
type TextureParamsType = {
    image: TexImageSource,
    wrapS?: number,
    wrapT?: number,
    minFilter?: number,
    magFilter?: number,
    colorSpace?: "srgb" | 'linear'
}
const defaultTextureParameter = {
    wrapS: WebGLRenderingContext["CLAMP_TO_EDGE"],
    wrapT: WebGLRenderingContext["CLAMP_TO_EDGE"],
    minFilter: WebGLRenderingContext["LINEAR"],
    magFilter: WebGLRenderingContext["LINEAR"]
}
export class Texture {
    image: TexImageSource
    wrapS: number
    wrapT: number
    minFilter: number
    magFilter: number
    ready: boolean = false
    private texture: WebGLTexture | null = null
    needUpdate: boolean = true
    colorSpace?: TextureParamsType['colorSpace'] = "srgb"
    constructor(params: TextureParamsType) {
        const { wrapS = defaultTextureParameter.wrapS, wrapT = defaultTextureParameter.wrapT,
            minFilter = defaultTextureParameter.minFilter, magFilter = defaultTextureParameter.magFilter,
            colorSpace = 'srgb'
        } = params
        this.image = params.image
        this.wrapS = wrapS
        this.wrapT = wrapT
        this.minFilter = minFilter
        this.magFilter = magFilter
        this.colorSpace = colorSpace

    }
    init(gl: WebGL2RenderingContext, unit: number) {
        let texture = this.texture
        if (!texture) texture = this.texture = gl.createTexture()
        gl.activeTexture(gl.TEXTURE0 + unit)
        gl.bindTexture(gl.TEXTURE_2D, texture)

        if (!this.needUpdate) return

        const internalFormat = this.colorSpace === 'srgb' ? gl.SRGB8_ALPHA8 : gl.RGBA8
        if (!this.ready) {
            gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([255, 0, 255, 255]))
        } else {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
            gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, gl.RGBA, gl.UNSIGNED_BYTE, this.image)

            if ([gl.LINEAR_MIPMAP_LINEAR, gl.LINEAR_MIPMAP_NEAREST, gl.NEAREST_MIPMAP_LINEAR, gl.NEAREST_MIPMAP_NEAREST].includes(this.minFilter)) {
                gl.generateMipmap(gl.TEXTURE_2D)
            }

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.wrapS)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.wrapT)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.magFilter)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.minFilter)
            const ext = gl.getExtension('EXT_texture_filter_anisotropic')
            if (ext) {
                const max = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT)
                gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(4, max))
            }
        }
        this.needUpdate = false
    }
    bind(gl: WebGL2RenderingContext, unit: number) {
        gl.activeTexture(gl.TEXTURE0 + unit)
        gl.bindTexture(gl.TEXTURE_2D, this.texture)
    }

}