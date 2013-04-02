from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.shortcuts import render_to_response
from django.template import RequestContext

from util.geojson_encode import *
from util.file_extension import *

from user_groups.models import UserGroup
from wms_layers.models import Private, External, Rectifier
from settings import PRIVATE_MAPFILE, USER_LOADED_MAPFILE, DATABASE_PASSWORD

import settings
import mapscript
import os, sys, re, datetime, os.path, zipfile

import logging, simplejson

logging.basicConfig(
    level = logging.DEBUG,
    format = '%(asctime)s %(levelname)s %(message)s',
)

'''Returns JSON listing the groups the user is associated with and the WMS layers available
for each
[
    {group_name, layers:[layer_name,...]},
    ...
]
'''
@login_required
def index(request):
    #Get users groups
    res = []
    groups = UserGroup.objects.filter(members__username=request.user.username)
    if len(groups) > 0:
        #Pull out group info we want
        for x in range(len(groups)):
            group = groups[x]
            new_group = {}
            new_group['group_name'] = group.name            
            #Get layers associated with group
            layers = Private.objects.filter(owner=group)
            layers.order_by('order')
            #logging.debug(layers)
            #open("/tmp/clark.log",'w').write('%s'%layers)
            new_layers = []
            #Pull out layer info we want
            for layer in layers:
                new_layer = {}
                new_layer['layer_name'] = layer.name
                new_layers.append(new_layer)                
            new_group['layers'] = new_layers
            res.append(new_group)
    
    return HttpResponse(geojson_encode(res), mimetype='text/javascript')

def private(request):
    #Must be logged in
    if not request.user.is_authenticated():
        error_msg = "WMS Request Error: You aren't logged in"
        return render_to_response('plain_500.html', {'error_msg': error_msg}, context_instance=RequestContext(request))

    #Only allow GET request
    if request.method != 'GET':
        error_msg = "WMS Request Error: Only a GET request is supported"
        return render_to_response('plain_500.html', {'error_msg': error_msg}, context_instance=RequestContext(request))
    
    #Don't allow user to specify their own mapfile
    if request.GET.has_key('map') or request.GET.has_key('MAP'):
        error_msg = "WMS Request Error: Specifying a custom mapfile is not allowed"
        return render_to_response('plain_500.html', {'error_msg': error_msg}, context_instance=RequestContext(request))
                 
    #Fetch layers user has permission to access
    #is_user_loaded, user_layers = __get_user_layer_info(request)
    user_layers = __get_user_layer_info(request)
    #Fetch layers user is trying to use
    layer_str = ""
    if request.GET.has_key('layers'):
        layer_str = request.GET['layers']
    elif request.GET.has_key('LAYERS'):
        layer_str = request.GET['LAYERS']
    elif request.GET.has_key('LAYER'):
        layer_str = request.GET['LAYER']
    elif request.GET.has_key('layer'):
        layer_str = request.GET['layer']                
    else:
        error_msg = "WMS Request Error: missing LAYERS parameter" 
        return render_to_response('plain_500.html', {'error_msg': error_msg}, context_instance=RequestContext(request))                             
    req_layers = layer_str.split(',')
    
    #Check user has permission to access those layers
    for req_layer in req_layers:
        if req_layer not in user_layers:
            error_msg = "WMS Request Error: you don't have permission to access a layer named "+req_layer+", if it even exists" 
            return render_to_response('plain_500.html', {'error_msg': error_msg}, context_instance=RequestContext(request))                                                                     

    #Generate image from WMS request parameters using Mapserver mapscript module
    import mapscript

    req = mapscript.OWSRequest()

    request_type = None
    if request.GET.has_key('REQUEST'):
        request_type = request.GET['REQUEST']
    elif request.GET.has_key('request'):
        request_type = request.GET['request']
    else:
        error_msg = "Missing 'REQUEST' parameter"
        return render_to_response('plain_500.html', {'error_msg': error_msg}, context_instance=RequestContext(request))                             

    if request_type == 'GetLegendGraphic':
        req.loadParams()  
    else:
        #Simply using the mapscript loadParams call will bork the django dev server so process manually
        mime = request.GET['FORMAT']
        req.setParameter("bbox", request.GET['BBOX'])
        req.setParameter("width", request.GET['WIDTH'])
        req.setParameter("height", request.GET['HEIGHT'])
        req.setParameter("srs", request.GET['SRS'])
        req.setParameter("format", mime)
        req.setParameter("layers", request.GET['LAYERS'])
        req.setParameter("request", request_type)
        req.setParameter("transparent", request.GET['TRANSPARENT'])

    map = mapscript.mapObj(PRIVATE_MAPFILE)

    #Specify database password for each layer object
    if request.GET.has_key('LAYERS'):
        layer_list = request.GET.get('LAYERS').split(',')
    else:
        layer_list = [request.GET.get('LAYER')] #Just one

    for layer_name in layer_list:
        layerObj = map.getLayerByName(layer_name)
        layerObj.connection = 'user=amndss dbname=amndss host=localhost password=%s' % (DATABASE_PASSWORD)

    if request_type == 'GetMap':
        map.loadOWSParameters(req)

    image = map.draw().getBytes()
    response = HttpResponse()
    response['Content-length'] = len(image)
    response['Content-Type'] = mime
    response.write(image)
    return response
    

def __get_user_layer_info(request):
    layer_set = Private.objects.filter(owner__members__username=request.user.username)
    layer_set.order_by("order")
    #is_user_loaded = len([x.user_file for x in layer_set]) > 0
    #return is_user_loaded, [x.name for x in layer_set]
    return [x.name for x in layer_set]

# generic function that fetches all records from a
# specified table and converts them to json string
def django2python(all_records,fields=None,m2m = []):

    response_dict={}

    if fields is None and len(all_records) > 0:
        fields = all_records[0].__dict__.keys()

    for record in all_records:
  
        record_dict = {}

        # compile the standard attributes of this object into a dict for JSON.
        for key in fields:
            if key[0:1] == '_': continue
            
            item = getattr(record,key)
            # convert anything that's not an int or a float to a string.
            if type(item) in [int,float]:
                record_dict[key] = item
            elif hasattr(item,'id'):
                record_dict[key] = id
            elif type(item) is list:
                for key in m:
                    if hasattr(record,key):
                        record_dict[key] = [item.id for item in getattr(record,key)]
                    else:
                        record_dict[key] = []
            #TODO: consider using javascript dates properly.
            #elif type(item) == datetime:
            #    record_dict[key] = "new Date (%s,%s,%s,%s,%s)" % ( item.year, item.month - 1, item.day, item.hour, item.minute)
            else:
                record_dict[key] = unicode(item)
        # resolve many-to-many relationships        
        for rel in m2m:
            record_dict[rel] = [obj.id for obj in getattr(record,rel).all()]
            
        # compile the foreign keys and many-to-many relationship attributes of this object into a list of IDs.
        response_dict[record_dict['id']] = record_dict

    return response_dict

'''Returns JSON listing the groups the user is associated with and the External WMS layers available
for each
[
    {group_name, layers:[layer_name,...]},
    ...
]
'''
@login_required
def index_external(request):
    #Get users groups
    res = []
    groups = UserGroup.objects.filter(members__username=request.user.username)
    if len(groups) > 0:
        #Pull out group info we want
        for x in range(len(groups)):
            group = groups[x]
            new_group = {}
            new_group['group_name'] = group.name            
            #Get layers associated with group
            layers = External.objects.filter(owner=group)
            layers.order_by('order')
            new_layers = []
            #Pull out layer info we want
            for layer in layers:
                new_layer = {}
                new_layer['layer_name'] = layer.name
                new_layers.append(new_layer)                
            new_group['layers'] = new_layers
            res.append(new_group)
    
    return res

def get_external_wms_layers():

    #add the mapfile connection parameter into the layers so chained layers' legend graphic can be loaded.
    py_layers = []
    for layer in External.objects.all().order_by('order'):
        py_layers.append({
            "name": layer.name,
            "order": layer.order,
            "wms_name": layer.wms_name,
            "visibility": layer.visibility,
            "active": layer.active,
            "format": layer.format.format,
            "url": layer.url,
            "layers": [s.strip() for s in layer.layers.split(",")],
            "srs": layer.srs.srs_id,
            "display_in_layer_switcher": layer.display_in_layer_switcher,
            "isBaseLayer": layer.is_base_layer,
            "opacity": layer.opacity,
            "hide_in_legend": layer.hide_in_legend,
            "transparent": layer.transparent
        })

    return simplejson.dumps(py_layers)
   
def get_rectifier_wms_layers():

    #add the mapfile connection parameter into the layers so chained layers' legend graphic can be loaded.
    py_layers = []
    for layer in Rectifier.objects.all().order_by('order'):
        py_layers.append({
            "name": layer.name,
            "order": layer.order,
            "wms_name": layer.wms_name,
            "visibility": layer.visibility,
            "active": layer.active,
            "format": layer.format.format,
            "url": layer.url,
            "layers": [s.strip() for s in layer.layers.split(",")],
            "srs": layer.srs.srs_id,
            "display_in_layer_switcher": layer.display_in_layer_switcher,
            "isBaseLayer": layer.is_base_layer,
            "opacity": layer.opacity,
            "transparent": layer.transparent
        })

    return simplejson.dumps(py_layers)

def __get_external_layer_names(request):
    layer_set = ExternalWMSLayer.objects
    layer_set.order_by("order")
    return [x.name for x in layer_set]

def __get_rectifier_layer_names(request):
    layer_set = Rectifier.objects
    layer_set.order_by("order")
    return [x.name for x in layer_set]

def upload_shape_file(request):
    
    theme_id = request.POST['theme']
    theme = models.theme.objects.get(id=int(theme_id))
    file = request.FILES.has_key('image') and request.FILES['image']
    content = request.POST['content']

    if file and file.name:
        filename = file.name
        filepath = None
        idx = 0
        while not filepath or os.path.exists(filepath):
            parts = os.path.splitext(filename)
            filename = parts[0] + str(idx) + parts[1]
            filepath = os.path.join('/tmp/',filename)
            idx += 1
            
        filetype = file_extension(filename.lower())
        is_zip = filetype == 'zip'
        if not is_zip:
            return HttpResponse(generate_error_html("Please upload a ZIP file."));

        try:
            zfile = zipfile.ZipFile(file, 'r')
            corr_extensions = ['dbf', 'prj', 'shp', 'shx']
            extensions = [file_extension(i.lower()) for i in zfile.namelist()]
            good_zip_file = True
            shp_filename = ''
            for ce in corr_extensions:
                if ce not in extensions:
                    good_zip_file = False
                    break
            if not good_zip_file:
                return HttpResponse(generate_error_html("ZIP file should include the following files: .shp, .shx, .dbf, .prj"));
        except:
            return HttpResponse(generate_error_html("Invalid ZIP file."));
        if True:
            for name in zfile.namelist():
                data = zfile.read(name)
                fname = re.sub(r'[^a-zA-Z\d\.]', '', name.lower())
                path = os.path.join('/tmp/', fname)
                if file_extension(fname) == 'shp':
                    shp_filename = fname
                fd = open(path, 'wb')
                fd.write(data)
                fd.close()
                os.chmod(path, 0777)
                
            ########################################
            description = request.POST['content']
            name=request.POST['name'] 
            source=request.POST['source']
            date_start=date_or_null(request.POST['date_start'])
            date_end=date_or_null(request.POST['date_end'])

            ds = DataSource(os.path.join('/tmp/',shp_filename))
            shapes = []
            for layer in ds:
                for feature in layer:
                    fields = {}
                    for fn in feature.fields:
                        if type(fn) == str:
                            fn = "".join(filter(lambda x: ord(x)<128, fn))
                        fields[fn] = feature.get(fn)
                        if type(fields[fn]) == str:
                            fields[fn] = "".join(filter(lambda x: ord(x)<128, fields[fn]))
                    fields_str = simplejson.dumps(fields)
                    trans_geom = feature.geom.transform(4326,clone=True)
                    new_geo_collection = GEOSGeometry(trans_geom.wkt)
                    shapes.append(new_geo_collection)

            new_shape = GeometryCollection(shapes)
            uus = models.UserUploadedShapes(geoms=new_shape,attributes=fields_str,name=name,description=description,theme=theme,source=source,start_date=date_start,end_date=date_end,style='{}')
            uus.save()
            shapes_json = render_to_geojson([uus], models.UserUploadedShapes, 'geoms', raw=True)
            return upload_template(str(shapes_json),'')

    else: 
        return upload_template('{success:False}',generate_error_html("Please upload a valid ZIP file."));

def ajaxRsp(body):
    response = HttpResponse(body,mimetype='text/plain')
    response['Cache-Control'] = "no-cache"
    response['Pragma'] = 'no-cache'
    response['Expires'] = '-1'
    return response

def get_fonts(request):
    fontfiledir = settings.MAPSERVER_DIR + 'etc/fonts.txt'
    fontfile = open(fontfiledir)
    fonts = [line.split(' ')[0] for line in fontfile.readlines()]
    if "" in fonts:
        fonts.remove("")
    fontfile.close()

    return ajaxRsp(simplejson.dumps({
      'fonts' : fonts
    }))
