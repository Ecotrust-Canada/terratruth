AMNDSS.LegendContext = function () {
    var obj = {
        _init: function () {

            this.rootContextMenu = new Ext.menu.Menu('rootContext', {
                minWidth: 300
            });
            this.mainContextMenu = new Ext.menu.Menu('mainContext', {
                minWidth: 300
            });

            this.slider = new Ext.Slider({
                width: 200,
                value: 0,
                increment: 1,
                minValue: 0,
                maxValue: 100
            });

            this.sliderPanel = new Ext.Panel({
                title: 'Transparency',
                frame: false,
                layout: 'fit',
                items: [this.slider]
            });

            this.slider.on('drag', function () {
                var layer = amndsslayoutinstance.legend.getLayerFromNode(this.mainContextMenu.node);
                if (layer instanceof OpenLayers.Layer.Vector) {
                    // Handle vector layer
                    layer.styleMap.styles['default'].defaultStyle['fillOpacity'] = this.slider.getValue() / 100;
                    layer.refresh();
                } else {
                    layer.setOpacity(this.slider.getValue() / 100);
                }
            },
            this);

            this.sliderVect = new Ext.Slider({
                width: 200,
                value: 0,
                increment: 1,
                minValue: 0,
                maxValue: 100
            });

            this.sliderPanelVect = new Ext.Panel({
                title: 'Transparency',
                frame: false,
                layout: 'fit',
                items: [this.sliderVect]
            });

            this.sliderVect.on('drag', function () {
                var layer = amndsslayoutinstance.legend.getLayerFromNode(this.mainContextMenu.node);
                if (layer instanceof OpenLayers.Layer.Vector) {
                    // Handle vector layer
                    layer.styleMap.styles['default'].defaultStyle['fillOpacity'] = this.sliderVect.getValue() / 100;
                    layer.refresh();
                } else {
                    layer.setOpacity(this.sliderVect.getValue() / 100);
                }
            },
            this);

            this.colorPanel = new Ext.ux.ColorPanel({
                autoHeight: true,
                shadow: true,
                animate: true,
                renderTo: Ext.get('colorpanel')
            });

            this.colorPickerPanel = new Ext.Panel({
                el: 'colorpanel',
                title: 'Layer Color',
                frame: false,
                layout: 'fit',
                items: this.colorPanel
            });

            this.styleFormVect = new Ext.FormPanel({
                frame: false,
                items: [this.sliderPanelVect, this.colorPickerPanel]
            });

            this.styleFormRast = new Ext.FormPanel({
                frame: false,
                items: [this.sliderPanel]
            });

            this.styleWindowVect = new Ext.Window({
                xtype: 'x-window',
                id: 'color-window',
                title: 'Vector Style Changer',
                layout: 'fit',
                width: 600,
                height: 400,
                closable: false,
                resizable: true,
                items: [this.styleFormVect],
                buttons: [{
                    text: 'Ok',
                    listeners: {
                        'click': {
                            fn: function () {
                                this.styleWindowVectFinish();
                            },
                            scope: this
                        }
                    }
                },
                {
                    text: 'Cancel',
                    listeners: {
                        'click': {
                            fn: function () {
                                this.styleWindowVect.hide();
                            },
                            scope: this
                        }
                    }
                }]
            });

            this.styleWindowRast = new Ext.Window({
                xtype: 'x-window',
                id: 'color-window',
                title: 'Raster Style Changer',
                layout: 'fit',
                width: 600,
                height: 400,
                closable: false,
                resizable: true,
                items: [this.styleFormRast],
                buttons: [{
                    text: 'Ok',
                    listeners: {
                        'click': {
                            fn: function () {
                                this.styleWindowRastFinish();
                            },
                            scope: this
                        }
                    }
                },
                {
                    text: 'Cancel',
                    listeners: {
                        'click': {
                            fn: function () {
                                this.styleWindowRast.hide();
                            },
                            scope: this
                        }
                    }
                }]
            });

            this.styleWindowRastFinish = function () {
                this.styleWindowRast.hide();
            };

            this.styleWindowVectFinish = function () {
                this.styleWindowVect.hide();
                var newColor = this.colorPanel.hsvToRgb(
                this.colorPanel.HSV.h, this.colorPanel.HSV.s, this.colorPanel.HSV.v);
                var layer = amndsslayoutinstance.legend.getLayerFromNode(this.mainContextMenu.node);
                layer.styleMap.styles['default'].defaultStyle['fillColor'] = '#' + this.colorPanel.rgbToHex(newColor);
                layer.refresh();
            };

            this.styleLayer = function (item, event) {
                var layer = amndsslayoutinstance.legend.getLayerFromNode(this.mainContextMenu.node);
                if ((layer instanceof OpenLayers.Layer.WMS) || (layer instanceof OpenLayers.Layer.Google)) {
                    if (!this.styleWindowRast.isVisible()) {
                        this.styleWindowRast.show();
                        this.slider.setValue(layer.opacity * 100);
                    } else {
                        var msg = Ext.Msg.show({
                            title: 'Raster Style Editor Already Open',
                            msg: 'Raster Style editor already open... Please finish updates in progress!',
                            buttons: Ext.Msg.OK,
                            icon: Ext.MessageBox.QUESTION
                        });
                    }
                } else if (layer instanceof OpenLayers.Layer.Vector) {
                    if (!this.styleWindowVect.isVisible()) {
                        this.styleWindowVect.show();
                        this.sliderVect.setValue(layer.opacity * 100);
                    } else {
                        var msg2 = Ext.Msg.show({
                            title: 'Vector Style Editor Already Open',
                            msg: 'Vector Style editor already open... Please finish updates in progress!',
                            buttons: Ext.Msg.OK,
                            icon: Ext.MessageBox.QUESTION
                        });
                    }
                }
            };

            this.zoomLayer = function (item, event) {
                1 + 1;
            };

            this.removeLayer = function (item, event) {
                alert("removeLayer pressed");
            };

            this.mainContextMenu.add(
            new Ext.menu.Item({
                text: 'Edit Style...',
                handler: this.styleLayer.createDelegate(this)
            }));

            this.legendMenuShow = function (node) {
                if (node.isRoot) {
                    1 + 1;
                } else { //if (node.getDepth() > 1) {
                    this.mainContextMenu.node = node;
                    this.mainContextMenu.show(node.ui.getAnchor());
                }
            };
        },
        getLayout: function () {
            return 1 + 1;
        }
    };
    obj._init();
    return obj;
};
