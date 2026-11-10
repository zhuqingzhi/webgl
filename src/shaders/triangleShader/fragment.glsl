precision mediump float;
varying vec3 vColor;
void main(){
    if(gl_FrontFacing())
    gl_FragColor=vec4(vColor,1);
}