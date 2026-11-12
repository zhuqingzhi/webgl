import { mat4, vec3 } from "gl-matrix"
import { AmbientLight, DirectionalLight, Geometry, Material, Mesh, MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial, Object3D, PerspectiveCamera, Renderer, SpotLight, Texture, TextureLoader } from "./shaderPlan/S2/D5"
import { createCheckerCanvas, createPlane, createSphere } from "./shaderPlan/S2/utils"
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
  normals: sphereBuffer.normals,
  uv: sphereBuffer.uv
})
const textureLoader = new TextureLoader()
const texture = textureLoader.load("./color.jpg")
texture.wrapS = renderer.gl.CLAMP_TO_EDGE
texture.wrapT = renderer.gl.CLAMP_TO_EDGE
// texture.colorSpace = 'linear'
const image = createCheckerCanvas(512, 8)
/* const checker = new Texture({
  image,
  wrapS: renderer.gl.REPEAT,
  wrapT: renderer.gl.REPEAT
}) */
const checker = new Texture({
  image,
  wrapS: renderer.gl.MIRRORED_REPEAT,
  wrapT: renderer.gl.MIRRORED_REPEAT,
  minFilter: renderer.gl.LINEAR_MIPMAP_LINEAR
})
checker.ready = true
const mat2 = new MeshPhongMaterial({
  color: [1, 1, 1],
  specular: [0.5, 0.5, 0.5],
  shininess: 32,
  map: checker
})
/* const mat2 = new MeshLambertMaterial({
  color: [1, 0.5, 0],
}) */
const sphere2 = new Mesh(geo, mat2)
sphere2.position = [0, 5, 0]

const planeParam = createPlane(1, 1, 10, 10)
const planeGeo = new Geometry(planeParam)
const planeMap = new Texture({
  image,
  wrapS: renderer.gl.REPEAT,
  wrapT: renderer.gl.REPEAT,
  /* wrapS: renderer.gl.MIRRORED_REPEAT,
  wrapT: renderer.gl.MIRRORED_REPEAT, */
  /* magFilter: renderer.gl.NEAREST,
  minFilter: renderer.gl.NEAREST, */
  minFilter: renderer.gl.LINEAR_MIPMAP_LINEAR,
  // minFilter: renderer.gl.NEAREST,

})
planeMap.ready = true
const planeMat = new MeshPhongMaterial({
  color: [1, 1, 1],
  specular: [0.5, 0.5, 0.5],
  shininess: 32,
  map: texture,
})
const plane = new Mesh(planeGeo, planeMat)
plane.position = [-20, 0, -30]
plane.scale = [3, 3, 3]
plane.rotation[0] = -Math.PI / 2

const planeMap2 = new Texture({
  image,
  wrapS: renderer.gl.CLAMP_TO_EDGE,
  wrapT: renderer.gl.CLAMP_TO_EDGE,
  /* wrapS: renderer.gl.MIRRORED_REPEAT,
  wrapT: renderer.gl.MIRRORED_REPEAT, */
  /* magFilter: renderer.gl.NEAREST,
  */
  minFilter: renderer.gl.LINEAR_MIPMAP_NEAREST,

})
planeMap2.ready = true

const planeMat2 = new MeshPhongMaterial({
  color: [1, 1, 1],
  specular: [0.5, 0.5, 0.5],
  shininess: 32,
  map: planeMap2
})
const plane2 = new Mesh(planeGeo, planeMat2)
plane2.position = [-10, 0, -30]
plane2.scale = [3, 3, 3]
plane2.rotation[0] = -Math.PI / 2

const planeMap3 = new Texture({
  image,
  wrapS: renderer.gl.REPEAT,
  wrapT: renderer.gl.REPEAT,
  /* wrapS: renderer.gl.MIRRORED_REPEAT,
  wrapT: renderer.gl.MIRRORED_REPEAT, */
  /* magFilter: renderer.gl.NEAREST,
  minFilter: renderer.gl.NEAREST, */
  minFilter: renderer.gl.LINEAR,

})
planeMap3.ready = true

const planeMat3 = new MeshPhongMaterial({
  color: [1, 1, 1],
  specular: [0.5, 0.5, 0.5],
  shininess: 32,
  map: planeMap3
})
const plane3 = new Mesh(planeGeo, planeMat3)
plane3.position = [0, 0, -30]
plane3.scale = [3, 3, 3]
plane3.rotation[0] = -Math.PI / 2



const planeMap4 = new Texture({
  image,
  wrapS: renderer.gl.REPEAT,
  wrapT: renderer.gl.REPEAT,
  /* wrapS: renderer.gl.MIRRORED_REPEAT,
  wrapT: renderer.gl.MIRRORED_REPEAT, */
  /* magFilter: renderer.gl.NEAREST,
  minFilter: renderer.gl.NEAREST, */
  minFilter: renderer.gl.LINEAR,

})
planeMap4.ready = true
const planeMat4 = new MeshPhongMaterial({
  color: [1, 1, 1],
  specular: [0.5, 0.5, 0.5],
  shininess: 32,
  map: planeMap4,
})
const plane4 = new Mesh(planeGeo, planeMat4)
plane4.position = [10, 0, -30]
plane4.scale = [3, 3, 3]
plane4.rotation[0] = -Math.PI / 3

const directionalLight = new DirectionalLight([1, 1, 1], 1)
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
  const t = performance.now() * 0.001
  plane.position[2] = -30 + Math.sin(t) * 20
  plane2.position[2] = -30 + Math.sin(t) * 20
  plane3.position[2] = -30 + Math.sin(t) * 20
  plane4.position[2] = -30 + Math.sin(t) * 20
  sphere2.rotation[1] += 0.03
  renderer.render([plane, plane2, plane3, plane4, directionalLight, ambientLight, sphere2], camera)
  requestAnimationFrame(render)
}
render()