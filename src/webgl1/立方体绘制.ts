const canvas: HTMLCanvasElement = document.querySelector("#canvas")!;
canvas.style.width = "100vw"
canvas.style.height = '100vh'
canvas.style.display = 'block'
const { width, height } = canvas.getBoundingClientRect()
canvas.width = width
canvas.height = height

const gl = canvas.getContext("webgl", { depth: true })!

const vertexShader = gl.createShader(gl.VERTEX_SHADER)!
gl.shaderSource(vertexShader, /*glsl*/`
  attribute vec3 pos;
  uniform mat4 modelMatrix;
  attribute vec4 color;
  varying vec4 vColor;
    void main(){
      gl_Position=modelMatrix*vec4(pos,1);
      vColor=color;
    }
  `)
gl.compileShader(vertexShader)
if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
  const log = gl.getShaderInfoLog(vertexShader);
  console.error("着色器vertexShader编译错误：", log);
}
const fragShader = gl.createShader(gl.FRAGMENT_SHADER)!
gl.shaderSource(fragShader, /*glsl*/`
    precision mediump float ;
    varying vec4 vColor;
    void main(){
      gl_FragColor=vColor;
    }
  `)
gl.compileShader(fragShader)
if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
  const log = gl.getShaderInfoLog(fragShader);
  console.error("着色器fragShader编译错误：", log);
}
const program = gl.createProgram()!
gl.attachShader(program, vertexShader)
gl.attachShader(program, fragShader)
gl.linkProgram(program)
gl.useProgram(program)
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  const log = gl.getProgramInfoLog(program);
  console.error("Program链接错误：", log);
}

gl.clearColor(0, 0, 0, 1)
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
gl.enable(gl.DEPTH_TEST)

function createCube(size: number) {
  const x = size / 2
  const y = size / 2
  const z = size / 2
  const cornerPosition = [
    // front
    [-x, -y, -z],
    [x, -y, -z],
    [x, y, -z],
    [-x, y, -z],
    // back
    [- x, -y, z],
    [x, -y, z],
    [x, y, z],
    [-x, y, z]
  ]
  const positions: number[] = []
  const faceColors: number[][] = [
    // front
    [1, 0, 0, 1],
    // left
    [0, 1, 0, 1],
    // back
    [0, 0, 1, 1],
    //right,
    [1, 1, 0, 1],
    //top
    [1, 0, 1, 1],
    //bottom
    [1, 1, 1, 1]
  ]
  const colors: number[] = []
  // 6个面的索引
  const faceIndices: number[][] = [
    // front
    [
      0, 1, 2, 3
    ],
    // left
    [
      4, 0, 3, 7
    ],
    // right
    [1, 5, 6, 2],
    //top
    [3, 2, 6, 7],
    // bottom
    [
      0, 1, 5, 4
    ],
    //back
    [4, 5, 6, 7]
  ]
  for (let i = 0; i < 6; i++) {
    const faceIndice = faceIndices[i]
    const faceColor = faceColors[i]
    positions.push(
      ...cornerPosition[faceIndice[0]],
      ...cornerPosition[faceIndice[1]],
      ...cornerPosition[faceIndice[2]],
      ...cornerPosition[faceIndice[0]],
      ...cornerPosition[faceIndice[2]],
      ...cornerPosition[faceIndice[3]],
    )
    for (let j = 0; j < 6; j++) {
      colors.push(...faceColor)
    }
  }
  return {
    positions: positions,
    colors
  }
}
const cube = createCube(1)
const posAttribLoc = gl.getAttribLocation(program, "pos")
gl.enableVertexAttribArray(posAttribLoc)
const posBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
gl.vertexAttribPointer(posAttribLoc, 3, gl.FLOAT, false, 3 * 4, 0)
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube.positions), gl.STATIC_DRAW)

const colorLoc = gl.getAttribLocation(program, "color")
gl.enableVertexAttribArray(colorLoc)
const colorBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 4 * 4, 0)
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube.colors), gl.STATIC_DRAW)


const identity = window.matrix.identity()
const modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix")
let count = 0
function render() {
  count += 0.01
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  const rotateX = window.matrix.rotateX(identity, Math.PI / 8)
  const rotationY = window.matrix.rotationY(Math.PI / 4 * count)
  const matrix = window.matrix.multiply(rotateX, rotationY)
  gl.uniformMatrix4fv(modelMatrixLoc, false, matrix)
  gl.drawArrays(gl.TRIANGLES, 0, cube.positions.length / 3)
  requestAnimationFrame(render)
}
render()