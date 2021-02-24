(function (factory) {
    // 根据环境，选用不同模块化方案
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['leaflet'], factory);
    } else if (typeof module !== 'undefined') {
        // Node/CommonJS
        module.exports = factory(require('leaflet'));
    } else {
        // Browser globals
        if (typeof window.L === 'undefined') {
            throw new Error('Leaflet must be loaded first');
        }
        factory(window.L);
    }
}(function (L) {
    // 将图片保存到本地(默认处理函数)
    function downloadPicToLocal(src) {
        // 下载图片
        let link = document.createElement("a");
        link.href = src; //下载链接
        link.setAttribute(
            "download",
            new Date().toLocaleString() + "_截图.png"
        );
        link.style.display = "none"; //a标签隐藏
        document.body.appendChild(link);
        link.click(); // 点击下载
        document.body.removeChild(link); // 移除a标签
    }
    L.Control.Snip = L.Control.extend({
        // 支持的配置参数
        options: {
            position: 'topleft', // 按钮位置
            callback: null, // 回调函数, 返回参数为已生成的框选图片 base64 地址
            title: '框选截图', // hover 按钮时的提示文字
            scale: 1, // 放大比例, 默认为 1 , 当值为更大时, 可使截图更加清晰
        },
        // 自定义 Control 添加到地图容器时的方法覆盖
        onAdd: function (map) {
            console.log(this)
            // 创建 div 容器, 设置样式
            this._addCss()
            var container = L.DomUtil.create('div', 'leaflet-control-snip leaflet-bar leaflet-control');
            // 给 div 容器添加点击链接, 设置样式
            this.link = L.DomUtil.create('a', 'leaflet-control-snip-button leaflet-bar-part', container);
            this.link.href = '#'; // 重置 a 标签的点击跳转
            this.link.title = this.options.title // 设置 hover 内容
            // 保存配置数据, 供其它地方使用
            // this._map._snip = { // 保存所需数据
            //     callback: this.options.callback? this.options.callback : downloadPicToLocal,
            //     scale: this.options.scale ? this.options.scale : 1
            // }
            // 监听按钮点击事件
            L.DomEvent.on(this.link, 'click', (e) => {
                this._drawRec()
            }, this);
            // 返回容器
            return container;
        },
        // 画矩形
        _drawRec: function () {
            const _map = this._map
            const that = this
            // 将鼠标样式改为十字
            _map.getContainer().style.cursor = "crosshair"

            // 禁止地图拖动
            _map.dragging.disable()

            let tmprec; // 过程矩形
            const latlngs = [] // 起止点
            let recOpts = { // 矩形样式
                color: 'gray',
                weight: 2,
                opacity: 0.8,
                dashArray: '5, 10',
                fill: false,
                fillOpacity: 0.1,
            }

            _map.on('mousedown', drawStart);
            _map.on('mouseup', drawFinished);

            function drawStart(e) {
                if (typeof tmprec != 'undefined') {
                    tmprec.remove()
                }
                //左上角坐标
                latlngs[0] = [e.latlng.lat, e.latlng.lng]

                //开始绘制，监听鼠标移动事件
                _map.on('mousemove', drawDuring)
            }

            function drawDuring(e) {
                latlngs[1] = [e.latlng.lat, e.latlng.lng]
                //删除临时矩形
                if (typeof tmpRect != 'undefined') {
                    tmpRect.remove()
                }
                //添加临时矩形
                tmpRect = L.rectangle(latlngs, recOpts).addTo(_map)
            }

            function drawFinished(e) {
                // 恢复鼠标样式
                // $(`#${_map._snip.mapid}`).css('cursor', "grab")
                _map.getContainer().style.cursor = "grab"
                // 恢复地图拖动
                _map.dragging.enable()
                // 移除监听
                _map.off('mousemove')
                _map.off('mousedown')
                _map.off('mouseup')

                // 移除临时矩形
                tmpRect.remove()

                //右下角坐标
                latlngs[1] = [e.latlng.lat, e.latlng.lng]
                // 最终矩形
                let resRect = L.rectangle(latlngs, recOpts).addTo(_map)

                // TODO:画完矩形之后，给用户选择权。

                // 转换地理坐标到屏幕坐标
                that._convertCoord(latlngs, resRect)
            }

        },
        // 转换坐标
        _convertCoord: function (latlngs, layer) {
            const _map = this._map
            // 移除框选矩形
            layer.remove()
            // let scale = window.devicePixelRatio; // 获取屏幕dpi
            let scale = this.options.scale ? this.options.scale : 1;
            // 零点坐标
            let zeroPoint = _map
                .latLngToLayerPoint([_map.getBounds()._northEast.lat, _map.getBounds()._southWest.lng]) // 获取坐标
                .multiplyBy(scale); // 按尺度放大
            // 将框选矩形转屏幕坐标
            let startPoint = _map.latLngToLayerPoint(latlngs[0]).multiplyBy(scale), // latlng 转 屏幕坐标 计算 起点及宽高
                endPoint = _map.latLngToLayerPoint(latlngs[1]).multiplyBy(scale),
                canvasWidth = Math.abs(startPoint.x - endPoint.x),
                canvasHeight = Math.abs(startPoint.y - endPoint.y);

            let x = startPoint.x - zeroPoint.x,
                y = startPoint.y - zeroPoint.y,
                width = canvasWidth,
                height = canvasHeight

            // 使用 html2canvas 插件获取图片
            html2canvas(document.getElementById(_map.getContainer().id), {
                useCORS: true,
                scale,
                ignoreElements: ele => {
                    return ele.className === 'leaflet-control-container'
                } // 忽略控件按钮
            }).then(canvas => {
                let clipCanvas = document.createElement("canvas");
                clipCanvas.width = width;
                clipCanvas.height = height;
                clipCanvas.getContext("2d").drawImage(canvas, x, y, width, height, 0, 0, width, height); // 截取图片
                let src = clipCanvas.toDataURL("image/png", 1.0); // 生成图片url
                this.options.callback ? this.options.callback(src) : downloadPicToLocal(src)
            });
        },
        // 使用 js 添加 CSS , 免除 css 的引用
        _addCss: function () {
            var css = document.createElement("style");
            css.innerHTML = `.leaflet-control-snip a {
                background: #fff url(data:image/png;base64,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) no-repeat 0 0;
                background-size: 26px 52px;
            }
            
            .leaflet-touch .leaflet-control-snip a {
                background-position: 2px 2px;
            }
            
            /* Do not combine these two rules; IE will break. */
            .leaflet-container:-webkit-full-screen {
                width: 100% !important;
                height: 100% !important;
            }
            
            @media (-webkit-min-device-pixel-ratio:2),
            (min-resolution:192dpi) {
                .leaflet-control-snip a {
                    background-image: url(data:image/png;base64,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);
                }
            }`;
            document.body.appendChild(css);
        },
    });
    // 适配大小写…, 不用 new ，直接使用方法创建
    L.control.snip = function (options) {
        return new L.Control.Snip(options);
    };
}));