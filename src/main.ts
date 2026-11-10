import { mat4, vec3 } from "gl-matrix"
import { AmbientLight, DirectionalLight, Geometry, Material, Mesh, MeshBasicMaterial, MeshHalfLambertMaterial, MeshLambertMaterial, PerspectiveCamera, Renderer } from "./shaderPlan/S2/D5"
import { createSphere } from "./shaderPlan/S2/utils"
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

const renderer = new Renderer({
  el: canvas
})
const camera = new PerspectiveCamera(Math.PI / 3, canvas.width / canvas.height, 0.1, 1000)
camera.position = [0, 0, 10]
const sphereBuffer = createSphere(1, 30, 30)
const geo = new Geometry({
  indices: sphereBuffer.indices,
  positions: sphereBuffer.positions,
  normals: sphereBuffer.normals
})
const mat2 = new MeshLambertMaterial({
  color: [1, 1, 0]
})
const sphere2 = new Mesh(geo, mat2)
sphere2.position = [-1, 0, 0]

const mat = new MeshHalfLambertMaterial({
  color: [1, 1, 0]
})
const sphere = new Mesh(geo, mat)
sphere.position = [1, 0, 0]

const mat3 = new MeshLambertMaterial({
  color: [1, 1, 0]
})
const sphere3 = new Mesh(geo, mat3)
sphere3.position = [3, 0, 0]
sphere3.name = 'sphere3'

const directionalLight = new DirectionalLight([1, 1, 1])
directionalLight.position = [0, 1, 1]
const ambientLight = new AmbientLight([1, 1, 1,], 0.1)
function render() {
  renderer.render([sphere2, sphere, sphere3, directionalLight, ambientLight], camera)
  requestAnimationFrame(render)
}
render()