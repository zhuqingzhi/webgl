import type { PostEffectType } from "./Materials"

export const MAX_LIGHTS = 8
export const EFFECT_MAP: Record<PostEffectType, number> = {
    none: 0,
    grayscale: 1,
    invert: 2,
    chromatic: 3,
    vignette: 4,
    scanline: 5,
    "blur3": 6,
    "blurGauss": 7,
    "sobel": 9,
    "sharpen": 8,
    "bright": 10,
    'blurH': 11,
    "blurV": 12,
    "hdrScale": 13,
    "hdrOver": 14
}