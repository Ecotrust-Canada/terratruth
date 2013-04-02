"""
URLConf for WMS layers
"""

from django.conf.urls.defaults import *
from django.views.generic.simple import direct_to_template
from django.contrib.auth import views as auth_views
from django.contrib import admin

from wms_layers.views import *

urlpatterns = patterns('',
                       url(r'^$', index),
                       url(r'^private/$', private),
)