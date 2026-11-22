import { Texture } from "./Textures"

export abstract class Loader {
    abstract load(url: string): any;
}
export class TextureLoader extends Loader {
    load(url: string): Texture {
        const img = new Image()
        const texture = new Texture({
            image: img,
            colorSpace: "srgb"
        })
        img.onload = e => {
            texture.ready = true
            texture.needUpdate = true
        }
        img.onerror = e => {
            texture.ready = false
            console.log('纹理加载失败')
        }
        img.src = url
        return texture
    }
}