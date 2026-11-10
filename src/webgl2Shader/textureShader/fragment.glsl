#version 300 es
precision mediump float;
in vec3 vColor;
out vec4 fragColor;
uniform sampler2D tex;
in vec2 uv;
void main(){
    vec4 col=texture(tex,uv);
    fragColor=col;
}