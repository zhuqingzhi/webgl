import { EFFECT_MAP } from "./Constants"
import type { Camera, Object3D } from "./D5"
import { CompositeMaterial, Material, PostProcessMaterial } from "./Materials"
import type { Renderer } from "./Renderer"
import { RenderTarget } from "./RenderTarget"

export interface PassContext {
    readBuffer: RenderTarget
    writeBuffer: RenderTarget
    textures: Map<string, WebGLTexture>
    renderer: Renderer
}
type PassInputs = {
    tex: WebGLTexture,
    unit: number
}
export class Pass {
    enabled: boolean = true
    needsSwap: boolean = false
    protected gl!: WebGL2RenderingContext
    material: Material = new Material({})
    emptyVAO!: WebGLVertexArrayObject
    render(ctx: PassContext): void { }
    setSize(width: number, height: number): void { }
    init(gl: WebGL2RenderingContext): void {
        this.gl = gl
        this.emptyVAO = gl.createVertexArray()
    }
    run(opt: {
        target: RenderTarget | null,
        material: Material,
        inputs: PassInputs[],
        clear?: boolean
    }) {
        const { target, material, inputs, clear = true } = opt
        if (target) {
            target.bind(this.gl)
        } else {
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null)
            this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight)
        }
        this.gl.disable(this.gl.DEPTH_TEST)
        this.gl.clearColor(0, 0, 0, 1)
        this.gl.disable(this.gl.CULL_FACE)
        if (clear) this.gl.clear(this.gl.COLOR_BUFFER_BIT)
        this.gl.useProgram(material.program)
        this.gl.bindVertexArray(this.emptyVAO)
        for (let i = 0; i < inputs.length; i++) {
            const element = inputs[i];
            this.gl.activeTexture(this.gl.TEXTURE0 + element.unit)
            this.gl.bindTexture(this.gl.TEXTURE_2D, element.tex)
        }
        material.uploadUniforms(this.gl)
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4)
        this.gl.bindVertexArray(null)
        // 解绑
        for (let i = 0; i < inputs.length; i++) {
            const element = inputs[i];
            this.gl.activeTexture(this.gl.TEXTURE0 + element.unit)
            this.gl.bindTexture(this.gl.TEXTURE_2D, null)
        }
    }
}

export class RenderPass extends Pass {
    enabled: boolean = true
    renderTarget!: RenderTarget
    needsSwap: boolean = true

    constructor(
        private scene: Object3D[],
        private camera: Camera
    ) {
        super()
    }
    init(gl: WebGL2RenderingContext) {
        super.init(gl)
        if (this.renderTarget) return
        const material = new PostProcessMaterial({})
        material.effect = "none"
        material.initShader(this.gl)
        this.material = material
    }
    render(ctx: PassContext): void {
        if (ctx.writeBuffer === null) return
        ctx.writeBuffer.bind(this.gl)
        this.gl.enable(this.gl.DEPTH_TEST)
        ctx.renderer.render(this.scene, this.camera)
        ctx.writeBuffer.unbind(this.gl)
    }
    setSize(width: number, height: number): void {
        this.renderTarget.setSize(this.gl, width, height)
    }
}

export class BloomPass extends Pass {
    enabled: boolean = true
    needsSwap: boolean = true
    compositeMaterial!: CompositeMaterial
    mip0A!: RenderTarget
    mip0B!: RenderTarget
    mip1A!: RenderTarget
    mip1B!: RenderTarget
    mip2A!: RenderTarget
    mip2B!: RenderTarget
    constructor() {
        super()
    }
    render(ctx: PassContext): void {
        let { readBuffer, writeBuffer } = ctx;
        this.material.uniforms.uResolution = [readBuffer.width, readBuffer.height]
        if (!writeBuffer) return console.error("writeBuffer为空")
        const pm = this.material as PostProcessMaterial
        // 亮度提取
        pm.effect = "bright"
        pm.uniforms.uEffect = EFFECT_MAP[pm.effect]
        pm.uniforms.uResolution = [writeBuffer.width, writeBuffer.height]

        // 提取亮部
        super.run({
            material: pm,
            target: this.mip0A,
            inputs: [
                {
                    tex: readBuffer.colorTex,
                    unit: 0
                }
            ]
        })
        // pingRT->blurH->pongRT->blurV->pingRT :第一级模糊
        this.runBlur(this.mip0A, this.mip0B)
        // pingRT->降采样->mip1A
        this.downsample(this.mip0A, this.mip1A, pm)
        // mip1A->blurH->mip1B->blurV->mip1A :第二级
        this.runBlur(this.mip1A, this.mip1B)
        // mip1A->降采样mip2A
        this.downsample(this.mip1A, this.mip2A, pm)
        // mip2A->blurH->mip2B->blurV->mipA:第三级
        this.runBlur(this.mip2A, this.mip2B)
        // 开启混合，渲染小的mip到大的mip上
        pm.effect = "none"
        pm.uniforms.uEffect = EFFECT_MAP[pm.effect]
        this.gl.enable(this.gl.BLEND)
        this.gl.blendFunc(this.gl.ONE, this.gl.ONE)
        // mip2A->mip1A
        super.run({
            target: this.mip1A,
            material: pm,
            inputs: [
                {
                    unit: 0,
                    tex: this.mip2A.colorTex
                }
            ],
            clear: false
        })
        // mip1A->mip0A
        super.run({
            target: this.mip0A,
            material: pm,
            inputs: [
                {
                    unit: 0,
                    tex: this.mip1A.colorTex
                },
            ],
            clear: false
        })
        // mip0A->pingRT
        this.gl.disable(this.gl.BLEND)
        super.run({
            target: ctx.writeBuffer,
            material: this.compositeMaterial,
            inputs: [
                {
                    unit: 0,
                    tex: ctx.readBuffer.colorTex
                },
                {
                    unit: 1,
                    tex: this.mip0A.colorTex
                }
            ],
            clear: true
        })

    }
    private downsample(src: RenderTarget, dst: RenderTarget, mat: PostProcessMaterial) {
        dst.bind(this.gl)
        mat.effect = "none"
        mat.uniforms.uEffect = EFFECT_MAP[mat.effect]
        this.gl.clear(this.gl.COLOR_BUFFER_BIT)
        this.gl.useProgram(mat.program)
        mat.uploadUniforms(this.gl)
        this.gl.activeTexture(this.gl.TEXTURE0)
        this.gl.bindTexture(this.gl.TEXTURE_2D, src.colorTex)
        this.gl.bindVertexArray(this.emptyVAO)
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4)
        this.gl.bindVertexArray(null)

        this.gl.activeTexture(this.gl.TEXTURE0)
        this.gl.bindTexture(this.gl.TEXTURE_2D, null)
    }
    private runBlur(src: RenderTarget, dst: RenderTarget) {
        const pm = this.material as PostProcessMaterial
        pm.effect = "blurH"
        pm.uniforms.uEffect = EFFECT_MAP[pm.effect]
        pm.uniforms.uResolution = [dst.width, dst.height]
        super.run({
            target: dst,
            material: pm,
            inputs: [
                {
                    tex: src.colorTex,
                    unit: 0
                }
            ]
        });
        [dst, src] = [src, dst]
        pm.effect = 'blurV'
        pm.uniforms.uEffect = EFFECT_MAP[pm.effect]
        pm.uniforms.uResolution = [dst.width, dst.height]
        super.run({
            target: dst,
            material: pm,
            inputs: [
                {
                    tex: src.colorTex,
                    unit: 0
                }
            ]
        });
    }
    setSize(width: number, height: number): void {
        const w = Math.floor(width)
        const h = Math.floor(height)
        this.mip0A.setSize(this.gl, w / 2, h / 2)
        this.mip0B.setSize(this.gl, w / 2, h / 2)
        this.mip1A.setSize(this.gl, w / 4, h / 4)
        this.mip1B.setSize(this.gl, w / 4, h / 4)
        this.mip2A.setSize(this.gl, w / 8, h / 8)
        this.mip2B.setSize(this.gl, w / 8, h / 8)
    }
    init(gl: WebGL2RenderingContext): void {
        super.init(gl)
        const compositeMaterial = new CompositeMaterial({})
        this.compositeMaterial = compositeMaterial
        this.compositeMaterial.initShader(gl)
        const material = new PostProcessMaterial({})
        material.effect = 'bright'
        material.uniforms.uEffect = EFFECT_MAP[material.effect]
        this.material = material
        this.material.initShader(gl)
        const w = gl.drawingBufferWidth
        const h = gl.drawingBufferHeight
        this.mip0A = new RenderTarget(gl, w / 2, h / 2, 'rgba16f')
        this.mip0B = new RenderTarget(
            gl, this.mip0A.width, this.mip0A.height, "rgba16f",
        );
        this.mip1A = new RenderTarget(gl, w / 4, h / 4, 'rgba16f')
        this.mip1B = new RenderTarget(gl, w / 4, h / 4, 'rgba16f')
        this.mip2A = new RenderTarget(gl, w / 8, h / 8, 'rgba16f')
        this.mip2B = new RenderTarget(gl, w / 8, h / 8, 'rgba16f')
    }
}

export class OutputPass extends Pass {
    enabled: boolean = true
    needsSwap: boolean = true
    material2!: CompositeMaterial
    render(ctx: PassContext): void {
        super.run({
            target: ctx.writeBuffer,
            inputs: [
                {
                    tex: ctx.readBuffer.colorTex,
                    unit: 0
                },
            ],
            material: this.material2,
            clear: true
        })
        super.run({
            target: null,
            inputs: [
                {
                    tex: ctx.writeBuffer.colorTex,
                    unit: 0
                },
            ],
            material: this.material,
            clear: true
        })
    }
    setSize(width: number, height: number): void {

    }
    init(gl: WebGL2RenderingContext): void {
        super.init(gl)
        const material = new PostProcessMaterial({})
        material.effect = 'srgb'
        material.uniforms.uEffect = EFFECT_MAP[material.effect]
        this.material = material
        this.material.initShader(gl)

        const mat2 = new CompositeMaterial({})
        mat2.uniforms.uToneMap = 2
        mat2.initShader(gl)
        this.material2 = mat2
    }
}

export class EffectComposer {
    readBuffer!: RenderTarget//始终指向下一阶段应该读取的结果
    writeBuffer!: RenderTarget//指向下一阶段应该写入的位置
    renderTarget1!: RenderTarget
    renderTarget2!: RenderTarget
    private renderer: Renderer
    gl!: WebGL2RenderingContext
    passes: Pass[] = []
    constructor(renderer: Renderer) {
        this.renderer = renderer
        this.gl = renderer.gl
        this.renderTarget1 = this.readBuffer = new RenderTarget(this.gl, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight, 'rgba16f')
        this.renderTarget2 = this.writeBuffer = new RenderTarget(this.gl, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight, 'rgba16f')
    }
    addPass(pass: Pass) {
        pass.init(this.gl)
        this.passes.push(pass)
    }

    render() {
        const textures = new Map()
        for (let index = 0; index < this.passes.length; index++) {
            const element = this.passes[index]
            if (!element?.enabled) continue
            element.render({
                writeBuffer: this.writeBuffer,
                readBuffer: this.readBuffer,
                textures,
                renderer: this.renderer
            })
            if (element.needsSwap) this.swapBuffer()
        }
    }
    swapBuffer() {
        [this.readBuffer, this.writeBuffer] = [this.writeBuffer, this.readBuffer]
    }
    setSize(width: number, height: number) {
        this.renderTarget1.setSize(this.gl, width, height)
        this.renderTarget2.setSize(this.gl, width, height)
        for (const p of this.passes) p.setSize(width, height)
    }
}