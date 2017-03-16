/**
 * Created by wyb on 2017/3/16.
 */
//显示图层
function showlayer() {
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
                    var geometryBegin = new ol.geom.Polygon(null);
                    geometryBegin.setCoordinates([[[cBegin[0], cBegin[3]], [cBegin[2], cBegin[3]], [cBegin[2], cBegin[1]], [cBegin[0], cBegin[1]], [cBegin[0], cBegin[3]]]]);
                    var centerBegin = new ol.extent.getCenter(geometryBegin.getExtent());
                    var geometryEnd = new ol.geom.Polygon(null);
                    geometryEnd.setCoordinates([[[cEnd[0], cEnd[3]], [cEnd[2], cEnd[3]], [cEnd[2], cEnd[1]], [cEnd[0], cEnd[1]], [cEnd[0], cEnd[3]]]]);
                    var centerEnd = new ol.extent.getCenter(geometryEnd.getExtent());
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
showlayer();