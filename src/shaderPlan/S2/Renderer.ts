import { vec3 } from "gl-matrix"
import { EFFECT_MAP, MAX_LIGHTS } from "./Constants"
import type { Camera, Mesh, Object3D } from "./D5"
import type { AmbientLight, DirectionalLight, SpotLight } from "./Light"
import { colorToLinear, isMesh } from "./utils"
import { CompositeMaterial, Material, PostProcessMaterial, type MeshPhongMaterial } from "./Materials"
import { RenderTarget } from "./RenderTarget"

type RendererParamType = {
    el?: HTMLCanvasElement
}

type PassInputs = {
    tex: WebGLTexture,
    unit: number
}

/* 
颜色管线
纹理采样：srgb8_alpha8->硬件解码->linear
材质颜色：colorToLinear()->linear
光照计算：linear
写入renderTarget:rgba16F，值可超过1.
亮部提取：阈值在Linear，1.0纯白
高斯模糊：linear空间，不能clamp
色调映射：Linear->[0,1]
srgb编码：伽马校正，linearToSrgb
输出到屏幕：srgb 8位
*/

// 渲染循环，切换program，遍历material的uniforms上传数据，脏标记
export class Renderer {
    shaderMap: Set<WebGLShader> = new Set()
    gl: WebGL2RenderingContext
    camera!: Camera
    scene!: Object3D[]
    time!: number
    private startTime: number
    renderTarget: RenderTarget
    postProcessMaterial: PostProcessMaterial
    compositeMaterial: CompositeMaterial
    emptyVBO: WebGLVertexArrayObject

    pingRT: RenderTarget
    pongRT: RenderTarget
    private bloomTex!: WebGLTexture
    constructor(params: RendererParamType) {
        if (!params.el) {
            params.el = document.createElement("canvas")
        }
        const context = params.el.getContext("webgl2")
        if (!context) {
            throw new Error("未获取到context")
        }
        this.gl = context
        const floatExt = this.gl.getExtension("EXT_color_buffer_float")
        if (!floatExt) {
            console.warn('[Renderer] EXT_color_buffer_float 不可用，将回退 LDR')
        }
        this.startTime = performance.now()
        this.emptyVBO = this.gl.createVertexArray()
        this.renderTarget = new RenderTarget(this.gl, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight, 'rgba16f')
        this.postProcessMaterial = new PostProcessMaterial({})
        this.postProcessMaterial.effect = "none"
        this.postProcessMaterial.initShader(this.gl)
        this.compositeMaterial = new CompositeMaterial({})
        this.compositeMaterial.initShader(this.gl)

        const hw = Math.floor(this.gl.drawingBufferWidth / 2)
        const hh = Math.floor(this.gl.drawingBufferHeight / 2)
        this.pingRT = new RenderTarget(this.gl, hw, hh, 'rgba16f')
        this.pongRT = new RenderTarget(this.gl, hw, hh, 'rgba16f')
    }
    render(list: Object3D[], camera: Camera) {
        this.time = performance.now() - this.startTime
        this.camera = camera
        this.scene = list
        // this.clearTextureUnits()

        this.renderTarget.bind(this.gl)
        this.gl.enable(this.gl.DEPTH_TEST)
        this._render()

        this.renderTarget.unbind(this.gl)

        this.runBloom(3)
        this.composite()

    }
    private runPass(opt: {
        target: RenderTarget | null,
        material: Material,
        inputs: PassInputs[]
    }) {
        const { target, material, inputs } = opt
        if (target) {
            target.bind(this.gl)
        } else {
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null)
            this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight)
        }
        this.gl.disable(this.gl.DEPTH_TEST)
        this.gl.clearColor(0, 0, 0, 1)
        this.gl.disable(this.gl.CULL_FACE)
        this.gl.clear(this.gl.COLOR_BUFFER_BIT)
        this.gl.useProgram(material.program)
        this.gl.bindVertexArray(this.emptyVBO)
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
    private runBloom(iteration = 2) {
        const pm = this.postProcessMaterial
        const pingRt = this.pingRT
        const pongRt = this.pongRT
        // 亮度提取
        pm.uniforms.uTime = this.time / 1000           // 秒
        pm.effect = "bright"
        pm.uniforms.uEffect = EFFECT_MAP[pm.effect]
        pm.uniforms.uResolution = [pingRt.width, pingRt.height]
        this.runPass({
            material: pm,
            target: pingRt,
            inputs: [
                {
                    tex: this.renderTarget.colorTex,
                    unit: 0
                }
            ]
        })

        // 多次分离高斯模糊
        let src = pingRt, dst = pongRt;
        for (let i = 0; i < iteration; i++) {
            // 水平模糊
            pm.effect = 'blurH'
            pm.uniforms.uEffect = EFFECT_MAP[pm.effect];
            pm.uniforms.uResolution = [dst.width, dst.height]
            this.runPass({
                material: pm,
                target: dst,
                inputs: [
                    {
                        tex: src.colorTex,
                        unit: 0
                    }
                ]
            });
            [src, dst] = [dst, src];
            pm.effect = 'blurV'
            pm.uniforms.uEffect = EFFECT_MAP[pm.effect];
            pm.uniforms.uResolution = [dst.width, dst.height]
            this.runPass({
                material: pm,
                target: dst,
                inputs: [
                    {
                        tex: src.colorTex,
                        unit: 0
                    }
                ]
            });
            [src, dst] = [dst, src];
        }
        this.bloomTex = src.colorTex
    }

    private composite() {
        this.runPass(
            {
                target: null,
                material: this.compositeMaterial,
                inputs: [
                    {
                        tex: this.renderTarget.colorTex,
                        unit: 0
                    },
                    {
                        tex: this.bloomTex,
                        unit: 1
                    }
                ]
            }
        )
    }


    private clearTextureUnits() {
        for (let i = 0; i < 8; i++) {
            this.gl.activeTexture(this.gl.TEXTURE0 + i)
            this.gl.bindTexture(this.gl.TEXTURE_2D, null)
        }
    }
    private async _render() {
        this.gl.clearColor(0, 0, 0, 1)
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
        this.gl.enable(this.gl.CULL_FACE)
        this.gl.cullFace(this.gl.BACK)
        this.camera.updateMatrix()
        this.camera.updateProjectionMatrix()
        const spotLights = this.scene.filter(o => o.type === 'SpotLight') as SpotLight[]
        const ambientLight = this.scene.find(o => o.type === 'AmbientLight') as AmbientLight
        const directionalLights = this.scene.filter(o => o.type === 'DirectionalLight') as DirectionalLight[]

        spotLights.forEach(l => l.updateMatrix())
        directionalLights.forEach(l => {
            l.updateMatrix()
            l.target?.updateMatrix()
        })

        for (let i = 0; i < this.scene.length; i++) {
            const mesh = this.scene[i];
            if (isMesh(mesh)) {
                // 资源
                mesh.material.initShader(this.gl)

                if (!mesh.geometry.vao) {
                    mesh.geometry.vao = mesh.geometry.init(this.gl, mesh.material.program)
                }
                // 计算
                mesh.updateMatrix()
                // 注入
                this.injectFrameUniforms(mesh)
                this.injectAmbientLightUniforms(mesh, ambientLight)
                this.injectDirectLightUniforms(mesh, directionalLights)
                this.injectSpotLightUniforms(mesh, spotLights)
                this.injectMaterialUniforms(mesh)
                this.renderMesh(mesh)
            }
        }
        // requestAnimationFrame(() => this._render())
    }


    private injectSpotLightUniforms(mesh: Mesh, spotLights: SpotLight[]) {
        const pos = mesh.material.uniforms.uLightPosition as Float32Array
        const col = mesh.material.uniforms.uLightColor as Float32Array
        const intens = mesh.material.uniforms.uLightIntensity as Float32Array

        const count = Math.min(spotLights.length, MAX_LIGHTS)

        // 先清零（可选：只清尾部）
        pos.fill(0)
        col.fill(0)
        intens.fill(0)

        for (let i = 0; i < count; i++) {
            const l = spotLights[i]
            const base = i * 3

            pos[base] = l.worldMatrix[12]
            pos[base + 1] = l.worldMatrix[13]
            pos[base + 2] = l.worldMatrix[14]

            const c = colorToLinear(l.color ?? [1, 1, 1])
            col[base] = c[0]
            col[base + 1] = c[1]
            col[base + 2] = c[2]

            intens[i] = l.intensity ?? 1
        }

        mesh.material.uniforms.uLightCount = count
    }
    private injectAmbientLightUniforms(mesh: Mesh, ambientLight: AmbientLight) {
        if (ambientLight) {
            mesh.material.uniforms.uAmbientColor = vec3.scale(
                vec3.create(),
                colorToLinear(ambientLight.color ?? [1, 1, 1]),
                ambientLight.intensity ?? 1,
            )
        }
    }
    private injectDirectLightUniforms(mesh: Mesh, directionalLights: DirectionalLight[]) {
        const dir = mesh.material.uniforms.uDirectLightDirection as Float32Array
        const col = mesh.material.uniforms.uDirectLightColor as Float32Array
        const intens = mesh.material.uniforms.uDirectLightIntensity as Float32Array

        const count = Math.min(directionalLights.length, MAX_LIGHTS)

        // 先清零（可选：只清尾部）
        dir.fill(0)
        col.fill(0)
        intens.fill(0)

        for (let i = 0; i < count; i++) {
            const l = directionalLights[i]
            const base = i * 3

            const target = l.target
            const lightWorldPos = vec3.fromValues(l.worldMatrix[12], l.worldMatrix[13], l.worldMatrix[14])
            const targetWorldPos = vec3.fromValues(target.worldMatrix[12], target.worldMatrix[13], target.worldMatrix[14])
            const lightDir = vec3.create()
            vec3.subtract(lightDir, lightWorldPos, targetWorldPos)
            vec3.normalize(lightDir, lightDir)

            dir[base] = lightDir[0]
            dir[base + 1] = lightDir[1]
            dir[base + 2] = lightDir[2]

            const c = colorToLinear(l.color ?? [1, 1, 1])
            col[base] = c[0]
            col[base + 1] = c[1]
            col[base + 2] = c[2]

            intens[i] = l.intensity ?? 1
        }

        mesh.material.uniforms.uDirLightCount = count
    }

    private injectFrameUniforms(mesh: Mesh) {
        // 注入视图矩阵，投影矩阵
        mesh.material.uniforms.viewMatrix = this.camera.matrixWorldInverse
        mesh.material.uniforms.projectionMatrix = this.camera.projectionMatrix
        mesh.material.uniforms.modelMatrix = mesh.worldMatrix
        mesh.material.uniforms.normalMatrix = mesh.normalMatrix
        mesh.material.uniforms.uCameraPos = this.camera.position
        mesh.material.uniforms.uTime = this.time
    }
    private injectMaterialUniforms(mesh: Mesh) {
        mesh.material.syncUniforms()
        const mat = mesh.material as MeshPhongMaterial
        let unit = 0

        if (mat.map) {
            mat.map.init(this.gl, unit)
            mat.map.bind(this.gl, unit)
            unit++
        } else {
            mat.uniforms['uTexture'] = 0          // 兜底，避免 sampler 未绑定
        }
        if (mat.normalMap) {
            mat.normalMap.init(this.gl, unit)
            mat.normalMap.bind(this.gl, unit)
            unit++
        } else {
            mat.uniforms['uNormalMap'] = 0        // 兜底指向 uTexture 所在单元
        }
    }
    renderMesh(mesh: Mesh) {

        //绑定
        this.gl.useProgram(mesh.material.program)
        this.gl.bindVertexArray(mesh.geometry.vao)

        // 上传
        mesh.material.uploadUniforms(this.gl)

        // 绘制
        this.gl.drawElements(this.gl.TRIANGLES, mesh.geometry.indices.length, this.gl.UNSIGNED_SHORT, 0)
        this.gl.bindVertexArray(null)
    }
}

