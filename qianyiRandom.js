/**
 * Created by wyb on 2017/3/16.
 */
//获取随机坐标
function randomPoint(arr) {
    var lon = arr[0] + Math.random() * (Math.abs(arr[2] - arr[0]));
    var lat = arr[1] + Math.random() * (Math.abs(arr[3] - arr[1]));
    return [lon, lat];
}
//显示图层
function showLayer() {
    var reaultJson;
    var data = Papa.parse('./data/grid.csv', {
            download: true,
            complete: function (results) {
                var items = results.data;
                var length = items.length;
                var featuresJson = [];
                for (var i = 1; i < length - 1; i++) {
                    var item = items[i];
                    var cBegin = quadgrid_decode(item[0]);
                    var cEnd = quadgrid_decode(item[1]);
                    var count = item[2];
                    var centerBegin = randomPoint(cBegin);
                    var centerEnd = randomPoint(cEnd);
                    var json = {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'LineString',
                            'coordinates': [centerBegin, centerEnd]
                        },
                        'properties': {
                            'count': count
                        }
                    };
                    featuresJson.push(json);
                }
                reaultJson = {
                    'type': 'FeatureCollection',
                    'features': featuresJson
                };
                var colorRange = ['#EE270B', '#06EE51', '#0815EE', '#EE0CD9'];
                var layer = new ol.layer.Vector({
                    source: new ol.source.Vector({
                        features: (new ol.format.GeoJSON()).readFeatures(JSON.stringify(reaultJson))
                    }),
                    style: function (feature) {
                        var classRendering =  parseInt(feature.get('count'));
                        var colorRendering;
                        if(classRendering <= 3){
                            colorRendering = colorRange[0];
                        }else if(classRendering > 3 && classRendering <= 10){
                            colorRendering = colorRange[1];
                        }else if(classRendering > 10 && classRendering <= 20){
                            colorRendering = colorRange[2];
                        }else {
                            colorRendering = colorRange[3];
                        }
                        return (new ol.style.Style({
                            fill: new ol.style.Fill({
                                color: 'rgba(98, 238, 26, 0.1)'
                            }),
                            stroke: new ol.style.Stroke({
                                color: colorRendering,
                                width: 0.1
                            })
                        }))
                    }
                });
                var map =initTdt();
                map.addLayer(layer);
                showMousePosition(map);
            }
        }
    )
}
showLayer();