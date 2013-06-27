/********** RectifyMap Class **********/
//Constructor
AMNDSS.RectifyMap = function (mapdiv, imagediv) {
    this.addEvents({
        "gcp_started": true,
        "gcp_end": true
    });

    this.mapdiv = mapdiv;
    this.imagediv = imagediv;

    var groups = AMNDSS.user.group_layers;
    var group = groups[0];

    var latlon_lon = group.long_coord;
    var latlon_lat = group.lat_coord;
    var latlon_zoom = group.mapzoom;

    //MouseDefaults is deprecated in 2.4 and will be removed by 3.0
    var mouseDefaults = new OpenLayers.Control.MouseDefaults();
    //var mouseDefaults = new OpenLayers.Control.Navigation();
    mouseDefaults.defaultDblClick = function () {
        return true;
    };

    var latlon_options = {
        projection: "EPSG:4326",
        units: "dd",
        numZoomLevels: 20,
        maxExtent: new OpenLayers.Bounds(-180, -90, 180, 90),
        controls: [mouseDefaults, new OpenLayers.Control.PanZoomBar()]
    };

    // This is the reference map
    this.map = new OpenLayers.Map(mapdiv, latlon_options);

    // Loop through all the rectifier layers in the database and 
    // the base layers, first...
    for (var name in AMNDSS.LayerListRectifier) {
        layer = AMNDSS.LayerListRectifier[name];
        if (layer.isBaseLayer) {
            this.map.addLayer(layer);
        }
    }

    // set up some map-specific stuff
    this.map.setCenter(new OpenLayers.LonLat(latlon_lon, latlon_lat), latlon_zoom);
    this.map.addControl(new OpenLayers.Control.MousePosition());
    this.map.addControl(new OpenLayers.Control.ScaleLine());
    this.map.addControl(new OpenLayers.Control.Scale());

    // Now loop through all the rectifier layers in the database and 
    // the ones that are used as overlays... (i.e. not set as base layers)
    for (var name in AMNDSS.LayerListRectifier) {
        layer = AMNDSS.LayerListRectifier[name];
        if (!layer.isBaseLayer) {
            this.map.addLayer(layer);
        }
    }

    ed_vectors = new OpenLayers.Layer.Vector("Vector Layer", {
        displayInLayerSwitcher: false
    }, {
        visibility: true
    });

    this.map.addLayer(ed_vectors);

    switcher = new OpenLayers.Control.LayerSwitcher();

    this.map.addControl(switcher);

    switcher.maximizeControl();

    this.ref_markers = new OpenLayers.Layer.Markers("Markers");
    this.map.addLayer(this.ref_markers);
    this.map.events.register("dblclick", this, this.addGCP2);

    geojson = new OpenLayers.Format.GeoJSON();

    //Add OL map to Ext component
    this.map_component = new AMNDSS.OLMapComponent({
        map: this.map
    });
};

/********** RectifyMap Class Extensions **********/

Ext.extend(AMNDSS.RectifyMap, Ext.util.Observable, {
    //Create map and display user image
    addImage2Rectify: function (data) {
        //Get rid of default double click handler
        //MouseDefaults is deprecated in 2.4 and will be removed by 3.0
        var mouseDefaults = new OpenLayers.Control.MouseDefaults();
        //var mouseDefaults = new OpenLayers.Control.Navigation();
        mouseDefaults.defaultDblClick = function () {
            return true;
        };

        var mapimage_options = {
            controls: [mouseDefaults, new OpenLayers.Control.PanZoomBar()],
            maxExtent: new OpenLayers.Bounds(0, 0, data.width, data.height),
            numZoomLevels: 6
        };

        this.mapimage = new OpenLayers.Map(this.imagediv, mapimage_options);
        this.mapimage.addControl(new OpenLayers.Control.MousePosition());
        this.mapimage.addControl(new OpenLayers.Control.LayerSwitcher());

        this.img_lyr = new OpenLayers.Layer.Image('Uploaded Image', '../referral/image/orig/' + data.id, new OpenLayers.Bounds(0, 0, data.width, data.height), new OpenLayers.Size(data.width, data.height), {
            numZoomLevels: 6
        });
        this.img_markers = new OpenLayers.Layer.Markers("Markers");
        this.img_markers_dict = {};
        this.mapimage.addLayers([this.img_lyr, this.img_markers]);

        this.mapimage.zoomToMaxExtent();

        this.mapimage.events.register("dblclick", this, this.addGCP);
        this.mapimage_component = new AMNDSS.OLMapComponent({
            map: this.mapimage
        });
    },

    addGCP: function (e) {
        var pix_loc = this.mapimage.getLonLatFromViewPortPx(e.xy);
        this.fireEvent("gcp_started", {
            loc: pix_loc
        });
    },

    addGCP2: function (e) {
        var pix_loc = this.map.getLonLatFromViewPortPx(e.xy);
        this.fireEvent("gcp_end", {
            loc: pix_loc
        });
    },

    createFeature: function (pix_loc) {
        return new OpenLayers.Feature(this.img_lyr, pix_loc);
    },

    addImageMarker: function (img_feat) {
        var id = img_feat.id;
        var marker = img_feat.createMarker();
        this.img_markers.addMarker(marker);
        img_feat.myMarker = marker;
    },

    removeLocation: function (id) {
        alert("removeLocation pressed with ID = " + id);
        this.ref_markers.removeMarker(this.img_markers_dict[id]);
    },

    addRefMarker: function (ref_feat) {
        var id = ref_feat.id;
        var marker = ref_feat.createMarker();
        this.ref_markers.addMarker(marker);
        ref_feat.myMarker = marker;
    },

    togglePopup: function (evt) {
        this.toggle();
        OpenLayers.Event.stop(evt);
    },

    getImgMarkerLyr: function () {
        return this.img_markers;
    },

    getImgLyr: function () {
        return this.img_lyr;
    },

    onPause: function (evt) {
        Ext.get('info').innerHTML = "Pause";
    },

    feature_info: function (feature) {
        var x = 1;
        var html = "<ul>";
        for (var i in feature.attributes) {
            html += "<li><b>" + i + "</b>: " + feature.attributes[i] + "</li>";
        }
        html += "</ul>";
        Ext.get('info').innerHTML = html;
    }
});

/********** Rectifier Class **********/

//Constructor
AMNDSS.Rectifier = function (parent) {
    this.features = [];
    this.featuresArray = [];
    this.img_markers = null;
    this.gcpBeingEdited = null;
    this.parent = parent;

    var mapdiv = 'rectifymap';
    var imagediv = 'rectifyimage';

    this.image_data = {
        filename: "133536460_orig.png",
        height: 772,
        width: 1066
    };

    //Add OL map to Dom element
    this.rectify_maps = new AMNDSS.RectifyMap(mapdiv, imagediv);
    this.rectify_maps.on("gcp_started", this.startGcp, this);
    this.rectify_maps.on("gcp_end", this.finishGcp, this);
};

/********** Rectifier Class Extensions **********/

Ext.extend(AMNDSS.Rectifier, Ext.util.Observable, {
    initLayout: function () {
        var upload_button = {
            xtype: 'button',
            text: 'Upload New Image',
            minWidth: 170,
            type: 'submit',
            listeners: {
                'click': {
                    fn: this.doImage2RectifyUpload,
                    scope: this
                }
            }
        };

        var cancel_button = new Ext.Button({
            xtype: 'button',
            text: 'Cancel',
            listeners: {
                'click': {
                    fn: this.cancelImage2RectifyUpload,
                    scope: this
                }
            }
        });
        var csrf_token = Ext.query('input[name="csrfmiddlewaretoken"]')[0];
        this.rect_upload_form = new Ext.form.FormPanel({
            id: 'rect-upload-form',
            frame: false,
            border: false,
            bodyStyle: 'padding:5px 5px 0',
            defaultType: 'textfield',
            fileUpload: true,
            html: '<b>Please ensure the image is under 1 MB in size and is in .jpg/.jpeg format.</b>',
            items: [{
                xtype: 'textfield',
                fieldLabel: 'Title',
                name: 'title',
                width: 150
            }, {
                xtype: 'textfield',
                fieldLabel: 'Image (jpg/jpeg)',
                name: 'image',
                inputType: 'file'
            }, {
                xtype: 'hidden',
                name: 'csrfmiddlewaretoken',
                value: csrf_token && csrf_token.value
            }],
            buttons: [
            upload_button, cancel_button]
        });

        this.defaultButton = new Ext.Button({
            xtype: 'button',
            id: 'default-button',
            text: 'Load Default Image',
            listeners: {
                'click': {
                    fn: this.loadDefaultImage,
                    scope: this
                }
            }
        });

        this.resetRectifierButton = new Ext.Button({
            xtype: 'button',
            minWidth: 170,
            id: 'rectifyZero',
            tooltip: 'Reset the rectifier including GCP\'s and uploaded images',
            text: 'Reset Rectifier',
            listeners: {
                'click': {
                    fn: this.rectifyZero,
                    scope: this
                }
            }
        });

        this.zoomToLocationButton = {
            xtype: 'button',
            minWidth: 170,
            text: 'Zoom To Location',
            tooltip: 'Zoom to a specific location on the reference map',
            type: 'submit',
            listeners: {
                'click': {
                    fn: this.zoom_load,
                    scope: this
                }
            }
        };

        this.uploadRawButton = new Ext.Button({
            xtype: 'button',
            minWidth: 170,
            id: 'rectifyOne',
            tooltip: 'Upload a new image for georeferencing and rectification',
            text: 'Upload New Image',
            listeners: {
                'click': {
                    fn: this.rectifyOne,
                    scope: this
                }
            }
        });

        this.rectifyButton = new Ext.Button({
            xtype: 'button',
            minWidth: 170,
            id: 'rectifyTwo',
            tooltip: 'Rectify your image once you\'ve added ground control points',
            text: 'Rectify Image',
            disabled: true,
            listeners: {
                'click': {
                    fn: this.rectifyTwo,
                    scope: this
                }
            }
        });

        this.helpButton = new Ext.Button({
            xtype: 'button',
            text: 'Help',
            minWidth: 170,
            listeners: {
                'click': {
                    fn: function () {
                        amndsslayoutinstance.launchHelp();
                    }
                }
            }
        });

        this.selectGCPPair = function (selectionModel, rowIndex, record) {
            var featureId = record.get('id');
            // In the future we can select the marker (make it a diff color)
            // when selected from the list
        };

        this.unselectGCPPair = function (selectionModel, rowIndex, record) {
            var featureId = record.get('id');
            // In the future we can unselect the marker (make it a diff color)
            // when unselected from the list
        };

        var test_data = [
            [1, 4, 46, -120, 56],
            [2, 8, 23, -121, 57]
        ];

        // create the data store
        var gcp_fields = [{
            name: 'id',
            type: 'float'
        }, {
            name: 'xp',
            type: 'float'
        }, {
            name: 'yp',
            type: 'float'
        }, {
            name: 'xr',
            type: 'float'
        }, {
            name: 'yr',
            type: 'float'
        }];

        this.gcpStore = new Ext.data.SimpleStore({
            fields: gcp_fields
        });

        //Compare checkbox columns
        var gcpSelectionModel = new Ext.grid.CheckboxSelectionModel();
        gcpSelectionModel.on("rowselect", this.selectGCPPair, this);
        gcpSelectionModel.on("rowdeselect", this.unselectGCPPair, this);

        var gcpColumnModel = new Ext.grid.ColumnModel([
        gcpSelectionModel,
        //{header:'ID',dataIndex:'id',width:60,sortable:true},
        {
            header: "Ximg",
            width: 75,
            dataIndex: 'xp'
        }, {
            header: "Yimg",
            width: 75,
            dataIndex: 'yp'
        }, {
            header: "Xref",
            width: 75,
            dataIndex: 'xr'
        }, {
            id: 'yr',
            header: "Yref",
            width: 75,
            dataIndex: 'yr'
        }]);

        this.removeGCP = function () {
            // Here we grab the selected GCP's and delete them
            //alert("Removing GCPs");
            var selections = this.gcpGrid.getSelectionModel().getSelections();
            var num_selections = selections.length;
            for (var i = 0; i < selections.length; i++) {
                var markers = selections[i].markers;
                this.rectify_maps.img_markers.removeMarker(markers[0].myMarker);
                this.rectify_maps.ref_markers.removeMarker(markers[1].myMarker);
                this.gcpStore.remove(selections[i]);
            }
            if (this.gcpStore.getCount() < 3) {
                this.rectifyButton.disable();
            }
        };

        // create the Grid
        this.gcpGrid = new Ext.grid.GridPanel({
            store: this.gcpStore,
            cm: gcpColumnModel,
            sm: gcpSelectionModel,
            stripeRows: true,
            height: 100,
            columnWidth: 0.4,
            autoExpandColumn: 'yr',
            title: 'Ground Control Points',
            tbar: [{
                xtype: 'button',
                text: 'Remove Selected GCP(s)',
                type: 'submit',
                listeners: {
                    'click': {
                        fn: this.removeGCP,
                        scope: this
                    }
                }
            }]
        });
        this.gcpRecord = Ext.data.Record.create(gcp_fields);

        this.gcpPanelButtons = new Ext.Panel({
            xtype: 'panel',
            border: false,
            frame: false,
            columnWidth: 0.6,
            bodyStyle: 'padding-left:8px;padding-top:8px;padding-right:10px',
            defaults: {
                // applied to each contained panel
                cls: 'form-button'
            },

            layout: 'table',
            layoutConfig: {
                // The total column count must be specified here
                columns: 2
            },
            items: [{
                html: '<b>Instructions</b>',
                border: false,
                frame: false
            },
            this.helpButton,
            {
                html: '<b>Step 1.</b>',
                border: false,
                frame: false
            },
            this.uploadRawButton,
            {
                html: '<b>Step 2. (Optional)</b>',
                border: false,
                frame: false
            },
            this.zoomToLocationButton,
            {
                html: '<b>Step 3. Add GCP\'s starting with image</b>',
                border: false,
                frame: false
            }, {
                html: '',
                border: false,
                frame: false
            }, {
                html: '<b>Step 4.</b>',
                border: false,
                frame: false
            },
            this.rectifyButton,
            {
                html: '<b>Start Over</b>',
                border: false,
                frame: false
            },
            this.resetRectifierButton]
        });
        var gcpPanel = new Ext.Panel({
            xtype: 'panel',
            id: 'rectify-gcp-panel',
            region: 'north',
            height: 160,
            split: true,
            layout: 'column',
            border: true,
            items: [this.gcpPanelButtons, this.gcpGrid]
        });

        var baseMap = new Ext.Panel({
            xtype: 'panel',
            title: 'Reference Map',
            id: 'rectifymappanel',
            region: 'center',
            layout: 'fit',
            items: [{
                id: 'rectifymapdiv',
                contentEl: 'rectifymap',
                region: 'center'
            }]
        });

        var rawImage = new Ext.Panel({
            xtype: 'panel',
            title: 'Unreferenced Image',
            id: 'rectifyimagepanel',
            split: true,
            region: 'west',
            width: 500,
            layout: 'fit',
            items: [{
                id: 'rectifyimagediv',
                contentEl: 'rectifyimage',
                region: 'center'
            }]
        });

        this.layout = new Ext.Panel({
            xtype: 'panel',
            id: 'rectifytabComp',
            title: 'Image Rectifier',
            layout: 'fit',
            style: 'padding:5px 5px 5px 5px',
            items: [{
                xtype: 'panel',
                id: 'rectifytabfit',
                layout: 'border',
                items: [
                rawImage, baseMap, gcpPanel]
            }]
        });
        return this.layout;
    },

    loadDefaultImage: function () {
        this.rectify_maps.addImage2Rectify(this.image_data);
    },

    rectifyZero: function () {
        //Destroy left map
        if (this.rectify_maps.mapimage) {
            this.rectify_maps.mapimage.destroy();
        }

        //Clear image from right map        
        if (this.newRectLayer) {
            this.rectify_maps.map.removeLayer(this.newRectLayer);
        }

        var num_selections = this.gcpStore.getCount();
        for (var i = 0; i < num_selections; i++) {
            var markers = this.gcpStore.getAt(i);
            this.rectify_maps.ref_markers.removeMarker(markers.markers[1].myMarker);
        }
        this.gcpStore.removeAll();
        if (this.gcpStore.getCount() < 3) {
            this.rectifyButton.disable();
        }
        this.features = [];
        this.featuresArray = [];
        this.img_markers = null;
        this.gcpBeingEdited = null;
        this.gcp1 = null;
        this.gcp1_added = null;
        this.gcp2 = null;
        this.gcp2_added = null;
    },

    rectifyOne: function () {
        if (!this.uploadWin) {
            this.uploadWin = new Ext.Window({
                id: 'rect_image_win',
                width: 360,
                height: 190,
                layout: 'fit',
                border: false,
                closable: false,
                title: 'Upload Image',
                iconCls: 'icon-upload',
                items: [this.rect_upload_form]
            });
        }
        this.rect_upload_form.getForm().reset();
        this.uploadWin.show();
    },

    zoom_load: function () {
        if (!this.zoomWin) {

            // add reference to zoom panels...
            this.zoom_form_address = new AMNDSS.AddressZoomPanel(this.rectify_maps.map);
            this.zoom_form_latlong = new AMNDSS.LatLongZoomPanel(this.rectify_maps.map);
            this.zoom_form_utm = new AMNDSS.UtmZoomPanel(this.rectify_maps.map);

            // create GUI wrappers
            this.findAddressWrap = new Ext.Panel({
                title: 'Address',
                style: 'padding-bottom:5px',
                ctCls: 'sub-sub-content-panel',
                items: this.zoom_form_address.getPanel(),
                border: false
            });

            this.findLatLonWrap = new Ext.Panel({
                title: 'Lat/Long Coordinate (Decimal Degrees)',
                items: this.zoom_form_latlong.getPanel(),
                style: 'padding-bottom:5px',
                border: false
            });

            this.findUtmWrap = new Ext.Panel({
                title: 'UTM Coordinate',
                items: this.zoom_form_utm.getPanel(),
                border: false
            });

            // create dialog window            
            this.zoomWin = new Ext.Window({
                id: 'zoom_win',
                title: 'Zoom to Location',
                border: false,
                resizeable: false,
                closable: false,
                items: [this.findAddressWrap, this.findLatLonWrap, this.findUtmWrap],
                buttonAlign: 'right',
                buttons: [{
                    text: 'Close',
                    listeners: {
                        'click': {
                            fn: function () {
                                this.zoomWin.hide();
                            },
                            scope: this
                        }
                    }
                }]
            });
        }

        this.zoom_form_address.findAddress.getForm().reset();
        this.zoom_form_latlong.findLatLon.getForm().reset();
        this.zoom_form_utm.zoom_panel.getForm().reset();
        this.zoomWin.show();
    },

    doImage2RectifyUpload: function () {
        //TODO: xhr request returns no response text...
        this.rect_upload_form.getForm().submit({
            url: '../referral/image/add/',
            method: 'POST',
            success: this.Image2RectifyUploadSuccess,
            failure: this.Image2RectifyUploadFail,
            scope: this,
            waitTitle: 'Uploading Image',
            waitMsg: 'Uploading and cataloging image...'
        });
    },

    cancelImage2RectifyUpload: function () {
        this.uploadWin.hide();
    },

    //Get the image information from the server so we can load it up
    Image2RectifyUploadSuccess: function (form, action) {
        Ext.Ajax.request({
            method: 'GET',
            url: '../referral/image/last/',
            success: this.newImageInfoSuccess.createDelegate(this),
            failure: this.newImageInfoFail.createDelegate(this)
        });
    },

    Image2RectifyUploadFail: function (form, action) {
        var res = Ext.util.JSON.decode(action.response.responseText);
        Ext.Msg.alert('Image Upload Failed', 'Your upload failed.  Problematic form items are shown in red.  Hover your mouse over the input fields to view the associated error message.');
    },

    //Parse the image info and load it in the raw image map
    newImageInfoSuccess: function (result) {
        var res = Ext.util.JSON.decode(result.responseText);
        this.uploadWin.hide();
        if (res) {
            this.image_data = {
                id: res.image.id,
                title: res.image.title,
                width: res.image.width,
                height: res.image.height
            };
            this.rectify_maps.addImage2Rectify(res.image);
        } else {
            Ext.Msg.alert('Image Upload Failed', 'Image information not returned from server, please try again or notify an administrator');
        }
    },

    newImageInfoFail: function () {
        Ext.Msg.alert('New Image Info Request Failed', 'A request for information on the newly uploaded image failed.  Please try again and notify an administrator if it continues to occur');
    },

    rectifyTwo: function () {
        Ext.Ajax.timeout = 120000;
        var gcp_data = this.getGcpData();
        if (!gcp_data || !this.image_data) {
            Ext.Msg.alert('Image Rectify Failed', 'You must first upload an image and create ground control points');
            return;
        }
        var gcp_obj = {
            "gcp_data": gcp_data
        };
        var the_params = {
            image_data: Ext.util.JSON.encode(this.image_data),
            gcp_data: Ext.util.JSON.encode(gcp_obj)
        };
        Ext.Ajax.request({
            method: 'GET',
            url: '../referral/image/rectify/' + this.image_data.id + '?',
            params: the_params,
            success: this.rectifySuccess.createDelegate(this),
            failure: this.rectifyFail.createDelegate(this)
        });
    },

    rectifySuccess: function (result) {
        this.newRectLayer = new OpenLayers.Layer.WMS('Rectified Image', "../referral/image/rectified/wms/" + this.image_data.id + "?", {
            layers: 'rectified_image',
            transparent: 'true',
            format: 'image/gif',
            srs: 'epsg:4326'
        }, {
            isBaseLayer: false,
            opacity: 0.8,
            singleTile: true
        });
        this.rectify_maps.map.addLayer(this.newRectLayer);
        amndsslayoutinstance.myPlaces.loadSingleUserImage(this.image_data);
    },

    rectifyFail: function (result) {
        //console.log('rectify failure');
        alert("rectify failure");
    },

    startGcp: function (pix_loc) {
        if (!this.gcp1_added) {
            var img_feat = this.rectify_maps.createFeature(pix_loc.loc);
            var id = img_feat.id;
            this.features[id] = img_feat;
            this.featuresArray.push(img_feat);
            this.rectify_maps.addImageMarker(img_feat);
            this.gcp1 = img_feat;
            this.gcp1_added = true;
            return id;
        } else {
            Ext.Msg.alert('', 'You have already created a ground control point (GCP) on the unreferenced image.  Create a 2nd GCP on the reference map to pair with it');
            return null;
        }
    },

    finishGcp: function (pix_loc) {
        if (this.gcp1_added) {
            var ref_feat = this.rectify_maps.createFeature(pix_loc.loc);
            var id = ref_feat.id;
            this.features[id] = ref_feat;
            this.featuresArray.push(ref_feat);
            this.rectify_maps.addRefMarker(ref_feat);
            this.gcp1_added = false;
            this.gcp2 = ref_feat;
            this.storeGcpPair(this.gcp1, this.gcp2);
        } else {
            Ext.Msg.alert('', 'You must first create a ground control point (GCP) on the unreferenced image.  Then add a matching GCP to the reference map.');
        }
    },

    storeGcpPair: function (feat1, feat2) {
        var gcp_prop = {
            xp: feat1.lonlat.lon,
            yp: feat1.lonlat.lat,
            xr: feat2.lonlat.lon,
            yr: feat2.lonlat.lat
        };
        var gcp_rec = new this.gcpRecord(gcp_prop);
        gcp_rec.markers = [feat1, feat2];
        this.gcpStore.add(gcp_rec);
        if (this.gcpStore.getCount() > 2) {
            this.rectifyButton.enable();
        }
    },

    //return array
    getGcpData: function () {
        var rec_data = [];
        var num_recs = this.gcpStore.getCount();
        if (num_recs < 1) {
            return null;
        }
        for (var e = 0; e < num_recs; e++) {
            rec_data.push(this.gcpStore.data.items[e].data);
        }
        return rec_data;
    }
});