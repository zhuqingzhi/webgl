#version 300 es
layout(location = 0) in vec3 pos;
layout(location = 1) in vec3 aColor;
out vec3 vColor;
uniform mat4 u_modelMatrix;
void main(){
    vec4 worldPos=u_modelMatrix*vec4(pos,1);
    gl_Position=worldPos;
    vColor=aColor;
}