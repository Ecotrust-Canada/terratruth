AMNDSS.LaunchReport = function () {
    var obj = {
        _init: function () {
            var forestry_actions = [];
            for (var i = 0; i < AMNDSS.user.reports.length; i++) {
                var report = AMNDSS.user.reports[i];
                forestry_actions.push([report]);
            }

            var store = new Ext.data.SimpleStore({
                fields: ['type'],
                data: forestry_actions
            });

            // Tools for report generation
            this.reportCombo = new Ext.form.ComboBox({
                hideLabel: true,
                store: store,
                displayField: 'type',
                mode: 'local',
                width: 250,
                listWidth: 250,
                emptyText: 'Select a report type...',
                editable: false,
                triggerAction: 'all'
            });

            this.reportResponse = function (resp, options) {
                var res = Ext.util.JSON.decode(resp.responseText);
                if (!res.success && res.error) {
                    Ext.Msg.alert('Report Error', res.error);
                } else {
                    this.deactivateBusyStatus();
                    this.launchReportWin.hide();
                    var report = new AMNDSS.ReportLayout(this.reportType, res);
                    this.reports = report;
                    var tabPanel = report.initLayout();
                    Ext.getCmp('centerComp').add(tabPanel);
                    Ext.getCmp('centerComp').doLayout();
                    Ext.getCmp('centerComp').activate(tabPanel);
                }
            };

            this.requestFail = function (resp) {
                //console.log("requestFail in amndssreport.js");
            };

            this.generateReport = function () {
                //console.log("generateReport");
                var grid = Ext.getCmp('userLayerGrid');
                var selections = [];
                var store = grid.getStore();
                for (var i = 0; i < store.getCount(); i++) {
                    if (store.getAt(i).get('selected')) {
                        selections.push(store.getAt(i));
                    }
                }
                var ids = "";
                if (selections.length) {
                    for (var i = 0; i < selections.length; i++) {
                        if (i === 0) {
                            ids = ids + selections[i].data.id;
                        } else {
                            ids = ids + "," + selections[i].data.id;
                        }
                    }
                    var url = '../referral/report';

                    this.reportType = this.reportCombo.getValue();

                    var params = 'task=CREATE_REPORT&reportType=' + this.reportType + '&ids=' + ids + '&output=json';

                    Ext.Ajax.request({
                        method: 'GET',
                        url: url + '?',
                        params: params,
                        scope: this,
                        success: this.reportResponse.createDelegate(this),
                        failure: this.requestFail.createDelegate(this),
                        extraOption: 'foo',
                        timeout: 300000
                    });

                } else {
                    // Warn the user that at least one shape from myshapes needs to be selected.
                    Ext.Msg.alert('Error', 'Please select at least one shape from MyShapes to use in the report generation');
                }
            };

            this.reportStatusBar = new Ext.StatusBar({
                defaultText: '',
                busyText: 'Generating report...',
                id: 'report-statusbar',
                iconCls: 'ready-icon'
            });

            this.launchReport = new Ext.FormPanel({
                border: false,
                frame: false,
                bodyStyle: 'padding:5px 5px 0',
                defaultType: 'field',
                bbar: this.reportStatusBar,
                items: [
                this.reportCombo]
            });

            this.generateButton = new Ext.Button({
                text: 'Generate Report',
                id: 'btnGenerateReport',
                listeners: {
                    'click': {
                        fn: function () {
                            this.activateBusyStatus();
                            this.generateReport();
                        },
                        scope: this
                    }
                }
            });

            this.launchReportWin = new Ext.Window({
                xtype: 'x-window',
                id: 'report-window',
                title: 'Run Report',
                layout: 'fit',
                resizable: false,
                closable: false,
                width: 300,
                height: 150,
                items: [this.launchReport],
                buttons: [this.generateButton, {
                    text: 'Close',
                    listeners: {
                        'click': {
                            fn: function () {
                                this.deactivateBusyStatus();
                                this.launchReportWin.hide();
                            },
                            scope: this
                        }
                    }
                }]
            });
        },
        getLaunchReportPanel: function () {
            return this.launchReportWrap;
        },

        startLaunch: function () {
            this.launchReport.launchReportWin.show();
        },

        activateBusyStatus: function () {
            this.generateButton.disable();
            this.reportStatusBar.showBusy();
        },

        deactivateBusyStatus: function () {
            this.generateButton.enable();
            this.reportStatusBar.clearStatus();
        }
    };

    obj._init();
    return obj;

};
