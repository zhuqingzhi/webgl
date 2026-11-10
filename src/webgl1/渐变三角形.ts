import vertexGlsl from "./shaders/gridColorTriangle/vertex.glsl?raw";
import fragGlsl from "./shaders/gridColorTriangle/fragment.glsl?raw";
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

const posAttrib = gl.getAttribLocation(program, "pos");
const posBuffer = createBuffer(gl, posAttrib, {
  dataType: gl.FLOAT,
  stride: 2 * 4,
  size: 2,
});

const colorAttrib = gl.getAttribLocation(program, "color");
const colorBuffer = createBuffer(gl, colorAttrib, {
  size: 3,
  stride: 3 * 4,
  dataType: gl.FLOAT,
});
const colors: number[] = [];

gl.clearColor(0, 0, 0, 1);
gl.clear(gl.COLOR_BUFFER_BIT);
const points: number[] = [];
window.addEventListener("click", (e: MouseEvent) => {
  const { clientX, clientY } = e;
  const x = (clientX / window.innerWidth) * 2 - 1;
  const y = 1 - (clientY / window.innerHeight) * 2;
  points.push(x, y);
  colors.push(Math.random(), Math.random(), Math.random());
  if (points.length && points.length % 6 === 0) {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, points.length / 2);
    console.log(points);
  }
});
