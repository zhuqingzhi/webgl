// 职责划分---类结构
// 虽然AI设计的将webgl上下文和vao放到类参数里面和threejs不同，但是作为mini渲染器应该还是可以的
// 直接上手threejs的设计理念还是太难了

import { mat3, mat4, vec3, vec4 } from "gl-matrix"
import { colorToLinear, createShader, isMesh } from "./utils"
const MAX_LIGHTS = 8
// 职责：顶点数据，主要管什么形状
export class Geometry {
    normals: Float32Array
    indices: Uint16Array
    positions: Float32Array
    vao!: WebGLVertexArrayObject
    constructor(params: {
        normals: Float32Array,
        indices: Uint16Array,
        positions: Float32Array
    }) {
        this.normals = params.normals
        this.indices = params.indices
        this.positions = params.positions
    }
    init(gl: WebGL2RenderingContext, program: WebGLProgram) {
        const vao = gl.createVertexArray()
        gl.bindVertexArray(vao)
        const aPositionLoc = gl.getAttribLocation(program, "aPosition")
        const aNormalLoc = gl.getAttribLocation(program, "aNormal")
        this.recordAttrib(gl, aPositionLoc, {
            name: "aPosition",
            data: this.positions,
            size: 3
        })
        this.recordAttrib(gl, aNormalLoc, {
            name: "aNormal",
            data: this.normals,
            size: 3
        })
        const ebo = gl.createBuffer()
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW)
        gl.bindVertexArray(null)
        return vao
    }
    recordAttrib(gl: WebGL2RenderingContext, index: number, attribParams: {
        name: string,
        data: Float32Array,
        size: number,
        offset?: number,
        type?: WebGLRenderingContextBase['FLOAT'] | WebGLRenderingContextBase["SHORT"]
    }) {
        if (index < 0) throw new Error(attribParams.name + "未获取到")
        const { data, size, offset = 0, type = gl.FLOAT } = attribParams
        let by = 0
        if (type === gl.FLOAT) by = 4
        if (type === gl.SHORT) by = 2
        gl.enableVertexAttribArray(index)
        const buffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.vertexAttribPointer(index, size, type, false, by * size, offset)
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    }
}

type MaterialParamsType = {
    color?: string | vec3
}
export class Material {
    vertexShader!: WebGLShader
    fragShader!: WebGLShader
    program!: WebGLProgram
    vertexString!: string
    fragmentString!: string
    uniforms: Record<string, any> = {
        uLightPosition: new Float32Array(MAX_LIGHTS * 3),
        uLightColor: new Float32Array(MAX_LIGHTS * 3),
        uLightIntensity: new Float32Array(MAX_LIGHTS),
        uLightCount: 0,
        uDirectLightColor: new Float32Array(MAX_LIGHTS * 3),
        uDirectLightDirection: new Float32Array(MAX_LIGHTS * 3),
        uDirectLightIntensity: new Float32Array(MAX_LIGHTS),
        uDirLightCount: 0
    }
    uniformInfoMap: Map<string, {
        location: WebGLUniformLocation,
        type: number,
        size: number
    }> = new Map()
    color?: string | vec3
    constructor(params: MaterialParamsType) {
        this.uniforms.uColor = colorToLinear(params.color as number[])
    }
    initShader(gl: WebGL2RenderingContext) {
        if (this.program) return
        console.log('[initShader] 编译一次', this.constructor.name)
        this.vertexShader = createShader(gl, this.vertexString, gl.VERTEX_SHADER)
        this.fragShader = createShader(gl, this.fragmentString, gl.FRAGMENT_SHADER)
        this.program = gl.createProgram()
        gl.attachShader(this.program, this.fragShader)
        gl.attachShader(this.program, this.vertexShader)
        gl.linkProgram(this.program)
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            throw new Error('' + gl.getProgramInfoLog(this.program))
        }
        this.buildUniformInfo(gl)
    }
    setUniforms(gl: WebGL2RenderingContext, name: string, value: any) {

    }
    buildUniformInfo(gl: WebGL2RenderingContext) {
        const count = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS)
        for (let i = 0; i < count; i++) {
            const u = gl.getActiveUniform(this.program, i)
            console.log('mm', u)
            if (!u) continue
            const location = gl.getUniformLocation(this.program, u.name)!
            const name = u.name.replace(/\[0\]$/, '')
            this.uniformInfoMap.set(name, {
                location,
                type: u.type,
                size: u.size
            })
        }
    }
    uploadUniforms(gl: WebGL2RenderingContext) {
        for (const [name, u] of this.uniformInfoMap) {
            const value = this.uniforms[name]
            if (value === undefined) continue
            const location = u.location
            switch (u.type) {
                case gl.FLOAT:
                    u.size > 1 ? gl.uniform1fv(location, value) : gl.uniform1f(location, value)
                    break
                case gl.FLOAT_VEC2:
                    gl.uniform2fv(location, value)
                    break
                case gl.FLOAT_VEC3:
                    gl.uniform3fv(location, value)
                    break
                case gl.FLOAT_VEC4:
                    gl.uniform4fv(location, value)
                    break

                case gl.INT:
                case gl.BOOL:
                    u.size > 1 ? gl.uniform1iv(location, value) : gl.uniform1i(location, value)
                    break
                case gl.INT_VEC2:
                case gl.BOOL_VEC2:
                    gl.uniform2iv(location, value)
                    break
                case gl.INT_VEC3:
                case gl.BOOL_VEC3:
                    gl.uniform3iv(location, value)
                    break
                case gl.INT_VEC4:
                case gl.BOOL_VEC4:
                    gl.uniform4iv(location, value)
                    break

                case gl.FLOAT_MAT2:
                    gl.uniformMatrix2fv(location, false, value)
                    break
                case gl.FLOAT_MAT3:
                    gl.uniformMatrix3fv(location, false, value)
                    break
                case gl.FLOAT_MAT4:
                    gl.uniformMatrix4fv(location, false, value)
                    break

                case gl.SAMPLER_2D:
                case gl.SAMPLER_CUBE:
                    // value 传纹理单元索引，例如 0,1,2...
                    gl.uniform1i(location, value)
                    break

                // WebGL2 扩展类型（若你用 WebGL2 可继续补齐）
                default:
                    throw new Error(`Unsupported uniform type: ${u.type}`)
            }
        }
    }

}
// 职责：shader，program
export class MeshBasicMaterial extends Material {
    vertexString = `#version 300 es
        in vec3 aPosition;
        uniform mat4 modelMatrix;
        uniform mat4 viewMatrix;
        uniform mat4 projectionMatrix;
        void main(){
            gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(aPosition,1.);
        }
    `
    fragmentString = `#version 300 es
        precision mediump float;
        uniform vec3 uColor;
        out vec4 fragColor;
        void main(){
            fragColor=vec4(uColor,1.);
        }
    
    `

    constructor(params: MaterialParamsType) {
        super(params)
    }

}
export class MeshLambertMaterial extends Material {
    vertexString = `#version 300 es
        in vec3 aPosition;
        in vec3 aNormal;
        out vec3 vNormal;
        out vec3 vWorldPos;
        uniform mat4 modelMatrix;
        uniform mat3 normalMatrix;
        uniform mat4 viewMatrix;
        uniform mat4 projectionMatrix;
        void main(){
            vec4 worldPos=modelMatrix*vec4(aPosition,1.);
            vWorldPos=worldPos.xyz;
            vNormal=normalize(normalMatrix*aNormal);
            gl_Position=projectionMatrix*viewMatrix*worldPos;
        }
    `
    fragmentString = `#version 300 es
        precision highp float;
        uniform vec3 uColor;
        out vec4 fragColor;
        uniform vec3 uLightColor;
        uniform vec3 uLightDir;
        in vec3 vNormal;
        in vec3 vWorldPos;
        uniform vec3 uAmbientColor;

        vec3 linearToSrgb(vec3 c) {
            return mix(
                c * 12.92,
                1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055,
                step(vec3(0.0031308), c)
            );
        }

        void main(){
            vec3 N=normalize(vNormal);
            vec3 L=normalize(uLightDir);
            float diffuse=max(dot(N,L),0.);
            vec3 ambientColor=uColor*uAmbientColor;
            vec3 diffuseColor=uColor*uLightColor*diffuse;
            vec3 col=ambientColor+diffuseColor;
            fragColor=vec4(linearToSrgb(col),1.);
        }
    
    `

    constructor(params: MaterialParamsType) {
        super(params)
    }

}

export class MeshHalfLambertMaterial extends Material {
    vertexString = `#version 300 es
        in vec3 aPosition;
        in vec3 aNormal;
        out vec3 vNormal;
        out vec3 vWorldPos;
        uniform mat4 modelMatrix;
        uniform mat3 normalMatrix;
        uniform mat4 viewMatrix;
        uniform mat4 projectionMatrix;
        void main(){
            vec4 worldPos=modelMatrix*vec4(aPosition,1.);
            vWorldPos=worldPos.xyz;
            vNormal=normalize(normalMatrix*aNormal);
            gl_Position=projectionMatrix*viewMatrix*worldPos;
        }
    `
    fragmentString = `#version 300 es
        precision highp float;
        uniform vec3 uColor;
        out vec4 fragColor;
        uniform vec3 uLightColor;
        uniform vec3 uLightDir;
        in vec3 vNormal;
        in vec3 vWorldPos;
        uniform vec3 uAmbientColor;
        uniform float uAmbientFactor;

        void main(){
            vec3 N=normalize(vNormal);
            vec3 L=normalize(uLightDir);
            float diffuse=dot(N,L)*0.5+0.5;
            vec3 ambientColor=uColor*uAmbientColor*uAmbientFactor;
            vec3 diffuseColor=uColor*uLightColor*diffuse;
            vec3 col=ambientColor+diffuseColor;
            fragColor=vec4(col,1.);
        }
    
    `

    constructor(params: MaterialParamsType) {
        super(params)
    }

}
type PhongMaterialType = {
    shininess?: number,
    specular?: vec3,
}
export class MeshPhongMaterial extends Material {
    vertexString = `#version 300 es
        in vec3 aPosition;
        in vec3 aNormal;
        out vec3 vNormal;
        out vec3 vWorldPos;
        uniform mat4 modelMatrix;
        uniform mat3 normalMatrix;
        uniform mat4 viewMatrix;
        uniform mat4 projectionMatrix;
        void main(){
            vec4 worldPos=modelMatrix*vec4(aPosition,1.);
            vWorldPos=worldPos.xyz;
            vNormal=normalize(normalMatrix*aNormal);
            gl_Position=projectionMatrix*viewMatrix*worldPos;
        }
    `
    fragmentString = `#version 300 es
        precision highp float;
        uniform vec3 uColor;
        out vec4 fragColor;
        uniform vec3 uLightColor;
        uniform vec3 uLightDir;
        in vec3 vNormal;
        in vec3 vWorldPos;
        uniform vec3 uAmbientColor;
        uniform vec3 uSpecular;
        uniform float uShininess;
        uniform vec3 uCameraPos;

        vec3 linearToSrgb(vec3 c) {
            return mix(
                c * 12.92,
                1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055,
                step(vec3(0.0031308), c)
            );
        }

        void main(){
            vec3 N=normalize(vNormal);
            vec3 L=normalize(uLightDir);
            float diffuse=max(dot(N,L),0.);
            vec3 ambientColor=uColor*uAmbientColor;
            vec3 diffuseColor=uColor*uLightColor*diffuse;

            vec3 V=normalize(uCameraPos-vWorldPos);
            vec3 H=normalize(L+V);
            float specularFactor=pow(max(dot(N,H),0.),uShininess);
            vec3 specularColor=uSpecular*uLightColor*specularFactor;

            vec3 col=ambientColor+diffuseColor+specularColor;
            col = col / (col + vec3(1.0));

            fragColor=vec4(linearToSrgb(col),1.);
        }
    
    `

    constructor(params: MaterialParamsType & PhongMaterialType) {
        super(params)
        this.uniforms.uSpecular = colorToLinear(params.specular ?? [1, 1, 1])
        this.uniforms.uShininess = params.shininess ?? 30
    }

}
export class MeshPhongMaterialMutiLight extends Material {
    vertexString = `#version 300 es
        in vec3 aPosition;
        in vec3 aNormal;
        out vec3 vNormal;
        out vec3 vWorldPos;
        uniform mat4 modelMatrix;
        uniform mat3 normalMatrix;
        uniform mat4 viewMatrix;
        uniform mat4 projectionMatrix;
        void main(){
            vec4 worldPos=modelMatrix*vec4(aPosition,1.);
            vWorldPos=worldPos.xyz;
            vNormal=normalize(normalMatrix*aNormal);
            gl_Position=projectionMatrix*viewMatrix*worldPos;
        }
    `
    fragmentString = `#version 300 es
        precision highp float;
        const int MAX_LIGHTS=8;
        uniform vec3 uColor;
        out vec4 fragColor;
        uniform vec3 uLightColor[MAX_LIGHTS];
        uniform vec3 uLightPosition[MAX_LIGHTS];
        uniform float uLightIntensity[MAX_LIGHTS];
        uniform int uLightCount;
        uniform vec3 uDirectLightColor[MAX_LIGHTS];
        uniform vec3 uDirectLightDirction[MAX_LIGHTS];
        uniform float uDirectLightIntensity[MAX_LIGHTS];
        uniform int uDirLightCount;

        in vec3 vNormal;
        in vec3 vWorldPos;
        uniform vec3 uAmbientColor;
        uniform vec3 uSpecular;
        uniform float uShininess;
        uniform vec3 uCameraPos;

        vec3 linearToSrgb(vec3 c) {
            return mix(
                c * 12.92,
                1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055,
                step(vec3(0.0031308), c)
            );
        }

        void main(){
       
            vec3 ambientColor=uColor*uAmbientColor;

            vec3 col=ambientColor;
            
            vec3 totalDiffuse=vec3(0.);
            vec3 totalSpecular=vec3(0.);
            vec3 N=normalize(vNormal);
            vec3 V=normalize(uCameraPos-vWorldPos);

            for(int i=0;i<MAX_LIGHTS;i++){
                if(i>=uDirLightCount)break;
                vec3 lightDir=normalize(uDirectLightDirction[i]);
                vec3 dirColor=uDirectLightColor[i];
                float uDirIntensity=uDirectLightIntensity[i];
                vec3 diffuse=dirColor*uColor*max(dot(N,lightDir),0.)*uDirIntensity;
                totalDiffuse+=diffuse;

                vec3 H=normalize(lightDir+V);
                float specular=pow(max(dot(N,H),0.),uShininess);
                totalSpecular+=dirColor*uSpecular*specular*uDirIntensity;
            }   
            
            for(int i=0;i<MAX_LIGHTS;i++){
                if(i>=uLightCount)break;
                // 点光源
                vec3 lightPos=uLightPosition[i];
                vec3 lightColor=uLightColor[i];
                float intensity=uLightIntensity[i];
                
                float dist=length(lightPos-vWorldPos);
                float attenuation=1./(0.1+dist*dist);
                vec3 L=normalize(lightPos-vWorldPos);
                float diffuse=max(dot(N,L),0.);
                totalDiffuse+=lightColor*uColor*diffuse*attenuation*intensity;
                
                vec3 H=normalize(L+V);
                float specular=pow(max(dot(N,H),0.),uShininess);
                totalSpecular+=lightColor*uSpecular*specular*attenuation*intensity;
            }
            col=col+totalSpecular+totalDiffuse;
            col = col / (col + vec3(1.0));
            fragColor=vec4(linearToSrgb(col),1.);
        }
    
    `

    constructor(params: MaterialParamsType & PhongMaterialType) {
        super(params)
        this.uniforms.uSpecular = colorToLinear(params.specular ?? [1, 1, 1])
        this.uniforms.uShininess = params.shininess ?? 30
    }

}


export class Object3D {
    type: string = 'Object3D'
    matrix: mat4 = mat4.create()
    worldMatrix: mat4 = mat4.create()
    parent?: Object3D
    position: vec3 = vec3.create()
    rotation: vec3 = vec3.create()
    scale: vec3 = vec3.fromValues(1, 1, 1)
    normalMatrix: mat3 = mat3.create()
    name?: string
    updateMatrix() {
        this.matrix = mat4.create()
        mat4.fromTranslation(this.matrix, this.position)
        mat4.rotateZ(this.matrix, this.matrix, this.rotation[2])
        mat4.rotateY(this.matrix, this.matrix, this.rotation[1])
        mat4.rotateX(this.matrix, this.matrix, this.rotation[0])
        mat4.scale(this.matrix, this.matrix, this.scale)
        this.updateWorldMatrix()
    }
    updateWorldMatrix() {
        this.worldMatrix = this.parent?.worldMatrix ? mat4.multiply(mat4.create(), this.parent.worldMatrix, this.matrix) : this.matrix
        this.normalMatrix = mat3.transpose(mat3.create(), mat3.invert(mat3.create(), mat3.fromMat4(mat3.create(), this.worldMatrix))!)
        // this.normalMatrix = mat3.fromMat4(mat3.create(), this.worldMatrix)
    }
}

// 变换，geometry,material
export class Mesh extends Object3D {
    geometry: Geometry
    material: Material
    constructor(geometry: Geometry, material: Material) {
        super()
        this.geometry = geometry
        this.material = material
        this.type = "Mesh"
    }
}

export class Light extends Object3D {
    color?: vec4
    intensity?: number
    constructor(color?: vec4, intensity?: number) {
        super()
        this.type = "Light"
        this.color = color
        this.intensity = intensity
    }
}

export class SpotLight extends Light {
    target!: Object3D
    constructor(color?: vec4, intensity?: number) {
        super(color, intensity)
        this.type = "SpotLight"
    }
}

export class DirectionalLight extends Light {
    target!: Object3D
    constructor(color?: vec4, intensity?: number) {
        super(color, intensity)
        this.type = "DirectionalLight"
    }
}

export class AmbientLight extends Light {
    constructor(color?: vec4, intensity?: number) {
        super(color, intensity)
        this.type = "AmbientLight"
    }
}

// 视图矩阵，投影矩阵
export class Camera extends Object3D {
    target: vec3 = vec3.fromValues(0, 0, 0)
    matrixWorldInverse!: mat4 | null
    projectionMatrix!: mat4
    position: vec3 = vec3.fromValues(1, 1, 1)
    needUpdateProjectionMatrix: boolean = false
    needUpdateMatrix: boolean = false
    constructor() {
        super()
        this.type = "Camera"
        this.cameraMatrixFromPositionTarget()
    }
    setPosition(position: vec3) {
        this.position = position
        this.needUpdateMatrix = true
    }
    lookAt(target: vec3) {
        this.target = target
    }
    cameraMatrixFromPositionTarget() {
        const target = this.target
        const position = this.position
        const up = [0, 1, 0]

        const z = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), position, target))
        const x = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), up, z))
        const y = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), z, x))

        const mat = mat4.fromValues(x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, position[0], position[1], position[2], 1)
        this.matrix = mat
        this.updateWorldMatrix()
        this.matrixWorldInverse = mat4.invert(mat4.create(), this.worldMatrix)
    }
    updateMatrix() {
        this.cameraMatrixFromPositionTarget()
    }
    updateProjectionMatrix() {

    }
}

export class PerspectiveCamera extends Camera {
    fov: number
    aspect: number
    near: number
    far: number

    constructor(fov: number, aspect: number, near: number, far: number) {
        super()
        this.fov = fov
        this.aspect = aspect
        this.near = near
        this.far = far
        this.type = 'PerspectiveCamera'
    }
    updateProjectionMatrix(): void {
        this.projectionMatrix = mat4.create()
        const { fov, aspect, near, far } = this
        mat4.perspective(this.projectionMatrix, fov, aspect, near, far)
    }
}

type RendererParamType = {
    el?: HTMLCanvasElement
}
// 渲染循环，切换program，遍历material的uniforms上传数据，脏标记
export class Renderer {
    shaderMap: Set<WebGLShader> = new Set()
    private gl: WebGL2RenderingContext
    camera!: Camera
    scene!: Object3D[]
    constructor(params: RendererParamType) {
        if (!params.el) {
            params.el = document.createElement("canvas")
        }
        const context = params.el.getContext("webgl2")
        if (!context) {
            throw new Error("未获取到context")
        }
        this.gl = context
    }
    render(list: Object3D[], camera: Camera) {
        this.camera = camera
        this.scene = list
        this._render()
    }
    private _render() {
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
        this.scene.forEach(mesh => {
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

                this.renderMesh(mesh)
            }
        })
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