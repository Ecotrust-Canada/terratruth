
AMNDSS.FindLocation = function(){
    var obj =
        {
            _init: function(){

                // This is the find location tab

                this.geocodeResp = function(point) {
                    if (!point) {
                        alert("Address not found, please try again.");
                    } else {
                        //var internalProjection = new OpenLayers.Projection("EPSG:4326");
                        //var externalProjection = new OpenLayers.Projection("EPSG:4326");
	                    var internalProjection = new OpenLayers.Projection("EPSG:900913");
	                    var externalProjection = new OpenLayers.Projection("EPSG:" + AMNDSS.spatialReferenceID);
                        var lonlat = new OpenLayers.LonLat(point.x, point.y);
                        amndsslayoutinstance.getMap().map_component.map.setCenter(
                            lonlat.transform(externalProjection, internalProjection), 12);
                    }};

                findAddress = new AMNDSS.AddressZoomPanel();

                this.findAddressWrap = new Ext.Panel({
                    title: 'Address',
                    style:'padding-bottom:5px',
                    ctCls: 'sub-sub-content-panel',                    
                    items: findAddress.getPanel(),
                    border: true
                });
                
                findLatLon = new AMNDSS.LatLongZoomPanel();
                
                this.findLatLonWrap = new Ext.Panel({
                    title: 'Lat/Long Coordinate (Decimal Degrees)',
                    items: findLatLon.getPanel(),
                    style:'padding-bottom:5px',
                    border: true
                });

                zoom_panel = new AMNDSS.UtmZoomPanel();
                
                this.findUtmWrap = new Ext.Panel({
                    title: 'UTM Coordinate',
                    items: zoom_panel.getPanel(),
                    border: true
                });               
            },            
            
            getGoogleSearchPanel: function(){
                return this.findAddressWrap;
            },
            getLatLonSearchPanel: function(){
                return this.findLatLonWrap;
            },
            getUtmSearchPanel: function(){
                return this.findUtmWrap;
            }            
        };
    obj._init();
    return obj;
};
