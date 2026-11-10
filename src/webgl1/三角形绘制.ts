import vertexGlsl from "./shaders/triangleShader/vertex.glsl?raw";
import fragGlsl from "./shaders/triangleShader/fragment.glsl?raw";
import { createShaderFromScript } from "./utils/index";
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
const posBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
gl.enableVertexAttribArray(posAttrib);
gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 8, 0);
gl.clearColor(0, 0, 0, 1);
gl.clear(gl.COLOR_BUFFER_BIT);
const points: number[] = [];
window.addEventListener("click", (e: MouseEvent) => {
  const { clientX, clientY } = e;
  const x = (clientX / window.innerWidth) * 2 - 1;
  const y = 1 - (clientY / window.innerHeight) * 2;
  points.push(x, y);

  if (points.length && points.length % 6 === 0) {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, points.length / 2);
    console.log(points);
  }
});
