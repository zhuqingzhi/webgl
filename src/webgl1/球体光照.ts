const canvas = document.getElementById("canvas")! as HTMLCanvasElement
canvas.style.width = '100vw'
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
        uniform mat4 viewMatrix;
        uniform mat4 projectionMatrix;
        uniform mat4 normalMatrix;
        attribute vec3 aNormal;
        varying vec3 vNormal;
        varying vec3 vPos;
        void main(){
            vec4 worldPos=modelMatrix*vec4(pos,1);
            gl_Position=projectionMatrix*viewMatrix*worldPos;
            vNormal=mat3(normalMatrix)*aNormal;
            vPos=worldPos.xyz;
        }
    `)
gl.compileShader(vertexShader)
const fragShader = gl.createShader(gl.FRAGMENT_SHADER)!
gl.shaderSource(fragShader, /*glsl*/`
    precision mediump float;
varying vec3 vNormal;
varying vec3 vPos;
uniform vec3 cameraPos;
uniform vec3 lightPos;
uniform vec4 color;
uniform vec3 lightColor;
uniform float ambientFactor;
uniform float u_Shininess;
void main(){

    // ========== 修正1：向量全部归一化，方向搞对 ==========
    vec3 N = normalize(vNormal);
    vec3 lightDir = normalize(lightPos - vPos); // 【关键】从片元指向光源，不是指向原点！
    float diffuseFactor = dot(N, lightDir);
    diffuseFactor = max(diffuseFactor, 0.0);

    // ========== 修正2：Blinn‑Phong 半程向量正确写法 ==========
    vec3 viewDir = normalize(cameraPos - vPos); // 从片元指向相机
    /* vec3 halfVec = normalize(lightDir + viewDir); // ✅ 半程向量 = L + V
    float specularFactor = dot(N, halfVec);
     */
    vec3 reflectDir=normalize(reflect(-lightDir,vNormal));
    float specularFactor=dot(reflectDir,viewDir);

    specularFactor = max(specularFactor, 0.0);
    specularFactor = pow(specularFactor, u_Shininess);
    vec3 outColor = lightColor * (ambientFactor + diffuseFactor + specularFactor * 0.8);
    gl_FragColor = color * vec4(outColor,1.0);
}

    `)

gl.compileShader(fragShader)

const program = gl.createProgram()
gl.attachShader(program, vertexShader)
gl.attachShader(program, fragShader)
gl.linkProgram(program)
gl.useProgram(program)

gl.clearColor(0, 0, 0, 1)
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

gl.enable(gl.DEPTH_TEST)



function createCube(size: number) {
    const x = size / 2
    const y = size / 2
    const z = size / 2

    const positions: number[] = []
    const colors: number[] = []
    const normals: number[] = []

    const cornerPos = [
        [-x, -y, -z],
        [x, -y, -z],
        [x, y, -z],
        [-x, y, -z],
        [-x, -y, z],
        [x, -y, z],
        [x, y, z],
        [-x, y, z],
    ]
    const faceIndices = [
        // front
        [0, 1, 2, 3],
        //back
        [4, 5, 6, 7],
        //left
        [4, 0, 3, 7],
        // right
        [1, 5, 6, 2],
        //top
        [3, 2, 6, 7],
        //bottom
        [0, 1, 5, 4]
    ]
    const faceColors = [
        //front
        [0, 1, 0, 1],
        //back
        [1, 1, 0, 1],
        //left
        [1, 1, 1, 1],
        //right
        [1, 0, 1, 1],
        //top
        [0, 1, 0, 1],
        //bottom
        [0, 1, 1, 1]
    ]
    const faceNormals = [
        // front
        [0, 0, -1],
        // bottom
        [0, 0, 1],
        // left
        [-1, 0, 0],
        // right
        [1, 0, 0],
        //top
        [0, 1, 0],
        //bottom
        [0, -1, 0]
    ]
    for (let i = 0; i < 6; i++) {
        const faceIndice = faceIndices[i]
        const faceColor = faceColors[i]
        const faceNormal = faceNormals[i]
        positions.push(
            ...cornerPos[faceIndice[0]],
            ...cornerPos[faceIndice[1]],
            ...cornerPos[faceIndice[2]],
            ...cornerPos[faceIndice[0]],
            ...cornerPos[faceIndice[2]],
            ...cornerPos[faceIndice[3]],
        )
        for (let j = 0; j < 6; j++) {
            colors.push(...faceColor)
            normals.push(...faceNormal)
        }
    }
    return {
        colors,
        positions,
        normals
    }
}
// const cube = createCube(1)
let cube = createSphere(0.5, 50, 50)

const posLoc = gl.getAttribLocation(program, "pos")
gl.enableVertexAttribArray(posLoc)
const posBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 3 * 4, 0)
gl.bufferData(gl.ARRAY_BUFFER, cube.positions, gl.STATIC_DRAW)



const aNormalLoc = gl.getAttribLocation(program, "aNormal")
gl.enableVertexAttribArray(aNormalLoc)
const normalBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
gl.vertexAttribPointer(aNormalLoc, 3, gl.FLOAT, false, 3 * 4, 0)
gl.bufferData(gl.ARRAY_BUFFER, cube.normals, gl.STATIC_DRAW)






const params = {
    cameraPos: [0, 0, 20],
    lightPos: [20, 20, 50],
    color: [0, 1, 0, 1],
    ambientFactor: 0.1,
    u_Shininess: 32,
    lightColor: [1, 1, 1]
}
const projectionMatrix = matrix.perspective(60, width / height, 0.1, 1000)
const viewMatrix = matrix.lookAt(
    new Vector3(...params.cameraPos),
    new Vector3(0, 0, 0),
    new Vector3(0, 1, 0)
)

const ambientFactorLoc = gl.getUniformLocation(program, "ambientFactor");
gl.uniform1f(ambientFactorLoc, params.ambientFactor)

const colorLoc = gl.getUniformLocation(program, "color");
gl.uniform4fv(colorLoc, params.color)

const u_ShininessLoc = gl.getUniformLocation(program, "u_Shininess");
gl.uniform1f(u_ShininessLoc, params.u_Shininess)

const lightColorLoc = gl.getUniformLocation(program, "lightColor");
gl.uniform3fv(lightColorLoc, params.lightColor)

const cameraPosLoc = gl.getUniformLocation(program, "cameraPos");
gl.uniform3fv(cameraPosLoc, params.cameraPos)

const lightPosLoc = gl.getUniformLocation(program, "lightPos");
gl.uniform3fv(lightPosLoc, params.lightPos)

const uMatrixLoc = gl.getUniformLocation(program, "modelMatrix")
const viewMatrixLoc = gl.getUniformLocation(program, "viewMatrix")
const projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix")
const nMatrixLoc = gl.getUniformLocation(program, "normalMatrix")
let count = 0
const translation = matrix.translation(8, 0, 0)

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    count += 1
    const rotationY = window.matrix.rotationY(Math.PI / 400 * count)
    const modelMatrix = translation
    // const modelMatrix = matrix.multiply(rotationY, translation)
    gl.uniformMatrix4fv(uMatrixLoc, false, modelMatrix)
    gl.uniformMatrix4fv(viewMatrixLoc, false, window.matrix.inverse(viewMatrix))
    gl.uniformMatrix4fv(projectionMatrixLoc, false, projectionMatrix)
    gl.uniformMatrix4fv(nMatrixLoc, false, matrix.transpose(matrix.inverse(modelMatrix)))
    gl.drawArrays(gl.TRIANGLES, 0, cube.positions.length / 3)
    requestAnimationFrame(render)
}

render()
function createSphere(
    radius: number,
    divideByYAxis: number,
    divideByCircle: number
): { positions: Float32Array; normals: Float32Array } {
    const pos: number[] = [];
    const nrm: number[] = [];

    for (let lat = 0; lat < divideByYAxis; lat++) {
        const theta0 = (lat * Math.PI) / divideByYAxis;
        const theta1 = ((lat + 1) * Math.PI) / divideByYAxis;

        for (let lon = 0; lon < divideByCircle; lon++) {
            const phi0 = (lon * 2 * Math.PI) / divideByCircle;
            const phi1 = ((lon + 1) * 2 * Math.PI) / divideByCircle;

            // 4个网格点
            const p = (t: number, p: number) => {
                const st = Math.sin(t);
                const ct = Math.cos(t);
                const sp = Math.sin(p);
                const cp = Math.cos(p);
                return {
                    x: radius * st * cp,
                    y: radius * ct,
                    z: radius * st * sp,
                    nx: st * cp,
                    ny: ct,
                    nz: st * sp
                }
            }
            const v0 = p(theta0, phi0)
            const v1 = p(theta0, phi1)
            const v2 = p(theta1, phi0)
            const v3 = p(theta1, phi1)

            // 三角1：v0 v1 v2
            pos.push(v0.x, v0.y, v0.z); nrm.push(v0.nx, v0.ny, v0.nz)
            pos.push(v1.x, v1.y, v1.z); nrm.push(v1.nx, v1.ny, v1.nz)
            pos.push(v2.x, v2.y, v2.z); nrm.push(v2.nx, v2.ny, v2.nz)
            // 三角2：v1 v3 v2
            pos.push(v1.x, v1.y, v1.z); nrm.push(v1.nx, v1.ny, v1.nz)
            pos.push(v3.x, v3.y, v3.z); nrm.push(v3.nx, v3.ny, v3.nz)
            pos.push(v2.x, v2.y, v2.z); nrm.push(v2.nx, v2.ny, v2.nz)
        }
    }
    return {
        positions: new Float32Array(pos),
        normals: new Float32Array(nrm)
    };
}