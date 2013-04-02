//Constructor
AMNDSS.ReportLayout = function(reportType, data){
    this.data = data;
    this.reportType = reportType;
};

Ext.extend(AMNDSS.ReportLayout, Ext.util.Observable, {
    initLayout: function() {
        this.layout = new Ext.Panel({
            xtype:'panel',
            id: 'report_panel'+Math.floor(Math.random()*999999),
            title: 'Report',
            closable: true,
            iconCls: 'report-tab',
            autoScroll: true,
            html: this.data.html,
            buttons: [{
                text: 'View Printable Report',
                listeners: {
                    'click' : {
                        fn: function(){this.exportDataToFile();},
                        scope: this
                    }
                }
            }]
        });

        return this.layout;
    },

    exportDataToFile: function() {
    	var loc = "../referral/report/?task=CREATE_REPORT&output=html&reportType="+escape(this.reportType)+"&ids="+this.data.ids;
    	window.open(loc);
    }
});