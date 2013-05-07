import pickle
import os

from django.contrib.gis.gdal import *
from django.contrib.gis.gdal.libgdal import lgdal

def gdal_get_rsp_files(out_dir, args):
    '''
        This script is run externally to Django because apache crashes if it is imported and run.
        It communicates with the AMNDSS application via the pickle module. 
        It is intended for use with shp_response.py

        Currently setup for use with the GDAL 1.7 binding.

        
    '''

    #extract serialized arguments.
    srid, other_field_names, items = args
    
    shape_basename = os.path.join(out_dir, "shape")
    lgdal.OGRRegisterAll()
    srs = SpatialReference(srid)
    dr = lgdal.OGRGetDriverByName('ESRI Shapefile') 
    
    # Creating the datasource
    # Create a directory for the output shapefiles

    ds = lgdal.OGR_Dr_CreateDataSource(dr,out_dir,None)
    # Creating the layer

    layer = lgdal.OGR_DS_CreateLayer(ds, 'shape', srs._ptr, 3, None)
    
    for name in other_field_names:
      name = name[:10]
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

if __name__ == "__main__":
    gdal_get_rsp_files(sys.argv[1], pickle.load(open(os.path.join(sys.argv[1],"shape.pickle"))))
    
