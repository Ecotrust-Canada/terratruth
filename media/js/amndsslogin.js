AMNDSS.Login = function () {
    this.base_url = '';
    this.addEvents({
        "user_info_loaded": true
    });
};

Ext.extend(AMNDSS.Login, Ext.util.Observable, {
    //Get user info from server
    load_user_info: function (callback) {
        this.login_callback = callback;
        Ext.Ajax.request({
            method: 'GET',
            url: this.base_url + '/user/',
            success: this.load_user_info2.createDelegate(this)
        });
    },
    //Process user info from server
    load_user_info2: function (response) {
        if (response && response.responseText) {
            var user_obj = Ext.util.JSON.decode(response.responseText);
            if (!user_obj.error && user_obj.username !== '') {
                AMNDSS.user = user_obj;
                this.fireEvent("user_info_loaded");
                return;
            }
        }
        Ext.Msg.alert('Error', 'Unable to load your user data, redirecting to main page');
        window.location = this.base_url;
    }
});
