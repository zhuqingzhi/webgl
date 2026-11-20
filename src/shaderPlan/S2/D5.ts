// 职责划分---类结构
// 虽然AI设计的将webgl上下文和vao放到类参数里面和threejs不同，但是作为mini渲染器应该还是可以的
// 直接上手threejs的设计理念还是太难了

import { mat3, mat4, vec3, vec4 } from "gl-matrix"
import { colorToLinear, computeTangents, isMesh } from "./utils"
import type { Material } from "./Materials"
import { MAX_LIGHTS } from "./Constants"
// 职责：顶点数据，主要管什么形状
export class Geometry {
    normals: Float32Array
    indices: Uint16Array
    positions: Float32Array
    vao!: WebGLVertexArrayObject
    uv: Float32Array
    tangent: Float32Array
    constructor(params: {
        normals: Float32Array,
        indices: Uint16Array,
        positions: Float32Array,
        uv: Float32Array
    }) {
        this.normals = params.normals
        this.indices = params.indices
        this.positions = params.positions
        this.uv = params.uv
        this.tangent = computeTangents(this.positions, this.normals, this.uv, this.indices)
    }
    init(gl: WebGL2RenderingContext, program: WebGLProgram) {
        const vao = gl.createVertexArray()
        gl.bindVertexArray(vao)
        const aPositionLoc = gl.getAttribLocation(program, "aPosition")
        const aNormalLoc = gl.getAttribLocation(program, "aNormal")
        const aUvLoc = gl.getAttribLocation(program, "aUv")
        const aTangentLoc = gl.getAttribLocation(program, "aTangent")
        this.recordAttrib(gl, aUvLoc, {
            name: "aUvLoc",
            data: this.uv,
            size: 2
        })
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
        this.recordAttrib(gl, aTangentLoc, {
            name: "aTangent",
            data: this.tangent,
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
