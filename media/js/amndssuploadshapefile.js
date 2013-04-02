AMNDSS.UploadShapefile = function(){
    var obj =
        {
            _init: function(){

                this.shapeUploadSuccess = function(form, action) {
                    form.reset();
                    this.uploadWin.hide();                    
                    amndsslayoutinstance.myPlaces.reloadFromGrid();
                };
                
                this.shapeUploadFailure = function(form, action) {
                    Ext.Msg.alert('Image Upload Failed',
                                  'Your upload failed. Problematic form items are shown in red. ' +
                                  ' Hover your mouse over the input fields to view the associated error message.');
                };
                
                this.doShapeUpload = function() {
                    //TODO: xhr request returns no response text...
                    this.shape_upload_form.getForm().submit({
                        url: '../referral/upload_referral_shapefile/',
                        method:'POST',
                        success: this.shapeUploadSuccess,
                        failure: this.shapeUploadFailure,
                        scope: this,
                        waitTitle: 'Uploading Shape',
                        waitMsg: 'Uploading and cataloging shape...'
                    });
                };
                
                this.cancelShapeUpload = function() {
                    this.uploadWin.hide();
                };

                this.shapeUpload_button = {
                    xtype: 'button',
                    text: 'Upload Shapefile',
                    type: 'submit',
                    listeners: {
                        'click' : {
                            fn: this.doShapeUpload,
                            scope: this
                        }
                    }
                };
                
                this.shapeCancel_button = new Ext.Button({
                    xtype: 'button',
                    text: 'Cancel',
                    listeners: {
                        'click' : {
                            fn: this.cancelShapeUpload,
                            scope: this
                        }
                    }
                });
                
                var csrf_token = Ext.query('input[name="csrfmiddlewaretoken"]')[0];
                this.shape_upload_form = new Ext.form.FormPanel({
                    id:'shape-upload-form',
                    frame:false,
                    border:false,
                    bodyStyle:'padding:5px 5px 0',
                    defaultType: 'textfield',
                    fileUpload: true,
                    html: '<b>Please ensure the file is an ESRI shapefile, in either BC Albers projection (for British Columbia), or Ontario MNR Lambert (for Ontario) and ' +
                          'is compressed to .zip format (including the following files: .shp, .shx, .dbf, .prj).</b>',
                    items: [{
                        xtype:'textfield',
                        fieldLabel: 'Description',
                        name: 'desc',
                        width:200
                    },{
                        xtype:'textfield',
                        fieldLabel: 'Shapefile ZIP (*.zip)',
                        name: 'upload',
                        inputType: 'file'
                    },{
                        xtype:'hidden', 
                        name:'csrfmiddlewaretoken',   
                        value:csrf_token && csrf_token.value
                    }   
                    ], buttons:[
                        this.shapeUpload_button,
                        this.shapeCancel_button
                    ]
                });
                
                this.uploadShapefile = function() {
                    //console.log("uploadShapefile Pressed");
                    if (!this.uploadWin) {
                        this.uploadWin = new Ext.Window({
                            id:'rect_shape_win',
                            width:380,
                            height:190,
                            layout:'fit',
                            border:false,
                            closable:false,
                            title:'Upload Shapefile',
                            iconCls:'icon-upload',
                            items:[this.shape_upload_form]
                        });
                    }
                    this.shape_upload_form.getForm().reset();
                    this.uploadWin.show();
                };
            },
            getUploadShapefileFunction: function(){
                return this.uploadShapefile;
            }

        };
    obj._init();
    return obj;
};
