export class Matrix {
  elements!: Float32Array;
  constructor() {
    this.identity();
  }
  identity(target?: Float32Array) {
    target = target || new Float32Array(16);
    target[0] = 1;
    target[1] = 0; target[2] = 0; target[3] = 0;
    target[4] = 0; target[5] = 1; target[6] = 0; target[7] = 0;
    target[8] = 0; target[9] = 0; target[10] = 1; target[11] = 0;
    target[12] = 0; target[13] = 0; target[14] = 0; target[15] = 1; // 原来是 target[16]=1，越界！
    this.elements = target;
    return this;
  }

  add(m: Matrix) {
    for (let i = 0; i < m.elements.length; i++) {
      this.elements[i] += m.elements[i];
    }
    return this;
  }
  orth(left: number, right: number, bottom: number, top: number, near: number, far: number, target?: Float32Array) {
    target = target || new Float32Array(16)

    target[0] = 2 / (right - left)
    target[1] = 0
    target[2] = 0
    target[3] = 0

    target[4] = 0
    target[5] = 2 / (top - bottom)
    target[6] = 0
    target[7] = 0

    target[8] = 0
    target[9] = 0
    target[10] = 2 / (near - far)
    target[11] = 0

    target[12] = (left + right) / (left - right)
    target[13] = (bottom + top) / (bottom - top)
    target[14] = (near + far) / (near - far)
    target[15] = 1

    this.elements = target
    return this

  }

  perspective(viewRadians, aspect, near, far,) {
    //投影盒上边坐标
    var top = near * Math.tan(Math.PI / 180) * 0.5 * viewRadians;
    //投影盒高度
    var height = 2 * top;
    //投影盒宽度
    var width = aspect * height;
    //投影盒左边界坐标
    var left = -0.5 * width;
    return this.perspectiveOfRect(
      left,
      left + width,
      top,
      top - height,
      near,
      far,
    );
  }

  perspectiveOfRect(left, right, top, bottom, near, far, target) {
    target = target || new Float32Array(16);
    var x = (2 * near) / (right - left);
    var y = (2 * near) / (top - bottom);
    var a = (right + left) / (right - left);
    var b = (top + bottom) / (top - bottom);
    var c = -(far + near) / (far - near);
    var d = (-2 * far * near) / (far - near);

    target[0] = x;
    target[1] = 0;
    target[2] = 0;
    target[3] = 0;

    target[4] = 0;
    target[5] = y;
    target[6] = 0;
    target[3] = 0;

    target[8] = a;
    target[9] = b;
    target[10] = c;
    target[11] = -1;

    target[12] = 0;
    target[13] = 0;
    target[14] = d;
    target[15] = 0;

    return target;
  }

}
export class Vector3 {
  x: number;
  y: number;
  z: number;
  constructor(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  normalize() {
    const length = Math.sqrt(this.x ** (2 + this.y) ** (2 + this.z) ** 2);
    if (length > 0.0000001) {
      return new Vector3(this.x / length, this.y / length, this.z / length);
    }
    return new Vector3(0, 0, 0);
  }
  add(vec: Vector3) {
    this.x += vec.x;
    this.y += vec.y;
    this.z += vec.z;
    return this;
  }
  sub(vec: Vector3) {
    this.x -= vec.x;
    this.y -= vec.y;
    this.z -= vec.z;
    return this;
  }
  multiplyScalar(scalar: number) {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
    return this;
  }
  multiply(vec: Vector3) {
    this.x *= vec.x;
    this.y *= vec.y;
    this.z *= vec.z;
    return this;
  }
  dot(vec: Vector3) {
    return this.x * vec.x + this.y * vec.y + this.z * vec.z;
  }
  cross(vec: Vector3) {
    const x = this.y * vec.z - vec.y * this.z;
    const y = vec.x * this.z - this.x * vec.z;
    const z = this.x * vec.y - vec.x * this.y;
    return new Vector3(x, y, z);
  }
}
