AMNDSS.AddressZoomPanel = function (map) {
    var obj = {
        _init: function () {
            // Called during component initialization
            // Config object has already been applied to 'this' so properties can 
            // be overriden here or new properties (e.g. items, tools, buttons) 
            // can be added, eg:

            this.description = Math.floor(Math.random() * 10000000);

            var geocoder = new google.maps.Geocoder();

            this.findButton = new Ext.Button({
                text: 'Find',
                minWidth: 80,
                id: 'btnFind',
                listeners: {
                    'click': {
                        fn: function () {
                            this.showAddress();
                        },
                        scope: this
                    }
                }
            });

            this.showAddress = function () {
                aForm = this.findAddress.getForm();
                var formFields = aForm.getValues();
                geocoder.geocode({
                    'address': formFields.address
                },

                function (results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        var internalProjection = new OpenLayers.Projection("EPSG:900913");
                        var externalProjection = new OpenLayers.Projection("EPSG:900913");

                        var projectionLatLong = new OpenLayers.Projection("EPSG:4326");
                        // Map passed in when constructed
                        if (map) {
                            map.setCenter(new OpenLayers.LonLat(results[0].geometry.location.lng(), results[0].geometry.location.lat()).transform(projectionLatLong, internalProjection), 12);
                        } else {
                            amndsslayoutinstance.getMap().map_component.map.setCenter(
                            new OpenLayers.LonLat(results[0].geometry.location.lng(),
                            results[0].geometry.location.lat()).transform(projectionLatLong, internalProjection), 12);
                        }
                    } else {
                        alert('Address search not successful for the following reason: ' + status);
                    }
                });
            };

            this.findAddress = new Ext.FormPanel({
                frame: false,
                border: false,
                bodyStyle: 'padding:5px 5px 0',
                defaultType: 'field',
                items: [{
                    hideLabel: true,
                    name: 'address',
                    width: 275,
                    listeners: {
                        // this enables the find when the user hits enter
                        'specialkey': {
                            fn: function (f, e) {
                                if (e.getKey() == 13) {
                                    this.showAddress();
                                }
                            },
                            scope: this
                        }
                    }
                }],
                buttons: [this.findButton, {
                    text: 'Clear',
                    listeners: {
                        'click': {
                            fn: function () {
                                this.findAddress.getForm().reset();
                            },
                            scope: this
                        }
                    }
                }]
            });
        },

        getPanel: function () {
            return this.findAddress;
        }
    };
    obj._init();
    return obj;
};