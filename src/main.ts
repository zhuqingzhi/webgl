import { Geometry, Mesh, Object3D, PerspectiveCamera, } from "./shaderPlan/S2/D5"
import { createCheckerCanvas, createNormalMapCanvas, createPlane, createSphere, createWhiteCanvas } from "./shaderPlan/S2/utils"
import { MeshBasicMaterial, MeshPhongMaterial, type PostEffectType } from "./shaderPlan/S2/Materials"
import { TextureLoader } from "./shaderPlan/S2/Loader";
import { Texture } from "./shaderPlan/S2/Textures";
import { Renderer } from "./shaderPlan/S2/Renderer";
import { AmbientLight, DirectionalLight, SpotLight } from "./shaderPlan/S2/Light";
import GUI from "three/examples/jsm/libs/lil-gui.module.min.js";
import gsap from "gsap";


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
  colorSpace: "linear",
  format: 'rgba8'
})
checker.ready = true
const normalTex = new Texture({
  image: createNormalMapCanvas(256, 5),
  wrapS: renderer.gl.REPEAT,
  wrapT: renderer.gl.REPEAT,
  minFilter: renderer.gl.LINEAR_MIPMAP_LINEAR,
  colorSpace: "linear",
  format: 'rgba8'
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

const whiteCanvas = createWhiteCanvas(512)

const planeMap = new Texture({
  image: whiteCanvas,
  wrapS: renderer.gl.REPEAT,
  wrapT: renderer.gl.REPEAT,
  /* wrapS: renderer.gl.MIRRORED_REPEAT,
  wrapT: renderer.gl.MIRRORED_REPEAT, */
  /* magFilter: renderer.gl.NEAREST,
  minFilter: renderer.gl.NEAREST, */
  minFilter: renderer.gl.LINEAR_MIPMAP_LINEAR,
  // minFilter: renderer.gl.NEAREST,
  colorSpace: "linear",
  format: 'rgba8'
})
planeMap.ready = true
/* const planeMat = new MeshBasicMaterial({
  color: [0.5, 0.5, 0.5]
}) */

const concrete = textureLoader.load("/concrete2/textures/herringbone_concrete_tile_03_diff_2k.jpg")
concrete.colorSpace = 'srgb'
const concreteNormalMap = textureLoader.load("/concrete2/textures/herringbone_concrete_tile_03_nor_gl_2k.jpg")
concreteNormalMap.colorSpace = 'linear'
concreteNormalMap.format = 'rgba8'
const planeMat = new MeshPhongMaterial({ procedural: 'none', map: concrete, color: [1, 1, 1], shininess: 64, specular: [1, 1, 1] })
const glowMat = new MeshBasicMaterial({ color: [5, 4, 3] })
const plane = new Mesh(planeGeo, planeMat)
plane.position = [0, 0, 0]
plane.scale = [10, 10, 10]

const directionalLight = new DirectionalLight([1, 1, 1], 0.3)
directionalLight.position = [2, 0, 5]
const target = new Object3D()
target.position = [0, 0, 0]
directionalLight.target = target

const ambientLight = new AmbientLight([1, 1, 1,], 0.1)

const gui = new GUI({
  autoPlace: true
})
const obj = {
  showNormalMap: false
}
gui.add(obj, 'showNormalMap', [true, false]).onChange(val => {
  if (val) {
    planeMat.normalMap = concreteNormalMap
  } else {
    planeMat.normalMap = undefined
  }
})

const lightPos = { x: 4, y: 0, z: 5 }

/* gsap.fromTo(
  lightPos,
  { x: 4, y: 0, z: 5 },
  {
    x: -4,
    duration: 4,
    repeat: -1,
    yoyo: true,
    onUpdate: () => {
      directionalLight.position[0] = lightPos.x
      directionalLight.position[1] = lightPos.y
      directionalLight.position[2] = lightPos.z
    },
  },
) */

function render() {
  renderer.render([directionalLight, ambientLight, plane], camera)
  requestAnimationFrame(render)
}
render()
