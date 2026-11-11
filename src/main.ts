import { mat4, vec3 } from "gl-matrix"
import { AmbientLight, DirectionalLight, Geometry, Material, Mesh, MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial, Object3D, PerspectiveCamera, Renderer, SpotLight } from "./shaderPlan/S2/D5"
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
camera.position = [0, 0, 15]
const sphereBuffer = createSphere(1, 30, 30)
const geo = new Geometry({
  indices: sphereBuffer.indices,
  positions: sphereBuffer.positions,
  normals: sphereBuffer.normals
})
/* const mat2 = new MeshPhongMaterial({
  color: [1, 0.5, 0],
  specular: [0.5, 0.5, 0.5],
  shininess: 32
}) */
const mat2 = new MeshLambertMaterial({
  color: [1, 0.5, 0],
})
const sphere2 = new Mesh(geo, mat2)
sphere2.position = [0, 0, 0]


const directionalLight = new DirectionalLight([1, 0, 0], 1)
directionalLight.position = [1, 1, 1]
const target = new Object3D()
target.position = [0, 0, 0]
directionalLight.target = target

const ambientLight = new AmbientLight([1, 1, 1,], 0.1)
const spotLight = new SpotLight([1, 0, 0], 10)
spotLight.position = [5, 0, 0]
const spotLight2 = new SpotLight([0, 1, 0], 10)
spotLight2.position = [0, 5, 0]
const spotLight3 = new SpotLight([0, 0, 1], 10)
spotLight3.position = [0, 0, 5]
function render() {
  renderer.render([sphere2, directionalLight, ambientLight, spotLight, spotLight2, spotLight3], camera)
  requestAnimationFrame(render)
}
render()