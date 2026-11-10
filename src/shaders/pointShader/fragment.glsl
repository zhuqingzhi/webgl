precision mediump float;
void main(){
    float d=distance(gl_PointCoord,vec2(0.5,0.5))*2.;
    float m=1.-step(0.5,d);
    gl_FragColor=vec4(vec3(m),1);
}