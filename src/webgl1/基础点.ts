import vertexGlsl from "./shaders/pointShader/vertex.glsl?raw";
import fragGlsl from "./shaders/pointShader/fragment.glsl?raw";
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

window.addEventListener("click", (e: MouseEvent) => {
  const { clientX, clientY } = e;
  const x = (clientX / window.innerWidth) * 2 - 1;
  const y = 1 - (clientY / window.innerHeight) * 2;
  gl.vertexAttrib2f(posAttrib, x, y);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.POINTS, 0, 1);
});
