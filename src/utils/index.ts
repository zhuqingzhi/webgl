export function createShaderFromScript(
  gl: WebGLRenderingContext,
  script: string,
  type:
    | WebGLRenderingContextBase["VERTEX_SHADER"]
    | WebGLRenderingContextBase["FRAGMENT_SHADER"],
) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("创建shader失败");
  gl.shaderSource(shader, script);
  gl.compileShader(shader);
  return shader;
}
type BufferParams = {
  size: number;
  stride: number;
  offset?: number;
  dataType:
    | WebGLRenderingContextBase["FLOAT"]
    | WebGLRenderingContextBase["INT"];
};
export function createBuffer(
  gl: WebGLRenderingContext,
  attrib: number,
  param: BufferParams,
) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(attrib);
  gl.vertexAttribPointer(
    attrib,
    param.size,
    param.dataType,
    false,
    param.stride,
    param.offset || 0,
  );
  return buffer;
}
