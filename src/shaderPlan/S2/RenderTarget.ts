export type RTFormat = "rgba8" | "rgba16f" | 'rgba32f'
export class RenderTarget {
    width: number
    height: number
    fbo: WebGLFramebuffer
    colorTex: WebGLTexture
    depthBuffer: WebGLRenderbuffer
    format: RTFormat
    constructor(gl: WebGL2RenderingContext, width: number, height: number, format: RTFormat = 'rgba8') {
        this.width = width
        this.height = height
        this.format = format

        const f = format === 'rgba16f' ? { internal: gl.RGBA16F, type: gl.HALF_FLOAT } :
            format === 'rgba32f' ? { internal: gl.RGBA32F, type: gl.FLOAT } :
                { internal: gl.RGBA8, type: gl.UNSIGNED_BYTE }

        this.fbo = gl.createFramebuffer()
        if (!this.fbo) throw new Error("createframebuffer failed")
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo)

        this.colorTex = gl.createTexture()
        if (!this.colorTex) throw new Error("createTexture failed")
        gl.bindTexture(gl.TEXTURE_2D, this.colorTex)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texImage2D(gl.TEXTURE_2D, 0, f.internal, width, height, 0, gl.RGBA, f.type, null)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.colorTex, 0)

        this.depthBuffer = gl.createRenderbuffer()
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer)
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, width, height)
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthBuffer)

        const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
        if (complete !== gl.FRAMEBUFFER_COMPLETE) {
            throw new Error("framebuffer incomplete:0x" + complete.toString(16))
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        gl.bindTexture(gl.TEXTURE_2D, null)
        gl.bindRenderbuffer(gl.RENDERBUFFER, null)
    }
    bind(gl: WebGL2RenderingContext) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo)
        gl.viewport(0, 0, this.width, this.height)
    }
    unbind(gl: WebGL2RenderingContext) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
    }
}