import { Geometry, Mesh, Object3D, PerspectiveCamera, } from "./shaderPlan/S2/D5"
import { createCheckerCanvas, createNormalMapCanvas, createPlane, createSphere } from "./shaderPlan/S2/utils"
import { MeshBasicMaterial, MeshPhongMaterial, type PostEffectType } from "./shaderPlan/S2/Materials"
import { TextureLoader } from "./shaderPlan/S2/Loader";
import { Texture } from "./shaderPlan/S2/Textures";
import { Renderer } from "./shaderPlan/S2/Renderer";
import { AmbientLight, DirectionalLight, SpotLight } from "./shaderPlan/S2/Light";
import GUI from "three/examples/jsm/libs/lil-gui.module.min.js";


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
  wrapS: renderer.gl.REPEAT,
  wrapT: renderer.gl.REPEAT,
  minFilter: renderer.gl.LINEAR_MIPMAP_LINEAR,
  colorSpace: "linear"
})
checker.ready = true
const normalTex = new Texture({
  image: createNormalMapCanvas(256, 5),
  wrapS: renderer.gl.REPEAT,
  wrapT: renderer.gl.REPEAT,
  minFilter: renderer.gl.LINEAR_MIPMAP_LINEAR,
  colorSpace: "linear"
})
normalTex.ready = true
const mat2 = new MeshPhongMaterial({
  color: [1, 1, 1],
  specular: [1, 1, 1],
  shininess: 32,
  procedural: 'checker',
  // procedural: "wood",
  // procedural: "marble",
  // procedural: "cloud"
  // normalMap: normalTex
})
/* const mat2 = new MeshLambertMaterial({
  color: [1, 0.5, 0],
}) */
const sphere2 = new Mesh(geo, mat2)
sphere2.position = [0, 0, 0]

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
renderer.gl.framebufferTexture2D
planeMap.ready = true
const planeMat = new MeshBasicMaterial({
  color: [1, 1, 1],
  procedural: "checker"
})
const plane = new Mesh(planeGeo, planeMat)
plane.position = [0, 0, 1]
plane.scale = [10, 10, 10]
plane.rotation[0] = -Math.PI / 2

const directionalLight = new DirectionalLight([1, 1, 1], 1)
directionalLight.position = [1, 0, 0]
directionalLight.position = [-1, 0, 0]
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

const gui = new GUI({
  autoPlace: true
})
const obj = {
  uLightIntensity: 0.3,
  uIntensity: 0.8
}
gui.add(obj, 'uLightIntensity', 0, 10, 0.01).name("提取光强度").onChange(val => {
  renderer.postProcessMaterial.uniforms.uLightIntensity = val
})
gui.add(obj, 'uIntensity', 0, 1, 0.1).name("辉光强度").onChange(val => {
  renderer.compositeMaterial.uniforms.uIntensity = val
})


function render() {
  const t = performance.now() * 0.001
  sphere2.rotation[1] += 0.03
  renderer.render([directionalLight, ambientLight, plane], camera)
  requestAnimationFrame(render)
}
render()

const effects: PostEffectType[] = ['none', 'grayscale', 'invert', 'chromatic', 'vignette', 'scanline']
let idx = 0
window.addEventListener('keydown', e => {
  if (e.key === ' ') {
    idx = (idx + 1) % effects.length
    renderer.postProcessMaterial.effect = effects[idx]
    console.log('effect:', effects[idx])
  }
})