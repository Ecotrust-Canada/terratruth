from django.http import HttpResponse
from django.http import HttpResponseRedirect
from django.contrib.auth.decorators import login_required
from django.template import RequestContext
from django.shortcuts import get_object_or_404
from django.shortcuts import render_to_response

from user_groups.models import UserGroup
from wms_layers.models import Private, Rectifier

from util.geojson_encode import *

from referrals.models import ReferralReport, ReferralStatus

import settings, os, simplejson, wms_layers.views

#import logging

#logging.basicConfig(
#    level = logging.DEBUG,
#    format = '%(asctime)s %(levelname)s %(message)s',
#)

def index(request):
    if request.user.is_authenticated():
        return HttpResponseRedirect('main')
    else:    
        return HttpResponseRedirect('home')    

#If a new javascript file is added to the app, it must be added to this list
#Consider moving to the settings file instead of burying in views
amn_js_files = [
    'amndss.js',
    'ext.ux.toast.js',
    'color-picker.ux.js',
    'LayerTree.js',
    'amndsslayerlist.js',
    'amndssol.js',
    'amndssolext.js',
    'amndssfindlocation.js',
    'amndsslegendcontext.js',
    'amndsslegendwindow.js',
    'amndssuploadshapefile.js',
    'amndsslaunchreport.js',
    'amndssprint.js',
    'amndssmyplaces.js',
    'amndssshapemanager.js',
    'amndsslayout.js',
    'amndssreportlayout.js',
    'amndssrectifier.js',
    'amndsslogin.js',
    'utmzoompanel.js',
    'latlongzoompanel.js',
    'addresszoompanel.js'
]

# Aggregates AMN js files into one without minifying or compressing.
def jsfull(request):
    js = "" 
    for file in amn_js_files:
        js = js + open(settings.MEDIA_ROOT+'js/%s'%file, 'r').read()
    return HttpResponse(js,mimetype="text/javascript")    

# Aggregates AMN js files into one with minifying, reducing the file size, but making it difficult to debug on the client
def jsmin(request):
    js = "" 
    #Minify by default, but leave it full text for debugging if requested using the minify=false param
    for file in amn_js_files:
        js = js + os.popen("cat "+settings.MEDIA_ROOT+"js/%s | jsmin"%file).read()
    return HttpResponse(js,mimetype="text/javascript")    

# GNG 25June09
# The following code handles minify-ing all the proj4js-specific javascript files for
# performance. If a new proj4js file is added to the app, it must be added to this list
def jsmin_proj4js(request):
    js_proj4js = "" 

    # loop through each file, and pass it through the js minifier
    for file in ('proj4js-compressed.js',
                 'defs/EPSG900913.js',
                 'defs/EPSG3005.js',
                 'defs/EPSG3160.js',
                 'defs/EPSG3161.js',
                 'defs/EPSG3155.js',
                 'defs/EPSG3156.js',
                 'defs/EPSG3157.js',
                 'defs/EPSG2955.js'):
            js_proj4js = js_proj4js + os.popen("cat /var/www/webmap/proj4js/lib/%s | jsmin"%file).read()

    # return all the files into a single response
    return HttpResponse(js_proj4js,mimetype="text/javascript")    

@login_required
def load_dst(request):
    return render_to_response('load_dst.html', RequestContext(
        request,{
            'minify':settings.MINIFY,
            'GOOGLE_API_MAPS_KEY':settings.GOOGLE_API_MAPS_KEY,
            'referral_status_options':simplejson.dumps([[r.id,r.title] for r in ReferralStatus.objects.all()]),
            'external_wms_layers':simplejson.dumps(wms_layers.views.get_external_wms_layers()),
            'rectifier_wms_layers':simplejson.dumps(wms_layers.views.get_rectifier_wms_layers()),
            'spatial_reference_id':settings.SPATIAL_REFERENCE_ID
        })
    )

"""
User web service
"""
@login_required
def user(request):
    if request.method == 'GET':
        retUser = {}
        retUser["username"] = request.user.username
        retUser["email"] = request.user.email       

        #Get users groups
        groups = UserGroup.objects.filter(members__username=request.user.username)
                
        group_list = []
        if len(groups) > 0:
            #Add wms layers
            for x in range(len(groups)):
                group = groups[x]
                new_group = {}
                new_group['group_name'] = group.name

                #Get locations and zoom setting for group
                new_group['lat_coord'] = group.lat_coord
                new_group['long_coord'] = group.long_coord
                new_group['mapzoom'] = group.mapzoom
                
                #Get layers associated with group
                layers = Private.objects.filter(owner=group)
                new_layers = []
                #Pull out layer info we want
                for layer in layers:
                    new_layer = {}
                    new_layer['layer_name'] = layer.name
                    new_layers.append(new_layer)
                new_group['layers'] = new_layers
                group_list.append(new_group)
            retUser['group_layers'] = group_list

            #Add reports
            reports = []
            for x in range(len(groups)):
                group = groups[x]
                    
                reports += [r.title for r in
                    ReferralReport.objects.filter(user_group=group)]     
            retUser['reports'] = reports
        return HttpResponse(geojson_encode(retUser), mimetype='text/javascript')
    
