import vertexGlsl from "./shaders/cube/vertex.glsl?raw";
import fragGlsl from "./shaders/cube/fragment.glsl?raw";
import { createBuffer, createShaderFromScript } from "./utils/index";
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

let positions = [
  -0.5, -0.5, 0.5, 1, 0, 0, 1, 0.5, -0.5, 0.5, 1, 0, 0, 1, 0.5, 0.5, 0.5, 1, 0,
  0, 1, -0.5, 0.5, 0.5, 1, 0, 0, 1,

  -0.5, 0.5, 0.5, 0, 1, 0, 1, -0.5, 0.5, -0.5, 0, 1, 0, 1, -0.5, -0.5, -0.5, 0,
  1, 0, 1, -0.5, -0.5, 0.5, 0, 1, 0, 1,

  0.5, 0.5, 0.5, 0, 0, 1, 1, 0.5, -0.5, 0.5, 0, 0, 1, 1, 0.5, -0.5, -0.5, 0, 0,
  1, 1, 0.5, 0.5, -0.5, 0, 0, 1, 1,

  0.5, 0.5, -0.5, 1, 0, 1, 1, 0.5, -0.5, -0.5, 1, 0, 1, 1, -0.5, -0.5, -0.5, 1,
  0, 1, 1, -0.5, 0.5, -0.5, 1, 0, 1, 1,

  -0.5, 0.5, 0.5, 1, 1, 0, 1, 0.5, 0.5, 0.5, 1, 1, 0, 1, 0.5, 0.5, -0.5, 1, 1,
  0, 1, -0.5, 0.5, -0.5, 1, 1, 0, 1,

  -0.5, -0.5, 0.5, 0, 1, 1, 1, -0.5, -0.5, -0.5, 0, 1, 1, 1, 0.5, -0.5, -0.5, 0,
  1, 1, 1, 0.5, -0.5, 0.5, 0, 1, 1, 1,
];

let indices = [
  0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14,
  15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23,
];

const aPos = gl.getAttribLocation(program, "aPos");
const aColor = gl.getAttribLocation(program, "aColor");
const posBuffer = gl.createBuffer();
gl.enableVertexAttribArray(aPos);
gl.enableVertexAttribArray(aColor);
gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 28, 0);
gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 28, 12);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
const indicesBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
gl.bufferData(
  gl.ELEMENT_ARRAY_BUFFER,
  new Uint16Array(indices),
  gl.STATIC_DRAW,
);
// gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
const uMatrix = gl.getUniformLocation(program, "uMatrix");
gl.clearColor(0, 0, 0, 1);
// gl.clear(gl.COLOR_BUFFER_BIT);

gl.enable(gl.CULL_FACE);

var aspect = canvas.width / canvas.height;
//计算正交投影矩阵
var projectionMatrix = matrix.ortho(-aspect * 4, aspect * 4, -4, 4, 100, -100);
var deg2radians = window.lib3d.math.deg2radians;
var dstMatrix = matrix.identity();
/*渲染*/
function render() {
  xAngle += 1;
  yAngle += 1;
  //先绕 Y 轴旋转矩阵。
  matrix.rotationY(deg2radians(yAngle), dstMatrix);
  //再绕 X 轴旋转
  matrix.multiply(
    dstMatrix,
    matrix.rotationX(deg2radians(xAngle), tmpMatrix),
    dstMatrix,
  );
  //模型投影矩阵。
  matrix.multiply(projectionMatrix, dstMatrix, dstMatrix);

  gl.uniformMatrix4fv(uMatrix, false, dstMatrix);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
  if (!playing) {
    return;
  }
  requestAnimationFrame(render);
}

var playing = false;
var xAngle = -1;
var yAngle = -1;
var dstMatrix = matrix.identity();
var tmpMatrix = matrix.identity();
document.body.addEventListener("click", function () {
  playing = !playing;
  render();
});
render();
