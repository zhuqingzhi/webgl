attribute vec3 pos;
attribute vec3 aColor;
varying vec3 vColor;
uniform mat4 u_modelMatrix;
void main(){
    vec4 worldPos=u_modelMatrix*vec4(pos,1);
    gl_Position=worldPos;
    vColor=aColor;
}