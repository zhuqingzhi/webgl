import vertexGlsl from "./shaders/textureShader/vertex.glsl?raw";
import fragGlsl from "./shaders/textureShader/fragment.glsl?raw";
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

const posAttrib = gl.getAttribLocation(program, "position");
const posBuffer = createBuffer(gl, posAttrib, {
  dataType: gl.FLOAT,
  stride: 2 * 4,
  size: 2,
});
const screenSizeAttrib = gl.getUniformLocation(program, "screenSize");
console.log(screenSizeAttrib);
gl.uniform2f(screenSizeAttrib, window.innerWidth, window.innerHeight);

/* prettier-ignore */
const points: number[] = [
  50,50,
  50,150,
  150,150,
  150,50
  ];
gl.clearColor(0, 0, 0, 1);
gl.clear(gl.COLOR_BUFFER_BIT);
gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

const pointIndexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pointIndexBuffer);
/* prettier-ignore */
const indices=[
  0,1,2,
  0,2,3
]
gl.bufferData(
  gl.ELEMENT_ARRAY_BUFFER,
  new Uint16Array(indices),
  gl.STATIC_DRAW,
);

const img = document.createElement("img");
img.src = "./color.jpg";
img.style = "width:0;height:0;display:none";
document.body.appendChild(img);
img.onload = (e) => {
  const uTexture = gl.getUniformLocation(program, "uTexture");
  gl.activeTexture(gl.TEXTURE0);
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.uniform1i(uTexture, 0);
  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
};
