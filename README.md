## leaflet-snip
一个框选截图的Leaflet插件，向Leaflet地图中提供一个按钮，点击后可在地图页面中拉出一个矩形框并获取框选范围内的地图图片。

### Feature
- 支持截图清晰度的调节（ `scale` 参数）
- 项目依赖 `html2canvas` 库
- Chrome ， FireFox 测试通过

查看项目 [Demo](https://anonbug.github.io/leaflet-snip/) 地址。

### Options
Option | Type | Default | Description
--- | --- | --- | ---
title | string | "框选截图" | 按钮 hover 时的提示文字
position | Leaflet control position | "topleft" | 截图按钮在页面中的位置
scale | Number | 1 | 成果图片的放大比例
callback | Function | 默认下载到本地 | 对成果图片的处理操作

### Example
```js
L.Snip({ 
    scale: 3, 
    position: 'topright',
    callback: src => console.log(src)
}).addTo(map)
```
