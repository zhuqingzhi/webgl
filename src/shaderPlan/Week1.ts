class Matrix4 {
    elements: number[]
    constructor() {
        this.elements = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]
    }
    static multiply(a: Matrix4, b: Matrix4, out?: Matrix4) {
        out = out || new Matrix4()
        const a00 = a.elements[0]
        const a10 = a.elements[1]
        const a20 = a.elements[2]
        const a30 = a.elements[3]

        const a01 = a.elements[4]
        const a11 = a.elements[5]
        const a21 = a.elements[6]
        const a31 = a.elements[7]

        const a02 = a.elements[8]
        const a12 = a.elements[9]
        const a22 = a.elements[10]
        const a32 = a.elements[11]

        const a03 = a.elements[12]
        const a13 = a.elements[13]
        const a23 = a.elements[14]
        const a33 = a.elements[15]

        const b00 = b.elements[0]
        const b10 = b.elements[1]
        const b20 = b.elements[2]
        const b30 = b.elements[3]

        const b01 = b.elements[4]
        const b11 = b.elements[5]
        const b21 = b.elements[6]
        const b31 = b.elements[7]

        const b02 = b.elements[8]
        const b12 = b.elements[9]
        const b22 = b.elements[10]
        const b32 = b.elements[11]

        const b03 = b.elements[12]
        const b13 = b.elements[13]
        const b23 = b.elements[14]
        const b33 = b.elements[15]

        const t00 = a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30
        const t10 = a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30
        const t20 = a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30
        const t30 = a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30

        const t01 = a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31
        const t11 = a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31
        const t21 = a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31
        const t31 = a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31

        const t02 = a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32
        const t12 = a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32
        const t22 = a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32
        const t32 = a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32

        const t03 = a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33
        const t13 = a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33
        const t23 = a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33
        const t33 = a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33



        out.elements = [
            t00, t10, t20, t30,
            t01, t11, t21, t31,
            t02, t12, t22, t32,
            t03, t13, t23, t33
        ]
        return out
    }
    static translate(target: Matrix4, dir: Vector3, out?: Matrix4) {
        out = out || new Matrix4()
        const transMat = new Matrix4()
        transMat.elements = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            dir.x, dir.y, dir.z, 1
        ]
        Matrix4.multiply(target, transMat, out)
        return out
    }
    static rotateX(target: Matrix4, rad: number, out?: Matrix4) {
        out = out || new Matrix4()
        const sin = Math.sin(rad)
        const cos = Math.cos(rad)
        const transMat = new Matrix4()
        transMat.elements = [
            1, 0, 0, 0,
            0, cos, sin, 0,
            0, -sin, cos, 0,
            0, 0, 0, 1
        ]
        Matrix4.multiply(target, transMat, out)
        return out
    }
    static rotateZ(target: Matrix4, rad: number, out?: Matrix4) {
        out = out || new Matrix4()
        const sin = Math.sin(rad)
        const cos = Math.cos(rad)
        const transMat = new Matrix4()
        transMat.elements = [
            cos, sin, 0, 0,
            -sin, cos, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]
        Matrix4.multiply(target, transMat, out)
        return out
    }
    static rotateY(target: Matrix4, rad: number, out?: Matrix4) {
        out = out || new Matrix4()
        const sin = Math.sin(rad)
        const cos = Math.cos(rad)
        const transMat = new Matrix4()

        transMat.elements = [
            cos, 0, -sin, 0,
            0, 1, 0, 0,
            sin, 0, cos, 0,
            0, 0, 0, 1
        ]
        Matrix4.multiply(target, transMat, out)
        return out
    }
    static scale(target: Matrix4, x: number, y: number, z: number, out?: Matrix4) {
        out = out || new Matrix4()
        const transMat = new Matrix4()
        transMat.elements = [
            x, 0, 0, 0,
            0, y, 0, 0,
            0, 0, z, 0,
            0, 0, 0, 1
        ]
        Matrix4.multiply(target, transMat, out)
        return out
    }
    static determinant(mat: Matrix4) {
        const [
            m00, m10, m20, m30,
            m01, m11, m21, m31,
            m02, m12, m22, m32,
            m03, m13, m23, m33
        ] = mat.elements

        const c00 = m11 * (m22 * m33 - m23 * m32) - m12 * (m21 * m33 - m23 * m31) + m13 * (m21 * m32 - m22 * m31)
        const c01 = m10 * (m22 * m33 - m23 * m32) - m12 * (m20 * m33 - m23 * m30) + m13 * (m20 * m32 - m22 * m30)
        const c02 = m10 * (m21 * m33 - m23 * m31) - m11 * (m20 * m33 - m23 * m30) + m13 * (m20 * m31 - m21 * m30)
        const c03 = m10 * (m21 * m32 - m22 * m31) - m11 * (m20 * m32 - m22 * m30) + m12 * (m20 * m31 - m21 * m30)
        return m00 * c00 - m01 * c01 + m02 * c02 - m03 * c03
    }
    determinant() {
        return Matrix4.determinant(this)
    }
}
class Point3 {
    x: number = 0
    y: number = 0
    z: number = 0
    w: number = 1
    constructor(x: number, y: number, z: number) {
        this.x = x
        this.y = y
        this.z = z
    }
    applyMatrix4(a: Matrix4) {
        const { x, y, z } = this
        const a00 = a.elements[0]
        const a10 = a.elements[1]
        const a20 = a.elements[2]
        const a30 = a.elements[3]

        const a01 = a.elements[4]
        const a11 = a.elements[5]
        const a21 = a.elements[6]
        const a31 = a.elements[7]

        const a02 = a.elements[8]
        const a12 = a.elements[9]
        const a22 = a.elements[10]
        const a32 = a.elements[11]

        const a03 = a.elements[12]
        const a13 = a.elements[13]
        const a23 = a.elements[14]
        const a33 = a.elements[15]
        const w = a30 * x + a31 * y + a32 * z + a33

        this.x = (a00 * x + a01 * y + a02 * z + a03) / w
        this.y = (a10 * x + a11 * y + a12 * z + a13) / w
        this.z = (a20 * x + a21 * y + a22 * z + a23) / w
        this.w = w
    }
}
function perspective(fovy: number, aspect: number, near: number, far: number) {
    // 近平面半高
    const halfHeight = near * Math.tan(fovy / 2)
    // 近平面半宽
    const halfWidth = halfHeight * aspect
    const left = -halfWidth
    const right = halfWidth
    const top = halfHeight
    const bottom = -halfHeight
    const mat = new Matrix4()
    const mat00 = 2 * near / (right - left)
    const mat11 = 2 * near / (top - bottom)
    const mat22 = (far + near) / (near - far)
    const mat23 = 2 * near * far / (near - far)

    mat.elements = [
        mat00, 0, 0, 0,
        0, mat11, 0, 0,
        0, 0, mat22, -1,
        0, 0, mat23, 0
    ]
    return mat
}
function perspectiveWebGPU(fovy: number, aspect: number, near: number, far: number) {
    // 近平面半高
    const halfHeight = near * Math.tan(fovy / 2)
    // 近平面半宽
    const halfWidth = halfHeight * aspect
    const left = -halfWidth
    const right = halfWidth
    const top = halfHeight
    const bottom = -halfHeight
    const mat = new Matrix4()
    const mat00 = 2 * near / (right - left)
    const mat11 = 2 * near / (top - bottom)
    const mat22 = far / (near - far)
    const mat23 = far * near / (near - far)

    mat.elements = [
        mat00, 0, 0, 0,
        0, mat11, 0, 0,
        0, 0, mat22, -1,
        0, 0, mat23, 0
    ]
    return mat
}

function orth(left: number, right: number, top: number, bottom: number, near: number, far: number) {
    const mat = new Matrix4()
    const mat00 = 2 / (right - left)
    const mat03 = (right + left) / (left - right)
    const mat11 = 2 / (top - bottom)
    const mat13 = (top + bottom) / (bottom - top)
    const mat22 = 2 / (near - far)
    const mat23 = (far + near) / (near - far)
    mat.elements = [
        mat00, 0, 0, 0,
        0, mat11, 0, 0,
        0, 0, mat22, 0,
        mat03, mat13, mat23, 1
    ]
    return mat
}

function transform(modelMatrix: Matrix4, viewMatrix: Matrix4) {
    return Matrix4.multiply(viewMatrix, modelMatrix)
}

class Vector3 {
    x: number = 0
    y: number = 0
    z: number = 0
    constructor(x: number = 0, y: number = 0, z: number = 0) {
        this.x = x
        this.y = y
        this.z = z
    }
    /**
 * dot 点积
 */
    static dot(a: Vector3, b: Vector3) {
        return a.x * b.x + a.y * b.y + a.z * b.z
    }

    /**
     * cross 叉积，out = a × b
     */
    static cross(a: Vector3, b: Vector3, out?: Vector3) {
        out = out || new Vector3();
        const ax = a.x, ay = a.y, az = a.z;
        const bx = b.x, by = b.y, bz = b.z;
        out.x = ay * bz - az * by;
        out.y = az * bx - ax * bz;
        out.z = ax * by - ay * bx;
        return out;
    }

    /**
     * 归一化，转为单位向量
     */
    static normalize(v: Vector3, out?: Vector3) {
        out = out || new Vector3();
        const len = Math.hypot(v.x, v.y, v.z);
        if (len < 1e-12) {
            out.x = out.y = out.z = 0
            return out
        }
        out.x = v.x / len;
        out.y = v.y / len;
        out.z = v.z / len;
        return out;
    }
    static sub(a: Vector3, b: Vector3, out?: Vector3) {
        out = out || new Vector3()
        out.x = a.x - b.x
        out.y = a.y - b.y
        out.z = a.z - b.z
        return out
    }
    static length(a: Vector3) {
        return Math.hypot(a.x, a.y, a.z)
    }
    static applyMatrix3(m: Matrix3, target: Vector3, out?: Vector3) {
        out = out || new Vector3()
        const [
            m00, m10, m20,
            m01, m11, m21,
            m02, m12, m22,
        ] = m.elements
        out.x = m00 * target.x + m01 * target.y + m02 * target.z
        out.y = m10 * target.x + m11 * target.y + m12 * target.z
        out.z = m20 * target.x + m21 * target.y + m22 * target.z
        return out
    }
    static normalMatrix(m: Matrix4): Matrix3 | null {
        // 取matrix4的左上3*3矩阵
        const mat3 = Matrix3.fromMatrix4(m)
        return Matrix3.normalMatrix(mat3)
    }
}

function lookAt(cameraPos: Vector3, target: Vector3) {
    const up = new Vector3(0, 1, 0)
    const front = new Vector3()
    Vector3.normalize(Vector3.sub(cameraPos, target, front), front)
    const right = new Vector3()
    Vector3.normalize(Vector3.cross(up, front, right), right)
    const upDir = new Vector3()
    Vector3.normalize(Vector3.cross(front, right, upDir), upDir)

    const mat = new Matrix4()
    /* 
        rightx,righty,rightz,-right*pos
        upx,upy,upz,-up*pos,
        frontx,fronty,frontz,-front*pos,
        0,0,0,1
        
    */
    const cameraMoveReverse = new Vector3()
    cameraMoveReverse.x = -Vector3.dot(right, cameraPos)
    cameraMoveReverse.y = -Vector3.dot(upDir, cameraPos)
    cameraMoveReverse.z = -Vector3.dot(front, cameraPos)
    mat.elements = [
        right.x, upDir.x, front.x, 0,
        right.y, upDir.y, front.y, 0,
        right.z, upDir.z, front.z, 0,
        cameraMoveReverse.x,
        cameraMoveReverse.y,
        cameraMoveReverse.z,
        1
    ]
    return mat
}

class Matrix3 {
    elements: number[]
    constructor() {
        this.elements = [
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
        ]
    }
    static fromMatrix4(mat: Matrix4, out?: Matrix3) {
        out = out || new Matrix3()
        const elements = mat.elements
        const m00 = elements[0]
        const m10 = elements[1]
        const m20 = elements[2]

        const m01 = elements[4]
        const m11 = elements[5]
        const m21 = elements[6]

        const m02 = elements[8]
        const m12 = elements[9]
        const m22 = elements[10]

        out.elements = [
            m00, m10, m20,
            m01, m11, m21,
            m02, m12, m22
        ]
        return out
    }
    static inverse(mat3: Matrix3, out?: Matrix3) {
        out = out || new Matrix3()
        const [
            m00, m10, m20,
            m01, m11, m21,
            m02, m12, m22
        ] = mat3.elements;

        const det =
            m00 * (m11 * m22 - m12 * m21) -
            m01 * (m10 * m22 - m12 * m20) +
            m02 * (m10 * m21 - m11 * m20);

        const eps = 1e-12;
        if (Math.abs(det) < eps) return null;
        const invDet = 1 / det;

        // 伴随矩阵（代数余子式转置），输出依然是【列优先】，和three对齐
        const inv = [
            (m11 * m22 - m12 * m21) * invDet,
            (m12 * m20 - m10 * m22) * invDet,
            (m10 * m21 - m11 * m20) * invDet,

            (m02 * m21 - m01 * m22) * invDet,
            (m00 * m22 - m02 * m20) * invDet,
            (m02 * m10 - m00 * m12) * invDet,

            (m01 * m12 - m02 * m11) * invDet,
            (m01 * m20 - m00 * m21) * invDet,
            (m00 * m11 - m01 * m10) * invDet,
        ];
        out.elements = inv
        return out;
    }
    static transpose(mat: Matrix3, out?: Matrix3) {
        out = out || new Matrix3()
        const [
            m00, m10, m20,
            m01, m11, m21,
            m02, m12, m22
        ] = mat.elements;
        out.elements = [
            m00, m01, m02,
            m10, m11, m12,
            m20, m21, m22
        ]
        return out
    }
    // 行列式
    determinant() {
        const [
            m00, m10, m20,
            m01, m11, m21,
            m02, m12, m22
        ] = this.elements
        return m00 * (m11 * m22 - m12 * m21) - m01 * (m10 * m22 - m12 * m20) + m02 * (m10 * m21 - m11 * m20)
    }
    static normalMatrix(mat3: Matrix3) {

        // 求逆
        const inverseMat3 = Matrix3.inverse(mat3)
        console.log('mmm', mat3, inverseMat3)
        // 转置
        if (!inverseMat3) return null
        const transposed = Matrix3.transpose(inverseMat3)
        return transposed
    }
}


/* const rotationY = Matrix4.rotateY(new Matrix4(), 0.6)
const rotationX = Matrix4.rotateX(rotationY, -0.35)
const modelMatrix = rotationX
const point = new Point3(-0.5, -0.5, -0.5)
point.applyMatrix4(modelMatrix)
console.log('world', point, modelMatrix)

const viewMatrix = lookAt(new Vector3(0, 0, 5), new Vector3(0, 0, 0))
const viewModelMatrix = Matrix4.multiply(viewMatrix, modelMatrix)
point.applyMatrix4(viewMatrix)
console.log('view', point, viewModelMatrix, viewMatrix)

const projectionMatrix = perspective(Math.PI / 4, 2269 / 1195, 0.1, 100)
const pvmMatrix = Matrix4.multiply(projectionMatrix, viewModelMatrix)
point.applyMatrix4(projectionMatrix)
console.log('project', point, pvmMatrix, projectionMatrix)

const diag = new Matrix3()
diag.elements = [
    1.6, 0, 0,
    0, 0.8, 0,
    0, 0, 1
]
const t = Matrix3.normalMatrix(diag)
const n = new Vector3(0.707, 0.707, 0)
const n1 = Vector3.applyMatrix3(t!, n)
const n2 = Vector3.normalize(n1)
console.log(n1, n2, t)
 */

const P = perspectiveWebGPU(Math.PI / 4, 1.9, 0.1, 100)
for (const zv of [-0.1, -100]) {
    const p = new Point3(0, 0, zv)
    p.applyMatrix4(P)
    console.log(zv, p.z, p.w)
}


/* 
1.局部坐标系
P(local)=(-0.5,-0.5,-0.5)
2.世界坐标系(矩阵写法，写代码时，列存储排列)
Ry=(
    cos(0.6),0,sin(0.6),0,
    0,1,0,0,
    -sin(0.6),0,cos(0.6),0,
    0,0,0,1
)
Rx=(
    1,0,0,0,
    0,cos(-0.35),-sin(-0.35),0,
    0,sin(-0.35),cos(-0.35),0,
    0,0,0,1
)
    M=Ry · Rx=(
        cos(0.6),sin(0.6)*sin(-0.35),sin(0.6)*cos(-0.35),0,
        0,cos(-0.35),-sin(-0.35),0,
        -sin(0.6),cos(0.6)*sin(-0.35),cos(0.6)*cos(-0.35),0,
        0,0,0,1
    )
    世界坐标系P(world)=M·P(local)
3. 视图空间（右手坐标系）
lookat(cameraPos,target)
z=normalize(cameraPos-target)
up=(0,1,0)
right=normalize(cross(up,z))
up=normalize(cross(z,right))
viewMatrix=(
    rightx,up.x,z.x,-right·cameraPos,
    right.y,up.y,z.y,-up·camerPos,
    right.z,up.z,z.z,-z·cameraPos,
    0,0,0,1
)
P(view)=viewMatrix·P(world)    
4.裁剪空间
perspective(fov,aspect,near,far)
projectionMatrix=(
    cot(fov/2)/aspect,0,0,0,
    0,cot(fov/2),0,0,
    0,0,(far+near)/(near-far),2*near*far/(near-far),
    0,0,-1,0
)
P(clip)=projectionMatrix·P(view)
5.ndc坐标系，右手
P(ndc)=P(clip)/w,w=-P(view).z
6.屏幕坐标系，原点在左上角
width,height是canvas的宽高
P(screen)=(
    width/2*(1+P(ndc).x),
    height/2*(1-P(ndc).y)
)

1.取viewModelMatrix的逆转置，是因为在相机空间里面计算法线就不用考虑相机位置了，相机空间内相机位置固定在原点
输出的法线也在视图空间，法线留在世界空间，则取modelMatrix
2.因为P(ndc).z=P(clip).z/w，w=-P(view).z，P(clip).z=A*P(view).z+B得到P(ndc).z=A+B/P(view).z，
和视图空间的1/P(view).z成线性相关，所以同样的z_view变化近处大，远处小
3.
*/

