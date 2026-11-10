import vertexGlsl from "./shaders/triangleShader/vertex.glsl?raw";
import fragGlsl from "./shaders/triangleShader/glsl.frag?raw";
import { createBuffer, createShaderFromScript } from "./utils/index";
import { Matrix, Vector3 } from "./utils/matrix";
const canvas: HTMLCanvasElement =
  document.querySelector<HTMLCanvasElement>("#canvas")!;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.display = "block";
const gl = canvas.getContext("webgl")!;
const program = gl.createProgram();
const vertexShader = createShaderFromScript(gl, vertexGlsl, gl.VERTEX_SHADER);
gl.attachShader(program, vertexShader);
const fragShader = createShaderFromScript(gl, fragGlsl, gl.FRAGMENT_SHADER);
gl.attachShader(program, fragShader);

gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  const info = gl.getProgramInfoLog(program);
  throw new Error(`Could not compile WebGL program. \n\n${info}`);
}
gl.useProgram(program);
gl.viewport(0, 0, canvas.width, canvas.height);

gl.clearColor(0, 0, 0, 1);
gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

const triangle1 = [
  /* prettier-ignore */
  0, 0, 0.5, 1, 0, 0.5, 1, 1, 0.5,
];
const triangle2 = [-0.5, 0, 0.5, 0.5, 0, 0.5, 0.5, 0.5, 0.5];

const posLoc = gl.getAttribLocation(program, "pos");
const colorLoc = gl.getAttribLocation(program, "aColor");
createBuffer(gl, posLoc, {
  dataType: gl.FLOAT,
  size: 3,
  stride: 3 * 4,
  offset: 0,
});
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangle1), gl.STATIC_DRAW);

createBuffer(gl, colorLoc, {
  dataType: gl.FLOAT,
  size: 3,
  stride: 3 * 4,
  offset: 0,
});
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([1, 0, 0, 1, 0, 0, 1, 0, 0]),
  gl.STATIC_DRAW,
);
// gl.enable(gl.DEPTH_TEST);
// gl.enable(gl.CULL_FACE);

const uModelMatrixLoc = gl.getUniformLocation(program, "u_modelMatrix");
const identity = window.matrix.identity();
const translateMatrix = window.matrix.translate(identity, -0.5, -0.5, 0);

let angle = 0;
const rotationXMatrix = window.matrix.rotationX(angle);
let mat = window.matrix.multiply(translateMatrix, rotationXMatrix);
const aspect = window.innerWidth / window.innerHeight
/* const matrix = new Matrix().orth(-aspect * 5, aspect * 5, -5, 5, -10, 10)
mat = window.matrix.multiply(matrix.elements, mat) */
const projectionMatrix = new Matrix().perspective(75, aspect, 0.1, 1000)
// const projectionMatrix = window.matrix.perspective(75, aspect, 0.1, 1000)

const cameraPosition = new Vector3(0, 0, 12)
var target = new Vector3(0, 0, 0);
var up = new Vector3(0, 1, 0);
var cameraMatrix = window.matrix.lookAt(cameraPosition, target, up);
var viewMatrix = window.matrix.inverse(cameraMatrix);
var viewProjectionMatrix = window.matrix.multiply(projectionMatrix, viewMatrix);
console.log("proj matrix", viewProjectionMatrix);
mat = window.matrix.multiply(viewProjectionMatrix, mat)
gl.uniformMatrix4fv(uModelMatrixLoc, false, mat);

function animate() {
  gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, triangle1.length / 3);
  requestAnimationFrame(animate);
}
animate();
