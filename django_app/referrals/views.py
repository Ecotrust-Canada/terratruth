import simplejson
from django.http import HttpResponse
from django.http import HttpResponseRedirect
from django.contrib.auth.decorators import login_required
from django.template import RequestContext
from django.shortcuts import get_object_or_404
from django.shortcuts import render_to_response
from django.contrib.gis.geos import GEOSGeometry
from django.contrib.gis.geos import fromstr
from django.contrib.gis.geos.error import GEOSException
from util.shp_response import *
from django.conf import settings
from django.contrib.gis.gdal import DataSource
from django.db.models import Q
from django.forms.models import modelformset_factory

import django
if django.VERSION[1] > 1:
    from django.db.models.base import ModelState
else:
    ModelState = None
    
from user_groups.models import UserGroupMembership, UserGroup
from forms import ImageAddForm, ShapeAddForm, ReferralInfoForm
from referrals.models import *
from util.geojson_encode import geojson_encode
import settings

from django.core.urlresolvers import reverse

import sys

import logging

logging.basicConfig(
    level = logging.DEBUG,
    format = '%(asctime)s %(levelname)s %(message)s',
)

'''
Loads the AMN client from template
'''
@login_required
def index(request):
    return render_to_response('load_dst.html', RequestContext(request,{}) )

############# Referral Report web service ###############   
'''
Report web service - Processes a report request
'''
def run_report(request):

    if not request.user.is_authenticated():
        return gen_error_resp("User not logged in")        
    if request.method != 'GET':    
        return gen_error_resp("Only GET is supported")
    if not request.GET.has_key('task'):
        return gen_error_resp("You must specify a task, for example task=CREATE_REPORT")
    if not request.GET.has_key('reportType'):
        return gen_error_resp("You must specify a reportType, for example reportType=report1")
    if not request.GET.has_key('ids'):
        return gen_error_resp("You must specify the shapes you want to analyze, for example ids=3,45,8")
    if request.GET['task'] != "CREATE_REPORT":
        return gen_error_resp("You must specify a task, for example task=CREATE_REPORT")

    report_type = request.GET['reportType']
    output = None
    if not request.GET.has_key('output'):
        output = 'json'
    else:
        output = request.GET['output']
        
    shape_id_string = request.GET['ids']
    shape_ids = shape_id_string.split(',')

    report = None
    from referrals.exceptions import ReportError    
    
    try:
        report_obj = ReferralReport.objects.get(title=report_type)
    except ReferralReport.DoesNotExist:
        return gen_error_resp("Either the requested report does not exist or you do not have permission to access it. Please contact an administrator.")

    try:
        report = ReferralShape.objects.generate(shape_ids, report_obj)
    except ReportError, e:
        return gen_error_resp(unicode(e.value))   

    from datetime import datetime
    doc = {
        'description':report_type,
        'date_added':str(datetime.now().strftime("%c (Pacific Standard Time)")),
        'notes':'The selected shape was analyzed against the public and private data.',
        'report':report,
        'ids':shape_id_string
    }
    
    if output == 'html':
        return render_to_response(report_obj.template, {'doc': doc}, RequestContext(request,{}) ) 
    else:
        from django.template import loader, Context
        t = loader.get_template(report_obj.template)

        c = Context({'user':request.user,'doc': doc})

        html = t.render(c)
        resp = {
                'success':True, 
                'html':html,
                'ids':shape_id_string
        }
        json = simplejson.dumps(resp)
        return HttpResponse(json, mimetype='text/plain')

############# Referral Shape web service ###############

def gen_error_resp(msg):
    msg = msg.replace('\n','')
    return HttpResponse("{success:false, error:'"+msg+"'}", mimetype='text/plain')

'''
Shape web service - Processes a new referral shape (GeoJSON)
Creates a new ReferralShape record
'''
@login_required
def add_referral_shape(request):    
    if request.method == 'POST' and request.POST['json']:
        user_groups = UserGroupMembership.objects.filter(user=request.user)

        # if the user is a member of no group, they cannot post referral shapes
        if user_groups:
            try:
                new_referral = simplejson.loads(request.POST['json'])
                new_poly = fromstr(new_referral['wkt'], srid=3005) #GEOSGeometry(new_referral['wkt'])
#                new_poly = new_poly.transform(3005, clone=True)

                # make sure the new poly is not a line (which GEOS will allow, but we don't want)
                if new_poly.area == 0.0:
                    return HttpResponse('{success:false, errorMsg:"Invalid shape received - all shapes must have at least three points."}', 
                                        mimetype='text/plain')
                if new_referral.has_key('shape_id'):
                    ref = ReferralShape.objects.get(id=int(new_referral['shape_id']))
                    ref_meta_data = ref.referralshapemetadata
                    #logging.debug('modifying existing shape, which by some miracle worked on the first go')
                else:
                    #logging.debug('creating new shape')
                    ref = ReferralShape()
                    ref_meta_data = ReferralShapeMetaData()
                    
                ref.owner = request.user
                ref.user_group = user_groups[0].group # setting to the first group the user belongs to, for now
                ref.description = new_referral['description']
                ref.poly = new_poly
                ref.rts_id = new_referral['rts_id']
                        
                ref.save()

                ref_meta_data.referral_shape = ref
                ref_meta_data.contact_organization = new_referral['contact_organization']
                ref_meta_data.contact_person = new_referral['contact_person']
                ref_meta_data.contact_person_title = new_referral['contact_person_title']
                ref_meta_data.contact_phone_voice = new_referral['contact_phone_voice']
                ref_meta_data.contact_phone_fax = new_referral['contact_phone_fax']
                ref_meta_data.contact_email = new_referral['contact_email']
                ref_meta_data.address_street = new_referral['address_street']
                ref_meta_data.address_city = new_referral['address_city']
                ref_meta_data.address_province_or_state = new_referral['address_province_or_state']
                ref_meta_data.address_postal_code = new_referral['address_postal_code']
                ref_meta_data.address_country = new_referral['address_country']
                ref_meta_data.dataset_creator = new_referral['dataset_creator']
                ref_meta_data.dataset_content_publisher = new_referral['dataset_content_publisher']
                ref_meta_data.dataset_publication_place = new_referral['dataset_publication_place']
                ref_meta_data.dataset_publication_date = new_referral['dataset_publication_date'].strip() or None
                ref_meta_data.dataset_abstract_description = new_referral['dataset_abstract_description']
                ref_meta_data.dataset_scale = new_referral['dataset_scale']
                ref_meta_data.dataset_date_depicted = new_referral['dataset_date_depicted'].strip() or None
                
                ref_meta_data.dataset_time_period = new_referral['dataset_time_period']
                ref_meta_data.dataset_geographic_key_words = new_referral['dataset_geographic_key_words']
                ref_meta_data.dataset_theme_key_words = new_referral['dataset_theme_key_words']
                ref_meta_data.dataset_security_classification = new_referral['dataset_security_classification']
                ref_meta_data.dataset_who_can_access_the_data = new_referral['dataset_who_can_access_the_data']
                ref_meta_data.dataset_use_constraints = new_referral['dataset_use_constraints']
                
                ref_meta_data.save()
                
                return HttpResponse('{success:true}', mimetype='text/plain')

            except GEOSException, e: # GEOS will complain about points by raising an exception
                return HttpResponse('{success:false, errorMsg:"Invalid shape received - all shapes must have at least three points."}', mimetype='text/plain')
            #TODO [cvo] uncomment the next two lines.
            #except Exception, e: # catch any other exception
            #    return HttpResponse('{success:false, error:"'+ e.message + str(sys.exc_info()) +'"}', mimetype='text/plain')
        else:
            return HttpResponse('{success:false, errorMsg:"Not authorized to submit shapes - you have no group memberships."}', mimetype='text/plain')

    return HttpResponse('{success:false}', mimetype='text/plain')

@login_required
def get_referral_shapes(request):
    '''
    Shape web service - returns a users saved shapes
    '''
    if not request.user.is_authenticated():
        return HttpResponse('{success:false}', mimetype='text/plain')
    if request.method == 'GET':        
        # allow access to all shapes in group, if this is an admin
        user_groups = UserGroupMembership.objects.filter(user=request.user)
        if user_groups and user_groups[0].role.name == 'Admin':
            shape_set = ReferralShape.objects.filter(user_group=user_groups[0].group).order_by('id')
        else: # otherwise allow access only to the shapes the user owns
            shape_set = ReferralShape.objects.filter(owner=request.user).order_by('id')

        # Convert to shape since serializer doesn't know how
        # GNG 17Dec09 - also convert date fields as well
        features = []
        for shape in shape_set:
            attrs = shape.__dict__
            output = {}
            
            for key in attrs.keys():
                # filter out modelstate attributes since they aren't serializable
                if type(attrs[key]) != ModelState:
                    output[key] = attrs[key]
                    
            pol = fromstr(output['poly'])
            output['poly'] = pol.wkt
            info = shape.info()
            if info is not None:
                output['status_id'] = info.status.id
            else:
                output['status_id'] = -1
            
            features.append(output)
           
        wrapped_data = { 'features':features }
        json = simplejson.dumps( wrapped_data )
        return HttpResponse(json, mimetype='text/plain')
        
@login_required
def update_referral_shape_status(request, shape_id, status_id):
    info = ReferralShape.objects.get(pk=int(shape_id)).info()
    info.status = ReferralStatus.objects.get(pk=int(status_id))
    info.save()
    return HttpResponse('{success:true}', mimetype='text/plain')
    
@login_required
def get_referral_shape_meta_data(request, shape_id):
    if not request.user.is_authenticated():
        return HttpResponse('{success:false}', mimetype='text/plain')
    else:   
        shape = ReferralShape.objects.get(id=int(shape_id))
        try:
            shape_meta_data = ReferralShapeMetaData.objects.get(referral_shape=shape).__dict__
        except ReferralShapeMetaData.DoesNotExist:
            return HttpResponse("{success:false, errorMessage:'No meta data found. You may create it now.'}", mimetype='text/plain')
        dataset_publication_date = shape_meta_data['dataset_publication_date']
        if dataset_publication_date:
            shape_meta_data['dataset_publication_date'] = '%04d-%02d-%02d'%(
              dataset_publication_date.year,
              dataset_publication_date.month,
              dataset_publication_date.day )
            
        dataset_date_depicted = shape_meta_data['dataset_date_depicted']
        if dataset_date_depicted:            
            shape_meta_data['dataset_date_depicted'] = '%04d-%02d-%02d'%(
              dataset_date_depicted.year,
              dataset_date_depicted.month,
              dataset_date_depicted.day )
        
        data = {'data':shape_meta_data, 'success':True}
        json = simplejson.dumps( data )
        return HttpResponse(json, mimetype='text/plain')  
    
'''
Shape web service - processes a shape removal request given the id
'''
@login_required
def delete_referral_shape(request):    
    if request.method == 'POST' and request.POST['id']:
        del_shape = ReferralShape.objects.get(pk=request.POST['id'])
        if del_shape.owner == request.user:
            del_shape.delete()
        else:
            # see if this is an admin deleting a shape from their group
            user_groups = UserGroupMembership.objects.filter(user=request.user)
            if user_groups and user_groups[0].role.name == 'Admin' and del_shape.user_group == user_groups[0].group:
                del_shape.delete()

        return HttpResponse('{success:true}', mimetype='text/plain')
    return HttpResponse('{success:false}', mimetype='text/plain')

def upload_referral_shapefile_form(request):
    form = ShapeAddForm()
    return render_to_response("upload_shape_file.html", {"form": form}, context_instance=RequestContext(request))

'''
Shape web service - Handle upload of one or more new shapes packaged within a shapefile
'''
@login_required
def upload_referral_shapefile(request):
    save_result = None
    shapefilename = ""
    
    if request.method != 'POST':
        return HttpResponse('{success:false}', mimetype='text/plain')
    
    form = ShapeAddForm(request.POST, request.FILES)
    
    if form.is_valid():
        save_result = form.save()
        
        user_groups = UserGroupMembership.objects.filter(user=request.user)

        if user_groups:
            ds = DataSource(settings.TEMP_DIR+save_result['shapefilename'])
            i = 0
            for layer in ds:
                for feature in layer:
                    # create a poly object we can save to the db
                    trans_geom = feature.geom.transform(settings.SPATIAL_REFERENCE_ID,clone=True)
                    new_poly = GEOSGeometry( trans_geom.wkt )
                
                    # create a default description in case there is none in the shapefile
                    desc = form.cleaned_data['desc'] + ' ' + str(i+1) 
                    
                    # now see if there is a desc in the shapefile -- if so, append it to the desc the user entered via the form
                    shape_desc = ','.join([ field.value for field in feature \
                        if field.name[0:4] == 'desc' and field.value != ''])
                    
                    if shape_desc.strip():
                        desc += ' - ' + shape_desc
                    
                    new_shape = ReferralShape( owner = request.user, 
                                               user_group = user_groups[0].group,
                                               description = desc,
                                               poly = new_poly )
                    
                    new_shape.save()
                    shape_id = new_shape.id 
                    i = i + 1
            
            if request.POST.has_key('web_form_entry'):
                referral_info_url = reverse('add_referral_info',
                                      args=[shape_id])

                return HttpResponseRedirect(referral_info_url)
            
            return HttpResponse('', mimetype='text/plain')
        
        else: # request user is not a member of any group
            return HttpResponse('{success:false, errorMsg:"user not authorized"}', mimetype='text/plain')
    else: # form.is_valid() not true
        if request.POST.has_key('web_form_entry'):
                return render_to_response("upload_shape_file.html", {
                    "form": form,
                }, context_instance=RequestContext(request))
        
        return HttpResponse('invalid submission', mimetype='text/plain')

'''
Shape web service - handle download request for 1 or more saved shapes.
Packages them into a zipped shapefile
'''
@login_required
def download_referral_shapes(request):

    if request.method != 'GET':
        return gen_error_resp("Only GET requests are supported")
    if not request.GET.has_key('ids'):
        return gen_error_resp("You specify the shape id's to download")
    if not request.GET.has_key('output'):
        return gen_error_resp("You must specify an 'output' of kml or shapefile")

    ids = request.GET['ids']
    id_list = ids.split(',')

    Qs = Q(pk=-1)

    for i in id_list:
        Qs = Qs | Q(pk=i)
        
    # filter based on the Qs
    shape_set = ReferralShape.objects.filter(Qs)

    # if an admin, we filter based on group
    user_groups = UserGroupMembership.objects.filter(user=request.user)

    if user_groups and user_groups[0].role.name == 'Admin':
        shape_set = shape_set.filter(user_group=user_groups[0].group)
    else:
        shape_set = shape_set.filter(owner=request.user)

    if request.GET['output'] == 'shapefile':        # parse out the id's and filter the shape_set with Q's                            
        if shape_set:
            return ShpResponse(shape_set)

    elif request.GET['output'] == 'kml':
        result = """<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://earth.google.com/kml/2.2">
    <Document>
        <name>AMN KML</name>
        <Style id="transBluePoly">
            <LineStyle>
                <width>1.5</width>
            </LineStyle>
            <PolyStyle>
                <color>7dff0000</color>
            </PolyStyle>
            <BalloonStyle>
                <!-- a background color for the balloon -->
                <bgColor>ffffffff</bgColor>
                <!-- styling of the balloon text -->
                <text>
                <![CDATA[                    
                    <a target="_blank" href="http://amn.ecotrust.ca/amndss">
                    <img src="http://www.nativemaps.org/themes/amn_0.9/title_together.gif" height="66" width="358"/></a>
                    <br/><br/>
                    <b>$[name]</b>
                    <br/>
                    <b>$[the_description/displayName]: $[the_description]</b>
                ]]>
                </text>
            </BalloonStyle>
        </Style>"""
        
        for shape in shape_set:

            shape.poly.transform(4326)
            pointGeom = shape.poly
            import re
            reg = re.compile(r'(?P<point>\S+\s\S+,)')
            mat = reg.search(pointGeom.wkt)
            point = mat.group('point').replace('((','').replace(' ',',')
            
            #Polygon shape
            result = result + "<Placemark>\n"
            result = result + "<name>AMN Shape ID: "+str(shape.id)+"</name>"
            result = result + "<styleUrl>#transBluePoly</styleUrl>\n"
            result = result + "<ExtendedData>\n"  
                     
            result = result + CreateKmlExtendedDataSection("the_description", "Description", shape.description)
            result = result + "</ExtendedData>"
            result = result + shape.poly.kml 
            result = result + "</Placemark>\n"
            
            #Push Pin
            result = result + "<Placemark>\n"
            result = result + "<name>AMN Shape ID: "+str(shape.id)+"</name>"
            result = result + "<styleUrl>#transBluePoly</styleUrl>\n"
            result = result + "<ExtendedData>\n"            

            result = result + CreateKmlExtendedDataSection("the_description", "Description", shape.description)
            result = result + "</ExtendedData>"
            result = result + "<Point><coordinates>%s0</coordinates></Point>" % point 
            result = result + "</Placemark>\n"
            
        result = result + "</Document>\n</kml>\n"

        #logging.debug("result =" + result)
        response = HttpResponse(result,mimetype='application/vnd.google-earth.kml+xml kml')
        response['Content-Disposition'] = 'attachment; filename="AmnKmlExport.kml"'
        return response             

    return HttpResponse('{success:false}', mimetype='text/plain')

def CreateKmlExtendedDataSection(name, displayname, value):
    template = "<Data name=\"%s\">" % name                      
    template = template + "<displayName>%s</displayName>" % displayname
    template = template + "<value>%s</value>" % (str(value).replace('&', '&amp;').replace('<', '').replace('>', '').replace('"', '&quot;').replace("'", '&#39;').replace(',','\n'))
    template = template + "</Data>"
    return template

############# Referral Image web service ###############

'''
Image web service - Handles upload of a new image from the user
Creates a new ReferralImage record 
'''
@login_required
def image_add(request):  
    
    form = ImageAddForm(request.POST, request.FILES)
    if form.is_valid():   
        form.save(request)    
    return HttpResponse('', mimetype='text/javascript')

'''
Image web service - Returns latest ReferralImage info as JSON including information 
about the height and width of the original image
'''
@login_required
def get_last_image_info(request):
    if not request.user.is_authenticated():
        return HttpResponse('{success:false,error:"not logged in"}', mimetype='text/plain')
    if request.method == 'GET':        
        image = ReferralImage.objects.filter(owner=request.user).order_by('-id')[0]
        if image.owner.username != request.user.username:
            return HttpResponse('{success:false, error: "You don\'t have permission to access this image"}', mimetype='text/plain')

        (width, height) = image.get_image_dim()
        image_dict = {'id':image.id,'title':image.title,'width':width,'height':height}
        wrapped_data = { 'image':image_dict }
        json = simplejson.dumps( wrapped_data )
        return HttpResponse(json, mimetype='text/javascript') 

'''
Image web service - Returns all of the users ReferralImage records as JSON
'''
@login_required
def get_image_info(request):
    if not request.user.is_authenticated():
        return HttpResponse('{success:false,error:"not logged in"}', mimetype='text/plain')
    if request.method == 'GET':        
        image_set = ReferralImage.objects.filter(owner=request.user).order_by('id')
        images = []
        for img in image_set:
            if img.has_been_rectified():
                images.append({'id':img.id,'title':img.title})
        wrapped_data = { 'images':images }
        json = simplejson.dumps( wrapped_data )
        return HttpResponse(json, mimetype='text/javascript') 

'''
Image web service - Given a ReferralImage id, returns the original uploaded image
'''
@login_required
def get_orig_image(request, pk=None):
    image = get_object_or_404(ReferralImage, pk=pk)
    if (image.owner.username == request.user.username):
        image_file = image.get_orig_file_obj()
        response = HttpResponse()
        response['Content-Type'] = image.content_type    
        response.write(image_file.read())
        return response      
    else:
        return HttpResponse('{success:false, error: "You don\'t have permission to access this image"}', mimetype='text/plain')

'''
Image web service - Given a ReferralImage id and an SRID returns a rectified
image in the project specified if it's available
'''
@login_required
def get_rectified_image(request, pk=None):
    image = get_object_or_404(ReferralImage, pk=pk)
    if (image.owner.username == request.user.username):
        srid = ''                
        if request.GET.has_key('SRID'):
            srid = request.GET['SRID']
        elif request.GET.has_key('srid'):
            srid = request.GET['srid']
        else:
            return HttpResponse('Missing SRID parameter', mimetype='text/plain')
        
        valid = _validate_srid(srid)
        if not valid:
            return HttpResponse('Malformed SRID parameter. Example: 4326', mimetype='text/plain')                                

        image_file = image.get_rect_file_obj(srid)
        response = HttpResponse()
        response['Content-Type'] = image.RECTIFIED_CONTENT_TYPE    
        response['Content-Disposition'] = 'attachment; filename=amn_my_image_'+str(pk)+'.tif'
        response.write(image_file.read())
        return response      
    else:
        return HttpResponse('{success:false, error: "You don\'t have permission to access this image"}', mimetype='text/plain')

'''
Validates an SRS parameter passed in a request
'''
def _validate_srs(srs_str):
    #Verify SRS format
    import re
    p = re.compile('^[a-zA-Z]*:[0-9]*$')
    if not p.match(srs_str):
        return False
    return True

'''
Validates an SRID parameter passed in a request
'''
def _validate_srid(srid_str):
    #Verify SRS format
    import re
    p = re.compile('[0-9]*$')
    if not p.match(srid_str):
        return False
    return True

'''
Image web service - Processes a WMS request for a rectified image with 
the given id. Most of this view code should be shifted into a 
ReferralImage method
'''
def get_rectified_wms_image(request, pk=None):
    if not request.user.is_authenticated():
        return HttpResponse('User not logged in', mimetype='text/plain')      
    image = get_object_or_404(ReferralImage, pk=pk)
    if (image.owner.username == request.user.username):
        #from util.mapscript_shortcuts import get_wms_image
        import mapscript
        req = mapscript.OWSRequest()

        #req.loadParams()  
        mime = request.GET['FORMAT']
        req.setParameter("bbox", request.GET['BBOX'])
        req.setParameter("width", request.GET['WIDTH'])
        req.setParameter("height", request.GET['HEIGHT'])
        req.setParameter("srs", request.GET['SRS'])
        req.setParameter("format", mime)
        req.setParameter("layers", request.GET['LAYERS'])
        req.setParameter("request", request.GET['REQUEST'])
                
        srs = ""                
        if request.GET.has_key('SRS'):
            srs = request.GET['SRS']
        elif request.GET.has_key('srs'):
            srs = request.GET['srs']
        else:
            return HttpResponse('Missing SRS parameter', mimetype='text/plain')
        
        valid = _validate_srs(srs)
        if not valid:
            return HttpResponse('Malformed SRS parameter. Example: EPSG:4326', mimetype='text/plain')        
        [epsg, srid] = srs.split(':')                
        
        if not image.srid_supported(int(srid)):
            return HttpResponse('Image not available for the given SRS.  Supported EPSG codes include: '+image.get_supported_srid_string()+'. Example "EPSG:4326"', mimetype='text/plain')
        
        filename = image.get_rect_filename(srid)
    
        map = mapscript.mapObj(settings.PRIVATE_MAPFILE)
        img_layer = map.getLayerByName('rectified_image')
        img_layer.data = settings.IMAGE_DIR+filename

        map.loadOWSParameters(req)
        
        image = map.draw().getBytes()
        response = HttpResponse()
        response['Content-length'] = len(image)
        response['Content-Type'] = mime
        response.write(image)
        return response

    else:
        return HttpResponse('{success:false, error: "You don\'t have permission to access this image"}', mimetype='text/plain')    

'''
Image web service - rectifies the ReferralImage specified.  Assumes that the
original image has already been uploaded.
'''
@login_required
def image_rectify(request, pk):
    output = ""
    gcp_obj = simplejson.loads(request.GET['gcp_data'])
    image_data = simplejson.loads(request.GET['image_data'])    
    gcp_data = gcp_obj['gcp_data']

    image = get_object_or_404(ReferralImage, pk=pk)
    if (image.owner.username != request.user.username):
        return HttpResponse('{success:false, error: "You don\'t have permission to access this image"}', mimetype='text/plain')

    image.rectify(image_data, gcp_data)
    return HttpResponse('{success:true}', mimetype='text/plain')


'''
Image web service - deletes the specified ReferralImage
'''
@login_required
def image_delete(request, pk):
    if request.method == 'POST' and request.POST['id']:
        image = get_object_or_404(ReferralImage, pk=pk)
        if (image.owner.username != request.user.username):
            return HttpResponse('{success:false, error: "You don\'t have permission to access this image"}', mimetype='text/plain')        

        #Remove stored images
        image.delete_files()        
        #Remove database record        
        image.delete()  
        
        return HttpResponse('{success:true}', mimetype='text/plain')
    return HttpResponse('{success:false}', mimetype='text/plain')

############# Referral Info web service ###############

'''
Info web service - Handles upload of referral info from the user
Creates a new ReferralInfo record 
'''
@login_required
def add_referral_info(request, shape_id):

    if request.method == "POST":
        form = ReferralInfoForm(request.POST)
        temp_value_container = []
        if form.is_valid():
            if request.POST['Confirm'] == "true":
                info = form.save(commit=False)
                #info.status = ReferralStatus.SUBMITTED
                info.status = ReferralStatus.objects.get(title=settings.DEFAULT_REFERRAL_INFO_STATUS)
                info.save()
                return HttpResponseRedirect("/referral/confirm_referral_submission.html")
            for fieldname in form.fields.keys():
                temp_value_container.append({'label':form.fields[fieldname].label,
                             'value':form.cleaned_data[fieldname]})
            
            return render_to_response("confirm_referral_info.html", {
            "user_values": temp_value_container,
            "form": form
        })           
    else:
        form = ReferralInfoForm(initial={'referral_shape':shape_id})
    return render_to_response("add_referral_info.html", {
            "form": form,
        })

def get_status_types(request):
    '''JSON containing the Ext.form.ComboBox config the referral status types'''
    return HttpResponse(simplejson.dumps([[r.id,r.title] for r in ReferralStatus.objects.all()]), mimetype='text/plain')

def render_html(request, htmlfile):
    return render_to_response(htmlfile)  

