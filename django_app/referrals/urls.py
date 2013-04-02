"""
URLConf for referral shape creation and analysis.
"""

from django.conf.urls.defaults import *
from django.views.generic.simple import direct_to_template
from django.contrib.auth import views as auth_views
from django.contrib import admin

from referrals.views import *

urlpatterns = patterns('',
                       url(r'^$', index),
                       url(r'^report/$', run_report),
                       url(r'^add_referral_shape/$', add_referral_shape),
                       url(r'^add_referral_info/(.*)$', add_referral_info, name='add_referral_info'),
                       url(r'^update_referral_shape_status/(\d+)/(\d+)$', update_referral_shape_status),
                       url(r'^get_status_types/$', get_status_types),
                       url(r'^get_referral_shapes/$', get_referral_shapes),
                       url(r'^get_referral_shape_meta_data/(\d+)$', get_referral_shape_meta_data),
                       url(r'^delete_referral_shape/$', delete_referral_shape),
                       url(r'^upload_referral_shapefile/$', upload_referral_shapefile),
                       url(r'^upload_referral_shapefile_form/$', upload_referral_shapefile_form),
                       url(r'^shape/download/$', download_referral_shapes),
                       url(r'^image/add/$', image_add),
                       url(r'^image/rectify/(\d+)$', image_rectify),
                       url(r'^image/delete/(\d+)$', image_delete),
                       url(r'^image/last/$', get_last_image_info),
                       url(r'^images/$', get_image_info),
                       url(r'^image/orig/(\d+)$', get_orig_image),
                       url(r'^image/rectified/wms/(\d+)$', get_rectified_wms_image),                       
                       url(r'^image/rectified/(\d+)$', get_rectified_image),
                       url(r'^(.*\.html?)$', render_html, name='referral_render_html')
)

