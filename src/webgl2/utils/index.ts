export function createShader(gl: WebGL2RenderingContext, type: WebGLRenderingContextBase["VERTEX_SHADER"]
    | WebGLRenderingContextBase['FRAGMENT_SHADER'], src: string) {
    const shader = gl.createShader(type)
    const shaderType = type === gl.FRAGMENT_SHADER ? "fragment shader" : "vertex shader"
    if (!shader) throw new Error(shaderType + "shader创建失败")
    gl.shaderSource(shader, src)
    gl.compileShader(shader)
    const compileStatus = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
    if (!compileStatus) {
        const log = gl.getShaderInfoLog(shader)
        gl.deleteShader(shader)
        throw new Error(shaderType + "着色器编译失败:" + log)
    }
    return shader
}

export function createProgram(gl: WebGL2RenderingContext) {
    const program = gl.createProgram()
    if (!program) throw new Error("program创建失败")
    return program
}


export function createSphere(radius: number, ySeg: number, xSeg: number): { vertices: Float32Array; indices: Uint16Array } {
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

export function createPlane(size: number): { vertices: Float32Array; indices: Uint16Array } {
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

export type MyMesh = {
    vao: WebGLBuffer,
    count: number,
    indexBuffer: WebGLBuffer
}
export interface Geometry {
    vao: WebGLBuffer
    count: number
    indices: WebGLBuffer

}
export function createGeometry(gl: WebGL2RenderingContext, vertices: Float32Array, indices: Uint16Array): Geometry {
    const vao = gl.createVertexArray()
    const vbo = gl.createBuffer()
    const ebo = gl.createBuffer()

    gl.bindVertexArray(vao)
    gl.enableVertexAttribArray(0)
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(1)
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12)

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)

    gl.bindVertexArray(null)

    return {
        vao,
        count: indices.length,
        indices: ebo
    }
}
export function createMesh(gl: WebGL2RenderingContext, vertices: Float32Array, indices: Uint16Array): MyMesh {
    const vao = gl.createVertexArray()
    const vbo = gl.createBuffer()
    const ebo = gl.createBuffer()

    gl.bindVertexArray(vao)
    gl.enableVertexAttribArray(0)
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(1)
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12)

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)

    gl.bindVertexArray(null)

    return {
        vao,
        count: indices.length,
        indexBuffer: ebo
    }
}
type Mat4 = Float32Array;
type Vec3 = readonly [number, number, number];

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
export class OrbitController {
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
    update() {
        this.getCameraPosition()
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