Ext.namespace('AMNDSS');

AMNDSS.user = {
    username: '',
    reports: {}
};

AMNDSS.VERSIONNUM = "0.1";
Ext.Ajax.timeout = 120000;

// Capture the back button to make sure people dont loose their changes
window.onbeforeunload = function() {   
    return "Any unsaved information will be lost.";   
};  

//Globals
var amndsslogin = null;
var amndsslayoutinstance = null;

AMNDSS.urlParams = {};
(function () {
    var match,
        pl     = /\+/g,  // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
        query  = window.location.search.substring(1);

    while (match = search.exec(query))
       AMNDSS.urlParams[decode(match[1])] = decode(match[2]);
})();

function finishload(){
    Ext.get('loading-mask').fadeOut({remove: false});
    Ext.get('loading').fadeOut({remove: false});
}

Ext.onReady(function(){
    // Send down to the server to load components
    Ext.QuickTips.init();
    amndsslayoutinstance = new AMNDSS.Layout();
    delay_finish = new Ext.util.DelayedTask(finishload);
    delay_finish.delay(500);
});

