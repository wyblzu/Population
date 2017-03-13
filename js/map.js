/**
 * Created by wyb on 2016/12/19.
 */
//初始化map
function initMap() {
    var bounds = [73.4510046356223, 18.1632471876417,
        134.976797646506, 53.5319431522236];
    var projection = new ol.proj.Projection({
        code: 'EPSG:4326',
        units: 'degrees'
    });
    //天地图道路图层和注记图层
    var vec_c = getTdtLayer("vec_c");
    var cva_c = getTdtLayer("cva_c");
    var heatMapLayer = createHeatMap();
    var imageTianDiTu = loadImageTile();
    var arcgisCacheLayer = loadArcGISCacheLayer();
    var layerGroup = new ol.layer.Group({
        title: '天地图',
        type: 'base',
        combine:true,
        visible: true,
        layers: [vec_c, cva_c]
    });
    var map = new ol.Map({
        controls: ol.control.defaults({
            attribution: false
        }),
        target: 'map',
        layers: [
            new ol.layer.Group({
                title: '底图',
                layers: [layerGroup]
            }),
            new ol.layer.Group({
                title: '热力图',
                layers: [heatMapLayer, arcgisCacheLayer, imageTianDiTu]
            })
        ],
        view : new ol.View({
            projection: projection,
            center: [116.3, 39.9],
            minZoom: 2,
            maxZoom: 18
        })
    });
    map.getView().fit(bounds, map.getSize());
    var layerSwitcher = new ol.control.LayerSwitcher({
        tipLabel: '图层' // Optional label for button
    });
    map.addControl(layerSwitcher);
    checkZoom(map);
}
//创建天地图图层
function getTdtLayer(lyr) {
    var url = "http://t4.tianditu.com/DataServer?T="+lyr+"&x={x}&Y={y}&L={z}";
    var projection = ol.proj.get("EPSG:4326");
    var projectionExtent = [ -180, -90, 180, 90 ];
    var maxResolution = (ol.extent.getWidth(projectionExtent) / (256 * 2));
    var resolutions = new Array(19);
    for (var z = 0; z < 19; ++z) {
        resolutions[z] = maxResolution / Math.pow(2, z);
    }
    var tileOrigin = ol.extent.getTopLeft(projectionExtent);
    var layer = new ol.layer.Tile({
        extent: [ -180, -90, 180, 90],
        source: new ol.source.TileImage({
            tileUrlFunction: function(tileCoord) {
                var z = tileCoord[0]+1;
                var x = tileCoord[1];
                var y = -tileCoord[2]-1;
                var n = Math.pow(2, z + 1);
                x = x % n;
                if (x * n < 0) {
                    x = x + n;
                }
                return url.replace('{z}', z.toString())
                    .replace('{y}', y.toString())
                    .replace('{x}', x.toString());
            },
            projection: projection,
            tileGrid: new ol.tilegrid.TileGrid({
                origin: tileOrigin,
                resolutions: resolutions,
                tileSize: 256
            })
        })
    });
    return layer;
}
function createHeatMap() {
    var heatmapSource = new ol.source.Vector();
    // fetch('data/cluster.json').then(function (response) {
    //     return response.json();
    // }).then(function (json) {
    //     var maxCountValue = maxCount(json);
    //     var featureJson = [];
    //     $.each(json, function (index, info) {
    //         var quadkey = info['gridkey'];
    //         var coods = quadgrid_decode(quadkey);
    //         var geometry = new ol.geom.Polygon(null);
    //         //构造几何
    //         geometry.setCoordinates([[[coods[0], coods[3]],[coods[2], coods[3]], [coods[2], coods[1]],[coods[0],coods[1]], [coods[0], coods[3]]]]);
    //         //求取中心点
    //         var center = new ol.extent.getCenter(geometry.getExtent());
    //         var weight = info['count']/maxCountValue;
    //         var interJson = {
    //             'type': 'Feature',
    //             'geometry': {
    //                 'type': 'Point',
    //                 'coordinates': center
    //             },
    //             'properties': {
    //                 'weight': weight
    //             }
    //         };
    //         featureJson.push(interJson);
    //     });
    //     var heatmapJSON = {
    //         'type': 'FeatureCollection',
    //         'features': featureJson
    //     };
    //     heatmapSource = new ol.source.Vector({
    //         features: (new ol.format.GeoJSON()).readFeatures(JSON.stringify(heatmapJSON))
    //     });
    // });
    //同步请求
    $.ajaxSettings.async = false;
    $.getJSON('data/cluster.json', function (data) {
        var maxCountValue = maxCount(data);
        var featureJson = [];
        $.each(data, function (index, info) {
            var quadkey = info['gridkey'];
            var coods = quadgrid_decode(quadkey);
            var geometry = new ol.geom.Polygon(null);
            //构造几何
            geometry.setCoordinates([[[coods[0], coods[3]],[coods[2], coods[3]], [coods[2], coods[1]],[coods[0],coods[1]], [coods[0], coods[3]]]]);
            //求取中心点
            var center = new ol.extent.getCenter(geometry.getExtent());
            var weight = info['count']/maxCountValue;
            var interJson = {
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': center
                },
                'properties': {
                    'weight': weight
                }
            };
            featureJson.push(interJson);
        });
        var heatmapJSON = {
            'type': 'FeatureCollection',
            'features': featureJson
        };
        heatmapSource = new ol.source.Vector({
            features: (new ol.format.GeoJSON()).readFeatures(JSON.stringify(heatmapJSON))
        });
    });
    var extent = heatmapSource.getExtent(heatmapSource);
    var heatmap = new ol.layer.Heatmap({
        gradient:['#00f', '#0ff', '#0f0', '#ff0', '#f00'],
        radius: 1,
        source: heatmapSource,
        entent: extent,
        //设置热力图显示级别
        minResolution:getResolution(12),
        maxResolution: getResolution(8),
        weight: 'weight',
        blur: 1.3,
        shadow: 200,
        opacity: 1,
        visible: true
    });
    heatmap.set('name', '热力图');
    heatmap.set("title", "OpenLayers热力图");
    return heatmap;
}
//加载ArcGIS缓存瓦片
function loadArcGISCacheLayer() {
    var layer = new ol.layer.Tile({
        source: new ol.source.XYZ({
            projection: 'EPSG:3857',
            maxZoom: 15,
            minZoom:3,
            tileUrlFunction: function (tileCoord) {
                var oo = "00000000";
                var zz = tileCoord[0];
                //小于10级前面补个0
                var z = "L" + (zz < 10?("0" + zz):zz);
                var xx = tileCoord[1].toString(16);
                var x = "C" + oo.substring(0, 8 - xx.length) + xx;
                var yy = (-tileCoord[2] - 1).toString(16); //注意此处，计算方式变了
                var y = "R" + oo.substring(0, 8 - yy.length) + yy;
                return './data/_alllayers/' + z + '/' + y + '/' + x + '.png';
            }
        })
    });
    layer.set('title', 'ArcGIS热力图');
    return layer;
}
//加载天地图离线影像瓦片
function loadImageTile() {
    var projection = ol.proj.get("EPSG:4326");
    var projectionExtent = [ -180, -90, 180, 90 ];
    var maxResolution = (ol.extent.getWidth(projectionExtent) / (256 * 2));
    var resolutions = new Array(19);
    for (var z = 0; z < 19; ++z) {
        resolutions[z] = maxResolution / Math.pow(2, z);
    }
    var tileOrigin = ol.extent.getTopLeft(projectionExtent);
    var layer = new ol.layer.Tile({
        extent: [ -180, -90, 180, 90],
        preload:0,
        source: new ol.source.XYZ({
            maxZoom: 18,
            minZoom:1,
            tileUrlFunction: function (tileCoord) {
                var z = tileCoord[0]+1;
                var x = tileCoord[1];
                var y = -tileCoord[2]-1;
                var n = Math.pow(2, z + 1);
                x = x % n;
                if (x * n < 0) {
                    x = x + n;
                }
                // return 'http://localhost:5555/TilesService/servlet/TilesRequest?z=' + z + '&x=' + x + '&y='+ y;
                return './data/tile/' + z + '/' + x + '/' + y + '.png';
            },
            projection: projection,
            tileSize: 256,
            tileGrid: new ol.tilegrid.TileGrid({
                origin: tileOrigin,
                resolutions: resolutions,
                tileSize: 256
            })
        })
    });
    layer.set('title', '影像');
    return layer;
}
//获取count的最大值
function maxCount(data) {
    var weight = [];
    for(var i =0; i < data.length; i ++){
        weight.push(data[i].count);
    }
    return Math.max.apply(null,weight);
}
//根据不同分辨率改变heatmap的radius和blur
function checkZoom(map) {
    var currentZoomLevel = map.getView().getZoom();
    var radius;
    var blur;
    var view = map.getView();
    view.on("change:resolution", function () {
        var newZoomLevel = map.getView().getZoom();
        if(currentZoomLevel != newZoomLevel){
            currentZoomLevel = newZoomLevel;
            var layer = findBy(map.getLayerGroup(),'name','热力图');
            if(newZoomLevel >= 14){
                radius = 38.87376386;
                blur = 38.97376386;
            }else if(newZoomLevel <= 9){
                radius = Math.pow(1.6, newZoomLevel-6) + 0.2;
                blur = Math.pow(1.6, newZoomLevel-6) + 0.2;
            }else {
                radius = Math.pow(1.6, newZoomLevel-5) + 0.2;
                blur = Math.pow(1.6, newZoomLevel-5) + 0.2;
            }
            layer.setRadius(radius);
            layer.setBlur(blur);
        }
    });
}
//根据缩放级别获取分辨率
function getResolution(z) {
    var projectionExtent = [ -180, -90, 180, 90 ];
    var maxResolution = (ol.extent.getWidth(projectionExtent) / (256 * 2));
    return maxResolution / Math.pow(2, z);
}
//根据关键字获取map中指定名称的图层
function findBy(layer, key, value) {
    //如果不是图层组使用该方法
    if (layer.get(key) === value) {
        return layer;
    }
    // 如果是图层组使用该方法
    if (layer.getLayers) {
        var layers = layer.getLayers().getArray(),
            len = layers.length, result;
        for (var i = 0; i < len; i++) {
            result = findBy(layers[i], key, value);
            if (result) {
                return result;
            }
        }
    }
    return null;
}
//加载谷歌缓存瓦片
function loadGoogleTilesCache() {
    var projectionExtent = [ -20037508.3427892, -20037508.3427892, 20037508.3427892, 20037508.3427892 ];
    var tileOrigin = ol.extent.getTopLeft(projectionExtent);
    var maxResolution = ol.extent.getWidth(projectionExtent) / 256;
    var resolutions = new Array(19);
    for(var i = 0; i < 19; i ++){
        resolutions[i] = maxResolution/ Math.pow(2, i);
    }
    var layer = new ol.layer.Tile({
        source: new ol.source.XYZ({
            maxZoom: 18,
            minZoom:0,
            tileUrlFunction: function (tileCoord) {
                var z = tileCoord[0];
                var x = tileCoord[1];
                var y = -tileCoord[2]-1;
                return './data/googletile/' + z + '/' + x + '/' + y + '.png';
            },
            projection: 'EPSG:900913',
            tileGrid: new ol.tilegrid.TileGrid({
                origin: tileOrigin,
                extent: projectionExtent,
                resolutions: resolutions,
                tileSize: [256, 256]
            }),
            wrapX: false
        })
    });
    var googleMapLayer = new ol.layer.Tile({
        source: new ol.source.XYZ({
            url:'http://www.google.cn/maps/vt/pb=!1m4!1m3!1i{z}!2i{x}!3i{y}!2m3!1e0!2sm!3i345013117!3m8!2szh-CN!3scn!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0'
        })
    });
    var map = new ol.Map({
        controls: ol.control.defaults({
            attribution: false
        }),
        target: 'map',
        view : new ol.View({
            projection: 'EPSG:900913',
            center: ol.proj.transform([116.3, 39.9], "EPSG:4326", 'EPSG:900913'),
            minZoom: 0,
            maxZoom: 18,
            zoom: 5
        })
    });
    map.addLayer(layer);
    // map.addLayer(googleMapLayer);
    showMousePosition(map);
}
//显示鼠标位置
function showMousePosition(map) {
    var element = document.getElementById('mousePosition');
    map.on("pointermove", function (event) {
        var coord = event.coordinate;
        var formatCoord = ol.coordinate.format(ol.proj.transform(coord, 'EPSG:900913', 'EPSG:4326'), '{x},{y}', 4);
        element.innerHTML = formatCoord;
    })
}
// initMap();
loadGoogleTilesCache();


















