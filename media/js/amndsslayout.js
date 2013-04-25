AMNDSS.Layout = function () {
    var obj = {
        _init: function () {
            //// Add some of our base DOM elements
            this._initDivs();

            this.amndsslogin = new AMNDSS.Login();
            this.amndsslogin.load_user_info();
            this.amndsslogin.on("user_info_loaded", this._initPostLogin, this);
        },

        _initPostLogin: function () {
            // Add the base map for the map tab
            this.amndss_map_component = AMNDSS.Map('map');
            // Create the base layout
            this.viewport = this._initViewport();
            this.amndss_map_component._initControls();

            // Register an event to keep track of selected shapes... needs to be late in the process...
            this.amndss_map_component.map.events.on({
                "zoomend": this.myPlaces.delayedUpdateSelectedFeatures,
                scope: this.myPlaces
            });

            this._initNewShape();

            // This is the legend tab
            this.legend = new mapfish.widgets.LayerTree({
                map: this.amndss_map_component.map_component.map,
                el: 'layerTree',
                showWmsLegend: true,
                id: 'legend-panel',
                ctCls: 'sub-content-panel',
                height: 200,
                margins: '0 0 0 0',
                enableDD: true,
                border: false,
                ascending: false
            });

            this.legend.on('contextmenu', this.legendContext.legendMenuShow, this.legendContext);
            this.legendPanel.add(this.legend);

            // We can hook up the events when a shape is added or modified
            this.amndss_map_component.map_component.on("shapeAdded", this.shapeAddedGetAttributes.createDelegate(this), this);
            this.amndss_map_component.map_component.on("shapeModified", this.shapeModifiedGetAttributes.createDelegate(this), this);

            this.myPlaces.loadSavedUserShapes();
            this.myPlaces.loadSavedUserImages();

            Ext.getCmp('centerComp').activate('maptabComp');
            Ext.getCmp('west-panel').expand();
            Ext.getCmp('west-panel').setTitle('<i>Welcome ' + AMNDSS.user.username + '</i>');

        },

        _initDivs: function () {

            // Add some of our base DOM elements
            Ext.DomHelper.append(document.body, {
                tag: 'div',
                id: 'map'
            });

            Ext.DomHelper.append(document.body, {
                tag: 'div',
                id: 'printquestions',
                cls: 'x-hidden'
            });
            Ext.DomHelper.append(Ext.get('printquestions'), {
                tag: 'div',
                id: 'printquestionstitle',
                cls: 'x-window-header'
            });
            Ext.DomHelper.append(document.body, {
                tag: 'div',
                id: 'newshapequestions',
                cls: 'x-hidden'
            });
            Ext.DomHelper.append(Ext.get('newshapequestions'), {
                tag: 'div',
                id: 'newshapequestionstitle',
                cls: 'x-window-header'
            });
            Ext.DomHelper.append(document.body, {
                tag: 'div',
                id: 'newhelpwindow',
                cls: 'x-hidden'
            });
            Ext.DomHelper.append(Ext.get('newhelpwindow'), {
                tag: 'div',
                id: 'newhelpwindowtitle',
                cls: 'x-window-header'
            });
            Ext.DomHelper.append(document.body, {
                tag: 'div',
                id: 'colorpanel',
                cls: 'x-hidden'
            });
            Ext.DomHelper.append(Ext.get('colorpanel'), {
                tag: 'div',
                id: 'colorpaneltitle',
                cls: 'x-window-header'
            });
            Ext.DomHelper.append(document.body, {
                tag: 'div',
                id: 'basicTools',
                cls: 'olControlEditingToolbar'
            });
            Ext.DomHelper.append(document.body, {
                tag: 'div',
                id: 'referenceMap'
            });
            Ext.DomHelper.append(document.body, {
                tag: 'div',
                id: 'north'
            });
            Ext.DomHelper.append(document.body, {
                tag: 'div',
                id: 'south'
            });
            Ext.DomHelper.append(document.body, {
                tag: 'div',
                id: 'west'
            });
            Ext.DomHelper.append(document.body, {
                tag: 'div',
                id: 'layerTree'
            });
            Ext.DomHelper.append(document.body, {
                tag: 'div',
                id: 'east'
            });
            Ext.DomHelper.append(document.body, {
                tag: 'div',
                id: 'maptab'
            });
            Ext.DomHelper.append(Ext.get('maptab'), {
                tag: 'a',
                id: 'hideit',
                href: '#'
            });
            Ext.DomHelper.append(document.body, {
                tag: 'div',
                id: 'rectifytab'
            });
            Ext.DomHelper.append(document.body, {
                tag: 'div',
                id: 'rectifymap'
            });
            Ext.DomHelper.append(document.body, {
                tag: 'div',
                id: 'rectifyimage'
            });
            Ext.DomHelper.append(document.body, {
                tag: 'div',
                id: 'reporttab'
            });
            Ext.DomHelper.append(document.body, {
                tag: 'div',
                id: 'downloadlink'
            });
            Ext.DomHelper.append(document.body, {
                tag: 'div',
                id: 'dummydiv'
            });
        },

        _initViewport: function () {
            return new Ext.Viewport({
                layout: 'border',
                items: [this._initWest(), this._initCenter()]
            });
        },

        // GNG 10Feb10 - the shape file manager code has been moved to a separate
        //               script (amndssshapemanager.js)
        _initNewShape: AMNDSS.Shapes._initNewShape,

        //Deprecated, not used anymore
        _initNewHelp: function () {
            this.newHelpPanel = new Ext.Window({
                xtype: 'x-window',
                el: 'newhelpwindow',
                id: 'help-window',
                title: 'Help',
                layout: 'fit',
                width: 800,
                height: 600,
                //html: "<iframe height=100% width=100% src='http://www.nativemaps.org/?q=top_menu/1/88/156/221' />"
                html: "<iframe height=100% width=100% src='http://nativemaps.org/?q=taxonomy/term/221' />"
            });
            return this.newHelpPanel;
        },

        _initNorth: function () {
            return new Ext.BoxComponent({
                region: 'north',
                el: 'north',
                height: 32
            });
        },

        _initSouth: function () {
            return new Ext.Panel({
                xtype: 'panel',
                region: 'south',
                contentEl: 'south',
                split: true,
                height: 100,
                minSize: 100,
                maxSize: 200,
                autoScroll: true,
                collapsible: true,
                collapsed: true,
                title: 'Debug',
                margins: '0 0 0 0',
                items: [{
                    contentEl: 'info',
                    border: false
                }]
            });
        },

        _initWest: function () {

            // Print stuff
            this.print = new AMNDSS.Print();
            this.printMap = this.print.getPrintPanel();

            // These are the basic nav tools that are always visible    
            this.basicTools = new Ext.Panel({
                xtype: 'panel',
                id: 'basic-tools',
                region: 'north',
                height: 68,
                margins: '0 0 0 0',
                title: 'Navigation Tools',
                border: false,
                layout: 'column',
                items: [{
                    contentEl: 'basicTools',
                    columnWidth: 0.4,
                    height: 30,
                    border: false
                },
                {
                    columnWidth: 0.2,
                    height: 30,
                    border: false,
                    style: 'padding-top:5px',
                    items: [{
                        id: 'launchHelp',
                        xtype: 'button',
                        text: 'Help',
                        iconCls: 'helpIcon',
                        listeners: {
                            'click': {
                                fn: function () {
                                    this.launchHelp();
                                },
                                scope: this
                            }
                        }
                    }]
                },
                {
                    columnWidth: 0.23,
                    height: 30,
                    border: false,
                    style: 'padding-top:5px',
                    items: [{
                        id: 'launchPrint',
                        xtype: 'button',
                        text: 'Print Map',
                        tooltip: 'Print current map view',
                        listeners: {
                            'click': {
                                fn: function () {
                                    this.print.startPrint();
                                },
                                scope: this
                            }
                        }
                    }]
                },
                {
                    columnWidth: 0.17,
                    height: 30,
                    border: false,
                    style: 'padding-top:5px; padding-left: 5px',
                    items: [{
                        id: 'exitTool',
                        xtype: 'button',
                        text: 'Exit',
                        tooltip: 'Exit and return to main menu',
                        listeners: {
                            'click': {
                                fn: function () {
                                    history.back();
                                },
                                scope: this
                            }
                        }
                    }]
                }]
            });

            // This is the find location tab
            this.findLocation = new AMNDSS.FindLocation();

            // This is for legend context menu 
            this.legendContext = new AMNDSS.LegendContext();

            // The legend panel itself, does not get populated until after user logs in
            this.legendPanel = new Ext.Panel({
                id: 'legPan',
                layout: 'fit'
            });

            // This is My Shapes (previously know as My Places, hence the internal name
            this.myPlaces = AMNDSS.MyPlaces();

            this.launchRectifier = function () {
                //console.log("launchRectifier Pressed");
            };

            this.editTools = new Ext.Panel({
                xtype: 'panel',
                region: 'center',
                collapsible: true,
                layout: 'accordion',
                layoutConfig: {
                    animate: true
                },
                items: [{
                    title: 'Find Location',
                    id: 'findloc-panel',
                    border: false,
                    iconCls: 'nav',
                    bodyStyle: 'padding:5px; overflow:auto',
                    items: [this.findLocation.getGoogleSearchPanel(), 
                            this.findLocation.getLatLonSearchPanel(),
                            this.findLocation.getUtmSearchPanel()
                    ]
                },
                {
                    title: 'My Shapes',
                    id: 'shapes-panel',
                    border: false,
                    iconCls: 'nav',
                    layout: 'fit',
                    bodyStyle: 'overflow:auto',
                    items: [this.myPlaces.getShapesPanel()]
                },
                {
                    title: 'My Images',
                    id: 'images-panel',
                    border: false,
                    iconCls: 'nav',
                    layout: 'fit',
                    bodyStyle: 'overflow:auto',
                    items: [this.myPlaces.getImagePanel()]
                },
                {
                    title: 'Base Layers',
                    id: 'legend-panel',
                    border: false,
                    iconCls: 'nav',
                    layout: 'fit',
                    items: [this.legendPanel]
                }]
            });

            this.referenceTools = new Ext.Panel({
                xtype: 'panel',
                id: 'reference-panel',
                collapsible: false,
                region: 'south',
                height: 175,
                margins: '0 0 0 0',
                title: 'Reference Map',
                border: false,
                items: [{
                    contentEl: 'referenceMap',
                    border: false
                }]
            });

            return new Ext.Panel({
                xtype: 'panel',
                region: 'west',
                id: 'west-panel',
                title: ' ',
                split: true,
                width: 350,
                minSize: 200,
                maxSize: 400,
                collapseMode: 'mini',
                collapsible: true,
                margins: '0 0 0 0',
                layout: 'border',
                items: [
                this.basicTools, this.editTools, this.referenceTools]
            });
        },

        _initCenter: function () {
            this.tabPanel = new Ext.TabPanel({
                id: 'centerComp',
                region: 'center',
                deferredRender: false,
                activeTab: 0,
                resizeTabs: true,
                minTabWidth: 100,
                items: [
                this._initCenterMapTab()],
                listeners: {
                    'beforetabchange': {
                        fn: this.tabPanelBeforeChange,
                        scope: this
                    },
                    'tabchange': {
                        fn: this.tabPanelChange,
                        scope: this
                    }
                }
            });
            return this.tabPanel;
        },

        _initCenterMapTab: function () {
            return new Ext.Panel({
                id: 'maptabComp',
                contentEl: 'maptab',
                title: 'Map View',
                layout: 'fit',
                items: this.amndss_map_component.map_component
            });
        },

        _initCenterReportTab: function () {
            return new Ext.Panel({
                xtype: 'panel',
                id: 'reporttabComp',
                title: 'Report Generator',
                layout: 'fit',
                style: 'padding:10px 10px 10px 10px',
                items: {
                    xtype: 'panel',
                    title: 'Report Type Picker',
                    id: 'reporttabPanel',
                    layout: 'border',
                    items: {
                        id: 'reporttabdiv',
                        contentEl: 'reporttab',
                        region: 'center'
                    }
                },
                buttons: [{
                    id: 'reportBack',
                    xtype: 'button',
                    text: 'Back',
                    listeners: {
                        'click': {
                            fn: this.reportBack,
                            scope: this
                        }
                    }
                },
                {
                    id: 'reportNext',
                    xtype: 'button',
                    text: 'Next',
                    listeners: {
                        'click': {
                            fn: this.reportNext,
                            scope: this
                        }
                    }
                }]
            });
        },

        addRectifier: function (rectifier) {
            if (!this.rectifier) {
                this.rectifier = new AMNDSS.Rectifier(amndsslayoutinstance);
                this.tabPanel.add(this.rectifier.initLayout());
                this.tabPanel.doLayout();
            } else {
                this.rectifier.rectifyZero();
            }
            Ext.getCmp('centerComp').activate('rectifytabComp');
        },

        getViewport: function () {
            return this.viewport;
        },

        getMap: function () {
            return this.amndss_map_component;
        },

        tabPanelBeforeChange: function (tabPanel, newTab, currentTab) {
            if (newTab.id == 'rectifytabComp') {
                var msg = Ext.Msg.wait('Loading Rectifier... Please Wait');
                var delaytsk = new Ext.util.DelayedTask(this.clearDelay, this, [msg]);
                delaytsk.delay(3000);
            } else if (newTab.id == 'maptabComp') {
                // Nothing here yet
                return;
            } else if (newTab.id == 'reporttabComp') {
                // Nothing here yet
                return;
            }
            return;
        },

        tabPanelChange: function (tabPanel, newTab, currentTab) {
            var west = Ext.getCmp('west-panel');
            if (newTab.id == 'rectifytabComp') {
                // Close the west panel if it is open
                if (west.collapsed !== true) {
                    west.collapse();
                }
                // Toggle the centre to make the map appear for the first time the tab is set visible...
                var map = amndsslayoutinstance.rectifier.rectify_maps.map_component.map;
                map.updateSize();
            } else if (newTab.id == 'maptabComp') {
                // Expand the west panel if not already expanded
                if (west.collapsed === true) {
                    west.expand();
                }
            } else if (newTab.id == 'reporttabComp') {
                // Close the west panel if it is open
                if (west.collapsed !== true) {
                    west.collapse();
                }
            }
            return;
        },

        reportNext: function () {
            this.report.processNext();
        },
        reportBack: function () {
            this.report.processBack();
        },
        clearDelay: function (msg) {
            msg.hide();
        },
        shapeAddedGetAttributes: function (shape) {
            this.newShapePanel.currentFeature = shape;
            this.newShapeForm.getForm().reset();
            this.newShapePanel.show();
            this.newShapePanel.currentShapeId = null; // new shape has no database ID yet.
        },
        shapeAdded: function () {
            var shape = this.newShapePanel.currentFeature;
            var form = this.newShapeForm.getForm();
            var formFields = form.getValues();

            var wkt_maker = new OpenLayers.Format.WKT({
                'internalProjection': new OpenLayers.Projection("EPSG:4326"),
                //'internalProjection': new OpenLayers.Projection("EPSG:900913"),
                'externalProjection': new OpenLayers.Projection("EPSG:" + AMNDSS.spatialReferenceID)
            });
            var shape_wkt = wkt_maker.write(shape);
            var params = {
                feature_id: "2",
                // Maybe not used... just use FS id's
                parent_id: "-1",
                // Mark new shapes as not having a parent
                author: AMNDSS.user.username,
                description: formFields.description,
                rts_id: formFields.rts_id,
                contact_organization: formFields.contact_organization,
                contact_person: formFields.contact_person,
                contact_person_title: formFields.contact_person_title,
                contact_phone_voice: formFields.contact_phone_voice,
                contact_phone_fax: formFields.contact_phone_fax,
                contact_email: formFields.contact_email,
                address_street: formFields.address_street,
                address_city: formFields.address_city,
                address_province_or_state: formFields.address_province_or_state,
                address_postal_code: formFields.address_postal_code,
                address_country: formFields.address_country,
                dataset_title: formFields.dataset_title,
                dataset_creator: formFields.dataset_creator,
                dataset_content_publisher: formFields.dataset_content_publisher,
                dataset_publication_place: formFields.dataset_publication_place,
                dataset_publication_date: formFields.dataset_publication_date,
                dataset_abstract_description: formFields.dataset_abstract_description,
                dataset_scale: formFields.dataset_scale,
                dataset_date_depicted: formFields.dataset_date_depicted,
                dataset_time_period: formFields.dataset_time_period,
                dataset_geographic_key_words: formFields.dataset_geographic_key_words,
                dataset_theme_key_words: formFields.dataset_theme_key_words,
                dataset_security_classification: formFields.dataset_security_classification,
                dataset_who_can_access_the_data: formFields.dataset_who_can_access_the_data,
                dataset_use_constraints: formFields.dataset_use_constraints,
                edit_notes: "",
                view_group: "",
                edit_group: "",
                wkt: shape_wkt
            };
            if (this.newShapePanel.currentShapeId) {
                params.shape_id = this.newShapePanel.currentShapeId;
            }
            OpenLayers.Util.extend(shape.attributes, params);

            var json = Ext.util.JSON.encode(params);
            var fs_url = "../referral/add_referral_shape/";

            Ext.Ajax.request({
                method: 'POST',
                url: fs_url + '?',
                params: {
                    json: json
                },
                success: this.postNewSuccess.createDelegate(this),
                failure: this.postNewFail.createDelegate(this)
            });
        },

        // Create new help window if required, otherwise bring to top
        launchHelp: function () {
            if (!this.help_window || this.help_window.closed) {
                //this.help_window = window.open("http://www.nativemaps.org/?q=top_menu/1/88/156/221", "help_window", "menubar=1,toolbar=1,resizable=1,scrollbars=1,width=800,height=600");
                this.help_window = window.open("http://nativemaps.org/?q=taxonomy/term/221", 
                                               "help_window", 
                                               "menubar=1,toolbar=1,resizable=1,scrollbars=1,width=800,height=600");
            } else {
                this.help_window.focus();
            }
        },
        postNewSuccess: function (resp) {
            var o = {};
            try {
                o = Ext.decode(resp.responseText);
            }
            catch(e) {
                //alert(resp.responseText); // uncomment for exception debugging
                return;
            }
            if (true !== o.success) {
                if (o.errorMsg) {
                    Ext.MessageBox.alert('Shape not saved.', o.errorMsg, function () {});
                } else {
                    Ext.MessageBox.alert('Shape not saved.', o.error, function () {});
                }
            } else { // successful save

                // close the add meta data panel
                this.newShapePanel.hide();
                // make sure we clean up the edit shape, regardless of success or fail
                this.amndss_map_component.ed_vectors.removeFeatures([this.newShapePanel.currentFeature]);

                this.amndss_map_component.userShapesLayer.redraw();
                this.myPlaces.loadSavedUserShapes();
                this.myPlaces.updateSelectedFeatures();
            }
            //console.log("postNewSuccess");
        },
        postNewFail: function (resp) {
            //console.log("postNewFail");
        },
        shapeModifiedGetAttributes: function (shape) {
            return;
        }
    };
    obj._init();
    return obj;
};
