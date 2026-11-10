const canvas = document.querySelector("#canvas") as HTMLCanvasElement;
// 创建上下文，depth+stencil都开启
const gl = canvas.getContext("webgl", {
    depth: true,
    stencil: true,
    antialias: true
})!;

// 顶点着色器：支持法线，可沿法线膨胀模型
const vsSource = `
attribute vec3 aPos;
attribute vec3 aNormal;
uniform mat4 mvp;
uniform float expand;
void main(){
  vec3 pos = aPos + aNormal * expand;
  gl_Position = mvp * vec4(pos,1.0);
}
`;
const fsSource = `
precision mediump float;
uniform vec3 color;
void main(){
  gl_FragColor = vec4(color,1.0);
}
`;

// shader编译工具
function createShader(gl: WebGLRenderingContext, type: number, src: string) {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
}
const vsh = createShader(gl, gl.VERTEX_SHADER, vsSource);
const fsh = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
const program = gl.createProgram()!;
gl.attachShader(program, vsh);
gl.attachShader(program, fsh);
gl.linkProgram(program);
gl.useProgram(program);

// 顶点属性位置
const aPosLoc = gl.getAttribLocation(program, "aPos");
const aNormalLoc = gl.getAttribLocation(program, "aNormal");
const mvpLoc = gl.getUniformLocation(program, "mvp");
const expandLoc = gl.getUniformLocation(program, "expand");
const colorLoc = gl.getUniformLocation(program, "color");

// 球体顶点数据（简化，位置+法线）
const sphereData: number[] = [];
const indexData: number[] = [];
const radius = 0.5;
const ySeg = 16;
const circSeg = 32;
for (let y = 0; y <= ySeg; y++) {
    const phi = Math.PI * y / ySeg;
    for (let x = 0; x <= circSeg; x++) {
        const theta = Math.PI * 2 * x / circSeg;
        const nx = Math.sin(phi) * Math.cos(theta);
        const ny = Math.cos(phi);
        const nz = Math.sin(phi) * Math.sin(theta);
        sphereData.push(nx * radius, ny * radius, nz * radius, nx, ny, nz);
    }
}
// 索引
for (let y = 0; y < ySeg; y++) {
    for (let x = 0; x < circSeg; x++) {
        const a = y * (circSeg + 1) + x;
        const b = a + circSeg + 1;
        indexData.push(a, b, a + 1);
        indexData.push(b, b + 1, a + 1);
    }
}

// 顶点缓冲
const vbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereData), gl.STATIC_DRAW);
// 索引缓冲
const ibo = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);

// MVP矩阵：正交矩阵，方便观察
function createOrtho(left: number, right: number, bottom: number, top: number, near: number, far: number): Float32Array {
    return new Float32Array([
        2 / (right - left), 0, 0, 0,
        0, 2 / (top - bottom), 0, 0,
        0, 0, -2 / (far - near), 0,
        -(right + left) / (right - left), -(top + bottom) / (top - bottom), -(far + near) / (far - near), 1
    ])
}
const mvp = createOrtho(-1, 1, -1, 1, -10, 10);

// ==========渲染循环==========
function render() {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.1, 0.1, 1);
    // 清除颜色、深度、模板
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.STENCIL_TEST);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(aPosLoc);
    gl.vertexAttribPointer(aNormalLoc, 3, gl.FLOAT, false, 24, 12);
    gl.enableVertexAttribArray(aNormalLoc);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.uniformMatrix4fv(mvpLoc, false, mvp);

    // =========阶段1：绘制本体，写入模板，模板=1=========
    gl.stencilFunc(gl.ALWAYS, 1, 0xff);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
    gl.stencilMask(0xff);
    gl.uniform1f(expandLoc, 0.0); // 不膨胀
    gl.uniform3f(colorLoc, 1, 1, 1); //白色球体
    gl.drawElements(gl.TRIANGLES, indexData.length, gl.UNSIGNED_SHORT, 0);

    // =========阶段2：膨胀模型，绘制轮廓，模板不等于1才画=========
    gl.stencilFunc(gl.NOTEQUAL, 1, 0xff);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
    gl.stencilMask(0x00); //禁止修改模板
    gl.uniform1f(expandLoc, 0.03); //向外膨胀一点点
    gl.uniform3f(colorLoc, 0, 1, 1); //青色轮廓
    gl.drawElements(gl.TRIANGLES, indexData.length, gl.UNSIGNED_SHORT, 0);

    requestAnimationFrame(render);
}
render();
