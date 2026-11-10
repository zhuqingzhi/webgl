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
/*
      5 ---------- 6
     /|          / |
    / |         /  | 
  3 --|-------- 2  |
  |   4 --------|- 7
  |  /          |  /
  | /           | / 
  |/            |/ 
  0 ----------- 1
*/

let CUBE_FACE_INDICES = [
  [0, 1, 2, 3], //前面
  [4, 5, 6, 7], //后面
  [0, 3, 5, 4], //左面
  [1, 7, 6, 2], //右面
  [3, 2, 6, 5], //上面
  [0, 4, 7, 1], //下面
];
function createFace(width, height, depth, color) {
  let zeroX = width / 2;
  let zeroY = height / 2;
  let zeroZ = depth || 0.5;
  let cornerPositions = [
    [-zeroX, -zeroY, zeroZ],
    [zeroX, -zeroY, zeroZ],
    [zeroX, zeroY, zeroZ],
    [-zeroX, zeroY, zeroZ],
    [-zeroX, -zeroY, -zeroZ],

    [-zeroX, zeroY, -zeroZ],
    [zeroX, zeroY, -zeroZ],
    [zeroX, -zeroY, -zeroZ],
  ];
  let colorInput = [color || [0, 255, 0, 255]];
  let normalInput = [
    [0, 0, 1],
    [0, 0, -1],
    [-1, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
  ];
  let texcoordsInput = [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 0],
  ];
  let colors = [];
  let positions = [];
  let normals = [];
  let indices = [];
  let texcoords = [];
  for (let f = 0; f < 1; ++f) {
    let faceIndices = CUBE_FACE_INDICES[f];
    let color = colorInput[f];
    let normal = normalInput[f];
    for (let v = 0; v < 4; ++v) {
      let position = cornerPositions[faceIndices[v]];
      positions = positions.concat(position);
      colors = colors.concat(color);
      normals = normals.concat(normal);
      texcoords = texcoords.concat(texcoordsInput[v]);
    }
    let offset = 4 * f;
    indices.push(offset + 0, offset + 1, offset + 2);
    indices.push(offset + 0, offset + 2, offset + 3);
  }
  indices = new Uint16Array(indices);
  positions = new Float32Array(positions);
  colors = new Uint8Array(colors);
  normals = new Float32Array(normals);
  texcoords = new Float32Array(texcoords);
  console.log("texcooords", texcoords);
  return {
    positions: positions,
    indices: indices,
    colors: colors,
    normals: normals,
    texcoords: texcoords,
  };
}
function createWing(topWidth, bottomWidth, height, depth) {
  let zeroXLeft = topWidth / 2;
  let zeroXRight = zeroXLeft / 2 + (bottomWidth - topWidth);
  let zeroY = height / 2;
  let zeroZ = depth / 2;

  let cornerPositions = [
    [-zeroXLeft, -zeroY, zeroZ],
    [zeroXRight, -zeroY, zeroZ],
    [zeroXLeft, zeroY, zeroZ],
    [-zeroXLeft, zeroY, zeroZ],
    [-zeroXLeft, -zeroY, -zeroZ],

    [-zeroXLeft, zeroY, -zeroZ],
    [zeroXLeft, zeroY, -zeroZ],
    [zeroXRight, -zeroY, -zeroZ],
  ];
  let colorInput = [
    [255, 0, 0, 255],
    [0, 255, 0, 255],
    [0, 0, 255, 255],
    [255, 255, 0, 255],
    [0, 255, 255, 255],
    [255, 0, 255, 255],
  ];
  let normalInput = [
    [0, 0, 1],
    [0, 0, -1],
    [-1, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
  ];
  let texcoordsInput = [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 0],
  ];
  let colors = [];
  let positions = [];
  let normals = [];
  let indices = [];
  let texcoords = [];
  for (let f = 0; f < 6; ++f) {
    let faceIndices = CUBE_FACE_INDICES[f];
    let color = colorInput[f];
    let normal = normalInput[f];
    for (let v = 0; v < 4; ++v) {
      let position = cornerPositions[faceIndices[v]];
      positions = positions.concat(position);
      colors = colors.concat(color);
      normals = normals.concat(normal);
      texcoords = texcoords.concat(texcoordsInput[v]);
    }
    let offset = 4 * f;
    indices.push(offset + 0, offset + 1, offset + 2);
    indices.push(offset + 0, offset + 2, offset + 3);
  }
  indices = new Uint16Array(indices);
  positions = new Float32Array(positions);
  colors = new Uint8Array(colors);
  normals = new Float32Array(normals);
  texcoords = new Float32Array(texcoords);
  console.log("texcooords", texcoords);
  return {
    positions: positions,
    indices: indices,
    colors: colors,
    normals: normals,
    texcoords: texcoords,
  };
}

function createCube(width, height, depth) {
  let zeroX = width / 2;
  let zeroY = height / 2;
  let zeroZ = depth / 2;

  let cornerPositions = [
    [-zeroX, -zeroY, zeroZ],
    [zeroX, -zeroY, zeroZ],
    [zeroX, zeroY, zeroZ],
    [-zeroX, zeroY, zeroZ],
    [-zeroX, -zeroY, -zeroZ],

    [-zeroX, zeroY, -zeroZ],
    [zeroX, zeroY, -zeroZ],
    [zeroX, -zeroY, -zeroZ],
  ];
  let colorInput = [
    [255, 0, 0, 255],
    [0, 255, 0, 255],
    [0, 0, 255, 255],
    [255, 255, 0, 255],
    [0, 255, 255, 255],
    [255, 0, 255, 255],
  ];
  let normalInput = [
    [0, 0, 1],
    [0, 0, -1],
    [-1, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
  ];
  let texcoordsInput = [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 0],
  ];
  let colors = [];
  let positions = [];
  let normals = [];
  let indices = [];
  let texcoords = [];
  for (let f = 0; f < 6; ++f) {
    let faceIndices = CUBE_FACE_INDICES[f];
    let color = colorInput[f];
    let normal = normalInput[f];
    for (let v = 0; v < 4; ++v) {
      let position = cornerPositions[faceIndices[v]];
      positions = positions.concat(position);
      colors = colors.concat(color);
      normals = normals.concat(normal);
      texcoords = texcoords.concat(texcoordsInput[v]);
    }
    let offset = 4 * f;
    indices.push(offset + 0, offset + 1, offset + 2);
    indices.push(offset + 0, offset + 2, offset + 3);
  }
  indices = new Uint16Array(indices);
  positions = new Float32Array(positions);
  colors = new Uint8Array(colors);
  normals = new Float32Array(normals);
  texcoords = new Float32Array(texcoords);
  console.log("texcooords", texcoords);
  return {
    positions: positions,
    indices: indices,
    colors: colors,
    normals: normals,
    texcoords: texcoords,
  };
}
function createLongCube(width, height, depth, repeatCount) {
  let zeroX = width / 2;
  let zeroY = height / 2;
  let zeroZ = depth / 2;

  let cornerPositions = [
    [-zeroX, -zeroY, zeroZ],
    [zeroX, -zeroY, zeroZ],
    [zeroX, zeroY, zeroZ],
    [-zeroX, zeroY, zeroZ],
    [-zeroX, -zeroY, -zeroZ],

    [-zeroX, zeroY, -zeroZ],
    [zeroX, zeroY, -zeroZ],
    [zeroX, -zeroY, -zeroZ],
  ];
  let colorInput = [
    [255, 10, 40, 255],
    [10, 255, 40, 255],
    [10, 40, 255, 255],
    [255, 255, 10, 255],
    [10, 255, 255, 255],
    [255, 10, 255, 255],
  ];
  let normalInput = [
    [0, 0, 1],
    [0, 0, -1],
    [-1, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
  ];
  let texcoordsInput = [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 0],
  ];
  let colors = [];
  let positions = [];
  let normals = [];
  let indices = [];
  let texcoords = [];
  for (let f = 0; f < 6; ++f) {
    let faceIndices = CUBE_FACE_INDICES[f];
    let color = colorInput[f];
    let normal = normalInput[f];
    for (let v = 0; v < 4; ++v) {
      let position = cornerPositions[faceIndices[v]];
      positions = positions.concat(position);
      colors = colors.concat(color);
      normals = normals.concat(normal);
      texcoords = texcoords.concat(texcoordsInput[v]);
    }
    let offset = 4 * f;
    indices.push(offset + 0, offset + 1, offset + 2);
    indices.push(offset + 0, offset + 2, offset + 3);
  }
  for (let i = 1; i < repeatCount; i++) {
    let index = 2;
    if (i == repeatCount - 1) {
      index = 1;
    }
    index = 0;
    for (let f = 0; f < 6 - index; ++f) {
      let faceIndices = CUBE_FACE_INDICES[f + index];
      let color = colorInput[f + index];
      let normal = normalInput[f + index];
      for (let v = 0; v < 4; ++v) {
        let position = cornerPositions[faceIndices[v]];
        positions.push(position[0], position[1], position[2] - i * depth);
        colors = colors.concat(color);
        normals = normals.concat(normal);
        texcoords = texcoords.concat(texcoordsInput[v]);
      }
      let offset = 24 * i + 4 * f;
      indices.push(offset + 0, offset + 1, offset + 2);
      indices.push(offset + 0, offset + 2, offset + 3);
    }
  }
  indices = new Uint16Array(indices);
  positions = new Float32Array(positions);
  colors = new Uint8Array(colors);
  normals = new Float32Array(normals);
  texcoords = new Float32Array(texcoords);
  console.log("texcooords", texcoords);
  return {
    positions: positions,
    indices: indices,
    colors: colors,
    normals: normals,
    texcoords: texcoords,
  };
}

function createCone(
  topRadius,
  bottomRadius,
  height,
  bottomDivide,
  verticalDivide,
  topColor,
  bottomColor,
  verticalColor,
) {
  let positions = [];
  let vertex = {};
  let indices = [];
  let normals = [];
  let colors = [];
  let atanθ = Math.atan2(bottomRadius - topRadius, height);
  let cosAtanθ = Math.cos(atanθ);
  let sinAtanθ = Math.sin(atanθ);
  let color = bottomColor || { r: 200, g: 200, b: 200, a: 255 };

  for (let i = -1; i <= verticalDivide + 1; i++) {
    let currentRadius = 0;
    if (i > verticalDivide) {
      currentRadius = topRadius;
    } else if (i < 0) {
      currentRadius = bottomRadius;
    } else {
      currentRadius =
        bottomRadius + (topRadius - bottomRadius) * (i / verticalDivide);
    }
    let yValue = (height * i) / verticalDivide - height / 2;
    if (i == -1 || i == verticalDivide + 1) {
      color = bottomColor || { r: 100, g: 100, b: 100, a: 255 };
      currentRadius = 0;
      if (i == -1) {
        yValue = -height / 2;
      } else {
        yValue = height / 2;
      }
    } else {
      color = { r: 100, g: 100, b: 100, a: 255 };
    }
    for (let j = 0; j <= bottomDivide; j++) {
      let xUnit = Math.sin((j * Math.PI * 2) / bottomDivide);
      let zUnit = Math.cos((j * Math.PI * 2) / bottomDivide);
      let xValue = currentRadius * xUnit;
      var zValue = currentRadius * zUnit;
      positions.push(xValue, yValue, zValue);
      normals.push(
        i < 0 || i > verticalDivide ? 0 : xUnit * cosAtanθ,
        i < 0 ? -1 : i > verticalDivide ? 1 : sinAtanθ,
        i < 0 || i > verticalDivide ? 0 : zUnit * cosAtanθ,
      );
      colors.push(color.r, color.g, color.b, color.a);
    }
  }

  // indices
  let vertexCountPerRadius = bottomDivide + 1;
  for (let i = 0; i < verticalDivide + 2; i++) {
    for (let j = 0; j < bottomDivide; j++) {
      indices.push(i * vertexCountPerRadius + j);
      indices.push(i * vertexCountPerRadius + j + 1);
      indices.push((i + 1) * vertexCountPerRadius + j + 1);

      indices.push(
        vertexCountPerRadius * (i + 0) + j,
        vertexCountPerRadius * (i + 1) + j + 1,
        vertexCountPerRadius * (i + 1) + j,
      );
    }
  }

  vertex.positions = new Float32Array(positions);
  vertex.indices = new Uint16Array(indices);
  vertex.normals = new Float32Array(normals);
  vertex.colors = new Uint8Array(colors);
  return vertex;
}
function getElementsCountPerVertex(attribute) {
  let result = 3;
  switch (attribute) {
    case "colors":
      result = 4;
      break;
    case "indices":
      result = 1;
      break;
    case "texcoords":
      result = 2;
      break;
  }
  return result;
}
function getArrayTypeByAttribName(attribute) {
  let type = Float32Array;
  switch (attribute) {
    case "colors":
      type = Uint8Array;
      break;
    case "indices":
      type = Uint16Array;
      break;
  }
  return type;
}
function transformIndicesToUnIndices(vertex) {
  let indices = vertex.indices;
  let vertexsCount = indices.length;
  let destVertex = {};

  Object.keys(vertex).forEach(function (attribute) {
    if (attribute == "indices") {
      return;
    }
    let src = vertex[attribute];
    let elementsPerVertex = getElementsCountPerVertex(attribute);
    let dest = [];
    let index = 0;
    for (let i = 0; i < indices.length; i++) {
      for (let j = 0; j < elementsPerVertex; j++) {
        dest[index] = src[indices[i] * elementsPerVertex + j];
        index++;
      }
    }
    let type = getArrayTypeByAttribName(attribute);
    destVertex[attribute] = new type(dest);
  });
  return destVertex;
}

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
        v_normal=mat3(modelMatrix)*a_normal;
        vPos=(modelMatrix*vec4(pos,1)).xyz;
    }
`;
const frag = `
    precision mediump float;
    varying vec4 vColor;
    varying vec3 vPos;
    varying vec3 v_normal;
    uniform vec3 u_lightPosition;
    uniform vec3 u_viewPosition;
    uniform int enableBling;

    void main(){
        vec3 lightColor=vec3(1,1,1);
        float ambientFactor=0.1;
        
        vec3 lightDir=u_lightPosition-vPos;
        float diffuseFactor=dot(normalize(lightDir),normalize(v_normal));
        diffuseFactor=max(diffuseFactor,0.);

        vec3 viewDir=u_viewPosition-vPos;
        // 反射光
        vec3 reflectDir=reflect(-lightDir,v_normal);

        // float specularFactor=0.;
        // float shininess=500.;
        // if(diffuseFactor>0.){
        //      specularFactor=dot(normalize(viewDir),normalize(reflectDir));
        //      specularFactor=max(specularFactor,0.);
        //      specularFactor=pow(specularFactor,shininess);
        // }
        viewDir=normalize(viewDir);
        vec3 halfDir=normalize(viewDir+normalize(lightDir));
        float specularFactor=0.;
        float shininess=500.;
        if(diffuseFactor>0.){
            // if(enableBling>0){
                specularFactor=dot(normalize(v_normal),halfDir);
            // }else{
            //     specularFactor=dot(viewDir,normalize(reflectDir));
            // }
            specularFactor=max(specularFactor,0.);
            specularFactor=pow(specularFactor,shininess);
            
        }
        
        vec3 specularColor=lightColor*specularFactor*1.5;


        gl_FragColor=vColor*vec4(lightColor*(ambientFactor+diffuseFactor)+specularColor,1);
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

function createSphere(radius, divideByYAxis, divideByCircle) {
  let yUnitAngle = Math.PI / divideByYAxis;
  let circleUnitAngle = (Math.PI * 2) / divideByCircle;
  let positions = [];
  let normals = [];
  for (let i = 0; i <= divideByYAxis; i++) {
    let unitY = Math.cos(yUnitAngle * i);
    let yValue = radius * unitY;

    for (let j = 0; j <= divideByCircle; j++) {
      let unitX = Math.sin(yUnitAngle * i) * Math.cos(circleUnitAngle * j);
      let unitZ = Math.sin(yUnitAngle * i) * Math.sin(circleUnitAngle * j);
      let xValue = radius * unitX;
      let zValue = radius * unitZ;
      positions.push(xValue, yValue, zValue);
      normals.push(unitX, unitY, unitZ);
    }
  }

  let indices = [];
  let circleCount = divideByCircle + 1;
  for (let j = 0; j < divideByCircle; j++) {
    for (let i = 0; i < divideByYAxis; i++) {
      indices.push(i * circleCount + j);
      indices.push(i * circleCount + j + 1);
      indices.push((i + 1) * circleCount + j);

      indices.push((i + 1) * circleCount + j);
      indices.push(i * circleCount + j + 1);
      indices.push((i + 1) * circleCount + j + 1);
    }
  }
  return {
    positions: new Float32Array(positions),
    indices: new Uint16Array(indices),
    normals: new Float32Array(normals),
  };
}
var random = Math.random;
function randomColor() {
  return {
    r: random() * 255,
    g: random() * 255,
    b: random() * 255,
    a: random() * 1,
  };
}
function createColorForVertex(vertex) {
  let vertexNums = vertex.positions;
  let colors = [];
  let color = {
    r: 255,
    g: 0,
    b: 0,
  };

  for (let i = 0; i < vertexNums.length; i++) {
    if (i % 36 == 0) {
      color = randomColor();
    }
    colors.push(color.r, color.g, color.b, 255);
  }

  vertex.colors = new Uint8Array(colors);
  return vertex;
}

var cube = createSphere(2, 6, 12); //createCube(10, 10, 10);
cube = transformIndicesToUnIndices(cube);
createColorForVertex(cube);
console.log(cube);
const aPos = gl.getAttribLocation(program, "pos");
const aPosBuffer = createBuffer(gl, aPos, {
  type: gl.FLOAT,
  stride: 3 * 4,
  size: 3,
  offset: 0,
});
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array(cube.positions),
  gl.STATIC_DRAW,
);
const aColor = gl.getAttribLocation(program, "color");
var colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, cube.colors, gl.STATIC_DRAW);
gl.vertexAttribPointer(aColor, 4, gl.UNSIGNED_BYTE, true, 4, 0);
gl.enableVertexAttribArray(aColor);

const aNormal = gl.getAttribLocation(program, "a_normal");
var colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, cube.normals, gl.STATIC_DRAW);
gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, true, 3 * 4, 0);
gl.enableVertexAttribArray(aNormal);

gl.enable(gl.CULL_FACE);

const uLightPositionLoc = gl.getUniformLocation(program, "u_lightPosition");
gl.uniform3f(uLightPositionLoc, 1, 0, 3);

const uViewPositionLoc = gl.getUniformLocation(program, "u_viewPosition");
gl.uniform3f(uViewPositionLoc, 1, 1, 1);

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
  gl.drawArrays(gl.TRIANGLES, 0, cube.positions.length / 3);
  requestAnimationFrame(animate);
}
animate();

const enableBlingLoc = gl.getUniformLocation(program, "enableBling");
const inputEl = document.createElement("input");
inputEl.type = "checkbox";
inputEl.style.display = "absolute";
inputEl.style.position = "right:0;top:0;";
inputEl.style.zIndex = "99";
inputEl.onchange = (e) => {
  console.log("hhh", e.target.checked);
  gl.uniform1i(enableBlingLoc, e.target.checked ? 1 : 0);
};
document.body.style.position = "relative";
document.body.appendChild(inputEl);
