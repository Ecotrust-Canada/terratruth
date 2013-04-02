
AMNDSS.LatLongZoomPanel = function(map){
     var obj =
        {
            _init: function(){

			    // Called during component initialization
			    // Config object has already been applied to 'this' so properties can 
			    // be overriden here or new properties (e.g. items, tools, buttons) 
			    // can be added, eg:
			    
			    this.description = Math.floor(Math.random()*10000000);
			    this.map = map;
                
                this.showLatLon = function() {
                    var form = this.findLatLon.getForm();
                    var formFields = form.getValues();
                    //console.log(formFields);
                    //var internalProjection = new OpenLayers.Projection("EPSG:4326");
                    //var externalProjection = new OpenLayers.Projection("EPSG:4326");
                    var internalProjection = new OpenLayers.Projection("EPSG:900913");
                    var externalProjection = new OpenLayers.Projection("EPSG:" + AMNDSS.spatialReferenceID);
                    var lonlat = new OpenLayers.LonLat(formFields.longitude, formFields.latitude);

	                //Map passed in when constructed
	                if (this.map) {           
	                    this.map.setCenter(lonlat.transform(externalProjection,internalProjection),10);
	                } else {
	                    amndsslayoutinstance.getMap().map_component.map.setCenter(lonlat.transform(externalProjection,internalProjection),10);
	                }                           
                };

                this.findLatLon = new Ext.FormPanel({
                    frame:false,
                    border:false,
                    ctCls: 'sub-sub-content-panel',
                    bodyStyle:'padding:5px 5px 0',
                    defaultType: 'field',
                    items: [
                        {
                            fieldLabel: 'Latitude',
                            hideLabel:false,
                            name: 'latitude'
                        },
                        {
                            fieldLabel: 'Longitude',
                            hideLabel:false,
                            name: 'longitude', 
			                listeners: {
			                    // this enables the find when the user hits enter
			                    'specialkey' : {
			                        fn: function(f,e){
			                             if (e.getKey() == 13) {this.showLatLon();}
			                        },
			                        scope: this
			                    }
			                }
                        }
                    ],
                    buttons: [{
                        text: 'Find',
                        listeners: {
                            'click' : {
                                fn: function(){this.showLatLon();},
                                scope: this
                            }
                        }
                    },{
                        text: 'Clear',
                        listeners: {
                            'click' : {
                                fn: function(){this.findLatLon.getForm().reset();},
                                scope: this
                            }
                        }
                    }]
                });
            },
            
	    getPanel: function(){
	        return this.findLatLon;
	    }            
    };           
     
    obj._init();
    return obj;
};
