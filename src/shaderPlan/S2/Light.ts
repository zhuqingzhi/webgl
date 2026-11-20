import type { vec4 } from "gl-matrix"
import { Object3D } from "./D5"

export class Light extends Object3D {
    color?: vec4
    intensity?: number
    constructor(color?: vec4, intensity?: number) {
        super()
        this.type = "Light"
        this.color = color
        this.intensity = intensity
    }
}

export class SpotLight extends Light {
    target!: Object3D
    constructor(color?: vec4, intensity?: number) {
        super(color, intensity)
        this.type = "SpotLight"
    }
}

export class DirectionalLight extends Light {
    target!: Object3D
    constructor(color?: vec4, intensity?: number) {
        super(color, intensity)
        this.type = "DirectionalLight"
    }
}

export class AmbientLight extends Light {
    constructor(color?: vec4, intensity?: number) {
        super(color, intensity)
        this.type = "AmbientLight"
    }
}