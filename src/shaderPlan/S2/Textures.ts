import { isArrayBufferView } from "./utils"

type TextureParamsType = {
    image: TexImageSource | ArrayBufferView,
    wrapS?: number,
    wrapT?: number,
    minFilter?: number,
    magFilter?: number,
    colorSpace: 'linear' | 'srgb',
    format: TextureFormat,
    width?: number
    height?: number
}
const defaultTextureParameter = {
    wrapS: WebGLRenderingContext["CLAMP_TO_EDGE"],
    wrapT: WebGLRenderingContext["CLAMP_TO_EDGE"],
    minFilter: WebGLRenderingContext["LINEAR"],
    magFilter: WebGLRenderingContext["LINEAR"]
}

export type TextureFormat = "rgba8" | "srgb8" | 'rgba16f' | 'rgba32f'
export class Texture {
    image: TexImageSource | ArrayBufferView
    wrapS: number
    wrapT: number
    minFilter: number
    magFilter: number
    ready: boolean = false
    private texture: WebGLTexture | null = null
    needUpdate: boolean = true
    format: TextureFormat
    colorSpace: TextureParamsType['colorSpace']
    width: number
    height: number
    constructor(params: TextureParamsType) {
        const { wrapS = defaultTextureParameter.wrapS, wrapT = defaultTextureParameter.wrapT,
            minFilter = defaultTextureParameter.minFilter, magFilter = defaultTextureParameter.magFilter,
            colorSpace, format
        } = params
        this.image = params.image
        this.wrapS = wrapS
        this.wrapT = wrapT
        this.minFilter = minFilter
        this.magFilter = magFilter
        this.colorSpace = colorSpace
        this.format = format
        this.width = params.width ?? 0
        this.height = params.height ?? 0
    }
    init(gl: WebGL2RenderingContext, unit: number) {
        let texture = this.texture
        if (!texture) texture = this.texture = gl.createTexture()
        gl.activeTexture(gl.TEXTURE0 + unit)
        gl.bindTexture(gl.TEXTURE_2D, texture)

        if (!this.needUpdate) return
        const { internalFormat, type } = this.getInternalFormat(gl)

        if (!this.ready) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([255, 0, 255, 255]))
        } else {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
            if (isArrayBufferView(this.image)) {
                gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, this.width, this.height, 0, gl.RGBA, type, this.image)
            } else {
                gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, gl.RGBA, type, this.image)
            }
            const mipmaps: number[] = [gl.LINEAR_MIPMAP_LINEAR, gl.LINEAR_MIPMAP_NEAREST, gl.NEAREST_MIPMAP_LINEAR, gl.NEAREST_MIPMAP_NEAREST]
            if (mipmaps.includes(this.minFilter)) {
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
    private getInternalFormat(gl: WebGL2RenderingContext) {
        if (this.format === 'srgb8') {
            return {
                internalFormat: gl.SRGB8_ALPHA8,
                type: gl.UNSIGNED_BYTE
            }
        }
        if (this.format === 'rgba16f') {
            return {
                internalFormat: gl.RGBA16F,
                type: gl.FLOAT
            }
        }
        if (this.format === 'rgba32f') {
            const ext = gl.getExtension("OES_texture_float_linear")
            if (!ext) {
                console.warn("不支持 32F 线性过滤，降级为 NEAREST")
                this.minFilter = gl.NEAREST      // ← 加这两行
                this.magFilter = gl.NEAREST
            }
            return {
                internalFormat: gl.RGBA32F,
                type: gl.FLOAT
            }
        }
        return {
            internalFormat: gl.RGBA8,
            type: gl.UNSIGNED_BYTE
        }
    }
}