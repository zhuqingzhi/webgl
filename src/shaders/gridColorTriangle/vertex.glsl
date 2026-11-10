attribute vec2 pos;
attribute vec3 color;
varying vec3 vColor;
void main(){
    gl_Position=vec4(pos,0,1);
    vColor=color;
}