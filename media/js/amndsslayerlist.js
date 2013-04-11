AMNDSS.LayerList = {};
AMNDSS.LayerListRectifier = {};

AMNDSS.external_wms_layers = _external_wms_layers;
AMNDSS.rectifier_wms_layers = _rectifier_wms_layers;

// Loop through all the external (i.e. private) layers in the database and get a reference to each
for (var i = 0; i < AMNDSS.external_wms_layers.length; i++) {
    var layer = AMNDSS.external_wms_layers[i];
    // in an earlier version we also included exceptions: 'application/vnd.ogc.se_xml',
    AMNDSS.LayerList[layer.name] = new OpenLayers.Layer.WMS(layer.wms_name, layer.url, {
        layers: layer.isBaseLayer ? layer.layers.join('') : layer.layers,
        transparent: layer.transparent,
        format: layer.format,
        exceptions: 'application/vnd.ogc.se_xml', 
        srs: layer.srs
    }, {
        displayInLayerSwitcher: layer.display_in_layer_switcher,
        isBaseLayer: layer.isBaseLayer,
        opacity: layer.opacity,
        hide_in_legend: layer.hide_in_legend,
        order: layer.order,
        active: layer.active,
        visibility: layer.visibility
    });
}

//Loop through all the rectifier layers in the database and get a reference to each
for (var i = 0; i < AMNDSS.rectifier_wms_layers.length; i++) {
 var layer = AMNDSS.rectifier_wms_layers[i];
 AMNDSS.LayerListRectifier[layer.name] = new OpenLayers.Layer.WMS(layer.wms_name, layer.url, {
     layers: layer.isBaseLayer ? layer.layers.join('') : layer.layers,
     transparent: layer.transparent,
     format: layer.format,
     srs: layer.srs
 }, {
     isBaseLayer: layer.isBaseLayer,
     opacity: layer.opacity,
     active: layer.active,
     visibility: layer.visibility
 });
}
