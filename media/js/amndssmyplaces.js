AMNDSS.MyPlaces = function () {

    var obj = {

        _init: function () {

            var me = this;
            this.internalProjection = new OpenLayers.Projection("EPSG:4326");
            this.externalProjection = new OpenLayers.Projection("EPSG:" + AMNDSS.spatialReferenceID);
            this.wkt = new OpenLayers.Format.WKT({
                'internalProjection': this.internalProjection,
                'externalProjection': this.externalProjection
            });

            this.requestFail = function (resp) {
                //console.log("requestFail in amndssmyplaces.js");
            };

            this.launchReport = new AMNDSS.LaunchReport();
            this.uploadShapefile = new AMNDSS.UploadShapefile();

            this.setUserShapeVisibilityOn = function (selectionModel, rowIndex, record) {
                var featureId = record.get('id');
                var layer = amndsslayoutinstance.amndss_map_component.userShapesLayer;
                var filter = amndsslayoutinstance.amndss_map_component.userShapesFilter;
                for (var i = 0; i < layer.features.length; i++) {
                    if (layer.features[i].fid == featureId) {
                        filter.fids.push(layer.features[i].fid);
                        layer.redraw(true);
                        delaytsk = new Ext.util.DelayedTask(this.updateSelectedFeatures);
                        delaytsk.delay(500);
                        break;
                    }
                }
            };

            this.setUserShapeVisibilityOff = function (selectionModel, rowIndex, record) {
                var featureId = record.get('id');
                var layer = amndsslayoutinstance.amndss_map_component.userShapesLayer;
                var filter = amndsslayoutinstance.amndss_map_component.userShapesFilter;
                for (var i = 0; i < layer.features.length; i++) {
                    if (layer.features[i].fid == featureId) {
                        for (var ii = filter.fids.length - 1; ii >= 0; ii--) {
                            if (filter.fids[ii] == featureId) {
                                // Remove from the visibility list
                                filter.fids = OpenLayers.Util.removeItem(filter.fids, featureId);
                                // Now from the selected list if there...
                                if (record.data["selected"]) {
                                    this.unselectUserShape(selectionModel, rowIndex, record);
                                    record.set("selected", 0);
                                }
                                layer.redraw(true);
                                var delaytsk = new Ext.util.DelayedTask(this.updateSelectedFeatures);
                                delaytsk.delay(500);
                            }
                        }
                        break;
                    }
                }
            };

            this.delayedUpdateSelectedFeatures = function () {
                var delaytsk = new Ext.util.DelayedTask(this.updateSelectedFeatures);
                delaytsk.delay(1500);

            };

            this.updateSelectedFeatures = function () {
                var layer = amndsslayoutinstance.amndss_map_component.userShapesLayer;
                var grid = Ext.getCmp('userLayerGrid');
                var ids = "";
                var selections = [];
                var store = grid.getStore();
                for (var i = 0; i < store.getCount(); i++) {
                    if (store.getAt(i).get('selected')) {
                        selections.push(store.getAt(i));
                    }
                }
                // If we have some selections in My Shapes... we update
                if (selections.length) {
                    for (var i = 0; i < selections.length; i++) {
                        var featureId = selections[i].data.id;
                        // We find the features with the correct ID's that match
                        for (var ii = 0; ii < layer.features.length; ii++) {
                            if (layer.features[ii].fid == featureId) {
                                // We have a selected feature we need to make it selected
                                var selectStyle = "select";
                                layer.drawFeature(layer.features[ii], selectStyle);
                            }
                        }
                    }
                }
            };

            this.selectUserShape = function (selectionModel, rowIndex, record) {
                var featureId = record.get('id');
                var layer = amndsslayoutinstance.amndss_map_component.userShapesLayer;
                var thisFeature = null;
                var filter = amndsslayoutinstance.amndss_map_component.userShapesFilter;
                for (var i = 0; i < layer.features.length; i++) {
                    if (layer.features[i].fid == featureId) {
                        thisFeature = layer.features[i];
                        break;
                    }
                }
                if (thisFeature) {
                    // Finally add the checkbox for the item...
                    if (!record.data["visible"]) {
                        this.setUserShapeVisibilityOn(selectionModel, rowIndex, record);
                        record.set("visible", 1);
                    }
                    layer.selectedFeatures.push(thisFeature);
                    this.updateSelectedFeatures();
                    layer.events.triggerEvent("featureselected", {
                        feature: thisFeature
                    });
                }
            };

            this.unselectUserShape = function (selectionModel, rowIndex, record) {
                var featureId = record.get('id');
                var layer = amndsslayoutinstance.amndss_map_component.userShapesLayer;
                var thisFeature = null;
                for (var i = 0; i < layer.features.length; i++) {
                    if (layer.features[i].fid == featureId) {
                        thisFeature = layer.features[i];
                        break;
                    }
                }
                if (thisFeature) {
                    // Store feature style for restoration later
                    layer.drawFeature(thisFeature, "default");
                    if (OpenLayers.Util.indexOf(layer.selectedFeatures, thisFeature) != -1) {
                        OpenLayers.Util.removeItem(layer.selectedFeatures, thisFeature);
                    }
                    layer.events.triggerEvent("featureunselected", {
                        feature: thisFeature
                    });
                }
            };

            // A checkbox you can add to a column
            Ext.grid.CheckColumn = function (config) {
                Ext.apply(this, config);
                if (!this.id) {
                    this.id = Ext.id();
                }
                this.renderer = this.renderer.createDelegate(this);
            };

            Ext.grid.CheckColumn.prototype = {
                init: function (grid) {
                    this.grid = grid;
                    this.grid.on('render', function () {
                        var view = this.grid.getView();
                        view.mainBody.on('mousedown', this.onMouseDown, this);
                    }, this);
                },

                onMouseDown: function (e, t) {
                    if (t.className && t.className.indexOf('x-grid3-cc-' + this.id) != -1) {
                        e.stopEvent();
                        var index = this.grid.getView().findRowIndex(t);
                        var record = this.grid.store.getAt(index);
                        record.set(this.dataIndex, !record.data[this.dataIndex]);
                        if (this.dataIndex === "visible") {
                            // If we are setting visible, work on the select stuff
                            if (record.data[this.dataIndex]) {
                                amndsslayoutinstance.myPlaces.setUserShapeVisibilityOn(null, index, record);
                            } else {
                                amndsslayoutinstance.myPlaces.setUserShapeVisibilityOff(null, index, record);
                            }
                        } else if (this.dataIndex === "selected") {
                            // Work on the select stuff
                            if (record.data[this.dataIndex]) {
                                amndsslayoutinstance.myPlaces.selectUserShape(null, index, record);
                            } else {
                                amndsslayoutinstance.myPlaces.unselectUserShape(null, index, record);
                            }
                        }
                    }
                },

                renderer: function (v, p, record) {
                    p.css += ' x-grid3-check-col-td';
                    return '<div class="x-grid3-check-col' + (v ? '-on' : '') + ' x-grid3-cc-' + this.id + '">&#160;</div>';
                }
            };

            // custom column plugin example
            var checkColumnVisible = new Ext.grid.CheckColumn({
                header: "Visible",
                dataIndex: 'visible',
                width: 55
            });

            // custom column plugin example
            var checkColumnSelected = new Ext.grid.CheckColumn({
                header: "Select",
                dataIndex: 'selected',
                width: 55
            });

            // create the data store
            this.userShapeFields = [{
                name: 'selected',
                type: 'bool'
            }, {
                name: 'visible',
                type: 'bool'
            }, {
                name: 'id',
                type: 'integer'
            }, {
                name: 'description',
                type: 'string'
            }, {
                name: 'rts_id',
                type: 'string'
            }, {
                name: 'status_id',
                type: 'integer'
            }];

            this.userShapeDataStore = new Ext.data.SimpleStore({
                fields: this.userShapeFields
            });

            this.userShapeRecord = Ext.data.Record.create(this.userShapeFields);

            //Compare check box columns
            var userShapesSelectionModel = new Ext.grid.CheckboxSelectionModel({
                singleSelect: true
            });

            userShapesSelectionModel.on("rowselect", this.selectUserShape, this);
            userShapesSelectionModel.on("rowdeselect", this.unselectUserShape, this);

            AMNDSS.referralStatusOptions.push([-1, 'n/a']);
            this.userShapesColumnModel = new Ext.grid.ColumnModel([
            checkColumnSelected, checkColumnVisible,
            {
                header: 'ID',
                dataIndex: 'id',
                width: 40,
                sortable: true,
                renderer: function (value) {
                    return "<a title='Double click to view/edit meta data click to view/edit meta data and status' style='display:block'>" + value + "</a>";
                }
            }, {
                header: 'Land Use Activity Shape',
                dataIndex: 'description',
                width: 180,
                sortable: true,
                renderer: function (value) {
                    return "<a title='Double click to view/edit meta data' style='display:block'>" + value + "</a>";
                }
            }, {
                header: 'Status',
                dataIndex: 'status_id',
                width: 80,
                sortable: true,
                renderer: function (value) {
                    var out;
                    Ext.each(AMNDSS.referralStatusOptions, function (item) {
                        if (item[0] == value) out = item[1];
                    });
                    return "<a title='Double click to view/edit meta data' style='display:block'>" + out + "</a>";
                },
                editor: new Ext.form.ComboBox({
                    store: AMNDSS.referralStatusOptions,
                    typeAhead: true,
                    triggerAction: 'all',
                    selectOnFocus: true,
                    listeners: {
                        beforeshow: function (field) {

                            if (field.getValue() === -1) {
                                field.disable();
                            } else {
                                field.enable();
                            }

                        },
                        change: {
                            fn: function (field, new_val, old_val) {
                                var id = this.userLayerGrid.store.getAt(this.userLayerGrid.rowIndex).data.id;
                                Ext.Ajax.request({
                                    method: 'GET',
                                    url: "../referral/update_referral_shape_status/" + id + '/' + new_val,
                                    success: function () {
                                        new Ext.ux.ToastWindow({
                                            title: 'Save Complete',
                                            html: 'Land Use Info successfully updated.'
                                            //, iconCls: ''
                                        }).show(document);
                                    },
                                    failure: function (rsp) {
                                        console.warn(rsp)
                                    }
                                });
                            },
                            scope: this
                        }

                    }
                }, {
                    header: 'Proponent',
                    dataIndex: 'proponent_name',
                    width: 180,
                    sortable: true,
                    renderer: function (value) {
                        return "<a title='Double click to view/edit meta data' style='display:block'>" + value + "</a>";
                    }
                })

            }]);

            this.loadSavedUserShapes = function () {
                var fs_url = "../referral/get_referral_shapes/";
                Ext.Ajax.request({
                    method: 'GET',
                    url: fs_url,
                    success: this.loadSavedUserShapesResp.createDelegate(this),
                    failure: this.loadSavedUserShapesFail.createDelegate(this)
                });
            };

            this.loadSavedUserShapesResp = function (response) {
                var res = Ext.util.JSON.decode(response.responseText);
                var layer = amndsslayoutinstance.amndss_map_component.userShapesLayer;
                var loaded_user_shapes = [];

                //Clear data store
                var newUserShapeDataStore = new Ext.data.SimpleStore({
                    fields: this.userShapeFields
                });

                //Load saved maps into data store and OL vector layer
                for (var i = 0; i < res.features.length; i++) {
                    var feat = res.features[i];
                    var userShapeProp = {
                        'id': feat.id,
                        'description': feat.description,
                        'rts_id': feat.rts_id,
                        'edit_notes': feat.edit_notes,
                        'status_id': feat.status_id
                    };
                    var selections = [];
                    var store = this.userLayerGrid.getStore();
                    for (ii = 0; ii < store.getCount(); ii++) {
                        if ((store.getAt(ii).get('id') == feat.id) && store.getAt(ii).get('selected')) {
                            // We need to mark selected in new one
                            userShapeProp.selected = 1;
                        }
                        if ((store.getAt(ii).get('id') == feat.id) && store.getAt(ii).get('visible')) {
                            // We need to mark selected in new one
                            userShapeProp.visible = 1;
                        }
                    }

                    //Add vector for calculating bounds and for example zooming to shape
                    userShapeProp['shape'] = feat.poly;

                    // add the new vector to the loaded_user_shapes array
                    var feature = this.wkt.read(feat.poly);
                    feature.fid = feat.id;
                    loaded_user_shapes.push(feature);

                    var userShapeRec = new this.userShapeRecord(userShapeProp);
                    newUserShapeDataStore.add(userShapeRec);
                }

                // clear open layers layer before adding the new features
                layer.destroyFeatures();
                layer.addFeatures(loaded_user_shapes);

                this.userShapeDataStore = newUserShapeDataStore;
                this.userLayerGrid.reconfigure(this.userShapeDataStore, this.userShapesColumnModel);
                
                this.handlePermalink();

                var delaytsk = new Ext.util.DelayedTask(this.updateSelectedFeatures);
                delaytsk.delay(500);
            };

            this.loadSavedUserShapesFail = function (response) {};

            this.deleteSavedUserShape3 = function (response) {
                var res = Ext.util.JSON.decode(response.responseText);
                this.loadSavedUserShapes();
                amndsslayoutinstance.amndss_map_component.userShapesLayer.redraw();
            };

            this.deleteSavedUserShape2 = function (button, selections) {
                if (button == 'yes') {
                    var fs_url = "../referral/delete_referral_shape/";
                    for (var i = 0; i < selections.length; i++) {
                        var cur_id = selections[i].data.id;
                        var succ_func = null;
                        //Do something after last mpa is deleted
                        if (i == selections.length - 1) {
                            succ_func = this.deleteSavedUserShape3.createDelegate(this);
                        }
                        Ext.Ajax.request({
                            method: 'POST',
                            url: fs_url + '?',
                            params: {
                                id: cur_id
                            },
                            success: succ_func,
                            failure: this.requestFail
                        });
                    }
                }
            };

            this.deleteSavedUserShape = function () {
                //Get selected rows
                var selections = [];
                var store = this.userLayerGrid.getStore();
                for (var i = 0; i < store.getCount(); i++) {
                    if (store.getAt(i).get('selected')) {
                        selections.push(store.getAt(i));
                    }
                }
                var num_selections = selections.length;
                if (num_selections > 0) {
                    var msg = Ext.Msg.show({
                        title: 'Confirm',
                        closable: false,
                        msg: 'Are you sure you want to delete the ' + num_selections + ' selected shape(s)?',
                        buttons: Ext.Msg.YESNO,
                        //Call the next function with this message box in scope and the 2nd argument the selections in the grid
                        fn: this.deleteSavedUserShape2.createDelegate(this, [selections], 1),
                        icon: Ext.MessageBox.QUESTION
                    });
                }
            };

            this.reloadFromGrid = function () {
                this.loadSavedUserShapes();
                amndsslayoutinstance.amndss_map_component.userShapesLayer.redraw();
            };

            this.downloadUserShape = function () {
                // Grab all the ID's selected to send down to the server to dump and zip them up
                var grid = Ext.getCmp('userLayerGrid');
                var ids = "";
                var selections = [];
                var store = grid.getStore();
                for (var i = 0; i < store.getCount(); i++) {
                    if (store.getAt(i).get('selected')) {
                        selections.push(store.getAt(i));
                    }
                }
                if (selections.length) {
                    for (var i = 0; i < selections.length; i++) {
                        if (i === 0) {
                            ids = ids + selections[i].data.id;
                        } else {
                            ids = ids + "," + selections[i].data.id;
                        }
                    }
                    var shape_link = "<a href='../referral/shape/download/?output=shapefile&ids=" + ids + "' target='_blank'> ESRI shapefile </a>";
                    var kml_link = "<a href='../referral/shape/download/?output=kml&ids=" + ids + "' target='_blank'> KML file (for use in Google Earth)</a>";
                    var htmlToAdd = "<br/>" + shape_link + "<br/><br/>or...<br/><br/>" + kml_link;
                    var msg = Ext.Msg.show({
                        title: 'Download Shape',
                        msg: htmlToAdd,
                        buttons: Ext.Msg.OK
                    });

                } else {
                    // Warn the user that at least one shape from myshapes needs to be selected.
                    Ext.Msg.alert('Oops!', 'Please select one or more shapes from the MyShapes list to download.');
                }
            };

            this.zoomToMyShape = function () {
                //Get selected rows
                var selections = [];
                var store = this.userLayerGrid.getStore();
                for (var i = 0; i < store.getCount(); i++) {
                    if (store.getAt(i).get('selected')) {
                        selections.push(store.getAt(i));
                    }
                }
                var num_selections = selections.length;
                if (num_selections == 0) {
                    Ext.Msg.alert('Error', 'Please select a shape.');
                } else if (num_selections > 0) {
                    //Zoom to first shape selected
                    var selection = selections[0];
                    var cur_shape = selection.data.shape;

                    //This is a hack (Tim). See the comment in amndssol.js
                    amndsslayoutinstance.amndss_map_component.zoom_to_user_shape(cur_shape);
                }
            };

            this.editShapeMetaDataResp = function (response) {
                var res = Ext.util.JSON.decode(response.responseText);
            };

            /* edit the meta data entry for an existing shape */
            this.editMetaData = function (grid, rowIndex, e) {
                var form = amndsslayoutinstance.newShapeForm.getForm(),
                    panel = amndsslayoutinstance.newShapePanel,
                    record = this.userLayerGrid.store.getAt(rowIndex),
                    featureId, layer = amndsslayoutinstance.amndss_map_component.userShapesLayer,
                    filter = amndsslayoutinstance.amndss_map_component.userShapesFilter;
                panel.currentShapeId = record.data.id;

                // get the feature associated with the selected row.
                featureId = record.get('id');
                for (var i = 0; i < layer.features.length; i++) {
                    if (layer.features[i].fid == featureId) {
                        amndsslayoutinstance.newShapePanel.currentFeature = layer.features[i];
                        break;
                    }
                }

                form.reset();
                form.load({
                    url: "../referral/get_referral_shape_meta_data/" + record.data.id,
                    success: function (form, action) {
                        form.setValues(record.data);
                    },
                    failure: function (form, action) {
                        // the following line commented as the error message is not really required here
                        //Ext.Msg.alert("Load failed", action.result.errorMessage);
                    }
                });
                amndsslayoutinstance.newShapePanel.show();

            };

            this.userLayerGrid = new Ext.grid.EditorGridPanel({
                xtype: 'grid',
                id: 'userLayerGrid',
                region: 'center',
                ctCls: 'sub-panel',
                store: this.userShapeDataStore,
                autoScroll: true,
                clicksToEdit: 1,
                cm: this.userShapesColumnModel,
                plugins: [checkColumnVisible, checkColumnSelected],
                viewConfig: {
                    forceFit: true
                },
                tbar: [{
                    id: 'draw_shape',
                    text: 'Draw',
                    tooltip: 'Draw a new shape on the map',
                    minWidth: 20,
                    listeners: {
                        'click': {
                            fn: function () {
                                amndsslayoutinstance.amndss_map_component.polygonTool.activate();
                            },
                            scope: this
                        }
                    }
                }, {
                    id: 'upload_shape',
                    text: 'Upload',
                    tooltip: 'Upload shapes from a shapefile',
                    minWidth: 20,
                    listeners: {
                        'click': {
                            fn: this.uploadShapefile.getUploadShapefileFunction(),
                            scope: this.uploadShapefile
                        }
                    }
                }, {
                    id: 'refresh_saved',
                    text: 'Reload',
                    tooltip: 'Reload shapes',
                    minWidth: 20,
                    listeners: {
                        'click': {
                            fn: this.reloadFromGrid,
                            scope: this
                        }
                    }
                }, {
                    xtype: 'tbseparator'
                }, {
                    id: 'zoom_shape',
                    text: 'Zoom',
                    tooltip: 'Zoom map to selected shape',
                    minWidth: 20,
                    listeners: {
                        'click': {
                            fn: this.zoomToMyShape,
                            scope: this
                        }
                    }
                }, {
                    id: 'download_shape',
                    text: 'Download',
                    tooltip: 'Download selected shapes',
                    minWidth: 20,
                    listeners: {
                        'click': {
                            fn: this.downloadUserShape,
                            scope: this
                        }
                    }
                }, {
                    text: 'Report',
                    handler: this.launchReport.startLaunch,
                    tooltip: 'Create Land Use Activity Report',
                    scope: this
                }, {
                    id: 'delete_saved',
                    text: 'Delete',
                    tooltip: 'Delete selected shapes',
                    minWidth: 20,
                    listeners: {
                        'click': {
                            fn: this.deleteSavedUserShape,
                            scope: this
                        }
                    }
                }],
                frame: true,
                stripeRows: true,
                listeners: {
                    rowdblclick: {
                        fn: this.editMetaData.createDelegate(this),
                        scope: this
                    },
                    rowclick: {
                        fn: function (grid, rowIndex) {
                            this.userLayerGrid.rowIndex = rowIndex;
                        },
                        scope: this
                    }
                }
            });

            this.myShapesPanel = new Ext.Panel({
                id: 'myShapesPan',
                layout: 'fit',
                items: this.userLayerGrid
            });

            /**************************** User Images *******************************/

            // create the data store
            this.userImageFields = [{
                name: 'id'
            }, {
                name: 'title',
                type: 'string'
            }];

            this.userImageDataStore = new Ext.data.SimpleStore({
                fields: this.userImageFields
            });

            this.userImageRecord = Ext.data.Record.create(this.userImageFields);

            this.selectUserImage = function (selectionModel, rowIndex, record) {
                var imageLayer = record.get('layer');
                imageLayer.setVisibility(true);
            };

            this.unselectUserImage = function (selectionModel, rowIndex, record) {
                var imageLayer = record.get('layer');
                imageLayer.setVisibility(false);
            };

            //Compare checkbox columns
            this.userImageSelectionModel = new Ext.grid.CheckboxSelectionModel();
            this.userImageSelectionModel.on("rowselect", this.selectUserImage, this);
            this.userImageSelectionModel.on("rowdeselect", this.unselectUserImage, this);

            this.userImageColumnModel = new Ext.grid.ColumnModel([
            this.userImageSelectionModel,
            {
                header: 'ID',
                dataIndex: 'id',
                width: 20,
                sortable: true
            }, {
                header: 'Title',
                dataIndex: 'title',
                width: 220,
                sortable: true
            }]);

            this.loadSavedUserImages = function () {
                Ext.Ajax.request({
                    method: 'GET',
                    url: '../referral/images/',
                    success: this.loadSavedUserImagesResp.createDelegate(this),
                    failure: this.loadSavedUserImagesFail.createDelegate(this)
                });
            };

            this.loadSavedUserImagesResp = function (response) {
                var res = Ext.util.JSON.decode(response.responseText);
                var loaded_user_images = [];

                //Clear data store
                var newUserImageDataStore = new Ext.data.SimpleStore({
                    fields: this.userImageFields
                });

                //Load saved maps into data store and OL vector layer
                for (var i = 0; i < res.images.length; i++) {
                    var img = res.images[i];

                    var map = amndsslayoutinstance.amndss_map_component.map;
                    var newRectLayer = new OpenLayers.Layer.WMS('Rectified Image', "../referral/image/rectified/wms/" + img.id + "?", {
                        layers: 'rectified_image',
                        transparent: 'true',
                        format: 'image/gif',
                        srs: 'epsg:4326'
                    }, {
                        isBaseLayer: false,
                        opacity: 0.8,
                        singleTile: true,
                        visibility: false
                    });
                    map.addLayer(newRectLayer);

                    var userImageProp = {
                        'id': img.id,
                        'title': img.title,
                        'layer': newRectLayer
                    };

                    var store = this.userImageGrid.getStore();
                    for (ii = 0; ii < store.getCount(); ii++) {
                        if ((store.getAt(ii).get('id') == img.id) && store.getAt(ii).get('selected')) {
                            // We need to mark selected in new one
                            userImageProp.selected = 1;
                        }
                    }

                    var userImageRec = new this.userImageRecord(userImageProp);
                    newUserImageDataStore.add(userImageRec);
                }

                this.userImageDataStore = newUserImageDataStore;
                this.userImageGrid.reconfigure(this.userImageDataStore, this.userImageColumnModel);
                var delaytsk = new Ext.util.DelayedTask(this.updateSelectedFeatures);
                delaytsk.delay(500);
            };

            this.loadSingleUserImage = function (image_data) {
                var map = amndsslayoutinstance.amndss_map_component.map;
                var newRectLayer = new OpenLayers.Layer.WMS('Rectified Image', "../referral/image/rectified/wms/" + image_data.id + "?", {
                    layers: 'rectified_image',
                    transparent: 'true',
                    format: 'image/gif',
                    srs: 'epsg:4326'
                }, {
                    isBaseLayer: false,
                    opacity: 0.8,
                    singleTile: true,
                    visibility: false
                });
                map.addLayer(newRectLayer);
                var userImageProp = {
                    'id': image_data.id,
                    'title': image_data.title,
                    'layer': newRectLayer
                };
                var store = this.userImageGrid.getStore();
                var userImageRec = new this.userImageRecord(userImageProp);
                this.userImageDataStore.add(userImageRec);
            };

            this.loadSavedUserImagesFail = function (response) {
                Ext.Msg.alert('Load failed', 'An error occured when loading your image. Please restart the tool and try again. Contact an administrator if this reoccurs.');
            };

            this.downloadSavedUserImage2 = function (selection) {
                var loc = "../referral/image/rectified/" + selection.data.id + "?srid=" + AMNDSS.spatialReferenceID;
                window.open(loc, "help_window", "menubar=0,toolbar=0,resizable=1,scrollbars=1,width=800,height=600");
            };

            this.downloadSavedUserImage = function () {
                //Get selected rows
                var selections = this.userImageGrid.getSelectionModel().getSelections();
                var num_selections = selections.length;
                if (num_selections > 1) {
                    Ext.Msg.alert('More than one image selected', 'This tool only supports downloading one image at a time and you have multiple selected. Please select only the one image.');
                } else if (num_selections == 0) {
                    Ext.Msg.alert('', 'No images selected for download');
                } else {
                    this.downloadSavedUserImage2(selections[0]);
                }
            };

            this.deleteSavedUserImage2 = function (button, selections) {
                if (button == 'yes') {
                    for (var i = 0; i < selections.length; i++) {
                        var cur_layer = selections[i].data.layer;
                        amndsslayoutinstance.amndss_map_component.map_component.map.removeLayer(cur_layer);
                        this.userImageDataStore.remove(selections[i]);
                        var cur_id = selections[i].data.id;
                        Ext.Ajax.request({
                            method: 'POST',
                            url: '../referral/image/delete/' + cur_id + '?',
                            params: {
                                id: cur_id
                            },
                            success: null,
                            failure: this.deleteFail
                        });
                    }
                }
            };

            this.deleteFail = function () {
                Ext.Msg.alert('Image delete failed', 'Removal of your image failed. Please try again and notify an administrator if this continues to occur.');
            };

            this.deleteSavedUserImage = function () {
                //Get selected rows
                var selections = this.userImageGrid.getSelectionModel().getSelections();
                var num_selections = selections.length;
                var that = this;
                if (num_selections > 0) {
                    var msg = Ext.Msg.show({
                        title: 'Delete ' + num_selections + ' Images ?',
                        msg: 'Are you sure you want to delete the ' + num_selections + ' selected images?',
                        buttons: Ext.Msg.YESNO,
                        fn: function (msg) {
                            that.deleteSavedUserImage2(msg, selections);
                        },
                        icon: Ext.MessageBox.QUESTION
                    });
                }
            };

            this.reloadImageFromGrid = function () {
                Ext.Msg.alert('Status', 'Not Yet Implemented');
            };

            this.userImageGrid = new Ext.grid.GridPanel({
                xtype: 'grid',
                id: 'userImageGrid',
                region: 'center',
                ctCls: 'sub-panel',
                store: this.userImageDataStore,
                autoScroll: true,
                cm: this.userImageColumnModel,
                sm: this.userImageSelectionModel,
                viewConfig: {
                    forceFit: true
                },
                tbar: [{
                    text: 'Upload/Rectify',
                    handler: function () {
                        amndsslayoutinstance.addRectifier();
                    },
                    tooltip: 'Upload and geo-reference an image',
                    scope: this
                }, {
                    id: 'download_saved',
                    text: 'Download',
                    tooltip: 'Download selected image',
                    listeners: {
                        'click': {
                            fn: this.downloadSavedUserImage,
                            scope: this
                        }
                    }
                }, {
                    id: 'delete_saved',
                    text: 'Delete',
                    tooltip: 'Delete selected image',
                    listeners: {
                        'click': {
                            fn: this.deleteSavedUserImage,
                            scope: this
                        }
                    }
                }],
                frame: true,
                stripeRows: true
            });

            this.myImagesPanel = new Ext.Panel({
                id: 'myImagesPan',
                layout: 'fit',
                items: this.userImageGrid
            });
        },

        /* handlePermalink()
         * Checks for a permalink to an RTS ID in query string parameters, and loads the shape with that ID.
         */
        handlePermalink: function() {
            var store = this.userLayerGrid.getStore()
            , rts_id;
            
            if (typeof AMNDSS.urlParams.rts_id === 'undefined') return;
            try {
              rts_id = parseInt(AMNDSS.urlParams.rts_id);
            } catch(e) {
              return;
            }

            for (var i = 0; i < store.getCount(); i++) {
                 rec = store.getAt(i);
                 if (rts_id == rec.get('rts_id')) {
                     rec.set('selected', 1);
                     rec.set('visible', 1);
                     this.setUserShapeVisibilityOn(null, i, rec);
                 }
            }
            this.zoomToMyShape();
        },
        getImagePanel: function () {
            return this.myImagesPanel;
        },
        getShapesPanel: function () {
            return this.myShapesPanel;
        }
    };
    obj._init();
    return obj;
};
