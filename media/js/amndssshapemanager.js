/*
 * This script manages creation, uploading and deletion of shape files in the DST
 * It needs to be loaded BEFORE the amndsslayout.js script as it is reference there. 
 * 
 */
AMNDSS.Shapes = {
    _initNewShape: function () {

        this.newShapeForm = new Ext.FormPanel({
            labelAlign: 'top',
            bodyStyle: 'padding:5px',
            monitorValid: true,
            items: [{
                layout: 'column',
                border: false,
                items: [{
                    layout: 'form',
                    border: false,
                    columnWidth: 0.5,
                    items: [new Ext.form.TextField({
                        fieldLabel: 'Land Use Activity Shape *',
                        name: 'description',
                        allowBlank: false,
                        width: 300
                    })]
                }, {
                    layout: 'form',
                    border: false,
                    columnWidth: 0.5,
                    items: [new Ext.form.TextField({
                        fieldLabel: 'Referral Tracking System ID',
                        name: 'rts_id',
                        allowBlank: true,
                        width: 300
                    })]
                }]
            }, {
                xtype: 'tabpanel',
                plain: true,
                activeTab: 0,
                height: 1000,
                /* By turning off deferred rendering we are guaranteeing that the
                       form fields within tabs that are not activated will still be rendered.
                       This is often important when creating multi-tabbed forms. */
                deferredRender: false,
                defaults: {
                    bodyStyle: 'padding:10px'
                },
                items: [{
                    title: 'Contact Information',
                    layout: 'column',
                    autoScroll: true,
                    items: [AMNDSS.Shapes.contactDetailsFormLeft,
                            AMNDSS.Shapes.contactDetailsFormRight]
                }, {
                    title: 'Dataset Details',
                    layout: 'column',
                    autoScroll: true,
                    items: [AMNDSS.Shapes.dataDetailsFormLeft,
                            AMNDSS.Shapes.dataDetailsFormRight]
                }]
            }],

            buttons: [{
                text: 'Save',
                formBind: true,
                listeners: {
                    'click': {
                        fn: function () {
                            this.shapeAdded();
                            this.newShapePanel.hide();
                            new Ext.ux.ToastWindow({
                                title: 'Save Complete',
                                html: 'Shape file meta data saved.'
                                //, iconCls: ''
                            }).show(document);
                        },
                        scope: this
                    }
                }
            }, {
                text: 'Cancel',
                listeners: {
                    'click': {
                        fn: function () {
                            this.newShapePanel.hide();
                            this.amndss_map_component.ed_vectors.removeFeatures([this.newShapePanel.currentFeature]);
                        },
                        scope: this
                    }
                }
            }]
        });

        this.newShapePanel = new Ext.Window({
            xtype: 'x-window',
            el: 'newshapequestions',
            id: 'question-window',
            title: 'Add Shape Metadata',
            layout: 'fit',
            closable: false,
            resizable: false,
            width: 700,
            height: 500,
            items: [this.newShapeForm]
        });
        return this.newShapePanel;
    },

    contactDetailsFormLeft: {
        layout: 'form',
        columnWidth: 0.5,
        border: false,
        items: [new Ext.form.TextField({
            fieldLabel: 'Organization',
            name: 'contact_organization',
            allowBlank: true,
            width: 300
        }), new Ext.form.TextField({
            fieldLabel: 'Contact Person',
            name: 'contact_person',
            allowBlank: true,
            width: 300
        }), new Ext.form.TextField({
            fieldLabel: 'Title',
            name: 'contact_person_title',
            allowBlank: true,
            width: 300
        }), new Ext.form.TextField({
            fieldLabel: 'Phone',
            name: 'contact_phone_voice',
            allowBlank: true,
            width: 300
        }), new Ext.form.TextField({
            fieldLabel: 'Fax',
            name: 'contact_phone_fax',
            allowBlank: true,
            width: 300
        }), new Ext.form.TextField({
            fieldLabel: 'Email',
            name: 'contact_email',
            allowBlank: true,
            width: 300
        })]
    },

    contactDetailsFormRight: {
        layout: 'form',
        columnWidth: 0.5,
        border: false,
        items: [new Ext.form.TextField({
            fieldLabel: 'Address',
            name: 'address_street',
            allowBlank: true,
            width: 300
        }), new Ext.form.TextField({
            fieldLabel: 'City',
            name: 'address_city',
            allowBlank: true,
            width: 300
        }), new Ext.form.TextField({
            fieldLabel: 'Province/State',
            name: 'address_province_or_state',
            allowBlank: true,
            width: 300
        }), new Ext.form.TextField({
            fieldLabel: 'Postal Code/Zip',
            name: 'address_postal_code',
            allowBlank: true,
            width: 300
        }), new Ext.form.TextField({
            fieldLabel: 'Country',
            name: 'address_country',
            allowBlank: true,
            width: 300
        })]
    },

    dataDetailsFormLeft: {
        layout: 'form',
        columnWidth: 0.5,
        border: false,
        items: [new Ext.form.TextField({
            fieldLabel: 'Creator',
            name: 'dataset_creator',
            allowBlank: true,
            width: 300
        }), new Ext.form.TextField({
            fieldLabel: 'Content publisher',
            name: 'dataset_content_publisher',
            allowBlank: true,
            width: 300
        }), new Ext.form.TextField({
            fieldLabel: 'Publication Place',
            name: 'dataset_publication_place',
            allowBlank: true,
            width: 300
        }), new Ext.form.DateField({
            fieldLabel: 'Publication Date',
            format: 'Y-m-d',
            name: 'dataset_publication_date',
            allowBlank: true,
            width: 284
        }), new Ext.form.TextField({
            fieldLabel: 'Abstract/Description',
            name: 'dataset_abstract_description',
            allowBlank: true,
            width: 300
        }), new Ext.form.TextField({
            fieldLabel: 'Scale',
            name: 'dataset_scale',
            allowBlank: true,
            width: 300
        }), new Ext.form.DateField({
            fieldLabel: 'Date Depicted',
            format: 'Y-m-d',
            name: 'dataset_date_depicted',
            allowBlank: true,
            width: 284
        })]
    },

    dataDetailsFormRight: {
        layout: 'form',
        columnWidth: 0.5,
        border: false,
        items: [new Ext.form.TextField({
            fieldLabel: 'Time Period',
            name: 'dataset_time_period',
            allowBlank: true,
            width: 300
        }), new Ext.form.TextField({
            fieldLabel: 'Geographic Keywords',
            name: 'dataset_geographic_key_words',
            allowBlank: true,
            width: 300
        }), new Ext.form.TextField({
            fieldLabel: 'Theme Keywords',
            name: 'dataset_theme_key_words',
            allowBlank: true,
            width: 300
        }), new Ext.form.TextField({
            fieldLabel: 'Security Classification',
            name: 'dataset_security_classification',
            allowBlank: true,
            width: 300
        }), new Ext.form.TextField({
            fieldLabel: 'Who Can Access The Data',
            name: 'dataset_who_can_access_the_data',
            allowBlank: true,
            width: 300
        }), new Ext.form.TextField({
            fieldLabel: 'Use Constraints/Distribution Liability',
            name: 'dataset_use_constraints',
            allowBlank: true,
            width: 300
        })]
    }

};