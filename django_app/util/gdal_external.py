import pickle

# GNG 05Feb10 - ensure django base code is accessable in the path 
import sys
sys.path.append ('/usr/local/django-trunk/')

# ctypes stuff
from django.contrib.gis.gdal import *
from django.contrib.gis.gdal.libgdal import lgdal

def gdal_get_rsp_files(fullname, args):
    ''' This script is run externally to Django because apache crashes if it is imported and run.
        It communicates with the AMNDSS application via the pickle module. 
        It is intended only for use with shp_response.py
    '''

    #extract serialized arguments.
    srid, other_field_names, items = args
    
    name = fullname.split('/')[-1]
    lgdal.OGRRegisterAll()
    
    srs = SpatialReference(srid)
    dr = lgdal.OGRGetDriverByName('ESRI Shapefile') 
    
    # Creating the datasource
    ds = lgdal.OGR_Dr_CreateDataSource(dr,fullname,None)
    
    # Creating the layer
    layer = lgdal.OGR_DS_CreateLayer(ds,name, srs._ptr, 3, None)
    
    for name in other_field_names:
      fld = lgdal.OGR_Fld_Create(str(name), 4)
      added = lgdal.OGR_L_CreateField(layer, fld, 0)
      check_err(added) 
    
    # Getting the Layer feature definition.
    fdefn = lgdal.OGR_L_GetLayerDefn(layer) 
    
    for item in items:
        
        feat = lgdal.OGR_F_Create(fdefn)
        # Setting the fields (for now all as strings)
        idx = 0
        for name in other_field_names:
          value = item[name]
          lgdal.OGR_F_SetFieldString(feat, idx, str(value))
          idx += 1
          
        # Transforming & setting the geometry
        pnt = OGRGeometry(item['wkt'], 3005)
        pnt.transform(srs)
        check_err(lgdal.OGR_F_SetGeometry(feat, pnt._ptr))
        # Creating the feature in the layer.
        
        check_err(lgdal.OGR_L_SetFeature(layer, feat))
    
    # Cleaning up
    check_err(lgdal.OGR_L_SyncToDisk(layer))
    lgdal.OGR_DS_Destroy(ds)
    lgdal.OGRCleanupAll()
    print 'success'

if __name__ == "__main__":
    gdal_get_rsp_files(sys.argv[1], pickle.load(open(sys.argv[1]+".pickle")))
    