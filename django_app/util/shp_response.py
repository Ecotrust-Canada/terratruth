import os
import shutil
import zipfile
import tempfile
import datetime
#import sys

from django.contrib.gis.db.models.fields import GeometryField
from django.http import HttpResponse

# the following line commented out as this module is run 
# stand-alone by the ShpResponse handler to avoid an Apache crash
#import gdal_external

import settings
import pickle
from cStringIO import StringIO
import gdal_external

import logging

logging.basicConfig(
    level = logging.DEBUG,
    format = '%(asctime)s %(levelname)s %(message)s',
)

def ShpResponse(query_set, geom_field=None, mimetype='application/zip'):

    tmp = tempfile.NamedTemporaryFile(suffix='.shp', mode = 'w')
    path = os.path.dirname(tmp.name)
    name = tmp.name.split('/')[-1]
    fullname = tmp.name
    basename = fullname.strip('.shp')
    tmp.close()

    fields = query_set.model._meta.fields
    geo_fields = [f for f in fields if isinstance(f, GeometryField)]
    other_field_names = [f.name for f in fields if not isinstance(f, GeometryField)]

    # convert query set to a list of dictionaries in order to pass it to an external script
    items = []
    for item in query_set:
        item2 = {}
        for name in other_field_names:
            item2[name] = str(getattr(item,name))
            #logging.debug("ShpResponse: name = "+name)
        item2['wkt'] = item.poly.wkt
        items.append(item2)
        
    if len(geo_fields) > 1:
        geo_field = geo_fields[0] # no support yet for multiple geometry fields
    else:
        geo_field = geo_fields[0]
    
    # tell gdal where its csv file is:
    os.environ['GDAL_DATA'] = os.environ.get('GDAL_DATA') or '/usr/local/share/gdal/'
    
    # Update: using fcgi so the following is no longer necessary.
    # ----------------------------------------------------
    '''
    # Calls to the GDAL Python binding crash the Apache web server, but they do not crash
    # the native Python interpreter when run stand-alone. This problem may be caused by
    # an incompatibility between the current version Apache's python sub-interpreter mod_wsgi and GDAL
    # and/or other libraries involved. The also occurs when using mod_python in place of mod_wsgi.
    # The (non-ideal) solution below invokes an external python interpreter, running a script which handles calls to GDAL.
    # Arguments / state are passed to this script via the pickle module. [cvo]
    
    pickle.dump([geo_field.srid, other_field_names, items],open(fullname+'.pickle','w'))
    gdal_script = os.path.join(settings.BASE_DIR, settings.BASE_APP, 'util/gdal_external.py')
    shape_cmd = "python %s %s"%(gdal_script,fullname)
    pin, pout, perr = os.popen3(shape_cmd)
    pout = pout.read()
    perr = perr.read()
    
    If the shape script fails propagate the error upwards.
    if perr:
        raise Exception('gdal script error: %s'%perr)
    '''
    
    #logging.debug("geo_field.srid = "+str(geo_field.srid))

    gdal_external.gdal_get_rsp_files(fullname, [geo_field.srid, other_field_names, items])
     
    buffer = StringIO()
    zip = zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED)
    files = ['shp','shx','prj','dbf']

    current_time = datetime.datetime.now().strftime("%Y-%m-%d")
    download_name = 'Terratruth_shape_' + current_time

    for item in files:
      filename= '%s.%s' % (basename, item)
      if not os.path.exists(filename):
        # raise an error if the file name is missing (this should never occur)
        raise Exception('''Shapefile `%s` is missing.'''%filename)
      zip.write(filename, '%s.%s' % (download_name, item))
    zip.close()
    buffer.flush()

    ret_zip = buffer.getvalue()
    buffer.close()     
    
    response = HttpResponse()
    response['Content-Disposition'] = 'filename=%s.zip' % download_name
    response['Content-length'] = str(len(ret_zip))
    response['Content-Type'] = mimetype
    response.write(ret_zip)
    return response
    