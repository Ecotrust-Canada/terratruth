from django import forms

from referrals.models import *

import settings
import zipfile
import os
from util.random_string import GenString

#CVO
#import logging
#logging.basicConfig(
#    level = logging.DEBUG,
#    format = '%(asctime)s %(levelname)s %(message)s',
#)
#/CVO

class ImageAddForm(forms.Form):
    image = forms.FileField(required=True)
    title = forms.CharField(max_length=200)

    def clean_image(self):
        if 'image' in self.cleaned_data:
            image = self.cleaned_data['image']

            the_split = os.path.splitext(image.name)
            extension = ""
            if the_split and len(the_split) == 2:
                 extension = the_split[1]                 
                 
            if extension != '.jpg' and extension != '.JPG' and extension != '.jpeg' and extension != '.JPEG':
                msg = 'Only jpg/jpeg format is allowed.'
                raise forms.ValidationError(msg)

            self.cleaned_data['extension'] = extension
            self.cleaned_data['content_type'] = image.content_type
            return image

    def save(self, request=None):
        file = self.cleaned_data['image']
        title = self.cleaned_data['title']
        filepath = settings.IMAGE_DIR

        import random
        image_id = GenString(20)
        filename = str(image_id) + '_orig' + self.cleaned_data['extension']
                
        fd = open('%s/%s' % (filepath, filename), 'wb+')        
        for chunk in file.chunks():
            fd.write(chunk)        
        fd.close()

        from PIL import Image
        im = Image.open('%s/%s' % (filepath, filename))
        width = im.size[0]
        height = im.size[1]               

        #Create new referral image record
        img_rec = ReferralImage( 
            owner = request.user,
            title = title,
            image_id = image_id,
            orig_extension = self.cleaned_data['extension'],
            content_type = self.cleaned_data['content_type']
        )
        img_rec.save()
        result = "{id:"+str(img_rec.id)+",width:"+str(width)+",height:"+str(height)+"}" 
        return result
    
class ShapeAddForm(forms.Form):
    desc = forms.CharField(max_length=200,widget=forms.Textarea)
    upload = forms.FileField(required=True)
    def clean_upload(self):

        if 'upload' in self.cleaned_data:
            upload = self.cleaned_data['upload']

            the_split = os.path.splitext(upload.name)
            extension = ""
            if the_split and len(the_split) == 2:
                extension = the_split[1]

            if extension != '.zip' and extension != '.ZIP':
                msg = 'Only .zip files are allowed.'
                raise forms.ValidationError(msg)

            return upload

    def save(self):

        file = self.cleaned_data['upload']
        desc = self.cleaned_data['desc']

        filename = file.name
        filepath = settings.TEMP_DIR
        full_name = filepath+filename
        
        fd = open('%s' % (full_name), 'wb')
        for chunk in file.chunks():
            fd.write(chunk)
        fd.close()

        zip_handle = zipfile.ZipFile( full_name )

        zip_contents = zip_handle.namelist()
        shapefilename = ""
        for zip_element in zip_contents:
            if zip_element.find('.shp') != -1 and zip_element.find('.xml') == -1:
                shapefilename = zip_element
            output_file = open( filepath + zip_element, 'wb')
            output_file.write( zip_handle.read( zip_element ))
            output_file.close()
            
        return { 'shapefilename':shapefilename }

class ReferralInfoForm(forms.ModelForm):
    class Meta:
        model = ReferralInfo
        exclude = ('status')

class ReferralMetaDataForm(forms.ModelForm):
    class Meta:
        model = ReferralShapeMetaData
