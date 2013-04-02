
AMNDSS.UtmZoomPanel = function(map){
    var obj = {
        _init: function(){
        // Called during component initialization
        // Config object has already been applied to 'this' so properties can 
        // be overriden here or new properties (e.g. items, tools, buttons) 
        // can be added, eg:
        
        this.description = Math.floor(Math.random()*10000000);
        this.map = map;

        // simple array store
        var utmstore = new Ext.data.SimpleStore({
            fields: ['id','name'],
            data: [[8,'UTM Zone 8'], 
                    [9,'UTM Zone 9'], 
                    [10,'UTM Zone 10'], 
                    [11,'UTM Zone 11']] 
        });

        this.utmcombo = new Ext.form.ComboBox({
            store: utmstore,
            displayField:'name',
            hideLabel: true,
            id:'utm_combo'+this.description,
            typeAhead: false,
            mode: 'local',
            triggerAction: 'all',
            emptyText:'Select UTM Zone...',
            forceSelection:true,
            valueField: 'id',
            selectOnFocus:true
        });

        this.zoom_panel = new Ext.FormPanel({
            frame:false,
            border:false,
            ctCls: 'sub-sub-content-panel',
            style:'padding:5px 5px 0; font-size:12px; font-family:tahoma,arial',
            items: [this.utmcombo,{
                frame:false,
                border:false,
                layout:'table',
                layoutConfig: {
                    columns: 5
                },            
                items:[{
                   html:'Upper left:  ',
                   cls:'form-label',                           
                   frame:false,
                   border:false
                },{
                    layout: 'form',
                    frame:false,
                    border:false,
                    items: [{
                            xtype:'textfield',
                            hideLabel:true,
                            width:80,
                            frame:false,
                            border:false,
                            name: 'upwest'
                        }]
                },{
                    cls:'form-label',
                    html:'W ',
                    frame:false,
                    border:false
                },{
                    border:false,
                    frame:false,
                    layout: 'form',
                    items: [{
                            xtype:'textfield',
                            width:80,
                            hideLabel:true,
                            name: 'upnorth',
                            border:false,
                            frame:false
                        }]
                },{
                   html:'N ',
                   cls:'form-label',
                   border:false,
                   frame:false
                },{
                   html:'Lower right:  ',
                   cls:'form-label',     
                   border:false,
                   frame:false
                },{
                    layout: 'form',
                    frame:false,
                    border:false,
                    items: [{
                            xtype:'textfield',
                            hideLabel:true,
                            width:80,
                            name: 'downwest',
                            border:false,
                            frame:false
                        }]
                },{
                    cls:'form-label',
                    html:'W ',
                    border:false,
                    frame:false
                },{
                    layout: 'form',
                    frame:false,
                    border:false,
                    items: [{
                            xtype:'textfield',
                            width:80,
                            hideLabel:true,
                            name: 'downnorth',
                            border:false,
                            frame:false
                        }]
                },{
                   html:'N ',
                   cls:'form-label',
                   border:false,
                   frame:false
                }]
            }],
            buttons: [{
                text: 'Find',
                listeners: {
                    'click' : {
                        fn: function(){this.zoomToUtm(this.zoom_panel.getForm());},
                        scope: this
                    }
                }
            },{
                text: 'Clear',
                listeners: {
                    'click' : {
                        fn: function(){this.zoom_panel.getForm().reset();},
                        scope: this
                    }
                }
            }]
        });
    },
    
    zoomToUtm: function(form) {
        var values = form.getValues();
        var utmzone_combo = form.findField('utm_combo'+this.description);
        var utmzone = utmzone_combo.getValue();
        
        if (utmzone == '') {
            Ext.Msg.alert('Search Error', 'Please select one of the UTM Zones. See the help for information on what a UTM zone is and how to find out which one to use.');
            return;
        }
        
        var upnorth = values.upnorth;
        var upwest = values.upwest;
        var downnorth = values.downnorth;
        var downwest = values.downwest;                               
        
        if (!upnorth || !upwest || !downnorth || !downwest) {
            Ext.Msg.alert('Search Error', 'Please enter all 4 values. Refer to the help documentation for information on what these values represent.');
            return;
        }
        if (!parseFloat(upnorth) || !parseFloat(upwest) || !parseFloat(downnorth) || !parseFloat(downwest)) {
            Ext.Msg.alert('Search Error', 'One of your 4 values is not a valid number, please double check them and try again');
            return;                 
        }
        
        var srcProj = null;  //Unknown for now                
        var dstProj = new OpenLayers.Projection("EPSG:4326");
                       
        var ul = new OpenLayers.LonLat(upwest, upnorth);
        var lr = new OpenLayers.LonLat(downwest, downnorth);
        var bounds = new OpenLayers.Bounds();
        bounds.extend(ul);
        bounds.extend(lr);

        if (utmzone == 8) {
            srcProj = new OpenLayers.Projection("EPSG:3155");
        } else if (utmzone == 9) {
            srcProj = new OpenLayers.Projection("EPSG:3156");
        } else if (utmzone == 10) {
            srcProj = new OpenLayers.Projection("EPSG:3157");
        } else { // utmzone == 11)...
            srcProj = new OpenLayers.Projection("EPSG:2955");
        }                

        bounds.transform(srcProj,dstProj);     
        
        //Map passed in when constructed
        if (this.map) {           
            this.map.zoomToExtent(bounds);
        } else {
            //Hack!!!
            amndsslayoutinstance.getMap().map_component.map.zoomToExtent(bounds);
        }                           
    },    
 
    getPanel: function(){
        return this.zoom_panel;
    }

	};
	obj._init();
	return obj;
};
