from django.contrib.auth.models import User, Group
from django.contrib.gis.db.models import *
from user_groups.models import UserGroup
from django.forms import ModelForm, ChoiceField
from django.core.exceptions import ValidationError

import mapscript
import os,sys,re,datetime,os.path,zipfile,subprocess,zipfile,simplejson

import logging, simplejson

logging.basicConfig(
    level = logging.DEBUG,
    format = '%(asctime)s %(levelname)s %(message)s',
)

'''
The following class provides support for private, locally stored, cultural WMS layers.
Users are associated with one or more groups. Groups have one or more users.
'''

class spatial_reference(Model):
    srs_id = CharField(max_length=15)

    def __unicode__(self):
        return unicode('%s' % self.srs_id)

    class Meta:
        verbose_name = ('Spatial Reference System')
        verbose_name_plural = ('Spatial Reference Systems')

class wms_format(Model):
    format = CharField(max_length=30)

    def __unicode__(self):
        return unicode('%s' % self.format)

    class Meta:
        verbose_name = ('WMS Format')
        verbose_name_plural = ('WMS Formats')

'''
The following class is the ancestor class for WMS layer (instantiated for external and rectifier WMS Layers.
'''
class ExternalCommon(Model):
    name = CharField('Internal Name',max_length=100)
    wms_name = CharField('WMS Name',max_length=100)
    url = CharField(max_length=1024)
    layers = TextField('Layer(s) (comma delimited)',)
    format = ForeignKey(wms_format,default=1)
    srs = ForeignKey(spatial_reference,default=1)
    opacity = FloatField(default=1)
    active = BooleanField(default=True)
    transparent = BooleanField(default=True)
    is_base_layer = BooleanField(default=False)
    hide_in_legend = BooleanField(default=False)
    visibility = BooleanField(default=False)
    display_in_layer_switcher = BooleanField(default=True)
    order = IntegerField(null=True,default=1)
    
    class Meta:
        abstract = True

'''
The following class provides support for public, external WMS layers, 
used for background data and base layer information in the main Terratruth Map view.
'''
class External(ExternalCommon):   
    def __unicode__(self):
        return unicode("%s" % (self.name))

    class Meta:
        verbose_name = 'External Layer'
        verbose_name_plural = 'External Layers'

'''
The following class provides support for public, external WMS layers, used for background data 
and base layer information in the Image Rectifier.
'''
class Rectifier(ExternalCommon):
    def __unicode__(self):
        return unicode("%s" % (self.name))

    class Meta:
        verbose_name = 'Rectifier Layer'
        verbose_name_plural = 'Rectifier Layers'

'''
The following class provides functionality to load private WMS Layers via the admin interface.
'''
class Private(Model):     
    def delete(self, *args, **kwargs):
        cursor = connection.cursor()
        # drop the table with old layer name if exists
        table_name = 'user_shape_%s' % self.layers
        cursor.execute("select * from information_schema.tables where table_name=%s", (table_name,))
        if cursor.rowcount: # delete the old table if exists.
            cursor.execute('DROP TABLE %s ;' % table_name)
        # garbage collection: remove record in geometry_columns
        cursor.execute("delete from geometry_columns where f_table_name=%s", (table_name,))
        mapserverdir = os.path.join(settings.MAPSERVER_DIR)
        generate_map_file()
        return super(Private, self).delete(*args, **kwargs)
    
    def user_shape_location (instance, filename):
        if not os.path.exists('/tmp/user_shape_uploads_dss'):
            os.mkdir('/tmp/user_shape_uploads_dss')
        upload_dir = os.path.join(settings.MEDIA_ROOT, 'uploads')
        os.system('rm -Rf %s' % upload_dir)
        os.system('ln -s /tmp/user_shape_uploads_dss/ %s' % (settings.MEDIA_ROOT + '/uploads'))
        filepath = os.path.join(upload_dir, filename)
        os.system('rm -Rf %s' % filepath)
        return filepath
   
    name = CharField(max_length=100)
    description = CharField('Description',max_length=500, blank=True)
    metadata = CharField('Metadata', max_length=500, blank=True)
    owner = ForeignKey(UserGroup, null=True) #Layer is owned by 0 or 1 groups
    order = IntegerField(null=True)
    url = CharField(max_length=1024, default='/cgi-bin/amndss.cgi?', blank=True, null=True)
    layers = TextField(blank=True, default='undefined', null=True)
    style = TextField(default='{"COLOR":"#ee9900","OUTLINECOLOR":"#ee9900","WIDTH":"1"}', blank=True, null=True)
    visibility = BooleanField(default=True)
    opacity = FloatField(default=1, blank=True, null=True)
    format = ForeignKey(wms_format,default=1, blank=True, null=True)
    show_legend = BooleanField(default=True)
    tag = CharField(max_length=255, help_text='comma delimited, flags used internally.', blank=True, null=True)
    user_file = FileField(upload_to=user_shape_location,null=True, blank=True, help_text="a zip file containing GIS shapefile to upload")
    user_file_type = CharField(max_length=10, blank=True, null=True)
    label_field_name = CharField(max_length=100, blank=True, null=True)
    label_style = TextField(default='{"COLOR":"#ffffff","SIZE":"9","FONT":"calibri"}', blank=True, null=True)
    
    def __unicode__(self):
        return unicode("%s" % (self.name))

    class Meta:
        verbose_name = 'Private Layer'
        verbose_name_plural = 'Private Layers'

class user_loaded_private_layer_form(ModelForm):
    label_field_name = ChoiceField(required=False)

    def __init__(self, *args, **kwargs):
        super(user_loaded_private_layer_form, self).__init__(*args, **kwargs)
        self.fields['label_field_name'].choices = [('','')]
        cursor = connection.cursor()
        table_name = 'user_shape_%s' % self.instance.layers
        cursor.execute("select column_name from information_schema.columns where table_name=%s", (table_name,))
        if cursor.rowcount: # delete the old table if exists.
            column_names = cursor.fetchall()
            for column_name in column_names:
                column_name = str(column_name[0])
                if column_name != 'the_geom':
                    self.fields['label_field_name'].choices.append((column_name, column_name))
    
    class Meta:
        model = Private
   
    def save(self, *args, **kwargs):
        cursor = connection.cursor()
        if self.cleaned_data['layers'].strip() == 'undefined':
        # if layers are not specified, then set it to be the title with spaces removed.
            self.cleaned_data['layers'] = re.sub(r'[^a-zA-Z\d]', '', self.cleaned_data['name']).lower()
       
        if 'user_file' in self.changed_data: #a new shape file is uploaded

            if 'layers' in self.changed_data:
                # drop the table with old layer name if exists
                table_name = 'user_shape_%s' % self.instance.layers
                cursor.execute("select * from information_schema.tables where table_name=%s", (table_name,))
                if cursor.rowcount: #delete the old table if exists.
                    cursor.execute('DROP TABLE %s ;' % table_name)
        
            try:
                zfile = zipfile.ZipFile(self.cleaned_data['user_file'], 'r')
            except:
                raise ValidationError("Invalid ZIP File")
            corr_extensions = ['dbf', 'prj', 'shp', 'shx']
            extensions = [file_extension(i.lower()) for i in zfile.namelist()]
            good_zip_file = True
            shp_filename = ''
            for ce in corr_extensions:
                if ce not in extensions:
                    good_zip_file = False
                    break
            if not good_zip_file:
                raise ValidationError("Invalid Shape File")
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
        
            # drop the table with new layer name if exists
            table_name = 'user_shape_%s' % self.cleaned_data['layers']
            cursor.execute("select * from information_schema.tables where table_name=%s", (table_name,))
            if cursor.rowcount: # delete the old table if exists.
                cursor.execute('DROP TABLE %s ;' % table_name)

            p = subprocess.Popen(r"shp2pgsql -s "'' + str(settings.SPATIAL_REFERENCE_ID) + ''" -W LATIN1 -I %s user_shape_%s" % (os.path.join('/tmp', shp_filename), self.cleaned_data['layers']), shell=True, stderr = subprocess.PIPE, stdout = subprocess.PIPE)
            sql = p.stdout.read()
            cursor.execute(sql)
            
            p.stderr.readline()
            typestr = p.stderr.readline()
            user_file_type = 'POINT'
            if 'POLYGON' in typestr:
                user_file_type = 'POLYGON'
            elif 'LINE' in typestr:
                user_file_type = 'LINE'
            self.cleaned_data['user_file_type'] = user_file_type
            
        elif 'layers' in self.changed_data:
            # rename the table to the new layer name if exists
            table_name = 'user_shape_%s' % self.instance.layers
            new_table_name = 'user_shape_%s' % self.cleaned_data['layers']
            cursor.execute("select * from information_schema.tables where table_name=%s", (table_name,))
            if cursor.rowcount: 
                cursor.execute('ALTER TABLE %s RENAME TO %s ;' % (table_name, new_table_name))
      
        result = super(user_loaded_private_layer_form, self).save(*args, **kwargs)
        result.layers = self.cleaned_data['layers']
        result.user_file_type = self.cleaned_data['user_file_type']
        generate_map_file(result)
        return result

def file_extension(filename):
    pos = filename.rfind('.')
    if pos > -1:
        return filename[pos+1:]
    else:
        return None

def generate_map_file(new_wms_layer=None):
    cursor = connection.cursor()
    cursor.execute("select table_name from information_schema.tables where table_name LIKE 'user_shape_%%'")
    table_names = cursor.fetchall()
    table_names = [t[0] for t in table_names]
    mapserverdir = os.path.join(settings.MAPSERVER_DIR)
    mapfile = open(os.path.join(mapserverdir, 'private_map_files', 'user_shapes.map'), 'w')
    wms_layers = list(Private.objects.all())
    # if the new wms_layer is a new one, append it to the list.
    # otherwise replace it with the old one in the list.
    if new_wms_layer:
        new_layer = True
        for i in range(len(wms_layers)):
            if wms_layers[i].layers == new_wms_layer.layers:
                wms_layers[i] = new_wms_layer
                new_layer = False
                break
        if new_layer:
            wms_layers.append(new_wms_layer)

    for wms in wms_layers:
        layers = wms.layers
        table_name = 'user_shape_%s' % layers
        if table_name.lower() not in table_names:
            continue
        style = simplejson.loads(wms.style)
        COLORstr = Hex2RGB(style['COLOR'])
        OUTLINECOLORstr = Hex2RGB(style['OUTLINECOLOR'])
        if COLORstr:
            COLORstr = '''
                COLOR ''' + COLORstr
        if OUTLINECOLORstr:
            OUTLINECOLORstr = '''
                OUTLINECOLOR ''' + OUTLINECOLORstr

        has_label = wms.label_field_name  and wms.label_field_name != ""
        labelstyle = simplejson.loads(wms.label_style)
        LABELstr = ''
        LABELstylestr = ''
        if has_label:
            label_field_name = wms.label_field_name.strip()
            LABELstr = '''
            LABELITEM "''' + label_field_name + '''"
            LABELCACHE ON'''
            LABELstylestr = '''
                LABEL
                  TYPE truetype
                  SIZE ''' + labelstyle['SIZE'] + '''
                  FONT ''' + labelstyle['FONT'] + '''
                  POSITION cc
                  COLOR ''' + Hex2RGB(labelstyle['COLOR']) + '''
                  OUTLINECOLOR ''' + Color2OutlineColor(labelstyle['COLOR']) + '''
                  PARTIALS FALSE
                  FORCE FALSE
                END'''

        STYLEstr = '''
                STYLE''' + COLORstr + OUTLINECOLORstr 
        if wms.user_file_type == 'POINT':
            STYLEstr = STYLEstr + '''
                    SYMBOL "square"
                    SIZE ''' + style['WIDTH']
        else:
            STYLEstr = STYLEstr + '''
                    WIDTH ''' + style['WIDTH']
        STYLEstr = STYLEstr + '''
                END'''

        mapfile.write('''
        LAYER
            NAME "''' + wms.name + '''"
            STATUS OFF
            DATA "the_geom from ''' + table_name + ''' using unique gid using SRID=''' + str(settings.SPATIAL_REFERENCE_ID) + '''"
            CONNECTIONTYPE POSTGIS
            CONNECTION "user=amndss dbname=amndss host=localhost password=''' + settings.DATABASE_PASSWORD + '''"
            METADATA
                "wms_title" "''' + wms.name + '''"
            END
            TYPE ''' + wms.user_file_type + '''
            UNITS DD
            PROJECTION
                "init=EPSG:''' + str(settings.SPATIAL_REFERENCE_ID) + '''"
            END
            DUMP TRUE
            TRANSPARENCY 70
            TEMPLATE foo''' + LABELstr + '''
            CLASS
                NAME "''' + wms.name + '"' +  STYLEstr + LABELstylestr + '''
            END
        END
        ''')
    mapfile.close()
    
def Hex2RGB(hexstr):
    hexstr = hexstr.strip()
    if len(hexstr) == 0:
        return ''
    if hexstr[0] == '#':
        hexstr = hexstr[1:]
    if len(hexstr) != 6:
        return ''
    try:
        return str(int(hexstr[:2], 16)) + ' ' + str(int(hexstr[2:4], 16)) + ' ' + str(int(hexstr[4:], 16))
    except:
        return ''

def Color2OutlineColor(hexstr):
    hexstr = hexstr.strip()
    if len(hexstr) == 0:
        return ''
    if hexstr[0] == '#':
        hexstr = hexstr[1:]
    if len(hexstr) != 6:
        return ''
    try:
        r = int(hexstr[:2], 16) * 255
        g = int(hexstr[2:4], 16) *  255
        b = int(hexstr[4:], 16) * 255
        yiq = (r * 299 + g * 587 + b * 114) / 1000.0;
        if yiq >= 128:
            return '1 1 1'
        else:
            return '255 255 255'
    except:
        return ''

