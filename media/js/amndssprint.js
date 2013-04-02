AMNDSS.Print = function () {
  var obj = {
    _init: function () {

      /////////////// Print dialog /////////////////////
      var print_actions = [
        ['PDF', 'PDF Type', 'pdf']
      //['PNG', 'PNG Type','png'],
      //['GIF', 'GIF Type','gif'],
      //['JPEG', 'JPEG Type','jpeg']
      ];

      var print_store = new Ext.data.SimpleStore({
        fields: ['type', 'desc', 'ind'],
        data: print_actions
      });

      // Tools for report generation
      this.printCombo = new Ext.form.ComboBox({
        name: 'imagetype',
        hideLabel: false,
        fieldLabel: 'Print Image Type',
        store: print_store,
        displayField: 'type',
        mode: 'local',
        width: 250,
        listWidth: 250,
        value: 'PDF',
        //emptyText:'Select an image type...',
        forceSelection: true,
        selectOnFocus: true
      });
      
      var csrf_token = Ext.query('input[name="csrfmiddlewaretoken"]')[0];
      this.printForm = new Ext.FormPanel({
        frame: false,
        bodyStyle: 'padding:5px 5px 0',
        defaultType: 'textfield',
        fileUpload: true,
        items: [
        new Ext.form.TextField({
          fieldLabel: 'Title',
          name: 'title',
          allowBlank: true,
          width: 300
        }), new Ext.form.TextArea({
          fieldLabel: 'Descriptive Text',
          name: 'description',
          allowBlank: true,
          width: 300
        }), new Ext.form.Checkbox({
          fieldLabel: 'Confidential watermark',
          name: 'confidential'
        }),
        // files cannot be uploaded via ajax.
        /*{
          xtype: 'textfield',
          fieldLabel: 'Logo Upload (*.jpg)',
          name: 'upload',
          inputType: 'file'
        },*/
        {
            xtype:'hidden', 
            name:'csrfmiddlewaretoken',   
            value:csrf_token && csrf_token.value
        },
        this.printCombo],
        buttons: [{
          text: 'Print Map',
          listeners: {
            'click': {
              fn: function () {
                
                var legendItems = AMNDSS.LegendWindow.legend_body.children, legendImages=[];
                for (var i=0; i<legendItems.length; i++) {
                  if (legendItems[i].tagName == "IMG") legendImages.push(legendItems[i].src);
                }
                // fetch the extent and image size
                var mapview = amndsslayoutinstance.amndss_map_component.map_component.map;
                var layers = mapview.layers;
                var extent = mapview.getExtent();
                extent = [extent.left, extent.bottom, extent.right, extent.top].join('+');
                var width = mapview.getSize().w;
                var height = mapview.getSize().h;
                // build a comma-joined list of layers
                var activelayers = [];
                for (i in layers) {
                  if (! (layers[i] instanceof OpenLayers.Layer.WMS)) continue;
                  if (!layers[i].getVisibility()) continue;
                  if (!layers[i].calculateInRange()) continue;
                  activelayers = activelayers.concat(layers[i].params['LAYERS']);
                }
                activelayers = activelayers.join('+');
                // open a window to our pure-Mapserver version
                var url = '/cgi-bin/amndss.cgi?';
                url += 'mode=map';
                url += '&mapext=' + extent;
                url += '&mapsize=' + width + '+' + height;
                url += '&layers=' + activelayers;

                var jsonRep = amndsslayoutinstance.amndss_map_component.getJSONState();
                var fs_url = "../print/";
                var test_url = fs_url;
                var form = this.printForm.getForm();
                var formFields = form.getValues();
                this.printForm.getForm().baseParams = {
                  request: 'print',
                  type: formFields.imagetype,
                  responsetype: 'url',
                  title: formFields.title,
                  description: formFields.description,
                  legendimages: Ext.util.JSON.encode(legendImages),
                  oldata: jsonRep
                };
                this.printForm.getForm().submit({
                  method: 'POST',
                  url: test_url,
                  success: this.printResp.createDelegate(this),
                  failure: this.printResp.createDelegate(this)
                });
                image_url = fs_url + "?request=print&type=pdf";
                this.printPanel.hide();
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
                this.printPanel.hide();
              },
              scope: this
            }
          }
        }]
      });

      this.printPanel = new Ext.Window({
        xtype: 'x-window',
        el: 'printquestions',
        id: 'question-window',
        title: 'Print Options',
        layout: 'fit',
        closable: false,
        resizable: false,
        width: 500,
        height: 300,
        items: [this.printForm]
      });

      this.printMap = new Ext.Panel({
        frame: false,
        border: false,
        bodyStyle: 'padding:5px 5px 0',
        defaultType: 'field',
        buttonAlign: 'center',
        buttons: [{
          text: 'Print',
          listeners: {
            'click': {
              fn: function () {
                this.printPanel.show();
              },
              scope: this
            }
          }
        }]
      });

      this.printMapWrap = new Ext.Panel({
        title: 'Print Current Map View',
        ctCls: 'sub-sub-content-panel',
        items: this.printMap,
        border: true
      });

      this.printResp = function (form, action) {
        var res = Ext.util.JSON.decode(action.response.responseText);
        // get root url of server
        var site_url = (window.location+'').match(/(https?:\/\/[^\/]+)\//)[1];
        window.open(site_url + res.url);
      };

    },
    getPrintPanel: function () {
      return this.printMapWrap;
    },

    startPrint: function () {
      var form = this.printForm.getForm();
      form.reset();
      this.printPanel.show();
    }

  };
  obj._init();
  return obj;
};
