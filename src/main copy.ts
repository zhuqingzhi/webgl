import { mat3, mat4, quat, vec3 } from "gl-matrix";
import { createGeometry, createPlane, createProgram, createShader, createSphere, type Geometry, type MyMesh } from "./webgl2/utils";

const canvas = document.querySelector("#canvas") as HTMLCanvasElement;
canvas.style.width = "100vw";
canvas.style.height = "100vh";
canvas.style.display = "block";
const gl = canvas.getContext("webgl2", {
    depth: true,
    antialias: true,
})!;
const { width, height } = canvas.getBoundingClientRect()
canvas.width = width
canvas.height = height
gl.viewport(0, 0, width, height)
gl.enable(gl.DEPTH_TEST)

if (!gl) {
    throw new Error("WebGL2 is not supported.");
}

const program = createProgram(gl)
const mainVs = `#version 300 es
layout(location=0) in vec3 pos;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
void main(){
    gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(pos,1.);
}
`
const mainFS = `#version 300 es
precision mediump float;
out vec4 fragColor;
void main(){
    fragColor=vec4(1,0,0,1);
}
`

const mainVsShader = createShader(gl, gl.VERTEX_SHADER, mainVs)
const mainFsShader = createShader(gl, gl.FRAGMENT_SHADER, mainFS)
gl.attachShader(program, mainFsShader)
gl.attachShader(program, mainVsShader)
gl.linkProgram(program)
gl.useProgram(program)


gl.clearColor(0, 0, 0, 1)
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

const cameraPos = [0, 0, 3]
const updir = [0, 1, 0]
const aspect = width / height


const uModelMatrix = gl.getUniformLocation(program, "modelMatrix")
const uViewMatrix = gl.getUniformLocation(program, "viewMatrix")
const uProjectionMatrix = gl.getUniformLocation(program, "projectionMatrix")

class OrbitController {
    canvas: HTMLCanvasElement
    target: vec3 = [0, 0, 0]
    isRotating: boolean = false
    isPaning: boolean = false

    yaw: number = 0;
    pitch: number = 0;
    radius: number = 3

    camera: Camera

    constructor(canvas: HTMLCanvasElement, camera: Camera) {
        this.canvas = canvas
        this.camera = camera
        this.bindEvents()
    }

    private bindEvents() {
        this.canvas.addEventListener("contextmenu", e => e.preventDefault())
        this.canvas.addEventListener("pointerdown", e => {
            console.log('pointerdown', e)
            if (e.button === 0) {
                this.isRotating = true
            } else {
                this.isPaning = true
            }
            this.canvas.addEventListener("pointermove", this.pointermoveFn.bind(this))
        })
        this.canvas.addEventListener("pointerup", this.stopAction.bind(this))

        this.canvas.addEventListener("wheel", (e) => {
            e.preventDefault();
            const zoomScale = Math.exp(e.deltaY * 0.001);
            this.radius *= zoomScale;
            this.radius = Math.max(1.2, Math.min(20, this.radius));
        }, { passive: false });
    }
    private stopAction(e: PointerEvent) {
        this.isRotating = false
        this.isPaning = false
        this.canvas.releasePointerCapture(e.pointerId);
    }
    private pointermoveFn(e: PointerEvent) {
        const rotateSpeed = 0.005;
        const dx = e.movementX
        const dy = e.movementY
        if (this.isRotating) {
            this.yaw += dx * rotateSpeed
            this.pitch += dy * rotateSpeed
            // 限制pitch防止翻转
            this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));
        }
        if (this.isPaning) {
            const cameraPos = this.getCameraPosition()
            const forward = vec3.create()
            vec3.normalize(forward, vec3.subtract(forward, this.target, cameraPos))
            const up = [0, 1, 0]
            const right = vec3.create()
            vec3.normalize(right, vec3.cross(right, forward, up))

            const upDir = vec3.create()
            vec3.normalize(upDir, vec3.cross(upDir, right, forward))
            const panSpeed = this.radius * 0.0015
            const panX = vec3.scale(vec3.create(), right, -dx * panSpeed)
            const panY = vec3.scale(vec3.create(), up, dy * panSpeed)
            const pan = vec3.add(vec3.create(), panX, panY)
            this.target = vec3.add(vec3.create(), this.target, pan)
        }
    }
    getCameraPosition() {
        const x = this.target[0] + this.radius * Math.sin(this.yaw) * Math.cos(this.pitch)
        const y = this.target[1] + this.radius * Math.sin(this.pitch)
        const z = this.target[2] + this.radius * Math.cos(this.yaw) * Math.cos(this.yaw)
        return [x, y, z]
    }
    update() {
        this.camera.position = this.getCameraPosition()
        this.camera.lookAt(this.target)
    }
}
function isCamera(el: Object3D): el is Camera {
    return el.type === 'Camera'
}

function isMesh(el: Object3D): el is Mesh {
    return el.type === 'Mesh'
}

class Renderer {
    domElement: HTMLCanvasElement
    scene!: Scene
    camera!: Camera
    constructor() {
        this.domElement = canvas
    }
    render(scene: Scene, camera: Camera) {
        this.scene = scene
        this.camera = camera
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        this.scene.traverse((el) => {
            if (isCamera(el)) {
                if (el.needsUpdate) {
                    el.updateMatrixWorld()
                }
                //更新视图矩阵和投影矩阵
                const viewMatrix = el.matrixWorldInverse
                const projMatrix = el.projectionMatrix
                gl.uniformMatrix4fv(uViewMatrix, false, viewMatrix)
                gl.uniformMatrix4fv(uProjectionMatrix, false, projMatrix)

            }
            if (isMesh(el)) {
                gl.bindVertexArray(el.attribute.vao);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, el.attribute.indices)
                gl.drawElements(gl.TRIANGLES, el.attribute.count, gl.UNSIGNED_SHORT, 0);
            }
        })

    }
}
class Object3D {
    children: Object3D[] = []
    type: string = "Object3D"
    attribute: {
        vao: WebGLBuffer
        count: number
        indices: WebGLBuffer
    }
    constructor() {
        this.attribute = {
            vao: gl.createVertexArray(),
            count: 0,
            indices: gl.createBuffer()
        }
    }
    add(el: Object3D) {
        this.children.push(el)
    }
    traverse(callback: (el: Object3D) => void) {
        this._traverse(this, callback)
    }
    _traverse(node: Object3D, callback: (el: Object3D) => void) {
        callback(node)
        if (node.children) {
            node.children.forEach(el => {
                this._traverse(el, callback)
            })
        }
    }

}

class Material {
    uniforms: Record<string, any> = {}
}
class Mesh extends Object3D {
    type: string = 'Mesh'
    constructor(geometry: Geometry, material: Material) {
        super()
        this.attribute = {
            vao: geometry.vao,
            count: geometry.count,
            indices: geometry.indices
        }
    }
}
class Camera extends Object3D {
    position: vec3 = [0, 0, 0]
    needsUpdate: boolean = false
    matrixWorld: mat4 = mat4.create()
    matrixWorldInverse: mat4 = mat4.create()
    projectionMatrix: mat4 = mat4.create()
    rotation: vec3 = [0, 0, 0]
    type: string = 'Camera'
    constructor() {
        super()
        this.updateProjectionMatrix()
    }
    setPosition(pos: vec3) {
        this.position = pos
        this.needsUpdate = true
    }
    lookAt(target: vec3) {
        this.matrixWorldInverse = mat4.lookAt(mat4.create(), this.position, target, [0, 1, 0])
    }
    updateMatrixWorld() {
        if (!this.needsUpdate) return;

        // YXZ 顺序，和Three.js Object3D默认一致
        const rotX = mat4.fromXRotation(mat4.create(), this.rotation[0]);
        const rotY = mat4.fromYRotation(mat4.create(), this.rotation[1]);
        const rotZ = mat4.fromZRotation(mat4.create(), this.rotation[2]);
        const trans = mat4.fromTranslation(mat4.create(), this.position);

        // R = Rz * Rx * Ry，然后 matrixWorld = trans * R
        let rot = mat4.multiply(mat4.create(), rotY, rotX);
        rot = mat4.multiply(mat4.create(), rot, rotZ);
        mat4.multiply(this.matrixWorld, trans, rot);

        // 求逆得到视图矩阵
        mat4.invert(this.matrixWorldInverse, this.matrixWorld);
        this.needsUpdate = false;
    }
    updateProjectionMatrix() {
        this.projectionMatrix = mat4.perspective(mat4.create(), Math.PI / 3, aspect, 0.1, 10000)
    }
}
class Scene extends Object3D {

}
const scene = new Scene()

const sphereGeo = createSphere(0.5, 30, 30)
const sphereVo = createGeometry(gl, sphereGeo.vertices, sphereGeo.indices)
const sphere = new Mesh(sphereVo, new Material())
scene.add(sphere)


gl.uniformMatrix4fv(uModelMatrix, false, mat4.create())

/* gl.bindVertexArray(sphereVo.vao)
const viewMatrix = mat4.lookAt(mat4.create(), cameraPos, [0, 0, 0], [0, 1, 0])
const projMatrix = mat4.perspective(mat4.create(), Math.PI / 3, aspect, 0.1, 10000)
gl.uniformMatrix4fv(uViewMatrix, false, viewMatrix)
gl.uniformMatrix4fv(uProjectionMatrix, false, projMatrix)
gl.drawElements(gl.TRIANGLES, sphereVo.count, gl.UNSIGNED_SHORT, 0) */

const planeVo = createPlane(4)
const planeGeometry = createGeometry(gl, planeVo.vertices, planeVo.indices)
const plane = new Mesh(planeGeometry, new Material())
scene.add(plane)

const renderer = new Renderer()
const camera = new Camera()
camera.setPosition(cameraPos)
const controller = new OrbitController(renderer.domElement, camera)
scene.add(camera)

function render() {
    controller.update()
    renderer.render(scene, camera)
    requestAnimationFrame(render)
}
render()