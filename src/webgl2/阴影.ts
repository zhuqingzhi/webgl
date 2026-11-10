const canvas = document.querySelector("#canvas") as HTMLCanvasElement;
canvas.style.width = "100vw";
canvas.style.height = "100vh";
canvas.style.display = "block";

const gl = canvas.getContext("webgl2", {
    depth: true,
    antialias: true,
});

if (!gl) {
    throw new Error("WebGL2 is not supported.");
}

type Mat4 = Float32Array;
type Vec3 = readonly [number, number, number];

function createShader(gl2: WebGL2RenderingContext, type: number, src: string): WebGLShader {
    const shader = gl2.createShader(type);
    if (!shader) {
        throw new Error("Failed to create shader.");
    }
    gl2.shaderSource(shader, src);
    gl2.compileShader(shader);
    if (!gl2.getShaderParameter(shader, gl2.COMPILE_STATUS)) {
        const info = gl2.getShaderInfoLog(shader) ?? "Unknown shader compile error.";
        gl2.deleteShader(shader);
        throw new Error(info);
    }
    return shader;
}

function createProgram(gl2: WebGL2RenderingContext, vs: string, fs: string): WebGLProgram {
    const v = createShader(gl2, gl2.VERTEX_SHADER, vs);
    const f = createShader(gl2, gl2.FRAGMENT_SHADER, fs);
    const program = gl2.createProgram();
    if (!program) {
        throw new Error("Failed to create program.");
    }
    gl2.attachShader(program, v);
    gl2.attachShader(program, f);
    gl2.linkProgram(program);
    gl2.deleteShader(v);
    gl2.deleteShader(f);
    if (!gl2.getProgramParameter(program, gl2.LINK_STATUS)) {
        const info = gl2.getProgramInfoLog(program) ?? "Unknown program link error.";
        gl2.deleteProgram(program);
        throw new Error(info);
    }
    return program;
}

function mat4Identity(): Mat4 {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ]);
}

function mat4Multiply(a: Mat4, b: Mat4): Mat4 {
    const out = new Float32Array(16);
    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
    out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
    out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
    out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    return out;
}

function mat4Perspective(fovYRad: number, aspect: number, near: number, far: number): Mat4 {
    const f = 1.0 / Math.tan(fovYRad * 0.5);
    const nf = 1 / (near - far);
    return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1,
        0, 0, (2 * far * near) * nf, 0,
    ]);
}

function vec3Normalize(v: Vec3): [number, number, number] {
    const len = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / len, v[1] / len, v[2] / len];
}

function vec3Subtract(a: Vec3, b: Vec3): [number, number, number] {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function vec3Cross(a: Vec3, b: Vec3): [number, number, number] {
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    ];
}

function vec3Add(a: Vec3, b: Vec3): [number, number, number] {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function vec3Scale(v: Vec3, s: number): [number, number, number] {
    return [v[0] * s, v[1] * s, v[2] * s];
}

function mat4LookAt(eye: Vec3, target: Vec3, up: Vec3): Mat4 {
    const z = vec3Normalize(vec3Subtract(eye, target));
    const x = vec3Normalize(vec3Cross(up, z));
    const y = vec3Cross(z, x);
    return new Float32Array([
        x[0], y[0], z[0], 0,
        x[1], y[1], z[1], 0,
        x[2], y[2], z[2], 0,
        -(x[0] * eye[0] + x[1] * eye[1] + x[2] * eye[2]),
        -(y[0] * eye[0] + y[1] * eye[1] + y[2] * eye[2]),
        -(z[0] * eye[0] + z[1] * eye[1] + z[2] * eye[2]),
        1,
    ]);
}

function mat4Translate(tx: number, ty: number, tz: number): Mat4 {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        tx, ty, tz, 1,
    ]);
}

function mat4RotateY(rad: number): Mat4 {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    return new Float32Array([
        c, 0, -s, 0,
        0, 1, 0, 0,
        s, 0, c, 0,
        0, 0, 0, 1,
    ]);
}

function mat4Transpose(m: Mat4): Mat4 {
    return new Float32Array([
        m[0], m[4], m[8], m[12],
        m[1], m[5], m[9], m[13],
        m[2], m[6], m[10], m[14],
        m[3], m[7], m[11], m[15],
    ]);
}

function mat4Inverse(m: Mat4): Mat4 {
    const out = new Float32Array(16);
    const m00 = m[0], m01 = m[1], m02 = m[2], m03 = m[3];
    const m10 = m[4], m11 = m[5], m12 = m[6], m13 = m[7];
    const m20 = m[8], m21 = m[9], m22 = m[10], m23 = m[11];
    const m30 = m[12], m31 = m[13], m32 = m[14], m33 = m[15];

    const b00 = m00 * m11 - m01 * m10;
    const b01 = m00 * m12 - m02 * m10;
    const b02 = m00 * m13 - m03 * m10;
    const b03 = m01 * m12 - m02 * m11;
    const b04 = m01 * m13 - m03 * m11;
    const b05 = m02 * m13 - m03 * m12;
    const b06 = m20 * m31 - m21 * m30;
    const b07 = m20 * m32 - m22 * m30;
    const b08 = m20 * m33 - m23 * m30;
    const b09 = m21 * m32 - m22 * m31;
    const b10 = m21 * m33 - m23 * m31;
    const b11 = m22 * m33 - m23 * m32;

    const det =
        b00 * b11 - b01 * b10 + b02 * b09 +
        b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) {
        throw new Error("Matrix inversion failed (determinant is zero).");
    }

    const invDet = 1 / det;

    out[0] = (m11 * b11 - m12 * b10 + m13 * b09) * invDet;
    out[1] = (m02 * b10 - m01 * b11 - m03 * b09) * invDet;
    out[2] = (m31 * b05 - m32 * b04 + m33 * b03) * invDet;
    out[3] = (m22 * b04 - m21 * b05 - m23 * b03) * invDet;
    out[4] = (m12 * b08 - m10 * b11 - m13 * b07) * invDet;
    out[5] = (m00 * b11 - m02 * b08 + m03 * b07) * invDet;
    out[6] = (m32 * b02 - m30 * b05 - m33 * b01) * invDet;
    out[7] = (m20 * b05 - m22 * b02 + m23 * b01) * invDet;
    out[8] = (m10 * b10 - m11 * b08 + m13 * b06) * invDet;
    out[9] = (m01 * b08 - m00 * b10 - m03 * b06) * invDet;
    out[10] = (m30 * b04 - m31 * b02 + m33 * b00) * invDet;
    out[11] = (m21 * b02 - m20 * b04 - m23 * b00) * invDet;
    out[12] = (m11 * b07 - m10 * b09 - m12 * b06) * invDet;
    out[13] = (m00 * b09 - m01 * b07 + m02 * b06) * invDet;
    out[14] = (m31 * b01 - m30 * b03 - m32 * b00) * invDet;
    out[15] = (m20 * b03 - m21 * b01 + m22 * b00) * invDet;
    return out;
}

function mat3NormalFromMat4(model: Mat4): Float32Array {
    const inv = mat4Inverse(model);
    const invT = mat4Transpose(inv);
    return new Float32Array([
        invT[0], invT[1], invT[2],
        invT[4], invT[5], invT[6],
        invT[8], invT[9], invT[10],
    ]);
}

function createSphere(radius: number, ySeg: number, xSeg: number): { vertices: Float32Array; indices: Uint16Array } {
    const data: number[] = [];
    const idx: number[] = [];
    for (let y = 0; y <= ySeg; y++) {
        const v = y / ySeg;
        const phi = v * Math.PI;
        for (let x = 0; x <= xSeg; x++) {
            const u = x / xSeg;
            const theta = u * Math.PI * 2;
            const nx = Math.sin(phi) * Math.cos(theta);
            const ny = Math.cos(phi);
            const nz = Math.sin(phi) * Math.sin(theta);
            data.push(nx * radius, ny * radius, nz * radius, nx, ny, nz);
        }
    }
    for (let y = 0; y < ySeg; y++) {
        for (let x = 0; x < xSeg; x++) {
            const i0 = y * (xSeg + 1) + x;
            const i1 = i0 + xSeg + 1;
            idx.push(i0, i1, i0 + 1);
            idx.push(i1, i1 + 1, i0 + 1);
        }
    }
    return { vertices: new Float32Array(data), indices: new Uint16Array(idx) };
}

function createPlane(size: number): { vertices: Float32Array; indices: Uint16Array } {
    const s = size * 0.5;
    const vertices = new Float32Array([
        -s, 0, -s, 0, 1, 0,
        s, 0, -s, 0, 1, 0,
        s, 0, s, 0, 1, 0,
        -s, 0, s, 0, 1, 0,
    ]);
    const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
    return { vertices, indices };
}

type Mesh = {
    vao: WebGLVertexArrayObject;
    indexBuffer: WebGLBuffer;
    indexCount: number;
};

function createMesh(gl2: WebGL2RenderingContext, vertices: Float32Array, indices: Uint16Array): Mesh {
    const vao = gl2.createVertexArray();
    const vbo = gl2.createBuffer();
    const ebo = gl2.createBuffer();
    if (!vao || !vbo || !ebo) {
        throw new Error("Failed to create mesh buffers.");
    }

    gl2.bindVertexArray(vao);
    gl2.bindBuffer(gl2.ARRAY_BUFFER, vbo);
    gl2.bufferData(gl2.ARRAY_BUFFER, vertices, gl2.STATIC_DRAW);
    gl2.bindBuffer(gl2.ELEMENT_ARRAY_BUFFER, ebo);
    gl2.bufferData(gl2.ELEMENT_ARRAY_BUFFER, indices, gl2.STATIC_DRAW);

    const stride = 6 * 4;
    gl2.enableVertexAttribArray(0);
    gl2.vertexAttribPointer(0, 3, gl2.FLOAT, false, stride, 0);
    gl2.enableVertexAttribArray(1);
    gl2.vertexAttribPointer(1, 3, gl2.FLOAT, false, stride, 12);

    gl2.bindVertexArray(null);
    return { vao, indexBuffer: ebo, indexCount: indices.length };
}

const shadowVs = `#version 300 es
layout(location = 0) in vec3 aPos;
uniform mat4 uLightMVP;
void main() {
  gl_Position = uLightMVP * vec4(aPos, 1.0);
}
`;

const shadowFs = `#version 300 es
precision highp float;
void main() {}
`;

const mainVs = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;

uniform mat4 uModel;
uniform mat4 uViewProj;
uniform mat4 uLightMVP;
uniform mat3 uNormalMat;

out vec3 vWorldPos;
out vec3 vNormal;
out vec4 vLightClipPos;

void main() {
  vec4 world = uModel * vec4(aPos, 1.0);
  vWorldPos = world.xyz;
  vNormal = normalize(uNormalMat * aNormal);
  vLightClipPos = uLightMVP * vec4(aPos, 1.0);
  gl_Position = uViewProj * world;
}
`;

const mainFs = `#version 300 es
precision highp float;

in vec3 vWorldPos;
in vec3 vNormal;
in vec4 vLightClipPos;

uniform vec3 uColor;
uniform vec3 uLightPos;
uniform vec3 uCameraPos;
uniform sampler2D uShadowMap;
uniform vec2 uShadowMapSize;

out vec4 fragColor;

float shadowPCF(vec4 lightClipPos, vec3 normal, vec3 lightDir) {
  vec3 ndc = lightClipPos.xyz / lightClipPos.w;
  vec3 proj = ndc * 0.5 + 0.5;

  if (proj.x < 0.0 || proj.x > 1.0 || proj.y < 0.0 || proj.y > 1.0 || proj.z > 1.0) {
    return 1.0;
  }

  float bias = max(0.002 * (1.0 - dot(normal, lightDir)), 0.0007);
  vec2 texel = 1.0 / uShadowMapSize;
  float lit = 0.0;

  for (int x = -1; x <= 1; x++) {
    for (int y = -1; y <= 1; y++) {
      vec2 uv = proj.xy + vec2(float(x), float(y)) * texel;
      float depth = texture(uShadowMap, uv).r;
      lit += (proj.z - bias <= depth) ? 1.0 : 0.0;
    }
  }
  return lit / 9.0;
}

void main() {
  vec3 n = normalize(vNormal);
  vec3 l = normalize(uLightPos - vWorldPos);
  vec3 v = normalize(uCameraPos - vWorldPos);
  vec3 h = normalize(l + v);

  float diff = max(dot(n, l), 0.0);
  float spec = pow(max(dot(n, h), 0.0), 32.0);
  float shadow = shadowPCF(vLightClipPos, n, l);

  vec3 ambient = uColor * 0.2;
  vec3 diffuse = uColor * diff * shadow;
  vec3 specular = vec3(0.25) * spec * shadow;

  fragColor = vec4(ambient + diffuse + specular, 1.0);
}
`;

const shadowProgram = createProgram(gl, shadowVs, shadowFs);
const mainProgram = createProgram(gl, mainVs, mainFs);

const uShadowLightMvp = gl.getUniformLocation(shadowProgram, "uLightMVP");
if (!uShadowLightMvp) {
    throw new Error("Missing uniform uLightMVP for shadow pass.");
}

const uModel = gl.getUniformLocation(mainProgram, "uModel");
const uViewProj = gl.getUniformLocation(mainProgram, "uViewProj");
const uLightMvp = gl.getUniformLocation(mainProgram, "uLightMVP");
const uNormalMat = gl.getUniformLocation(mainProgram, "uNormalMat");
const uColor = gl.getUniformLocation(mainProgram, "uColor");
const uLightPos = gl.getUniformLocation(mainProgram, "uLightPos");
const uCameraPos = gl.getUniformLocation(mainProgram, "uCameraPos");
const uShadowMap = gl.getUniformLocation(mainProgram, "uShadowMap");
const uShadowMapSize = gl.getUniformLocation(mainProgram, "uShadowMapSize");

if (!uModel || !uViewProj || !uLightMvp || !uNormalMat || !uColor || !uLightPos || !uCameraPos || !uShadowMap || !uShadowMapSize) {
    throw new Error("Missing uniforms for main pass.");
}

const sphere = createSphere(0.5, 24, 48);
const plane = createPlane(8);
const sphereMesh = createMesh(gl, sphere.vertices, sphere.indices);
const planeMesh = createMesh(gl, plane.vertices, plane.indices);

const shadowSize = 1024;
const shadowDepthTex = gl.createTexture();
const shadowFbo = gl.createFramebuffer();
if (!shadowDepthTex || !shadowFbo) {
    throw new Error("Failed to create shadow framebuffer.");
}

gl.bindTexture(gl.TEXTURE_2D, shadowDepthTex);
gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.DEPTH_COMPONENT24,
    shadowSize,
    shadowSize,
    0,
    gl.DEPTH_COMPONENT,
    gl.UNSIGNED_INT,
    null,
);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFbo);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, shadowDepthTex, 0);
gl.drawBuffers([gl.NONE]);
gl.readBuffer(gl.NONE);
const fboStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
gl.bindFramebuffer(gl.FRAMEBUFFER, null);
if (fboStatus !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error(`Shadow framebuffer incomplete: ${fboStatus.toString()}`);
}

function resizeCanvasToDisplaySize(target: HTMLCanvasElement): void {
    const rect = target.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width * window.devicePixelRatio));
    const height = Math.max(1, Math.floor(rect.height * window.devicePixelRatio));
    if (target.width !== width || target.height !== height) {
        target.width = width;
        target.height = height;
    }
}

function drawShadowPass(mesh: Mesh, lightMvp: Mat4): void {
    gl.useProgram(shadowProgram);
    gl.uniformMatrix4fv(uShadowLightMvp, false, lightMvp);
    gl.bindVertexArray(mesh.vao);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
    gl.drawElements(gl.TRIANGLES, mesh.indexCount, gl.UNSIGNED_SHORT, 0);
}

function drawMainPass(
    mesh: Mesh,
    model: Mat4,
    viewProj: Mat4,
    lightMvp: Mat4,
    color: Vec3,
    lightPos: Vec3,
    cameraPos: Vec3,
): void {
    gl.useProgram(mainProgram);
    gl.uniformMatrix4fv(uModel, false, model);
    gl.uniformMatrix4fv(uViewProj, false, viewProj);
    gl.uniformMatrix4fv(uLightMvp, false, lightMvp);
    gl.uniformMatrix3fv(uNormalMat, false, mat3NormalFromMat4(model));
    gl.uniform3f(uColor, color[0], color[1], color[2]);
    gl.uniform3f(uLightPos, lightPos[0], lightPos[1], lightPos[2]);
    gl.uniform3f(uCameraPos, cameraPos[0], cameraPos[1], cameraPos[2]);
    gl.uniform1i(uShadowMap, 0);
    gl.uniform2f(uShadowMapSize, shadowSize, shadowSize);
    gl.bindVertexArray(mesh.vao);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
    gl.drawElements(gl.TRIANGLES, mesh.indexCount, gl.UNSIGNED_SHORT, 0);
}

const up: Vec3 = [0, 1, 0];
const lightPos: Vec3 = [2.5, 4.0, 1.8];
const lightTarget: Vec3 = [0, 0, 0];

class OrbitController {
    private readonly canvasEl: HTMLCanvasElement;
    private target: [number, number, number];
    private radius: number;
    private yaw: number;
    private pitch: number;
    private isRotating = false;
    private isPanning = false;
    private lastX = 0;
    private lastY = 0;

    constructor(canvasEl: HTMLCanvasElement, initialPos: Vec3, initialTarget: Vec3) {
        this.canvasEl = canvasEl;
        this.target = [initialTarget[0], initialTarget[1], initialTarget[2]];

        const offset = vec3Subtract(initialPos, initialTarget);
        this.radius = Math.hypot(offset[0], offset[1], offset[2]);
        this.yaw = Math.atan2(offset[2], offset[0]);
        this.pitch = Math.asin(offset[1] / this.radius);
        this.bindEvents();
    }

    getCameraPosition(): [number, number, number] {
        const x = this.target[0] + this.radius * Math.cos(this.pitch) * Math.cos(this.yaw);
        const y = this.target[1] + this.radius * Math.sin(this.pitch);
        const z = this.target[2] + this.radius * Math.cos(this.pitch) * Math.sin(this.yaw);
        return [x, y, z];
    }

    getTarget(): [number, number, number] {
        return [this.target[0], this.target[1], this.target[2]];
    }

    private bindEvents(): void {
        this.canvasEl.addEventListener("contextmenu", (e) => e.preventDefault());
        this.canvasEl.addEventListener("pointerdown", (e) => {
            this.canvasEl.setPointerCapture(e.pointerId);
            this.lastX = e.clientX;
            this.lastY = e.clientY;
            if (e.button === 0) {
                this.isRotating = true;
            } else if (e.button === 1 || e.button === 2) {
                this.isPanning = true;
            }
        });

        this.canvasEl.addEventListener("pointermove", (e) => {
            const dx = e.clientX - this.lastX;
            const dy = e.clientY - this.lastY;
            this.lastX = e.clientX;
            this.lastY = e.clientY;

            if (this.isRotating) {
                const rotateSpeed = 0.005;
                this.yaw -= dx * rotateSpeed;
                this.pitch -= dy * rotateSpeed;
                const limit = Math.PI * 0.49;
                this.pitch = Math.max(-limit, Math.min(limit, this.pitch));
            }

            if (this.isPanning) {
                const cameraPos = this.getCameraPosition();
                const forward = vec3Normalize(vec3Subtract(this.getTarget(), cameraPos));
                const right = vec3Normalize(vec3Cross(forward, up));
                const cameraUp = vec3Normalize(vec3Cross(right, forward));
                const panSpeed = this.radius * 0.0015;
                const pan = vec3Add(vec3Scale(right, -dx * panSpeed), vec3Scale(cameraUp, dy * panSpeed));
                this.target = vec3Add(this.target, pan);
            }
        });

        const stopAction = (): void => {
            this.isRotating = false;
            this.isPanning = false;
        };
        this.canvasEl.addEventListener("pointerup", stopAction);
        this.canvasEl.addEventListener("pointercancel", stopAction);
        this.canvasEl.addEventListener("wheel", (e) => {
            e.preventDefault();
            const zoomScale = Math.exp(e.deltaY * 0.001);
            this.radius *= zoomScale;
            this.radius = Math.max(1.2, Math.min(20, this.radius));
        }, { passive: false });
    }
}

const orbit = new OrbitController(canvas, [2.8, 2.2, 3.4], [0, 0.3, 0]);

gl.enable(gl.DEPTH_TEST);

function render(timeMs: number): void {
    resizeCanvasToDisplaySize(canvas);
    const time = timeMs * 0.001;
    const aspect = canvas.width / canvas.height;
    const cameraPos = orbit.getCameraPosition();
    const cameraTarget = orbit.getTarget();

    const cameraProj = mat4Perspective((60 * Math.PI) / 180, aspect, 0.1, 30);
    const cameraView = mat4LookAt(cameraPos, cameraTarget, up);
    const viewProj = mat4Multiply(cameraProj, cameraView);

    const lightProj = mat4Perspective((70 * Math.PI) / 180, 1, 0.5, 20);
    const lightView = mat4LookAt(lightPos, lightTarget, up);
    const lightViewProj = mat4Multiply(lightProj, lightView);

    const sphereModel = mat4Multiply(mat4Translate(0, 0.65 + Math.sin(time) * 0.1, 0), mat4RotateY(time * 0.8));
    const planeModel = mat4Identity();

    const sphereLightMvp = mat4Multiply(lightViewProj, sphereModel);
    const planeLightMvp = mat4Multiply(lightViewProj, planeModel);

    gl.viewport(0, 0, shadowSize, shadowSize);
    gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFbo);
    gl.clearDepth(1.0);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    drawShadowPass(planeMesh, planeLightMvp);
    drawShadowPass(sphereMesh, sphereLightMvp);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.08, 0.09, 0.12, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, shadowDepthTex);

    drawMainPass(planeMesh, planeModel, viewProj, planeLightMvp, [0.7, 0.72, 0.75], lightPos, cameraPos);
    drawMainPass(sphereMesh, sphereModel, viewProj, sphereLightMvp, [0.93, 0.95, 1.0], lightPos, cameraPos);

    requestAnimationFrame(render);
}

requestAnimationFrame(render);
