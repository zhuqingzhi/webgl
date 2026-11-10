class Model {
    uniforms: {}
    u_Matrix: {}
    constructor(bufferInfo, uniforms) {
        this.uniforms = uniforms || {}
        this.u_Matrix = window.matrix.identity()
        this.bufferInfo = bufferInfo
    }
}