from django.conf import settings
from django.conf.urls.defaults import *
from django.contrib import admin
from django.views.generic.simple import direct_to_template, redirect_to

from views import *
import wms_layers.views
admin.autodiscover()

from django.contrib.auth.views import password_reset, password_reset_done, password_change, password_change_done

urlpatterns = patterns('',
    (r'^$', index),
    (r'^admin/(.*)', admin.site.root),
    (r'^user/', user),
    (r'^dss/', load_dst),
    (r'^dst/', redirect_to, {'url': '/dss'}),
    (r'^accounts/', include('registration.urls')),
    (r'^referral/', include('referrals.urls')),    
    (r'^profiles/', include('profiles.urls')),
    (r'^wms_layers/', include('wms_layers.urls')),
    (r'^jsmin_proj4js/', jsmin_proj4js),
    (r'^jsmin/', jsmin),
    (r'^jsfull/', jsfull),
    (r'^print/', 'amndssprint.views.index'),
    (r'^getfonts/', wms_layers.views.get_fonts),
    (r'^tmp/(.*)$','django.views.static.serve',{'document_root': "/tmp/", 'show_indexes': True}),   
)

urlpatterns += patterns('',
    (r'^accounts/profile/$', direct_to_template, {'template': 'registration/profile.html'}),
    (r'^accounts/password_reset/$', password_reset, {'template_name': 'registration/password_reset.html'}),
    (r'^accounts/password_reset_done/$', password_reset_done, {'template_name': 'registration/password_reset_done.html'}),
    (r'^accounts/password_change/$', password_change, {'template_name': 'registration/password_change_form.html'}),
    (r'^accounts/password_change_done/$', password_change_done, {'template_name': 'registration/password_change_done.html'}),
)

if settings.DEBUG is True:
    urlpatterns += patterns('',
        (r'^media/(.*)$','django.views.static.serve',{'document_root': settings.MEDIA_ROOT, 'show_indexes': True}),     
        #GIS tools
        (r'^webmap/(.*)$','django.views.static.serve',{'document_root': settings.WEBMAP_ROOT, 'show_indexes': True})
    )
