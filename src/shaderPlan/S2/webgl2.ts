import { mat4, vec3 } from "gl-matrix"

function createShader(gl: WebGL2RenderingContext, source: string, type: WebGLRenderingContextBase['VERTEX_SHADER'] | WebGLRenderingContextBase['FRAGMENT_SHADER']) {
    const shader = gl.createShader(type)
    const shaderType = type === gl.VERTEX_SHADER ? '顶点着色器' : "片元着色器"
    if (!shader) throw new Error(shaderType + "创建失败")
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(shaderType + "编译失败:" + gl.getShaderInfoLog(shader))
    }
    return shader
}

const canvas = document.getElementById("canvas")! as HTMLCanvasElement;
canvas.style.width = window.innerWidth + "px"
canvas.style.height = window.innerHeight + "px"
canvas.style.display = 'block'
const { width, height } = canvas.getBoundingClientRect()
const dpr = window.devicePixelRatio
canvas.width = Math.round(dpr * width)
canvas.height = Math.round(dpr * height)

const gl = canvas.getContext("webgl2")
if (!gl) throw new Error("webglcontext没获取到")

const vertexStr = `#version  300 es
in vec3 aPos;
uniform mat4 uMVP;
out vec3 vNormal;
in vec3 aNormal;
void main(){
    vec4 clipPos=uMVP*vec4(aPos,1.);
    gl_Position=clipPos;
    vNormal=aNormal;
}

`
const fragStr = `#version  300 es
precision mediump float;
in vec3 vNormal;
out vec4 fragColor;
void main() {
  if (gl_FrontFacing) {
    fragColor = vec4(0.2, 0.8, 0.4, 1.0);   // 正面：绿
  } else {
    fragColor = vec4(0.9, 0.2, 0.2, 1.0);   // 背面：红
  }
}

`

const vertexShader = createShader(gl, vertexStr, gl.VERTEX_SHADER)
const fragShader = createShader(gl, fragStr, gl.FRAGMENT_SHADER)

const program = gl.createProgram()
gl.attachShader(program, vertexShader)
gl.attachShader(program, fragShader)
gl.linkProgram(program)
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("program链接失败:" + gl.getProgramInfoLog(program))
gl.useProgram(program)

const verts = new Float32Array([
    // 前面 +Z  (0-3)
    -0.5, -0.5, 0.5, 0, 0, 1,
    0.5, -0.5, 0.5, 0, 0, 1,
    0.5, 0.5, 0.5, 0, 0, 1,
    -0.5, 0.5, 0.5, 0, 0, 1,
    // 后面 -Z  (4-7)
    0.5, -0.5, -0.5, 0, 0, -1,
    -0.5, -0.5, -0.5, 0, 0, -1,
    -0.5, 0.5, -0.5, 0, 0, -1,
    0.5, 0.5, -0.5, 0, 0, -1,
    // 右面 +X  (8-11)
    0.5, -0.5, 0.5, 1, 0, 0,
    0.5, -0.5, -0.5, 1, 0, 0,
    0.5, 0.5, -0.5, 1, 0, 0,
    0.5, 0.5, 0.5, 1, 0, 0,
    // 左面 -X  (12-15)
    -0.5, -0.5, -0.5, -1, 0, 0,
    -0.5, -0.5, 0.5, -1, 0, 0,
    -0.5, 0.5, 0.5, -1, 0, 0,
    -0.5, 0.5, -0.5, -1, 0, 0,
    // 上面 +Y  (16-19)
    -0.5, 0.5, 0.5, 0, 1, 0,
    0.5, 0.5, 0.5, 0, 1, 0,
    0.5, 0.5, -0.5, 0, 1, 0,
    -0.5, 0.5, -0.5, 0, 1, 0,
    // 下面 -Y  (20-23)
    -0.5, -0.5, -0.5, 0, -1, 0,
    0.5, -0.5, -0.5, 0, -1, 0,
    0.5, -0.5, 0.5, 0, -1, 0,
    -0.5, -0.5, 0.5, 0, -1, 0,
])

const indices = new Uint16Array([
    0, 2, 1, 0, 2, 3,       // 前
    4, 5, 6, 4, 6, 7,       // 后
    8, 9, 10, 8, 10, 11,     // 右
    12, 13, 14, 12, 14, 15,  // 左
    16, 17, 18, 16, 18, 19,  // 上
    20, 21, 22, 20, 22, 23,  // 下
])
const aPosLoc = gl.getAttribLocation(program, "aPos")
if (aPosLoc < 0) throw new Error('aPos attribute 没找到')
const aNormalLoc = gl.getAttribLocation(program, "aNormal")
if (aNormalLoc < 0) throw new Error('aNormal attribute 没找到')
const uMvpLoc = gl.getUniformLocation(program, "uMVP")
if (!uMvpLoc) throw new Error('uMVP 没找到')


const vao = gl.createVertexArray()
gl.bindVertexArray(vao)
const aPosBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, aPosBuffer)
gl.enableVertexAttribArray(aPosLoc)
gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 6 * 4, 0)
gl.enableVertexAttribArray(aNormalLoc)
gl.vertexAttribPointer(aNormalLoc, 3, gl.FLOAT, false, 6 * 4, 3 * 4)
gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW)
const ebo = gl.createBuffer()
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo)
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)
gl.bindVertexArray(null)


gl.enable(gl.CULL_FACE)
gl.cullFace(gl.BACK)
gl.enable(gl.DEPTH_TEST)
gl.enable(gl.BLEND)
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
gl.clearColor(0, 0, 0, 1)

// viewMatrix
const viewMatrix = mat4.create()
const cameraPos = vec3.fromValues(0, 0, 5)
const target = vec3.fromValues(0, 0, 0)
mat4.lookAt(viewMatrix, cameraPos, target, vec3.fromValues(0, 1, 0))

// projectionMatrix
const projectionMatrix = mat4.create()
mat4.perspective(projectionMatrix, Math.PI / 3, canvas.width / canvas.height, 0.1, 1000)

const startTime = performance.now()
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    const r = (performance.now() - startTime) * 0.001
    const rotation = mat4.fromYRotation(mat4.create(), r)

    const mvp = mat4.create()
    mat4.multiply(mvp, projectionMatrix, viewMatrix)
    mat4.multiply(mvp, mvp, rotation)
    gl?.uniformMatrix4fv(uMvpLoc, false, mvp)

    gl?.bindVertexArray(vao)
    gl?.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0)
    requestAnimationFrame(render)
}
render()