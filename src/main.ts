import { Geometry, Mesh, Object3D, PerspectiveCamera, } from "./shaderPlan/S2/D5"
import { createCheckerCanvas, createNormalMapCanvas, createPlane, createSphere, createWavePlane, createWhiteCanvas } from "./shaderPlan/S2/utils"
import { MeshBasicMaterial, MeshPhongMaterial, type PostEffectType } from "./shaderPlan/S2/Materials"
import { TextureLoader } from "./shaderPlan/S2/Loader";
import { Texture } from "./shaderPlan/S2/Textures";
import { Renderer } from "./shaderPlan/S2/Renderer";
import { AmbientLight, DirectionalLight, SpotLight } from "./shaderPlan/S2/Light";
import GUI from "three/examples/jsm/libs/lil-gui.module.min.js";
import gsap from "gsap";
import { BloomPass, EffectComposer, OutputPass, RenderPass } from "./shaderPlan/S2/Pass";


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

const textureLoader = new TextureLoader()
const texture = textureLoader.load("./color.jpg")
texture.wrapS = renderer.gl.CLAMP_TO_EDGE
texture.wrapT = renderer.gl.CLAMP_TO_EDGE
// texture.colorSpace = 'linear'
const image = createCheckerCanvas(512, 8)

const checker = new Texture({
  image,
  wrapS: renderer.gl.REPEAT,
  wrapT: renderer.gl.REPEAT,
  minFilter: renderer.gl.LINEAR_MIPMAP_LINEAR,
  colorSpace: "linear",
  format: 'rgba8'
})
checker.ready = true

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

const planeParam = createPlane(1, 1, 10, 10)
// const planeParam = createWavePlane(1, 1, 10, 10)
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


const concrete = textureLoader.load("/concrete2/textures/herringbone_concrete_tile_03_diff_2k.jpg")
concrete.colorSpace = 'srgb'
concrete.wrapS = concrete.wrapT = renderer.gl.REPEAT
const concreteNormalMap = textureLoader.load("/concrete2/textures/herringbone_concrete_tile_03_nor_gl_2k.jpg")
concreteNormalMap.colorSpace = 'linear'
concreteNormalMap.format = 'rgba8'
const planeMat = new MeshPhongMaterial({ procedural: 'none', map: concrete, color: [1, 1, 1], shininess: 32, specular: [0.5, 0.5, 0.5], normalScale: 0.5 })
const testNormal = new Texture({
  image: createNormalMapCanvas(256, 5),
  wrapS: renderer.gl.REPEAT,
  wrapT: renderer.gl.REPEAT,
  minFilter: renderer.gl.LINEAR_MIPMAP_LINEAR,
  colorSpace: 'linear',      // 数据贴图，绝对不能用 srgb
  format: 'rgba8'
})
testNormal.ready = true
const glowMat = new MeshBasicMaterial({ color: [5, 4, 3] })
planeMat.normalMap = concreteNormalMap
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
  showNormalMap: true,
  rotateZ: 0,
  normalScale: 0.5,
  uLightIntensity: 0.3,
  uIntensity: 0.8,
  uToneMap: 0,
  uExposure: 1,
  bloomType: 0,
  uThreshold: 1.0,
  uSoftKnee: 0.5,
  uSigma: 1.5,
  uRadius: 1.5
}

gui.add(obj, 'showNormalMap', [true, false]).onChange(val => {
  if (val) {
    planeMat.normalMap = concreteNormalMap
  } else {
    planeMat.normalMap = undefined
  }
})
gui.add(obj, "normalScale", 0, 5, 0.01).onChange(val => {
  planeMat.normalScale = val
})
// 加一个绕 Z 轴旋转的控制
gui.add(obj, 'rotateZ', -Math.PI, Math.PI, 0.01).onChange(v => {
  plane.rotation[2] = v
})
const lightPos = { x: 2, y: 0, z: 5 }
gui.add(lightPos, 'x', -5, 5, 0.01).onChange(val => {
  directionalLight.position[0] = val
})
gui.add(lightPos, 'y', -5, 5, 0.01).onChange(val => {
  directionalLight.position[1] = val
})
gui.add(lightPos, 'z', -5, 5, 0.01).onChange(val => {
  directionalLight.position[2] = val
})



const scene = [directionalLight, ambientLight, plane]
const effectComposer = new EffectComposer(renderer)
const renderPass = new RenderPass(renderer, scene, camera)
effectComposer.addPass(renderPass)
const bloomPass = new BloomPass()
effectComposer.addPass(bloomPass)
const outputPass = new OutputPass()
effectComposer.addPass(outputPass)


gui.add(obj, 'uIntensity', 0, 1, 0.1).name("辉光强度").onChange(val => {
  outputPass.material.uniforms.uIntensity = val
})
gui.add(obj, "uToneMap", [0, 1, 2, 3]).name("色调映射").onChange(val => {
  outputPass.material.uniforms.uToneMap = val
})
gui.add(obj, "uExposure", 0, 10, 0.1).name("曝光度").onChange(val => {
  outputPass.material.uniforms.uExposure = val
})

gui.add(obj, 'uThreshold', 0, 10, 0.001).name("辉光阈值").onChange(val => {
  bloomPass.material.uniforms.uThreshold = val
})
gui.add(obj, 'uSoftKnee', 0, 1, 0.01).name("软膝").onChange(val => {
  bloomPass.material.uniforms.uSoftKnee = val
})
gui.add(obj, 'uSigma', 0.5, 10, 0.01).name("模糊sigma").onChange(val => {
  bloomPass.material.uniforms.uSigma = val
})
gui.add(obj, 'uRadius', 0.5, 10, 0.01).name("模糊uRadius").onChange(val => {
  bloomPass.material.uniforms.uRadius = val
})
function render() {
  // renderer.render(scene, camera)
  effectComposer.render()
  requestAnimationFrame(render)
}
render()
