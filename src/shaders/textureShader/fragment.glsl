precision mediump float;
uniform sampler2D uTexture;
varying vec2 vUv;
void main(){
    vec4 col=texture2D(uTexture,vUv);
    gl_FragColor=col;
    // gl_FragColor=vec4(vUv,0,1);
}