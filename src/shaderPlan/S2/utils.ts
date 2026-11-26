import { vec3 } from "gl-matrix"
import type { Mesh, Object3D } from "./D5"

export function createShader(gl: WebGL2RenderingContext, source: string, type: WebGLRenderingContextBase['VERTEX_SHADER'] | WebGLRenderingContextBase['FRAGMENT_SHADER']) {
    const shader = gl.createShader(type)
    const shaderType = type === gl.VERTEX_SHADER ? '顶点着色器' : "片元着色器"
    if (!shader) throw new Error(shaderType + "创建失败")
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(shaderType + "编译失败:" + gl.getShaderInfoLog(shader))
    }
    return shader
}
export function createSphere(radius: number, divideByYAxis: number, divideByCircle: number) {
    let yUnitAngle = Math.PI / divideByYAxis;
    let circleUnitAngle = (Math.PI * 2) / divideByCircle;
    let positions = [];
    let normals = [];
    let uv = []
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
            uv.push(j / divideByCircle, i / divideByYAxis)
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
        uv: new Float32Array(uv)
    };
}
export function createWavePlane(
    width = 1,
    height = 1,
    segX = 100,
    segY = 100,
    freq = 5,
) {
    const plane = createPlane(width, height, segX, segY)
    const amplitude = 0.02
    const w = 2 * Math.PI * freq

    for (let i = 0; i < plane.positions.length / 3; i++) {
        const u = plane.uv[i * 2]
        const v = plane.uv[i * 2 + 1]

        // z = amplitude * (sin(wu) + cos(wv))
        plane.positions[i * 3 + 2] =
            amplitude * (Math.sin(w * u) + Math.cos(w * v))

        const nx = -amplitude * w * Math.cos(w * u) / width
        const ny = amplitude * w * Math.sin(w * v) / height
        const length = Math.hypot(nx, ny, 1)

        plane.normals[i * 3] = nx / length
        plane.normals[i * 3 + 1] = ny / length
        plane.normals[i * 3 + 2] = 1 / length
    }

    return plane
}

export function isMesh(mesh: Object3D): mesh is Mesh {
    return mesh.type === 'Mesh'
}
function srgbToLinear(c: number): number {
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

export function colorToLinear(color: ArrayLike<number>): vec3 {
    return vec3.fromValues(
        srgbToLinear(color[0]),
        srgbToLinear(color[1]),
        srgbToLinear(color[2]),
    )
}

export function createCheckerCanvas(size = 512, cells = 8): HTMLCanvasElement {
    const c = document.createElement('canvas')
    c.width = c.height = size
    const ctx = c.getContext('2d')!
    const cell = size / cells
    for (let y = 0; y < cells; y++) {
        for (let x = 0; x < cells; x++) {
            ctx.fillStyle = (x + y) % 2 === 0 ? '#ffffff' : '#000000'
            ctx.fillRect(x * cell, y * cell, cell, cell)
        }
    }
    return c
}
export function createWhiteCanvas(size = 512, color = "#808080"): HTMLCanvasElement {
    const c = document.createElement('canvas')
    c.width = c.height = size
    const ctx = c.getContext('2d')!
    ctx.fillStyle = color
    ctx.fillRect(0, 0, size, size)
    return c
}

export function createPlane(
    width = 1,
    height = 1,
    segX = 1,
    segY = 1
) {
    if (segX < 1 || segY < 1) {
        throw new Error("segX 和 segY 必须 >= 1")
    }

    const positions: number[] = []
    const normals: number[] = []
    const uv: number[] = []
    const indices: number[] = []

    const halfW = width * 0.5
    const halfH = height * 0.5

    // 顶点：按行列生成
    for (let y = 0; y <= segY; y++) {
        const v = y / segY
        const py = v * height - halfH

        for (let x = 0; x <= segX; x++) {
            const u = x / segX
            const px = u * width - halfW

            // XZ 平面，Y=0
            positions.push(px, py, 0)
            normals.push(0, 0, 1)
            uv.push(u, v)
        }
    }

    // 索引：每个网格两个三角形
    const row = segX + 1
    for (let y = 0; y < segY; y++) {
        for (let x = 0; x < segX; x++) {
            const a = y * row + x
            const b = a + 1
            const c = a + row
            const d = c + 1

            indices.push(a, b, c)
            indices.push(c, b, d)
        }
    }

    return {
        positions: new Float32Array(positions),
        indices: new Uint16Array(indices),
        normals: new Float32Array(normals),
        uv: new Float32Array(uv)
    }
}

export function computeTangents(
    positions: Float32Array,
    normals: Float32Array,
    uvs: Float32Array,
    indices: Uint16Array
): Float32Array {
    const vertexCount = positions.length / 3
    const tan1 = new Float32Array(vertexCount * 3)   // 累加器
    const tan2 = new Float32Array(vertexCount * 3)

    for (let i = 0; i < indices.length; i += 3) {
        const i0 = indices[i], i1 = indices[i + 1], i2 = indices[i + 2]

        const x1 = positions[i1 * 3] - positions[i0 * 3]
        const y1 = positions[i1 * 3 + 1] - positions[i0 * 3 + 1]
        const z1 = positions[i1 * 3 + 2] - positions[i0 * 3 + 2]
        const x2 = positions[i2 * 3] - positions[i0 * 3]
        const y2 = positions[i2 * 3 + 1] - positions[i0 * 3 + 1]
        const z2 = positions[i2 * 3 + 2] - positions[i0 * 3 + 2]

        const s1 = uvs[i1 * 2] - uvs[i0 * 2]
        const t1 = uvs[i1 * 2 + 1] - uvs[i0 * 2 + 1]
        const s2 = uvs[i2 * 2] - uvs[i0 * 2]
        const t2 = uvs[i2 * 2 + 1] - uvs[i0 * 2 + 1]

        const det = s1 * t2 - s2 * t1
        if (Math.abs(det) < 1e-8) continue          // UV 退化的三角形，跳过
        const r = 1 / det

        const sdirX = (x1 * t2 - x2 * t1) * r
        const sdirY = (y1 * t2 - y2 * t1) * r
        const sdirZ = (z1 * t2 - z2 * t1) * r
        const tdirX = (x2 * s1 - x1 * s2) * r
        const tdirY = (y2 * s1 - y1 * s2) * r
        const tdirZ = (z2 * s1 - z1 * s2) * r

        for (const j of [i0, i1, i2]) {
            tan1[j * 3] += sdirX
            tan1[j * 3 + 1] += sdirY
            tan1[j * 3 + 2] += sdirZ
            tan2[j * 3] += tdirX
            tan2[j * 3 + 1] += tdirY
            tan2[j * 3 + 2] += tdirZ
        }
    }

    // Gram-Schmidt 正交化：T 减去它在 N 上的投影
    const tangents = new Float32Array(vertexCount * 3)
    for (let i = 0; i < vertexCount; i++) {
        const nx = normals[i * 3], ny = normals[i * 3 + 1], nz = normals[i * 3 + 2]
        let tx = tan1[i * 3], ty = tan1[i * 3 + 1], tz = tan1[i * 3 + 2]

        const d = nx * tx + ny * ty + nz * tz
        tx -= nx * d; ty -= ny * d; tz -= nz * d

        const len = Math.hypot(tx, ty, tz) || 1
        tangents[i * 3] = tx / len
        tangents[i * 3 + 1] = ty / len
        tangents[i * 3 + 2] = tz / len
    }

    return tangents
}
export function createNormalMapCanvas(size = 256, freq = 8): HTMLCanvasElement {
    const c = document.createElement('canvas')
    c.width = c.height = size
    const ctx = c.getContext('2d')!
    const img = ctx.createImageData(size, size)

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const u = x / size, v = y / size
            const w = Math.PI * 2 * freq
            // 高度场 h = sin(u*w) * cos(v*w)，梯度即法线的 xy
            const dx = Math.cos(u * w) * w
            const dy = -Math.sin(v * w) * w
            // 法线 = normalize(-dx, -dy, 1)，缩放一下避免过陡
            const nx = -dx * 0.02, ny = -dy * 0.02, nz = 1
            const len = Math.hypot(nx, ny, nz)

            const i = (y * size + x) * 4
            img.data[i] = ((nx / len) * 0.5 + 0.5) * 255
            img.data[i + 1] = ((ny / len) * 0.5 + 0.5) * 255
            img.data[i + 2] = ((nz / len) * 0.5 + 0.5) * 255
            img.data[i + 3] = 255
        }
    }
    ctx.putImageData(img, 0, 0)
    return c
}

export function isArrayBufferView(
    image: TexImageSource | ArrayBufferView,
): image is ArrayBufferView {
    return ArrayBuffer.isView(image)
}

// src/shaderPlan/S2/utils.ts 里加

function faceToDirection(face: number, s: number, t: number): [number, number, number] {
    switch (face) {
        case 0: return [1, -t, -s]   // +X
        case 1: return [-1, -t, s]   // -X
        case 2: return [s, 1, t]   // +Y
        case 3: return [s, -1, -t]   // -Y
        case 4: return [s, -t, 1]   // +Z
        case 5: return [-s, -t, -1]   // -Z
        default: return [0, 0, 1]
    }
}

function skyColor(dir: [number, number, number]): [number, number, number] {
    const [x, y, z] = dir
    const len = Math.hypot(x, y, z) || 1
    const ny = y / len              // -1（正下方）到 +1（正上方）

    if (ny >= 0) {
        // 天空：地平线浅白蓝 → 天顶深蓝
        const k = Math.pow(ny, 0.5)
        return [
            0.75 + (0.15 - 0.75) * k,
            0.85 + (0.35 - 0.85) * k,
            0.95 + (0.90 - 0.95) * k,
        ]
    } else {
        // 地面：地平线浅白蓝 → 地下褐
        const k = Math.pow(-ny, 0.5)
        return [
            0.75 + (0.30 - 0.75) * k,
            0.85 + (0.22 - 0.85) * k,
            0.95 + (0.15 - 0.95) * k,
        ]
    }
}

export function createSkyCubemap(size = 64): Uint8Array[] {
    const faces: Uint8Array[] = []

    for (let face = 0; face < 6; face++) {
        const data = new Uint8Array(size * size * 4)

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                // 像素 → 面内坐标 [-1, 1]
                const s = ((x + 0.5) / size) * 2 - 1
                const t = ((y + 0.5) / size) * 2 - 1

                const dir = faceToDirection(face, s, t)
                const c = skyColor(dir)

                const i = (y * size + x) * 4
                data[i] = Math.round(c[0] * 255)
                data[i + 1] = Math.round(c[1] * 255)
                data[i + 2] = Math.round(c[2] * 255)
                data[i + 3] = 255
            }
        }
        faces.push(data)
    }
    return faces
}

const DEBUG_COLORS = [
    [255, 0, 0],     // +X 红
    [0, 255, 0],     // -X 绿
    [0, 0, 255],     // +Y 蓝
    [255, 255, 0],   // -Y 黄
    [255, 0, 255],   // +Z 品红
    [0, 255, 255],   // -Z 青
]

export function createDebugCubemap(size = 64): Uint8Array[] {
    return DEBUG_COLORS.map(c => {
        const data = new Uint8Array(size * size * 4)
        for (let i = 0; i < size * size; i++) {
            data[i * 4] = c[0]
            data[i * 4 + 1] = c[1]
            data[i * 4 + 2] = c[2]
            data[i * 4 + 3] = 255
        }
        return data
    })
}