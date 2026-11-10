function createProgram(gl: WebGL2RenderingContext) {
  return gl.createProgram();
}
function createShader(
  gl: WebGL2RenderingContext,
  shaderSource: string,
  type:
    | WebGLRenderingContextBase["VERTEX_SHADER"]
    | WebGLRenderingContextBase["FRAGMENT_SHADER"],
) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("shader创建失败:" + type);
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
  return shader;
}
type BufferParams = {
  stride: number;
  size: number;
  offset: number;
  type:
    | WebGLRenderingContextBase["FLOAT"]
    | WebGLRenderingContextBase["UNSIGNED_INT"];
};
function createBuffer(
  gl: WebGL2RenderingContext,
  index: number,
  params: BufferParams,
) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(
    index,
    params.size,
    params.type,
    false,
    params.stride,
    params.offset,
  );
  gl.enableVertexAttribArray(index);
  return buffer;
}
const canvas: HTMLCanvasElement = document.querySelector("#canvas")!;
const width = window.innerWidth;
const height = window.innerHeight;
canvas.style.width = width + "px";
canvas.style.height = height + "px";
canvas.style.display = "block";
canvas.width = width;
canvas.height = height;

const vertex = `
    precision mediump float;
    varying vec2 vUv;
    attribute vec2 pos;
    void main(){
        gl_Position=vec4(pos,0,1);
        vec2 uv=pos/vec2(1,1);
        vUv=uv;
    }
`;
const frag = `
    precision mediump float;
    uniform sampler2D tex;
    varying vec2 vUv;
    void main(){
        vec4 col=texture2D(tex,vUv);
        // gl_FragColor=vec4(1,0,0,1);
        gl_FragColor=col;
    }
`;
const gl = canvas.getContext("webgl2")!;
const program = createProgram(gl);

const vertexShader = createShader(gl, vertex, gl.VERTEX_SHADER);
gl.attachShader(program, vertexShader);
const fragShader = createShader(gl, frag, gl.FRAGMENT_SHADER);
gl.attachShader(program, fragShader);
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  const info = gl.getProgramInfoLog(program);
  throw new Error(`Could not compile WebGL program. \n\n${info}`);
}
gl.useProgram(program);
const aPos = gl.getAttribLocation(program, "pos");
const aPosBuffer = createBuffer(gl, aPos, {
  type: gl.FLOAT,
  size: 2,
  stride: 2 * 4,
  offset: 0,
});

gl.clearColor(0, 0, 0, 1);
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([
    -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5,
  ]),
  gl.STATIC_DRAW,
);

const img = new Image();
img.src = "/color.jpg";

img.onload = (e) => {
  const uTex = gl.getUniformLocation(program, "tex");
  gl.activeTexture(gl.TEXTURE0);
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.uniform1i(uTex, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
};
