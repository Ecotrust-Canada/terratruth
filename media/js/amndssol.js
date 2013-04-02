/* AMN  Aboriginal Mapping Network 
 * DSS  Decision Support System
 * OL   Openlayers
 * This Java Script manages the display of open layers and the legend in the Map View.
*/

AMNDSS.Map = function (mapdiv) {
    var obj = {
        _init: function (mapdiv) {
            this.map = this._initMap(mapdiv);
            this._initPrivateLayers();
        },

        _initPrivateLayers: function () {
            // Decode response from WMS layer web service
            var groups = AMNDSS.user.group_layers;

            // Add each group of layers to the map
            for (var i = 0; i < groups.length; i++) {
                var group = groups[i];
                var layers = group.layers;

                // Create array of layer names
                var layer_names = [];

                for (var j = 0; j < layers.length; j++) {
                    var layer = layers[j];
                    layer_names.push(layer.layer_name);
                }

                // Create new WMS layer object with all the param information
                var wms_layer = new OpenLayers.Layer.WMS(
                group.group_name, "../wms_layers/private/?", {
                    layers: layer_names,
                    transparent: 'true',
                    format: 'image/gif',
                    //srs: 'epsg:4326'
                    srs: 'epsg:900913'
                },
                {
                    visibility: false,
                    isBaseLayer: false,
                    transparent: 'true'
                });
                this.map.addLayer(wms_layer);
            }
        },

        _initPrivateLayersFail: function () {
            Ext.Msg.alert('Layer error', 'Problems where encountered when loading layers for your user group. Please contact an administrator if this happens again');
        },

        _initMap: function (mapdiv) {
            OpenLayers.IMAGE_RELOAD_ATTEMPTS = 5;
            // avoid pink tiles
            OpenLayers.Util.onImageLoadErrorColor = "transparent";

            //this.internalProjection = new OpenLayers.Projection("EPSG:4326");
            this.internalProjection = new OpenLayers.Projection("EPSG:900913");
            this.externalProjection = new OpenLayers.Projection("EPSG:" + AMNDSS.spatialReferenceID);

            this.geojson = new OpenLayers.Format.GeoJSON({
                'internalProjection': this.internalProjection,
                'externalProjection': this.externalProjection
            });
            this.wkt = new OpenLayers.Format.WKT({
                'internalProjection': this.internalProjection,
                'externalProjection': this.externalProjection
            });

            //
            // Setup projection, zoom levels, unit, extents, etc
            //
            // specify custom centre point based on FN group...
            var groups = AMNDSS.user.group_layers;
            var group = groups[0];
            var group_name = group.group_name;
            var mapLon = group.long_coord;
            var mapLat = group.lat_coord;
            var mapZoom = group.mapzoom;

            var projectionSphericalMercator = new OpenLayers.Projection("EPSG:900913");
            var projectionLatLong = new OpenLayers.Projection("EPSG:4326");

            var mapOptions = {
                projection: projectionSphericalMercator,
                displayProjection: projectionLatLong,
                units: "m",
                sphericalMercator: true,
                numZoomLevels: 20,
                maxExtent: new OpenLayers.Bounds(-180, -90, 180, 90).transform (projectionLatLong, projectionSphericalMercator),
                controls: []
            };

            var map;

            // Here we make our base map... the guts of the OL interface
            map = new OpenLayers.Map(mapdiv, mapOptions);

            // Loop through each layer in the list and get the order value for each
            // Note: The order corresponds to the REVERSE order in which the layers 
            // display in the legend.
            
            var by_order = {}, order, layer;
            for (var name in AMNDSS.LayerList) {
                layer = AMNDSS.LayerList[name];
                //console.log(layer);
                if (layer.active) {
                    order = layer.order || 0;
                    if (by_order[order]) {
                        by_order[order].push(layer);
                    } else {
                        by_order[order] = [layer];
                    }
                }
            }

            // sort the layer list based on the order attribute
            var orders = Object.keys(by_order);
            orders.sort();

            // OpenStreetMap base layer (appears but other WMS layers won't load on it)
            var osmarender = new OpenLayers.Layer.OSM("OpenStreetMap", "http://c.tile.openstreetmap.org/${z}/${x}/${y}.png");
            map.addLayer(osmarender);
  
            // add each layer in the correct order
            for (var i = 0; i < orders.length; i++) {
                map.addLayers(by_order[orders[i]]);
            }
            
            // centre on the coordinates specified above (based on the FN)
            map.setCenter(new OpenLayers.LonLat(mapLon, mapLat).transform (projectionLatLong, projectionSphericalMercator), mapZoom);
            
            // create reference map 
            map.addControl(new OpenLayers.Control.OverviewMap({
                div: Ext.get('referenceMap'),
                size: new OpenLayers.Size(338, 140)
            }));

            // GNG 25June09
            // handles map browsing with mouse events 
            // (dragging, double-clicking, and scrolling the wheel)
            map.addControl(new OpenLayers.Control.Navigation());

            //Add OL map to Ext component
            this.map_component = new AMNDSS.OLMapComponent({
                map: map
            });

            this.map_component.addEvents({
                "shapeAdded": true,
                "shapeModified": true
            });
            return map;
        },

        _initControls: function () {

            my_shapes_vector_layer = new OpenLayers.Layer.Vector(
                    "Vector Layer",
                    {
                        displayInLayerSwitcher: false
                    },
                    {
                        visibility: true
                    }
                ),

            
            this.ed_vectors = my_shapes_vector_layer;
            
            // One layer that can be used to show a single shape from the users cache
            var defaultStyle = OpenLayers.Util.extend({},
            OpenLayers.Feature.Vector.style["default"]);
            
            var selectStyle = OpenLayers.Util.extend({},
            OpenLayers.Feature.Vector.style["select"]);
            
            var styleMap = new OpenLayers.StyleMap({
                'default': OpenLayers.Util.extend(defaultStyle, {
                    fillColor: "red",
                    fillOpacity: 0.5,
                    strokeColor: "black"
                }),
                'select': selectStyle
            });

            this.userShapesFilter = new OpenLayers.Filter.FeatureId({
                fids: []
            });
            this.userShapesRule = new OpenLayers.Rule({
                filter: this.userShapesFilter
            });
            styleMap.styles['default'].addRules([this.userShapesRule]);

            this.userShapesLayer = new OpenLayers.Layer.Vector("My Shapes", {
                projection: new OpenLayers.Projection("EPSG:" + AMNDSS.spatialReferenceID),
                displayInLayerSwitcher: false,
                styleMap: styleMap
            });

            // The select feature tool.
            selectTool = new OpenLayers.Control.SelectFeature(this.userShapesLayer, {
                'multiple': true,
                title: 'Select a Feature'
            });
            var onSelect = function (feature) {
                popup = new OpenLayers.Popup.Anchored("Select Popup", feature.geometry.getBounds().getCenterLonLat(), new OpenLayers.Size(250, 75), "<div style='font-size:.8em'>Feature: " + feature.id + "<br />Area: " + feature.geometry.getArea() + "</div>", null, true);
                feature.popup = popup;
                this.map.addPopup(popup);
                var json = this.geojson.write(feature, true);
            };
            selectTool.onSelect = onSelect.createDelegate(this);

            var onUnselect = function (feature) {
                this.map.removePopup(feature.popup);
                feature.popup.destroy();
                feature.popup = null;
            };

            selectTool.onUnselect = onUnselect.createDelegate(this);

            this.map.addLayers([this.userShapesLayer, this.ed_vectors]);

            // Add the mouse position control
            this.map.addControl(new OpenLayers.Control.ScaleLine());
            this.map.addControl(new OpenLayers.Control.Scale());
            this.map.addControl(new OpenLayers.Control.MousePosition());

            // Start setting up the editing tools
            var editingTools = Ext.get('editingTools');
            this.editingToolbar = new OpenLayers.Control.Panel();

            // And the navigation tools
            var basicTools = Ext.get('basicTools');
            this.basicToolbar = new OpenLayers.Control.Panel({
                div: basicTools
            });

            // And the selection tools
            var selectTools = Ext.get('selectTools');
            this.selectToolbar = new OpenLayers.Control.Panel({
                div: selectTools
            });

            this.polygonTool = new OpenLayers.Control.DrawFeature(this.ed_vectors, OpenLayers.Handler.Polygon, {
                title: 'Draw a Polygon',
                'displayClass': 'olControlDrawFeaturePolygon'
            });
            this.editingToolbar.addControls(this.polygonTool);

            // Individual tools.
            // Starting with the drag tool
            dragTool = new OpenLayers.Control.DragFeature(this.userShapesLayer, {
                title: 'Drag a Feature'
            });

            var onComplete = function (feature) {
                var json = this.geojson.write(feature, true);
            };

            dragTool.onComplete = onComplete.createDelegate(this);

            // Now the modify feature tool.
            modifyTool = new OpenLayers.Control.ModifyFeature(this.userShapesLayer, {
                title: 'Modify a Feature'
            });
            var onModification = function (feature) {
                var json = this.geojson.write(feature, true);
                this.map_component.fireEvent("shapeModified", feature);
            };
            modifyTool.onModification = onModification.createDelegate(this);

            // The select feature tool.
            selectTool = new OpenLayers.Control.SelectFeature(this.userShapesLayer, {
                'multiple': false,
                title: 'Select a Feature',
                'displayClass': 'olControlHover'
            });
            var onSelectPop = function (feature) {
                popup = new OpenLayers.Popup.Anchored("Select Popup", feature.geometry.getBounds().getCenterLonLat(), new OpenLayers.Size(250, 75), "<div style='font-size:.8em'>Feature: " + feature.id + "<br />Area: " + feature.geometry.getArea() + "</div>", null, true);
                feature.popup = popup;
                this.map.addPopup(popup);
                var json = this.geojson.write(feature, true);
            };

            selectTool.onSelect = onSelectPop.createDelegate(this);

            this.onFeatureInsert = function (feature) {
                this.map_component.fireEvent("shapeAdded", feature);
            };

            this.ed_vectors.onFeatureInsert = this.onFeatureInsert.createDelegate(this);

            this.getFeaturesResponse = function (response) {
                //Ext.get('info').innerHTML = response.responseText + "\r\n";
            };

            this.ed_vectors.getFeaturesResponse = this.getFeaturesResponse.createDelegate(this);

            this.defaultFail = function (response) {
                //Ext.get('info').innerHTML = "Failure Returned \r\n";
            };

            this.ed_vectors.defaultFail = this.defaultFail.createDelegate(this);

            panControl = new OpenLayers.Control.DragPan({
                title: 'Pan Map',
                'displayClass': 'olControlNavigation'
            });
            inControl = new OpenLayers.Control.ZoomBox({
                title: 'Zoom In',
                'out': false,
                'displayClass': 'olControlZoomBox'
            });
            outControl = new OpenLayers.Control.ZoomBox({
                title: 'Zoom Out',
                'out': true,
                'displayClass': 'olControlZoomBoxOut'
            });

            // GNG: The order of these controls need to be reversed for the current version of ExtJS:
            //this.basicToolbar.addControls([panControl,inControl,outControl,selectTool]);
            // Like this: 
            this.basicToolbar.addControls([selectTool, outControl, inControl, panControl]);

            // Basic query from the navigation tools
            OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {
                defaultHandlerOptions: {},
                initialize: function (options) {
                    this.handlerOptions = OpenLayers.Util.extend({},
                    this.defaultHandlerOptions);
                    OpenLayers.Control.prototype.initialize.apply(this, arguments);
                    this.handler = new OpenLayers.Handler.Click(this, {
                        'click': this.onClick
                    },
                    this.handlerOptions);
                },
                onClick: function (evt) {
                    var lon = this.map.getLonLatFromPixel(evt.xy).lon;
                    var lat = this.map.getLonLatFromPixel(evt.xy).lat;
                    var params = 'format=GeoJSON&bbox=' + (lon - 0.05) + ',' + (lat - 0.05) + ',' + (lon + 0.05) + ',' + (lat + 0.05);
                    var msg = 'pause ' + lon + ' ' + lat + ' ' + params;
                    var url = '/webmap/featureserver/featureserver.cgi/amnusers?';
                    var request = new OpenLayers.Ajax.Request(url + params, {
                        method: 'get',
                        onSuccess: this.getFeaturesResponse,
                        onFailure: this.defaultFail
                    });
                    var a = 1;
                },
                getFeaturesResponse: function (response) {
                    //var g = new OpenLayers.Format.GeoJSON();
                    //var features =  g.read(response.responseText);
                    //if (features && features.length) {
                    //Ext.get('info').innerHTML = "";
                    //for(var i = 0; i < features.length; i++) {
                    //Ext.get('info').innerHTML += g.write(features[i], true);
                    //}
                    //}
                },
                defaultFail: function (response) {
                    //Ext.get('info').innerHTML = "Failure Returned \r\n";
                }
            });

            // Add the controls to the map itself
            this.map.addControl(this.basicToolbar);
            this.map.addControl(this.editingToolbar);
            this.map.addControl(this.selectToolbar);

            for (var i = 0; i < this.basicToolbar.controls.length; i++) {
                if (this.basicToolbar.controls[i].events) {
                    this.basicToolbar.controls[i].events.on({
                        "activate": this.turnOffAllTools,
                        scope: this
                    });
                    this.basicToolbar.controls[i].deactivate();
                }
            }

            for (var i = 0; i < this.editingToolbar.controls.length; i++) {
                if (this.editingToolbar.controls[i].events) {
                    this.editingToolbar.controls[i].events.on({
                        "activate": this.turnOffAllTools,
                        scope: this
                    });
                    this.editingToolbar.controls[i].deactivate();
                }
            }
            for (var i = 0; i < this.selectToolbar.controls.length; i++) {
                if (this.selectToolbar.controls[i].events) {
                    this.selectToolbar.controls[i].events.on({
                        "activate": this.turnOffAllTools,
                        scope: this
                    });
                    this.selectToolbar.controls[i].deactivate();
                }
            }
            // Activate the pan tool.
            this.basicToolbar.activateControl(this.basicToolbar.controls[0]);
        },

        turnOffAllTools: function (evt) {
            var obj = evt.object;
            var basic = this.basicToolbar;
            var editing = this.editingToolbar;
            var select = this.selectToolbar;
            for (var control in basic.controls) {
                if ((basic.controls[control] != obj) && (basic.controls[control].active)) {
                    // Need to turn off the active controls that are not the newly
                    // Selected one...
                    basic.controls[control].deactivate();
                }
            }

            for (control in editing.controls) {
                if ((editing.controls[control] != obj) && (editing.controls[control].active)) {
                    // Need to turn off the active controls that are not the newly
                    // Selected one...
                    editing.controls[control].deactivate();
                }
            }

            for (control in select.controls) {
                if ((select.controls[control] != obj) && (select.controls[control].active)) {
                    // Need to turn off the active controls that are not the newly
                    // Selected one...
                    select.controls[control].deactivate();
                }
            }
        },

        onPause: function (evt) {
            //function onPause(evt) {
            //Ext.get('info').innerHTML = "Pause";
        },

        feature_info: function (feature) {
            var x = 1;
            var html = "<ul>";
            for (var i in feature.attributes) {
                html += "<li><b>" + i + "</b>: " + feature.attributes[i] + "</li>";
            }
            html += "</ul>";
        },

        addUserShapesLayer: function () {
            // One layer that can be used to show a single shape from the users cache
            this.userShapesLayer = new OpenLayers.Layer.Layer("Selected User Shape", {
                projection: new OpenLayers.Projection("EPSG:" + AMNDSS.spatialReferenceID),
                displayInLayerSwitcher: true
            });
            this.map.addLayer(this.userShapesLayer);

            // The select feature tool.
            selectTool = new OpenLayers.Control.SelectFeature(this.userShapesLayer, {
                'multiple': true,
                title: 'Select a Feature'
            });

            var onSelect = function (feature) {
                popup = new OpenLayers.Popup.Anchored("Select Popup", feature.geometry.getBounds().getCenterLonLat(), new OpenLayers.Size(250, 75), "<div style='font-size:.8em'>Feature: " + feature.id + "<br />Area: " + feature.geometry.getArea() + "</div>", null, true);
                feature.popup = popup;
                this.map.addPopup(popup);
                var json = this.geojson.write(feature, true);
                document.getElementById('info').innerHTML = json;
            };
            selectTool.onSelect = onSelect.createDelegate(this);
            this.selectToolbar.addControls(selectTool);
        },

        getJSONState: function () {
            var mapLayers = {};
            var layers = this.map.layers;
            var activelayers = [];
            // First loop through and find the WMS layers
            for (i in layers) {
                if (! (layers[i] instanceof OpenLayers.Layer.WMS)) continue;
                if (!layers[i].getVisibility()) continue;
                if (!layers[i].calculateInRange()) continue;
                if (! (layers[i].params["LAYERS"] instanceof Array)) {
                    layers[i].params["LAYERS"] = [layers[i].params["LAYERS"]];
                }
                activelayers[activelayers.length] = {
                    name: layers[i].name,
                    params: layers[i].params,
                    opacity: layers[i].opacity,
                    projection: layers[i].projection.projCode,
                    units: layers[i].units,
                    url: layers[i].url,
                    visibility: layers[i].visibility
                };
            }
            // Now the user shapes layer we grab the shape ID's
            var grid = Ext.getCmp('userLayerGrid');
            var ids = "";
            var selections = [];
            var store = grid.getStore();

            for (var i = 0; i < store.getCount(); i++) {
                if (store.getAt(i).get('selected')) {
                    selections.push(store.getAt(i).data.id);
                }
            }
            var objNote = {
                mapID: this.map.id,
                extent: this.map.getExtent(),
                mapLayers: activelayers,
                vectorLayers: selections
            };
            var jsonNote = Ext.util.JSON.encode(objNote);
            return jsonNote;
        },

        get_user_shape_by_fid: function (id) {
            var feature_match = null;
            var features = this.userShapesLayer.features;
            for (var i = 0; i < features.length; ++i) {
                //fid is id returned by featureserver
                if (features[i].fid == id) {
                    feature_match = features[i];
                    break;
                }
            }
            return feature_match;
        },

        // This is a hack used my shapes. The problem is the my shapes data store is
        // maintained separately from the layer on the map. The my shapes may
        // contain shapes that the map layer doesn't. This is because the
        // layer is updated at various times. So instead I have my places pass the
        // GeoJSON structure from its data store, create a temporary vector from it,
        // get its bbox bounds, then destroy it when I'm done.
        zoom_to_user_shape: function (shape) {
            var real_shape = this.wkt.read(shape); //real_shape_arr[0];
            var bounds = real_shape.geometry.getBounds();
            this.map.zoomToExtent(bounds);
        }
    };
    obj._init(mapdiv);
    return obj;
};
