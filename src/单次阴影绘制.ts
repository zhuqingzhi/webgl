import { mat3, mat4, vec3 } from "gl-matrix";
import { createMesh, createPlane, createProgram, createShader, createSphere, type MyMesh } from "./webgl2/utils";

const canvas = document.querySelector("#canvas") as HTMLCanvasElement;
canvas.style.width = "100vw";
canvas.style.height = "100vh";
canvas.style.display = "block";
const gl = canvas.getContext("webgl2", {
    depth: true,
    antialias: true,
})!;
const { width, height } = canvas.getBoundingClientRect()
canvas.width = width
canvas.height = height
gl.viewport(0, 0, width, height)
gl.enable(gl.DEPTH_TEST)

if (!gl) {
    throw new Error("WebGL2 is not supported.");
}

const shadowProgram = createProgram(gl)
const shadowVs = `#version 300 es
layout(location=0) in vec3 pos;
uniform mat4 lightMVP;
void main(){
    gl_Position=lightMVP*vec4(pos,1);
}
`
const shadowFs = `#version 300 es
precision mediump float;
void main(){
}
`
const shadowVsShader = createShader(gl, gl.VERTEX_SHADER, shadowVs)
const shadowFsShader = createShader(gl, gl.FRAGMENT_SHADER, shadowFs)
gl.attachShader(shadowProgram, shadowVsShader)
gl.attachShader(shadowProgram, shadowFsShader)
gl.linkProgram(shadowProgram)
gl.useProgram(shadowProgram)


const lightMVPLoc = gl.getUniformLocation(shadowProgram, "lightMVP")

const sphere = createSphere(0.5, 30, 30)
const plane = createPlane(4)

const sphereVo = createMesh(gl, sphere.vertices, sphere.indices)
const planeVO = createMesh(gl, plane.vertices, plane.indices)

const lightPos: vec3 = [3, 3, 3]
const m4: mat4 = mat4.create()
const lookTarget = [0, 0, 0]
const upDir = [0, 1, 0]
const lightViewMatrix = mat4.lookAt(m4, lightPos, lookTarget, upDir)

const projectionMatrix = mat4.create()
const aspect = width / height
mat4.perspective(projectionMatrix, Math.PI / 3, aspect, 0.1, 10000)
const sphereModelMatrix = mat4.translate(mat4.create(), mat4.create(), [0, 0, 0])

const lightVP = mat4.multiply(mat4.create(), projectionMatrix, lightViewMatrix)
const sphereLightMVP = mat4.multiply(mat4.create(), lightVP, sphereModelMatrix)
const planeModelMatrix = mat4.translate(mat4.create(), mat4.create(), [0, 0, 0])
const planeLightMVP = mat4.multiply(mat4.create(), lightVP, planeModelMatrix)
gl.uniformMatrix4fv(lightMVPLoc, false, sphereLightMVP)

gl.clearColor(0, 0, 0, 1)
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

function drawShadowPass(mesh: MyMesh, matrix: mat4) {
    gl.useProgram(shadowProgram)

    gl.bindVertexArray(mesh.vao)
    gl.uniformMatrix4fv(lightMVPLoc, false, matrix)

    gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0)
    gl.bindVertexArray(null)
}

const depthTex = gl.createTexture()
const shadowSize = 1024
gl.bindTexture(gl.TEXTURE_2D, depthTex)
gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, shadowSize, shadowSize, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

const shadowFbo = gl.createFramebuffer()
gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFbo)
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTex, 0)
gl.drawBuffers([gl.NONE])
gl.readBuffer(gl.NONE)

gl.viewport(0, 0, shadowSize, shadowSize);
gl.clearDepth(1.0);
gl.clear(gl.DEPTH_BUFFER_BIT);
drawShadowPass(sphereVo, sphereLightMVP)

drawShadowPass(planeVO, planeLightMVP)


const mainVs = `#version 300 es
layout(location=0) in vec3 pos;
layout(location=1) in vec3 aNormal;

uniform mat4 uProjView;
uniform mat4 uModel;
uniform mat4 uLightMVP;
uniform mat3 uNormalMat;

out vec4 vLightClipPos;
out vec3 vNormal;
out vec3 vWorldPos;

void main(){
    vec4 worldPos=uModel*vec4(pos,1);
    vWorldPos=worldPos.xyz;
    vNormal=normalize(uNormalMat*aNormal);
    vLightClipPos=uLightMVP*vec4(pos,1);
    gl_Position=uProjView*worldPos;
}
`
const mainFs = `#version 300 es
precision highp float;

in vec4 vLightClipPos;
in vec3 vNormal;
in vec3 vWorldPos;

uniform vec3 uColor;
uniform vec3 uLightPos;
uniform vec3 uCameraPos;
uniform sampler2D uShadowMap;
uniform vec2 uShadowMapSize;

out vec4 fragColor;

float shadowPCF(vec4 lightClipPos,vec3 normal,vec3 lightDir){
    
    vec3 ndc=lightClipPos.xyz/lightClipPos.w;
    vec3 proj=ndc*0.5+0.5;
    if(proj.x>1.||proj.x<0.||proj.y>1.||proj.y<0.||proj.z>1.){
        return 1.;
    }
    //float bias=0.001;
    float bias = max(0.002 * (1.0 - dot(normal, lightDir)), 0.0007);

    vec2 texel=1./uShadowMapSize;
    float lit=0.;

    for(int x=-1;x<=1;x++){
        for(int y=-1;y<=1;y++){
            vec2 uv=proj.xy+vec2(float(x),float(y))*texel;
            float depth=texture(uShadowMap,uv).r;
            lit+=(proj.z-bias<=depth)?1.:0.; 
        }
    }
        return lit/9.;
}

void main(){
    vec3 n=normalize(vNormal);
    vec3 lightDir=normalize(uLightPos-vWorldPos);
    vec3 viewDir=normalize(uCameraPos-vWorldPos);
    vec3 hal=normalize(lightDir+viewDir);

    float ambient=0.2;
    float shadow=shadowPCF(vLightClipPos,n,lightDir);
    float diffuse=max(dot(n,lightDir),0.)*shadow;
    float specular=pow(max(dot(n,hal),0.),32.)*shadow;
    
    fragColor=vec4(uColor*(ambient+diffuse+specular),1);
}
`
const mainProgram = createProgram(gl)
const mainVsShader = createShader(gl, gl.VERTEX_SHADER, mainVs)
const mainFsShader = createShader(gl, gl.FRAGMENT_SHADER, mainFs)

gl.attachShader(mainProgram, mainVsShader)
gl.attachShader(mainProgram, mainFsShader)
gl.linkProgram(mainProgram)
gl.useProgram(mainProgram)

const uProjViewLoc = gl.getUniformLocation(mainProgram, "uProjView")
const uModelLoc = gl.getUniformLocation(mainProgram, "uModel")
const uLightMVPLoc = gl.getUniformLocation(mainProgram, "uLightMVP")
const uNormalMatLoc = gl.getUniformLocation(mainProgram, "uNormalMat")
const uColorLoc = gl.getUniformLocation(mainProgram, "uColor")
const uLightPosLoc = gl.getUniformLocation(mainProgram, "uLightPos")
const uCameraPosLoc = gl.getUniformLocation(mainProgram, "uCameraPos")
const uShadowMapLoc = gl.getUniformLocation(mainProgram, "uShadowMap")
const uShadowMapSizeLoc = gl.getUniformLocation(mainProgram, "uShadowMapSize")

const cameraPos = [0, 2, 4]

gl.uniform2fv(uShadowMapSizeLoc, [shadowSize, shadowSize])
gl.uniform3fv(uCameraPosLoc, cameraPos)
gl.uniform3fv(uLightPosLoc, lightPos)
gl.uniform3fv(uColorLoc, [0, 1, 0])



const cameraProj = mat4.perspective(mat4.create(), Math.PI / 3, aspect, 0.1, 10000)
const cameraView = mat4.lookAt(mat4.create(), cameraPos, lookTarget, upDir)
const viewMatrix = cameraView
const projView = mat4.multiply(mat4.create(), cameraProj, viewMatrix!)
gl.uniformMatrix4fv(uProjViewLoc, false, projView)
gl.uniformMatrix4fv(uModelLoc, false, sphereModelMatrix)
gl.uniformMatrix4fv(uLightMVPLoc, false, sphereLightMVP)
const normalMatrix = mat3.fromMat4(mat3.create(), mat4.transpose(mat4.create(), mat4.invert(mat4.create(), sphereModelMatrix)!))
gl.uniformMatrix3fv(uNormalMatLoc, false, normalMatrix)

gl.activeTexture(gl.TEXTURE0)
gl.bindTexture(gl.TEXTURE_2D, depthTex)
gl.uniform1i(uShadowMapLoc, 0)

gl.bindFramebuffer(gl.FRAMEBUFFER, null)
gl.drawBuffers([gl.BACK]);
gl.viewport(0, 0, canvas.width, canvas.height)

gl.bindVertexArray(sphereVo.vao)
gl.drawElements(gl.TRIANGLES, sphereVo.count, gl.UNSIGNED_SHORT, 0)

gl.bindVertexArray(planeVO.vao)
gl.uniformMatrix4fv(uLightMVPLoc, false, planeLightMVP)
gl.uniformMatrix4fv(uModelLoc, false, planeModelMatrix)
const planeNormalMat = mat3.fromMat4(mat3.create(), mat4.transpose(mat4.create(), mat4.invert(mat4.create(), planeModelMatrix)!))
gl.uniformMatrix3fv(uNormalMatLoc, false, planeNormalMat)
gl.drawElements(gl.TRIANGLES, planeVO.count, gl.UNSIGNED_SHORT, 0)