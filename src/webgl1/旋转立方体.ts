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
    | WebGLRenderingContextBase["UNSIGNED_BYTE"];
};
function createBuffer(
  gl: WebGLRenderingContext,
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
    attribute vec3 pos;
    attribute vec4 color;
    varying vec4 vColor;
    uniform mat4 pMatrix;
    uniform mat4 modelMatrix;
    varying vec3 v_normal;
    attribute vec3 a_normal;
    varying vec3 vPos;
    void main(){
        gl_Position=pMatrix*modelMatrix*vec4(pos,1);
        vColor=color;
        v_normal=normalize(mat3(modelMatrix)*a_normal);
        vPos=(modelMatrix*vec4(pos,1)).xyz;
    }
`;
const frag = `
    precision mediump float;
    varying vec4 vColor;
    uniform vec3 u_lightPosition;
    varying vec3 v_normal;
    varying vec3 vPos;
    void main(){
        vec4 lightColor=vec4(1,1,1,1);
        float ambientFactor=0.1;
        vec4 ambientColor=lightColor*ambientFactor;

        vec3 lightDir=u_lightPosition-vPos;
        float diffuseFactor=dot(normalize(lightDir),normalize(v_normal));
        diffuseFactor=max(diffuseFactor,0.);
        vec4 diffuseColor=lightColor*diffuseFactor;

        gl_FragColor=vColor*(ambientColor+diffuseColor);
    }
`;
const gl = canvas.getContext("webgl")!;
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
gl.clearColor(0, 0, 0, 1);
gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
//顶点信息
let zeroX = 0.5;
let zeroY = 0.5;
let zeroZ = 0.5;
/* prettier-ignore */
let positions = [
    [-zeroX, -zeroY, zeroZ],  //V0
    [zeroX, -zeroY, zeroZ],  //V1
    [zeroX, zeroY, zeroZ],   //V2
    [-zeroX, zeroY, zeroZ],  //V3
    [-zeroX, -zeroY, -zeroZ],//V4
    [-zeroX, zeroY, -zeroZ], //V5
    [zeroX, zeroY, -zeroZ],  //V6
    [zeroX, -zeroY, -zeroZ]  //V7
]
/* prettier-ignore */
const CUBE_FACE_INDICES = [
  [0, 1, 2, 3], //前面
  [4, 5, 6, 7], //后面
  [0, 3, 5, 4], //左面
  [1, 7, 6, 2], //右面
  [3, 2, 6, 5], //上面
  [0, 4, 7, 1] // 下面
];
/* prettier-ignore */
const FACE_COLORS = [
    [1, 0, 0, 1], // 前面，红色
    [0, 1, 0, 1], // 后面，绿色
    [0, 0, 1, 1], // 左面，蓝色
    [1, 1, 0, 1], // 右面，黄色
    [1, 0, 1, 1], // 上面，品色
    [0, 1, 1, 1]  // 下面，青色
]

const indices: number[] = [];
let vertices: number[] = [];
const colors: number[] = [];

for (let i = 0; i < CUBE_FACE_INDICES.length; i++) {
  // 绘制一个面
  const faceIndices = CUBE_FACE_INDICES[i];
  const faceColor = FACE_COLORS[i];
  // 绘制面三角形
  indices.push(
    faceIndices[0],
    faceIndices[1],
    faceIndices[2],
    faceIndices[0],
    faceIndices[2],
    faceIndices[3],
  );
  for (let j = 0; j < 4; j++) {
    let position = positions[faceIndices[j]];
    vertices = vertices.concat(position);
    colors.push(...faceColor);
  }
}
console.log(vertices, indices, colors);
const aPos = gl.getAttribLocation(program, "pos");
const aPosBuffer = createBuffer(gl, aPos, {
  type: gl.FLOAT,
  stride: 3 * 4,
  size: 3,
  offset: 0,
});
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
const aColor = gl.getAttribLocation(program, "color");
const colorBuffer = createBuffer(gl, aColor, {
  type: gl.FLOAT,
  stride: 4 * 4,
  size: 4,
  offset: 0,
});
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

/* prettier-ignore */
let indices2 = [
  0, 1, 2, 0, 2, 3,
  4, 5, 6, 4, 6, 7,
  8, 9, 10, 8, 10, 11, 
  12, 13, 14, 12, 14,15,
  16, 17, 18, 16,18, 19,
  20, 21, 22, 20, 22, 23,
];
const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(
  gl.ELEMENT_ARRAY_BUFFER,
  new Uint8Array(indices2),
  gl.STATIC_DRAW,
);

var normalInput = [
  [0, 0, 1], //前平面
  [0, 0, -1], //后平面
  [-1, 0, 0], //左平面
  [1, 0, 0], //右平面
  [0, 1, 0], //上平面
  [0, -1, 0], //下平面
];

const aNormalLoc = gl.getAttribLocation(program, "a_normal");
const normalBuffer = createBuffer(gl, aNormalLoc, {
  type: gl.FLOAT,
  size: 3,
  stride: 3 * 4,
  offset: 0,
});
/* prettier-ignore */
const normals:number[] = []

for (let i = 0; i < normalInput.length; i++) {
  const faceNormal = normalInput[i];
  normals.push(...faceNormal, ...faceNormal, ...faceNormal, ...faceNormal);
}

gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

gl.enable(gl.CULL_FACE);

const uLightPositionLoc = gl.getUniformLocation(program, "u_lightPosition");
gl.uniform3f(uLightPositionLoc, 0, 3, 6);

const modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
const identity = window.matrix.identity();
const modelMatrix = window.matrix.rotateX(identity, 0);
gl.uniformMatrix4fv(modelMatrixLoc, false, modelMatrix);
const pMatrixLoc = gl.getUniformLocation(program, "pMatrix");
const aspect = canvas.width / canvas.height;
const pMatrix: Float32Array = window.matrix.ortho(
  -10 * aspect,
  10 * aspect,
  -10,
  10,
  -20,
  20,
);
gl.uniformMatrix4fv(pMatrixLoc, false, pMatrix);
console.log(colors);
let angle = 0;
function animate() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  angle += 0.01;
  const rotateXMatrix = window.matrix.rotateX(identity, angle);
  const rotateYMatrix = window.matrix.rotateY(identity, angle);

  const transMatrix = window.matrix.translation(5 * aspect, 0, 0);
  const rotate = window.matrix.multiply(rotateYMatrix, rotateXMatrix);
  const mat = window.matrix.multiply(transMatrix, rotateXMatrix);
  gl.uniformMatrix4fv(modelMatrixLoc, false, rotateXMatrix);
  gl.drawElements(gl.TRIANGLES, indices2.length, gl.UNSIGNED_BYTE, 0);
  requestAnimationFrame(animate);
}
animate();
