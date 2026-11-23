# S6完整bloom颜色管线

- 渲染到renderTarget保存场景图uSceneTexture
- postprocessMaterial处理uSceneTexture，并提取高光
  - 软高光，颜色转亮度，contrib曲线
- 高光部分纹理通过ping/pongRT处理水平和垂直高斯模糊，9_tap
- 多级降采样+升采样叠加
  - 多级降采样
    使用多组RT渲染上一级场景纹理，ping/pong->1/2-->降采样-->mip1A/mip1B RT--->降采样-->mip2A/mip2B
    其中降采样，是将上一级的输出纹理通过直通effect='none'的方式直接渲染到mip1A进行初始化
  - 升采样叠加
    开启blend混合，设置blendFunc(gl.one,gl.one)保留源和目标纹理的rgba，将源绘制到目标RT上就能和目标RT原来的
    colorTex保存的模糊进行叠加

# 颜色管线

- 贴图采样
  srgb8_alpha8->硬件解码->linear
  数据贴图（几何，空间信息）直接设置贴图linear，使用internalformat rgba8直接保存
- 材质颜色
  colorTolinear->linear
- 光照计算（全在linear）
  ambient+Σ(diffuse+specular)计算所有光照，结果可以>1.0
- 写入rendertarget
  rgba16f,无clamp，保留hdr，如果RT是rgba8则会削顶截断
- 亮部提取extractLight
  lum=dot(col,Rec.709)，软阈值，抛物线过渡
  输出：只保留超过阈值的部分
- 三级降采样+高斯模糊
  1/2 → 1/4 → 1/8
  每级 blurH + blurV，sigma 控制软硬，radius 控制范围

* 升采样叠加
  1/8 加到 1/4，1/4 加到 1/2
  加性混合，clear:false 保留原内容

- 合成 + 曝光 + 色调映射
  hdr = (scene + bloom × intensity) × 2^EV
  Reinhard / Filmic / ACES 三选一

- sRGB 编码// 伽马校正
  pow(col, 1/2.2) 或精确分段公式

- 输出到屏幕
  sRGB 8 位
