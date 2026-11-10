attribute vec2 position;
uniform vec2 screenSize;
varying vec2 vUv;
void main(){
    vec2 pos=position/screenSize*2.-1.;
    pos=pos*vec2(1,-1);
    gl_Position=vec4(pos,0,1);
    /* vec2 uv=position/screenSize;
    vUv = vec2(uv.x, 1.0 - uv.y); */
    float minP = 50.0;
    float size = 100.0;
    // 映射到 0~1
    float u = (position.x - minP) / size;
    float v = (position.y - minP) / size;
    // 翻转Y匹配图片原点
    vUv = vec2(u, 1.0 - v);
}