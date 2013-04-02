import os,sys,subprocess,time,tempfile,types

# Mapserver
import mapscript
import watermark
import urllib

# PIL for image manipulation
import Image, StringIO, cStringIO
#from pythonmagickwand.image import Image as magickImage

# ReportLab for PDF support
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, Frame
import os,time
import logging
logging.basicConfig(
    level = logging.DEBUG,
    format = '%(asctime)s %(levelname)s %(message)s',
)

################ Amn Map Class #####################
class AmnMap(object):
    W = 120 * 10
    H = int(120 * 6.5)
    
    def __init__(self,fields):
        self.fields = fields

    def createMapImage(self):
        import settings
        # Create a map object
        outputMap = mapscript.mapObj(settings.PRIVATE_MAPFILE)
        gd =  mapscript.outputFormatObj('AGG/PNG')
        outputMap.setOutputFormat(gd)
        extent = self.fields['oldata']['extent']
        outputMap.setExtent(extent['left'], extent['bottom'], extent['right'], extent['top'])
        outputMap.setSize(self.W,self.H)
        
        # Set all the layers initially off.
        i=0
        layer = outputMap.getLayer(i)
        while layer:
            layer.status = mapscript.MS_OFF
            i = i + 1
            layer = outputMap.getLayer(i)
        
        connection = "user=%s dbname=%s host=%s password=%s" % (
                            settings.DATABASE_USER,
                            settings.DATABASE_NAME,
                            (settings.DATABASE_HOST or "localhost"),
                            settings.DATABASE_PASSWORD
                        )

        # Example for WMS layer building
        layers = self.fields['oldata']['mapLayers']
        layerNames = ""
        for i,layer in enumerate(layers):
            subLayers = layer['params']['LAYERS']
            if subLayers and (type(subLayers) != types.ListType):
                subLayers = list(subLayers)
            for subLayer in subLayers:
                mapFileLayer = outputMap.getLayerByName(subLayer)
                
                # use layer from mapfile directly.
                if mapFileLayer:
                    # authenticate db connections.
                    if "user=%s" % settings.DATABASE_USER in mapFileLayer.connection:
                        mapFileLayer.connection = connection
                        mapFileLayer.status = mapscript.MS_DEFAULT
                    outputMap.insertLayer(mapFileLayer)
                # generate a custom layer dynamically.
                else:
                    wmsLayer = mapscript.layerObj()
                    wmsLayer.name = 'wms'+str(i)
                    wmsLayer.connection = layer['url'].replace("..",settings.HOST)
                    wmsLayer.connectiontype = mapscript.MS_WMS
                    wmsLayer.status = mapscript.MS_DEFAULT
                    wmsLayer.type = mapscript.MS_LAYER_RASTER
                    #wmsLayer.setProjection("init="+layer['params']['SRS'])
                    # By default take the first 'list' of any values
                    wmsLayer.metadata.set("wms_name", subLayer)
                    wmsLayer.metadata.set("wms_format", "image/png") #layer['params']['FORMAT'])
                    wmsLayer.metadata.set("wms_srs", layer['params']['SRS'])
                    wmsLayer.metadata.set("wms_server_version", layer['params']['VERSION'])
                    outputMap.insertLayer(wmsLayer)
                
        vectorLayers = self.fields['oldata']['vectorLayers']
        if len(vectorLayers) > 0:
            dataString = "poly from (select id, poly from referrals_referralshape where "
            for i,vectorLayer in enumerate(vectorLayers):
                if i == 0:
                    dataString = dataString + "id=" + str(vectorLayer)
                else:
                    dataString = dataString + " OR id=" + str(vectorLayer)
            dataString = dataString + ") as foo using unique id using SRID=3005"
            userShapeLayer = outputMap.getLayerByName("user_shapes")
            userShapeLayer.connection = connection
            userShapeLayer.status = mapscript.MS_DEFAULT
            outputMap.insertLayer(userShapeLayer)
            userShapeLayer.data = dataString

        scalebarBG = mapscript.colorObj(255,255,255)
        outputMap.scalebar.status = mapscript.MS_EMBED
        outputMap.scalebar.outlinecolor = scalebarBG

        # Setup the default name for the output image
        # create a subdirectory in tmp in case it already isn't there (to keep it nice a tidy)
        os.popen("mkdir -p /tmp/terratruth_print_files").read()
        
        outputImageFile = '/tmp/terratruth_print_files/testmap%s.jpg'%time.time()
        # Save the image to temporary spot, in jpeg format (PNG was causing an error)
        outputMap.selectOutputFormat('JPEG')
        img = outputMap.draw()
        
        # save and reload because otherwise we don't have a real PIL image apparently.
        img.save(outputImageFile)
        img = Image.open(outputImageFile)
        
        if self.fields.get('confidential'):
            confImage = Image.open(os.path.join(settings.BASE_DIR,"media","images","confidential.gif"))
            img = watermark.watermark(img, confImage, (0, 0), 0.5)
        
        if self.fields.get('legendimages'):
            legend = self.createLegendImage()
            img = watermark.watermark(img, legend,(img.size[0]-legend.size[0],
                0), 1)
        
        img.save(outputImageFile)
        # Can use the outputImageFile to pass back to be inserted into PDF
        # Can return the outputImageUrl that contains the URL to image

        image = ImageReader(outputImageFile)
        return image

    def createLegendImage(self):
        legend = Image.new('RGBA', (500,self.H), (255,255,255,255))
        h = 0
        w = 0
        for url in self.fields['legendimages']:
            file = urllib.urlopen(url)
            item = Image.open(cStringIO.StringIO(file.read()))
            if item.size[0] + h < self.H:
                legend.paste(item,(0,h))
                w = max(item.size[0],w)
                h += item.size[1]
        legend = legend.crop((0,0,w,h))
        return legend

    def createScalebarImage(self):
        pass

if __name__ == '__main__':
    
    am = AmnMap({'legendimages':[
        'http://openmaps.gov.bc.ca/mapserver/parks-and-recreation?service=wms&LAYER=TA_WILDLIFE_MGMT_AREAS_C&service=WMS&version=1.1.1&request=GetLegendGraphic&exceptions=application%2Fvnd.ogc.se_inimage&format=image%2Fpng',
        'http://openmaps.gov.bc.ca/mapserver/parks-and-recreation?service=wms&LAYER=TA_CONSERVANCY_AREAS_C&service=WMS&version=1.1.1&request=GetLegendGraphic&exceptions=application%2Fvnd.ogc.se_inimage&format=image%2Fpng'
    ]})
    
    am.createLegendImage().save('out.gif')
    
