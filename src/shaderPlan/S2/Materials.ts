import type { vec3 } from "gl-matrix"
import type { Texture } from "./Textures"
import { colorToLinear, createShader } from "./utils"
import { MAX_LIGHTS } from "./Constants"

type MaterialParamsType = {
    color?: vec3
}
export class Material {
    vertexShader!: WebGLShader
    fragShader!: WebGLShader
    program!: WebGLProgram
    vertexString!: string
    fragmentString!: string
    uniforms: Record<string, any> = {
        uLightPosition: new Float32Array(MAX_LIGHTS * 3),
        uLightColor: new Float32Array(MAX_LIGHTS * 3),
        uLightIntensity: new Float32Array(MAX_LIGHTS),
        uLightCount: 0,
        uDirectLightColor: new Float32Array(MAX_LIGHTS * 3),
        uDirectLightDirection: new Float32Array(MAX_LIGHTS * 3),
        uDirectLightIntensity: new Float32Array(MAX_LIGHTS),
        uDirLightCount: 0,
    }
    uniformInfoMap: Map<string, {
        location: WebGLUniformLocation,
        type: number,
        size: number
    }> = new Map()
    color?: vec3
    type: string = 'Material'
    private warnedUniforms = new Set<string>()
    constructor(params: MaterialParamsType) {
        this.color = params.color ?? [1, 1, 1]
        this.syncUniforms()
    }
    initShader(gl: WebGL2RenderingContext) {
        if (this.program) return
        console.log('[initShader] 编译一次', this.constructor.name)
        this.vertexShader = createShader(gl, this.vertexString, gl.VERTEX_SHADER)
        this.fragShader = createShader(gl, this.fragmentString, gl.FRAGMENT_SHADER)
        this.program = gl.createProgram()
        gl.attachShader(this.program, this.fragShader)
        gl.attachShader(this.program, this.vertexShader)
        gl.linkProgram(this.program)
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            throw new Error('' + gl.getProgramInfoLog(this.program))
        }
        this.buildUniformInfo(gl)
    }
    setUniforms(gl: WebGL2RenderingContext, name: string, value: any) {

    }
    buildUniformInfo(gl: WebGL2RenderingContext) {
        const count = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS)
        for (let i = 0; i < count; i++) {
            const u = gl.getActiveUniform(this.program, i)
            console.log('mm', u)
            if (!u) continue
            const location = gl.getUniformLocation(this.program, u.name)!
            const name = u.name.replace(/\[0\]$/, '')
            this.uniformInfoMap.set(name, {
                location,
                type: u.type,
                size: u.size
            })
        }
    }
    uploadUniforms(gl: WebGL2RenderingContext) {
        for (const [name, u] of this.uniformInfoMap) {
            const value = this.uniforms[name]
            if (value === undefined || value < 0) {
                if (!this.warnedUniforms.has(name)) {
                    console.warn(`[uniform] shader 声明了 "${name}"，但 uniforms 里没有对应值`)
                    this.warnedUniforms.add(name)
                }
                continue
            }
            const location = u.location
            switch (u.type) {
                case gl.FLOAT:
                    u.size > 1 ? gl.uniform1fv(location, value) : gl.uniform1f(location, value)
                    break
                case gl.FLOAT_VEC2:
                    gl.uniform2fv(location, value)
                    break
                case gl.FLOAT_VEC3:
                    gl.uniform3fv(location, value)
                    break
                case gl.FLOAT_VEC4:
                    gl.uniform4fv(location, value)
                    break

                case gl.INT:
                case gl.BOOL:
                    u.size > 1 ? gl.uniform1iv(location, value) : gl.uniform1i(location, value)
                    break
                case gl.INT_VEC2:
                case gl.BOOL_VEC2:
                    gl.uniform2iv(location, value)
                    break
                case gl.INT_VEC3:
                case gl.BOOL_VEC3:
                    gl.uniform3iv(location, value)
                    break
                case gl.INT_VEC4:
                case gl.BOOL_VEC4:
                    gl.uniform4iv(location, value)
                    break

                case gl.FLOAT_MAT2:
                    gl.uniformMatrix2fv(location, false, value)
                    break
                case gl.FLOAT_MAT3:
                    gl.uniformMatrix3fv(location, false, value)
                    break
                case gl.FLOAT_MAT4:
                    gl.uniformMatrix4fv(location, false, value)
                    break

                case gl.SAMPLER_2D:
                case gl.SAMPLER_CUBE:
                    // value 传纹理单元索引，例如 0,1,2...
                    gl.uniform1i(location, value)
                    break

                // WebGL2 扩展类型（若你用 WebGL2 可继续补齐）
                default:
                    throw new Error(`Unsupported uniform type: ${u.type}`)
            }
        }
    }
    syncUniforms() {
        this.uniforms['uColor'] = this.uniforms["uMaterial.color"] = colorToLinear(this.color ?? [1, 1, 1])
    }
}
// 职责：shader，program
export class MeshBasicMaterial extends Material {
    vertexString = `#version 300 es
        in vec3 aPosition;
        uniform mat4 modelMatrix;
        uniform mat4 viewMatrix;
        uniform mat4 projectionMatrix;
        void main(){
            gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(aPosition,1.);
        }
    `
    fragmentString = `#version 300 es
        precision mediump float;
        uniform vec3 uColor;
        out vec4 fragColor;
        void main(){
            fragColor=vec4(uColor,1.);
        }
    
    `

    constructor(params: MaterialParamsType) {
        super(params)
    }

}
export class MeshLambertMaterial extends Material {
    vertexString = `#version 300 es
        in vec3 aPosition;
        in vec3 aNormal;
        out vec3 vNormal;
        out vec3 vWorldPos;
        uniform mat4 modelMatrix;
        uniform mat3 normalMatrix;
        uniform mat4 viewMatrix;
        uniform mat4 projectionMatrix;
        void main(){
            vec4 worldPos=modelMatrix*vec4(aPosition,1.);
            vWorldPos=worldPos.xyz;
            vNormal=normalize(normalMatrix*aNormal);
            gl_Position=projectionMatrix*viewMatrix*worldPos;
        }
    `
    fragmentString = `#version 300 es
        precision highp float;
        const int MAX_LIGHTS=8;
        uniform vec3 uColor;
        out vec4 fragColor;
        uniform vec3 uLightColor[MAX_LIGHTS];
        uniform vec3 uLightPosition[MAX_LIGHTS];
        uniform float uLightIntensity[MAX_LIGHTS];
        uniform int uLightCount;
        uniform vec3 uDirectLightColor[MAX_LIGHTS];
        uniform vec3 uDirectLightDirection[MAX_LIGHTS];
        uniform float uDirectLightIntensity[MAX_LIGHTS];
        uniform int uDirLightCount;

        in vec3 vNormal;
        in vec3 vWorldPos;
        uniform vec3 uAmbientColor;

        vec3 linearToSrgb(vec3 c) {
            return mix(
                c * 12.92,
                1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055,
                step(vec3(0.0031308), c)
            );
        }

        void main(){
            vec3 totalDiffuse=vec3(0.);
            vec3 N=normalize(vNormal);
       
            vec3 ambientColor=uColor*uAmbientColor;

            vec3 col=ambientColor;
            
            

            for(int i=0;i<MAX_LIGHTS;i++){
                if(i>=uDirLightCount)break;
                vec3 lightDir=normalize(uDirectLightDirection[i]);
                vec3 dirColor=uDirectLightColor[i];
                float dirIntensity=uDirectLightIntensity[i];
                vec3 diffuse=dirColor*uColor*max(dot(N,lightDir),0.)*dirIntensity;
                totalDiffuse+=diffuse;
            }   
            for(int i=0;i<MAX_LIGHTS;i++){
                if(i>=uLightCount)break;
                // 点光源
                vec3 lightPos=uLightPosition[i];
                vec3 lightColor=uLightColor[i];
                float intensity=uLightIntensity[i];
                
                float dist=length(lightPos-vWorldPos);
                float d2=max(dist*dist,1e-4);
                float attenuation=1./d2;
                vec3 L=normalize(lightPos-vWorldPos);
                float diffuse=max(dot(N,L),0.);
                totalDiffuse+=lightColor*uColor*diffuse*attenuation*intensity;
                
            }
            col=col+totalDiffuse;
            col = col / (col + vec3(1.0));
            fragColor=vec4(linearToSrgb(col),1.);
        }
    
    `

    constructor(params: MaterialParamsType) {
        super(params)
    }

}


type PhongMaterialType = {
    shininess?: number,
    specular?: vec3,
    map?: Texture,
    normalMap?: Texture,
    procedural?: ProceduralType
}
type ProceduralType = 'none' | 'checker' | 'wood' | 'marble' | 'cloud'
export class MeshPhongMaterial extends Material {
    vertexString = `#version 300 es
        in vec3 aPosition;
        in vec3 aNormal;
        in vec2 aUv;
        in vec3 aTangent;
        out vec2 vUv;
        out vec3 vNormal;
        out vec3 vWorldPos;
        out vec3 vTangent;
        uniform mat4 modelMatrix;
        uniform mat3 normalMatrix;
        uniform mat4 viewMatrix;
        uniform mat4 projectionMatrix;
        void main(){
            vec4 worldPos=modelMatrix*vec4(aPosition,1.);
            vWorldPos=worldPos.xyz;
            vNormal=normalize(normalMatrix*aNormal);
            gl_Position=projectionMatrix*viewMatrix*worldPos;
            vUv=aUv;
            vTangent=normalize(normalMatrix*aTangent);
        }
    `
    fragmentString = `#version 300 es
        precision highp float;
        const int MAX_LIGHTS=8;
        out vec4 fragColor;
        uniform vec3 uLightColor[MAX_LIGHTS];
        uniform vec3 uLightPosition[MAX_LIGHTS];
        uniform float uLightIntensity[MAX_LIGHTS];
        uniform int uLightCount;
        uniform vec3 uDirectLightColor[MAX_LIGHTS];
        uniform vec3 uDirectLightDirection[MAX_LIGHTS];
        uniform float uDirectLightIntensity[MAX_LIGHTS];
        uniform int uDirLightCount;
        in vec2 vUv;
        in vec3 vTangent;

        uniform sampler2D uTexture;
        uniform sampler2D uNormalMap;
        uniform bool uHasNormalMap;

        in vec3 vNormal;
        in vec3 vWorldPos;
        uniform vec3 uAmbientColor;

        uniform vec3 uCameraPos;
        uniform int uProcedural;

        struct Material{
            vec3 color;
            vec3 specular;
            float shininess;
        };
        uniform Material uMaterial;
        uniform float uTime;

        vec3 linearToSrgb(vec3 c) {
            return mix(
                c * 12.92,
                1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055,
                step(vec3(0.0031308), c)
            );
        }
        float checker(vec2 uv, float n) {
            vec2 p = uv * n;
            vec2 w = fwidth(p);                       // 屏幕空间导数，一个像素跨多少格子
            vec2 i = 2.0 * (abs(fract((p - 0.5 * w) * 0.5) - 0.5)
                        - abs(fract((p + 0.5 * w) * 0.5) - 0.5)) / w;
            return 0.5 - 0.5 * i.x * i.y;
        }
        float hash(vec2 p) {
            p = fract(p * vec2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
        }
        float noise(vec2 p) {
            vec2 i = floor(p);              // 格子索引
            vec2 f = fract(p);              // 格内坐标 0~1
            f = f * f * (3.0 - 2.0 * f);    // smoothstep，让插值在边界处平滑

            float a = hash(i);                          // 左下
            float b = hash(i + vec2(1.0, 0.0));         // 右下
            float c = hash(i + vec2(0.0, 1.0));         // 左上
            float d = hash(i + vec2(1.0, 1.0));         // 右上

            return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }
        float fbm(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            for (int i = 0; i < 5; i++) {
                v += a * noise(p);
                p *= 2.0;       // 频率翻倍
                a *= 0.5;       // 振幅减半
            }
            return v;
        }
        vec3 wood(vec2 uv) {
            vec2 q = uv * vec2(2.0, 1.0);
            float grain = fbm(q * 4.0);                      // 木纹扰动
            float rings = sin((q.x * 8.0 + grain * 3.0) * 3.14159);
            return mix(vec3(0.35, 0.18, 0.08),
                    vec3(0.70, 0.45, 0.25),
                    rings * 0.5 + 0.5);
        }
        vec3 marble(vec2 uv) {
            float m = fbm(uv * 3.0);
            float veins = abs(sin(uv.x * 6.0 + m * 8.0));
            return mix(vec3(0.05), vec3(0.95), pow(veins, 0.3));
        }
        vec3 cloud(vec2 uv) {
            float c = fbm(uv * 8.0+uTime*0.001);
            return mix(vec3(0.30, 0.50, 0.80),
                    vec3(1.0),
                    smoothstep(0.5, 0.9, c));
        }
        vec3 computeAlbedo() {
            if (uProcedural == 0) return uMaterial.color * texture(uTexture, vUv).rgb;
            if (uProcedural == 1) return vec3(checker(vUv, 8.0));
            if (uProcedural == 2) return wood(vUv);
            if (uProcedural == 3) return marble(vUv);
            if (uProcedural == 4) return cloud(vUv);
            return uMaterial.color;
        }
        void main(){
            vec3 totalDiffuse=vec3(0.);
            vec3 totalSpecular=vec3(0.);
            vec3 N=normalize(vNormal);

            if(uHasNormalMap){
                vec3 T=normalize(vTangent);
                vec3 B=normalize(cross(N,T));
                mat3 TBN=mat3(T,B,N);
                vec3 n=texture(uNormalMap,vUv).xyz*2.-1.;
                N=normalize(TBN*n);
            }

            vec3 V=normalize(uCameraPos-vWorldPos);
            vec4 tex=texture(uTexture,vUv);
       
            
            vec3 albedo = computeAlbedo();
            vec3 ambientColor = albedo * uAmbientColor;
            vec3 col=ambientColor;
            

            for(int i=0;i<MAX_LIGHTS;i++){
                if(i>=uDirLightCount)break;
                vec3 lightDir=normalize(uDirectLightDirection[i]);
                vec3 dirColor=uDirectLightColor[i];
                float dirIntensity=uDirectLightIntensity[i];
                vec3 diffuse=dirColor*albedo*max(dot(N,lightDir),0.)*dirIntensity;
                totalDiffuse+=diffuse;

                vec3 H=normalize(lightDir+V);
                float specular=pow(max(dot(N,H),0.),uMaterial.shininess);
                totalSpecular+=dirColor*uMaterial.specular*specular*dirIntensity;
            }   
            
            for(int i=0;i<MAX_LIGHTS;i++){
                if(i>=uLightCount)break;
                // 点光源
                vec3 lightPos=uLightPosition[i];
                vec3 lightColor=uLightColor[i];
                float intensity=uLightIntensity[i];
                
                float dist=length(lightPos-vWorldPos);
                float d2=max(dist*dist,1e-4);
                float attenuation=1./d2;
                vec3 L=normalize(lightPos-vWorldPos);
                float diffuse=max(dot(N,L),0.);
                totalDiffuse+=lightColor*albedo*diffuse*attenuation*intensity;
                
                vec3 H=normalize(L+V);
                float specular=pow(max(dot(N,H),0.),uMaterial.shininess);
                totalSpecular+=lightColor*uMaterial.specular*specular*attenuation*intensity;
            }
            col=col+totalSpecular+totalDiffuse;
            // col = col / (col + vec3(1.0));
            // fragColor=vec4(linearToSrgb(col),1.);
            fragColor=vec4(col,1.);

        }
    
    `
    specular: vec3
    shininess: number
    type: string = 'MeshPhongMaterial'
    map?: Texture
    normalMap?: Texture
    procedural?: ProceduralType

    constructor(params: MaterialParamsType & PhongMaterialType) {
        super(params)
        this.specular = colorToLinear(params.specular ?? [1, 1, 1])
        this.shininess = params.shininess ?? 30
        this.map = params.map
        this.normalMap = params.normalMap
        this.procedural = params.procedural
    }
    syncUniforms(): void {
        super.syncUniforms()
        this.uniforms['uSpecular'] = this.specular ?? [1, 1, 1]
        this.uniforms['uShininess'] = this.shininess ?? 30
        this.uniforms['uMaterial.specular'] = this.specular ?? [1, 1, 1]
        this.uniforms['uMaterial.shininess'] = this.shininess ?? 30
        this.uniforms['uHasNormalMap'] = !!this.normalMap
        const PROC_MAP = { none: 0, checker: 1, wood: 2, marble: 3, cloud: 4 }
        this.uniforms.uProcedural = PROC_MAP[this.procedural ?? 'none']
    }
}
export type PostEffectType =
    | 'none'        // 直通
    | 'grayscale'   // 灰度
    | 'invert'      // 反色
    | 'chromatic'   // 色差
    | 'vignette'    // 暗角
    | 'scanline'    // 扫描线
    | 'blur3'        // 3×3 均值
    | 'blurGauss'    // 5×5 高斯
    | 'sharpen'      // 锐化
    | 'sobel'        // 边缘检测
    | 'bright'       // 提取亮部
    | 'blurH'        // 水平高斯模糊
    | "blurV"        // 垂直高斯模糊
    //hdr debug 效果
    | 'hdrScale'    // 值除以 4
    | 'hdrOver'     // 超 1 标红
export class PostProcessMaterial extends Material {
    vertexString = `#version 300 es
        out vec2 vUv;
        void main(){
            vec2 pos=vec2(
                float(gl_VertexID&1)*2.-1.,
                float(gl_VertexID>>1)*2.-1.
            );
            gl_Position=vec4(pos,0.,1.);
            vUv=pos*0.5+.5;
        }

    `
    fragmentString = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uSceneTexture;
uniform float uTime;
uniform vec2 uResolution;
uniform float uAmount;
uniform int uEffect;
uniform float uLightIntensity;

// ── 色差：三次采样，RGB 通道朝不同方向偏移 ──
vec3 chromatic(vec2 uv, float amount) {
    vec2 dir = uv - 0.5;
    float r = texture(uSceneTexture, uv + dir * amount).r;
    float g = texture(uSceneTexture, uv).g;
    float b = texture(uSceneTexture, uv - dir * amount).b;
    return vec3(r, g, b);
}

// ── 暗角：越靠边越暗 ──
vec3 vignette(vec3 col, vec2 uv, float strength) {
    vec2 d = uv - 0.5;
    float v = 1.0 - smoothstep(0.35, 0.75, length(d) * strength);
    return col * v;
}

// ── 扫描线：按像素行做周期性明暗 ──

vec3 scanline(vec3 col, vec2 uv, float time) {
    float y = uv.y * uResolution.y;

    // 条纹：周期 4 像素，对比度 30%
    float stripe = 0.5 + 0.5 * sin(y * 3.14159 * 0.05+time*10.);
    col *= 0.7 + 0.3 * stripe;

    // 扫描头：缓慢上移的亮带
    float head = fract(time * 0.15);
    float beam = exp(-abs(uv.y - head) * 180.0);
    col += vec3(beam * 0.15);

    return col;
}

// 3x3均值模糊:本质上9个格子权重相等
vec3 blur3(vec2 uv,vec2 texelSize){
    vec3 total=vec3(0.);
    for(int i=-1;i<=1;i++){
        for(int j=-1;j<=1;j++){
            vec2 offset=vec2(
                i,j
            )*texelSize*4.;
            total+=texture(uSceneTexture,uv+offset).rgb;
        }

    }
    return total/9.;
}

// 5x5高斯模糊：exp(-r²/(2σ²))，r:采样点到中心距离，sigma:模糊扩散宽度
vec3 blurGauss(vec2 uv,vec2 texelSize,float radius){
    vec3 totalCol=vec3(0.);
    float totalHeavy=0.;
    float sigma=1.5;
    for(int i=-2;i<=2;i++){
        for(int j=-2;j<=2;j++){
            vec2 offset=vec2(i,j);
            float r=length(offset);
            float heavy=exp(-r*r/(2.*sigma*sigma));
            totalHeavy+=heavy;
            totalCol+=texture(uSceneTexture,uv+offset*texelSize*radius).rgb*heavy;
        }
    }
    return totalCol/totalHeavy;
}

// 锐化：center-blur得到高频细节，再乘以strength调节高频细节，center+blur就是模糊
// 增强高频对比
vec3 sharpen(vec2 uv,float strength,vec2 texelSize){
    vec3 center=texture(uSceneTexture,uv).rgb;
    vec3 blur=blur3(uv,texelSize);
    return center+(center-blur)*strength;
}

vec3 sharpenUSM(vec2 uv, vec2 texelSize, float amount){
    vec3 src = texture(uSceneTexture, uv).rgb;
    vec3 blur = blurGauss(uv, texelSize,4.);

    float ySrc  = dot(src,  vec3(0.299, 0.587, 0.114));
    float yBlur = dot(blur, vec3(0.299, 0.587, 0.114));
    float hi = ySrc - yBlur;

    // 阈值抑制（可调）
    float th = 0.01;
    float m = smoothstep(th, th * 2.0, abs(hi));

    vec3 outCol = src + amount * m * hi;   // 只加亮度高频
    return clamp(outCol, 0.0, 1.0);
}

// sobel:边缘检测，亮度梯度最大的地方就是边缘，xy方向都进行累加
vec3 sobel(vec2 uv,vec2 texelSize){
    // Gx：检测水平方向变化
    float kx[9] = float[](-1., 0., 1.,
                          -2., 0., 2.,
                          -1., 0., 1.);
    // Gy：检测垂直方向变化
    float ky[9] = float[](-1., -2., -1.,
                           0.,  0.,  0.,
                           1.,  2.,  1.);
    int i=0;
    float gx=0.;
    float gy=0.;
    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 offset = vec2(float(x), float(y)) * texelSize;
            vec3 c = texture(uSceneTexture, uv + offset).rgb;
            float lum = dot(c, vec3(0.299, 0.587, 0.114));   // 转亮度
            gx += lum * kx[i];
            gy += lum * ky[i];
            i++;
        }
    }
    float g=sqrt(gx*gx+gy*gy);
    return vec3(g);
}
// 提取亮部
vec3 extractLight(vec2 uv){
    vec3 col=texture(uSceneTexture,uv).rgb;
    float lum=dot(col,vec3(.299,.587,.114));
    // float m=step(uLightIntensity,lum);
    float knee=0.15;
    float m = max(lum - uLightIntensity, 0.0) / max(lum, 1e-4);
    return col*m;
}
// 9_tap水平模糊
vec3 blurH(vec2 uv,vec2 texelSize,float radius){
    vec3 totalCol=vec3(0);
    float weight=0.;
    float sigma=1.5;
    for(int i=-4;i<=4;i++){
        float w=exp(-float(i)*float(i)/(2.*sigma*sigma));
        totalCol+=texture(uSceneTexture,uv+vec2(float(i)*radius,0)*texelSize).rgb*w;
        weight+=w;
    }
    return totalCol/weight;
}
vec3 blurV(vec2 uv,vec2 texelSize,float radius){
    vec3 totalCol=vec3(0.);
    float weight=0.;
    float sigma=5.;
    for(int i=-4;i<=4;i++){
        float w=exp(-float(i)*float(i)/(2.*sigma*sigma));
        totalCol+=texture(uSceneTexture,uv+vec2(0.,float(i)*radius)*texelSize).rgb*w;
        weight+=w;
    }
    
    return totalCol/weight;
}
// 1) 除以 4 观察：如果 RT 是 RGBA8，全部 ≤ 0.25，画面灰暗
//    如果是 RGBA16F，高光区 > 1，除以 4 后仍能看到亮斑
vec3 hdrScale(vec2 uv) {
    vec3 c = texture(uSceneTexture, uv).rgb;
    return c / 4.0;
}

// 2) 超 1 标红：一眼看出哪些像素超出了 LDR 范围
vec3 hdrOver(vec2 uv) {
    vec3 c = texture(uSceneTexture, uv).rgb;
    float m = max(max(c.r, c.g), c.b);
    return m > 1. ? vec3(1.0, 0.0, 0.0) : c;
}
void main() {
    vec3 col;
    vec2 texelSize=1./uResolution;

    if (uEffect == 3) {
        // 色差要自己采样，不走默认路径
        col = chromatic(vUv, uAmount);
    } else {
        col = texture(uSceneTexture, vUv).rgb;
    }

    if (uEffect == 1) {
        // 灰度：亮度加权
        float g = dot(col, vec3(0.299, 0.587, 0.114));
        col = vec3(g);
    }
    else if (uEffect == 2) {
        col = 1.0 - col;
    }
    else if (uEffect == 4) {
        col = vignette(col, vUv, uAmount * 100.0);
    }
    else if (uEffect == 5) {
        col = scanline(col, vUv, uTime);
    }else if(uEffect ==6){
        col=blur3(vUv,texelSize);
    }else if(uEffect ==7){
        col=blurGauss(vUv,texelSize,4.);
    }else if(uEffect ==8){
        col=sharpen(vUv,2.,texelSize);
        // col=sharpenUSM(vUv,texelSize,2.);
    }else if(uEffect ==9){
        col=sobel(vUv,texelSize);
    }else if(uEffect ==10){
        col=extractLight(vUv);
    }else if(uEffect ==13){
        col=hdrScale(vUv);
    }else if(uEffect ==14){
        col=hdrOver(vUv);
    }else{
        col=texture(uSceneTexture,vUv).rgb;
    }

    fragColor = vec4(col, 1.0);
}
    
    `
    uniforms: Record<string, any> = {
        uSceneTexture: 0,
        uTime: 0,
        uResolution: [1, 1],       // 真实像素尺寸
        uAmount: 0.01,             // 效果强度
        uEffect: 10,                // 效果编号
        uLightIntensity: 0.3
    }
    effect: PostEffectType = 'bright'
}

export class CompositeMaterial extends Material {
    vertexString: string = `#version 300 es
        out vec2 vUv;
        void main(){
            vec2 c=vec2(gl_VertexID&1,gl_VertexID>>1);
            gl_Position=vec4(c*2.-1.,0.,1.);
            vUv=c;
        }
    `
    fragmentString: string = `#version 300 es
        precision highp float;
        uniform sampler2D uSceneTexture;
        uniform sampler2D uBloomTexture; 
        uniform float uIntensity;
        in vec2 vUv;
        out vec4 fragColor;
        void main(){
            vec3 scene = texture(uSceneTexture, vUv).rgb;
            vec3 bloom = texture(uBloomTexture, vUv).rgb;
            vec3 col = scene + bloom * uIntensity;
            col = col / (col + vec3(1.0));   // Reinhard
            fragColor = vec4(col, 1.0);
        }
    `
    uniforms: Record<string, any> = {
        uSceneTexture: 0,
        uBloomTexture: 1,
        uIntensity: 0.8
    }
}