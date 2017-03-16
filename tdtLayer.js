/**
 * Created by wyb on 2017/3/16.
 */
//获取天地图图层
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
//初始化天地图
function initTdt() {
    var bounds = [73.4510046356223, 18.1632471876417,
        134.976797646506, 53.5319431522236];
    var projection = new ol.proj.Projection({
        code: 'EPSG:4326',
        units: 'degrees'
    });
    //天地图道路图层和注记图层
    var vec_c = getTdtLayer("vec_c");
    var cva_c = getTdtLayer("cva_c");
    var map = new ol.Map({
        controls: ol.control.defaults({
            attribution: false
        }),
        target: 'map',
        layers: [vec_c,cva_c],
        view : new ol.View({
            projection: projection,
            center: [116.3, 39.9],
            minZoom: 2,
            maxZoom: 18
        })
    });
    map.getView().fit(bounds, map.getSize());
    return map;
}
//显示鼠标位置
function showMousePosition(map) {
    var element = document.getElementById('mousePosition');
    map.on("pointermove", function (event) {
        var coord = event.coordinate;
        var formatCoord = ol.coordinate.format(coord, '{x},{y}', 4);
        element.innerHTML = formatCoord;
    })
}