attribute vec2 pos;
void main(){
    gl_PointSize=20.;
    gl_Position=vec4(pos,0,1);
}