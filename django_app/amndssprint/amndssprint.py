#!/usr/bin/env python
# Some system libs
import os,sys,subprocess,time,tempfile,types
# Mapserver
import mapscript
# PIL for image manipulation
import Image, StringIO
#from pythonmagickwand.image import Image as magickImage
# ReportLab for PDF support
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, Frame

# JSON Support
import simplejson

import settings, pickle

import logging
logging.basicConfig(
    level = logging.DEBUG,
    format = '%(asctime)s %(levelname)s %(message)s',
)

################ PDF Output Class #####################
class AMNPdf(object):
    def __init__(self,fields,imagefilename = None):
        self.fields = fields
        self.filehandle = None
        self.filename = None
        self.data = None
        self.imagefilename = imagefilename

    def createPdf(self, imageGenerator = None):
        if imageGenerator:
            mapImage = imageGenerator.createMapImage()
        else:
            mapImage = None

        (self.filehandle,self.filename) = tempfile.mkstemp(suffix='.pdf')
        c = canvas.Canvas(self.filename)
        port_width,port_height = letter
        land_width = port_height
        land_height = port_width
        c.setPageSize([land_width,land_height])
        # choose some colors
        c.setStrokeColorRGB(0.5,0.5,0.5)
        c.setFillColorRGB(0.95,0.95,0.95)
        # draw a rectangle
        c.rect(0.45*inch,0.45*inch,10.1*inch,6.6*inch, fill=1)
        # Add the image
        if mapImage:
            c.drawImage(mapImage,0.5*inch,0.5*inch,10.0*inch,6.5*inch)
            
        c.setFont("Helvetica", 24)
        c.setFillColorRGB(0,0,0)
        c.drawString(0.5*inch, 7.5*inch,
            self.fields['title'] or "Untitled")

        description = self.fields['description'] or ""
        styles = getSampleStyleSheet()
        styleN = styles['Normal']
        descriptionFlowable = [Paragraph(description,styleN)]
        f = Frame(5*inch,7.25*inch,4*inch,1*inch,showBoundary=0)
        f.addFromList(descriptionFlowable,c)
        #descTextObj = c.beginText()
        #descTextObj.setTextOrigin(7.5*inch,8*inch)
        #descTextObj.setFont("Helvetica", 12)
        #descTextObj.textLines(description)
        #c.drawText(descTextObj)

        if self.imagefilename:
            logoImage = ImageReader(self.imagefilename)
            c.drawImage(logoImage,9.25*inch,7.25*inch,1.25*inch,1*inch,
                preserveAspectRatio=True, anchor="nw")
        
        # define a large font
        c.setFont("Helvetica", 14)
        c.setFillColorRGB(1,1,1)
        # Layers to draw
        layers = self.fields['oldata']['mapLayers']
        layerNames = ""
        for layer in layers:
            layerNames = layerNames + ' ' + layer['name']
        #c.drawString(3.5*inch, 5*inch, "Map Layers Passed Down")
        c.showPage()
        c.save()
        self.data = c.getpdfdata()
        return (self.filename, self.data)

if __name__ == '__main__':
    print "Test"
    
    sys.path.append('/usr/local/apps/amndss/django_app')
    from util.amn_map import *
    
    fields = pickle.load(open('/tmp/fields.pkl','r'))
    imageGenerator = AmnMap(fields)
    pdfObject = AMNPdf(fields,'/usr/local/apps/amndss/media/images/ECLogoColour-small.jpg')
    pdfObject.createPdf(imageGenerator)
    
