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
        normals: new Float32Array(normals)
    };
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