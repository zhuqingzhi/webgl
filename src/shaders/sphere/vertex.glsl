attribute vec3 aPos;
uniform mat4 uMatrix;
void main(){
    gl_Position=uMatrix*vec4(aPos,1);
}