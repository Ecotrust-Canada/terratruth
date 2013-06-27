from django.conf import settings
from django.contrib.auth.models import User, Group
from django.contrib.gis.db.models import *
from django.utils.translation import ugettext_lazy as _ # internationalization translate call
from django.shortcuts import get_object_or_404
import simplejson
from psycopg2 import ProgrammingError
import subprocess
from user_groups.models import UserGroup
from settings import IMAGE_DIR

# Added for referral info entry form:
from django.db import models
from django.forms import ModelForm, ChoiceField

import logging
logging.basicConfig(
    level = logging.DEBUG,
    format = '%(asctime)s %(levelname)s %(message)s',
)

class ExecuteException(Exception):
    pass

def execute(cmd):
    try:
        subprocess.Popen(cmd, shell=True).communicate()
    except OSError, e:
        raise ExecuteException('''
COMMAND: %s
OSError: %s
''' % (cmd, e))

class ReferralShapeManager(GeoManager):

    def gen_referral_info_attributes(self, where_id_str, shape_ids):
        from django.db import connection
        cursor = connection.cursor()
        results = []

        sql= 'SELECT * FROM referrals_referralinfo as info, referrals_referralstatus as status, referrals_referralshape as us \
              WHERE info.referral_shape_id = us.id AND info.status_id = status.id AND (' + where_id_str +')'

        try:
            cursor.execute(sql)
        except ProgrammingError, e:
            from referrals.exceptions import ReportError
            raise ReportError, e

        for shape_id in shape_ids:
            results.append({'record_values':cursor.fetchone()})

        return results 

    def gen_intersections(self, where_id_str, int_layers, where_clause = ''):
        from django.db import connection
        cursor = connection.cursor()
        result = {}
        for layer in int_layers:

            # Calculate intersection of shapes with various layers 
            sql= 'SELECT count(*) from ' + layer['table'] + """ as cr, referrals_referralshape as us where \
            """+where_id_str+" and intersects(us.poly,cr.the_geom) "+where_clause

            logging.debug(sql)

            try:
                cursor.execute(sql)
            except ProgrammingError, e:
                from referrals.exceptions import ReportError
                raise ReportError, e   
                         
            result[layer['title']] = cursor.fetchone()[0]

        return result 

    def gen_answers(self, where_id_str, qst_fields):
        from django.db import connection
        cursor = connection.cursor()                
        answers = {}
        
        for i in range(len(qst_fields)): 
            answer = {}
            qst = qst_fields[i]
            
            if qst['sql'] != '':
                try:                
                    # Insert ids into query string
                    sql = qst['sql'].replace('where_id_str',where_id_str)
                    cursor.execute(sql)
                    rows = cursor.fetchall()
    
                    if len(rows) == 0:
                        answer['None Found'] = 0
                    for row in rows:
                        zero = 0
                        one = 0
                        if row[0] != None:
                            zero = row[0]
                        if row[1] != None:
                            one = row[1]

                        answer[zero] = one
                        
                except ProgrammingError, e:
                    from referrals.exceptions import ReportError
                    raise ReportError, e     
            else:
                answer = None
                
            answers[i] = {
                'title':qst['title'],
                'header1':qst['header1'],
                'header2':qst['header2'],
                'q':answer
            }
        return answers
            
    def build_where_id_str(self, shape_ids):
        where_ids = ""
        for i in range(len(shape_ids)):
            id = shape_ids[i]
            if i == 0:
                where_ids += "us.id = "+id
            else:
                where_ids += " OR us.id = "+id
        return where_ids
            
    def generate(self, shape_ids, report_obj):
        report = {}        
        qst = {}
        int_sums = {}
        gen = {}
 
        where_id_str = self.build_where_id_str(shape_ids)
 
        referral_info_attributes = {}
        referral_info_attributes = self.gen_referral_info_attributes(where_id_str, shape_ids)

        public_int_layers = report_obj.get_layers()
        int_sums = self.gen_intersections(where_id_str, public_int_layers)
 
        qst_fields = report_obj.get_queries()
        qstns = self.gen_answers(where_id_str, qst_fields)
 
        report['questions'] = qstns
        report['general'] = {'reportIntersectionSums':int_sums}
        report['info_attributes'] = referral_info_attributes
        
        return report
    
class ReferralShape(Model):
    owner = ForeignKey(User)
    user_group = ForeignKey(UserGroup)
    description = CharField(_('Description'), max_length=200, blank=False)
    edit_notes = CharField(_('Edit Notes'),max_length=200)
    poly = PolygonField(_('Polygon'),srid=settings.SPATIAL_REFERENCE_ID)
    objects = ReferralShapeManager()
    rts_id = CharField(_('Referral Tracking System ID'), max_length=30, blank=True)
    
    def info(self):
        try:
            return ReferralInfo.objects.get(referral_shape = self)
        except ReferralInfo.DoesNotExist:
            return None
        
    def __unicode__(self):
        return unicode('%s' % self.description)

    class Meta:
        verbose_name = _('Referral Shape')
        verbose_name_plural = _('Referral Shapes')

class ReferralShapeMetaData(Model):
    referral_shape = OneToOneField(ReferralShape)
    contact_organization = CharField(_('Organization'), max_length=50, blank=True)
    contact_person = CharField(_('Contact Person'), max_length=50, blank=True)
    contact_person_title = CharField(_('Title'), max_length=30, blank=True)
    contact_phone_voice = CharField(_('Phone'), max_length=20, blank=True)
    contact_phone_fax = CharField(_('Fax'), max_length=20, blank=True)
    contact_email = CharField(_('Email Address'), max_length=200, blank=True)
    address_street = CharField(_('Address'), max_length=50, blank=True)
    address_city = CharField(_('City'), max_length=30, blank=True)
    address_province_or_state = CharField(_('Province/State'), max_length=30, blank=True)
    address_postal_code = CharField(_('Postal Code/Zip'), max_length=15, blank=True)
    address_country = CharField(_('Country'), max_length=20, blank=True)
    dataset_creator = CharField(_('Creator'), max_length=50, blank=True)
    dataset_content_publisher = CharField(_('Content Publisher'), max_length=50, blank=True)
    dataset_publication_place = CharField(_('Publication Place'), max_length=200, blank=True)
    dataset_publication_date = DateField('Publication Date', blank=True, default=datetime.datetime.now().strftime("%Y-%m-%d"), null=True)
    dataset_abstract_description = CharField(_('Abstract/Description'), max_length=200, blank=True)
    dataset_scale = CharField(_('Scale'), max_length=20, blank=True)
    dataset_date_depicted = DateField('Date Depicted', blank=True, default=datetime.datetime.now().strftime("%Y-%m-%d"), null=True)
    dataset_time_period = CharField(_('Time Period'), max_length=50, blank=True)
    dataset_geographic_key_words = CharField(_('Geographic Key Words'), max_length=100, blank=True)
    dataset_theme_key_words = CharField(_('Theme Key Words'), max_length=100, blank=True)
    dataset_security_classification = CharField(_('Security Classification'), max_length=50, blank=True)
    dataset_who_can_access_the_data = CharField(_('Who Can Access The Data?'), max_length=50, blank=True)
    dataset_use_constraints = CharField(_('Use Constraints/Distribution Liability'), max_length=200, blank=True)

    def __unicode__(self):
        return unicode('Meta Data for %s' % self.referral_shape)

    class Meta:
        verbose_name = _('Referral Shape Meta Data')
        verbose_name_plural = _('Referral Shape Meta Data')

class ReferralImage(Model):     
    RECTIFIED_FORMAT = 'tif'   
    RECTIFIED_CONTENT_TYPE = 'image/tif'
    
    SUPPORTED_SRIDS = [4326, settings.SPATIAL_REFERENCE_ID]
    # Can build filenames from the stored pieces
    # Supports rectification to multiple EPSG codes without
    # having to alter the database.  Thus its scalable.
    
    owner = ForeignKey(User)
    title = CharField(_('Name'), max_length=200)
    image_id = CharField('Unique ID', max_length=20)
    orig_extension = CharField(_('File extension of original file'), max_length=6)
    content_type = CharField(_('Content type of original file'), max_length=20)
    
    def __unicode__(self):
        return unicode('%s' % self.title)

    class Meta:
        verbose_name = _('Rectified Image')
        verbose_name_plural = _('Rectified Images')
    
    def get_orig_filename(self):
        return str(self.image_id)+'_orig'+self.orig_extension

    def get_interm_filename(self):
        return str(self.image_id)+'_interm.'+self.RECTIFIED_FORMAT
    
    def get_rect_filename(self, srid):
        return str(self.image_id)+'_rect_'+str(srid)+'.'+self.RECTIFIED_FORMAT
    
    # Returns the height and weight of the given image
    def get_image_dim(self):
        filename = self.get_orig_filename()        
        from PIL import Image
        im = Image.open('%s%s' % (IMAGE_DIR, filename))
        return im.size      
    
    def get_orig_file_obj(self):
        filename = self.get_orig_filename()
        return open('%s%s' % (IMAGE_DIR, filename), "rb")

    def get_rect_file_obj(self, srid):
        filename = self.get_rect_filename(srid)
        return open('%s%s' % (IMAGE_DIR, filename), "rb")
    
    def delete_files(self):
        orig_path = settings.IMAGE_DIR + self.get_orig_filename();
        interm_path = settings.IMAGE_DIR + self.get_interm_filename();
        rect_path_4326 = settings.IMAGE_DIR + self.get_rect_filename(4326);
        rect_path_3005 = settings.IMAGE_DIR + self.get_rect_filename(settings.SPATIAL_REFERENCE_ID);
        
        import os
        if os.path.exists(orig_path):
            os.remove(orig_path)
        if os.path.exists(interm_path):
            os.remove(interm_path)
        if os.path.exists(rect_path_4326):
            os.remove(rect_path_4326)
        if os.path.exists(rect_path_3005):
            os.remove(rect_path_3005)                        
    
    def rectify(self, image_data, gcp_data):   
        orig_path = settings.IMAGE_DIR + self.get_orig_filename();
        interm_path = settings.IMAGE_DIR + self.get_interm_filename();
        rect_path_4326 = settings.IMAGE_DIR + self.get_rect_filename(4326);
        rect_path_3005 = settings.IMAGE_DIR + self.get_rect_filename(settings.SPATIAL_REFERENCE_ID);
        import os        
        command = settings.GDAL_PATH+"/gdal_translate "+orig_path+' '+interm_path
        if subprocess.call(command):
            raise Exception ("gdal_translate failed")

        #Add control points to tif
        command = settings.GDAL_PATH+'/gdal_translate -a_srs "EPSG:4326"'
        for i in range(len(gcp_data)):
            cur = gcp_data[i]           
            #Switch from bottom y origin to top y origin
            cur['yp'] = image_data['height'] - cur['yp'];
            
            gcp_flag = ' -gcp '
            gcp_vals = str(cur['xp']) + " " + str(cur['yp']) + " " + str(cur['xr']) + " " + str(cur['yr'])
            gcp_param = gcp_flag + gcp_vals
            command += gcp_param
        
        command += " " + orig_path + " " + interm_path
        execute(command)

        #Warp the tif to 4326
        command = settings.GDAL_PATH+"/gdalwarp -t_srs 'EPSG:4326' -dstnodata 255 " + interm_path + " " + rect_path_4326
        execute(command)

        #Warp the tif to settings.SPATIAL_REFERENCE_ID
        command = settings.GDAL_PATH+"/gdalwarp -t_srs 'EPSG:" + str(settings.SPATIAL_REFERENCE_ID) +"' -dstnodata 255 " + interm_path + " " + rect_path_3005 
        execute(command)
        return True          
    
    def has_been_rectified(self):
        rect_path_4326 = settings.IMAGE_DIR + self.get_rect_filename(4326);
        rect_path_3005 = settings.IMAGE_DIR + self.get_rect_filename(settings.SPATIAL_REFERENCE_ID);        
        import os
        if os.path.exists(rect_path_4326) and os.path.exists(rect_path_3005):
            return True
    
    def srid_supported(self, srid):
        if srid in self.SUPPORTED_SRIDS:
            return True
        else:
            return False
    
    def get_supported_srid_string(self):
        return ','.join([str(x) for x in self.SUPPORTED_SRIDS])
    

# The following data lists are for use in the ReferralInfo table for the bcgs_mapsheet_* fields 
# (GNG Added 15May09)
BCGS_MAPSHEET_QUAD_CHOICES = (
    ('114', '114'),
    ('104', '104'),
    ('103', '103'),
    ('102', '102'),
    ('94', '94'),
    ('93', '93'),
    ('92', '92'),
    ('83', '83'),
    ('82', '82'),
)

BCGS_MAPSHEET_MAP_BLOCK_CHOICES = (
    ('A', 'A'),
    ('B', 'B'),
    ('C', 'C'),
    ('D', 'D'),
    ('E', 'E'),
    ('F', 'F'),
    ('G', 'G'),
    ('H', 'H'),
    ('I', 'I'),
    ('J', 'J'),
    ('K', 'K'),
    ('L', 'L'),
    ('M', 'M'),
    ('N', 'N'),
    ('O', 'O'),
    ('P', 'P'),
)

BCGS_MAPSHEET_SHEET_CHOICES = [(a,a) for a in range(1,101)]

class ReferralStatus(Model):
    r'''
    Tracks the progress of referrals through a number of states, configurable by client.
    
    Model defines an enum of possible referral states.
    '''
    title = CharField(max_length=20)

    def __unicode__(self):
        return unicode('%s' % self.title)

    class Meta:
        verbose_name = _('Referral Status')
        verbose_name_plural = _('Referral Status')
    
# The following class is a table to store associated information
# for a referral, and is populated via a proponent web entry form 
# (GNG Added 15May09)
class ReferralInfo(Model):
    referral_shape = OneToOneField(ReferralShape)
    date_of_submission = DateField('Date of Submission', default=datetime.datetime.now().strftime("%Y-%m-%d"))
    first_nations_contact = CharField('Name of First Nations Contact Person(s)', max_length=50)
    proposal_desc = TextField(('Proposal'), max_length=200)
    location_desc = TextField(('Location'), max_length=200)
    date_requested_by = DateField('Date Requested By')
    date_requested_by_desc = TextField(('Response is Requested By'), max_length=200, blank=True)
    authorization_desc = TextField(('Authorization or Decision to be made'), max_length=200, blank=True)
    proponent_name = CharField(('Proponent'), max_length=50)
    background_context = TextField(('Background/Context'), max_length=200, blank=True)
    bcgs_mapsheet_quad = CharField(('Quadrangle'), max_length=3, choices=BCGS_MAPSHEET_QUAD_CHOICES, blank=True)
    bcgs_mapsheet_map_block = CharField(('Map Block'), max_length=1, choices=BCGS_MAPSHEET_MAP_BLOCK_CHOICES, blank=True)
    bcgs_mapsheet_sheet = CharField(('Sheet'), max_length=3, choices=BCGS_MAPSHEET_SHEET_CHOICES, blank=True)
    legal_desc = TextField(('Legal Description'), max_length=200)
    term_of_proposal = CharField(('Schedule/Term of Proposal'), max_length=50)
    other_info = TextField(('Other Information'), max_length=200, blank=True)
    related_decisions = TextField(('Related Decisions to be made'), max_length=200, blank=True)
    agency_moe = CharField(('Ministry of Environment (MOE)'), max_length=50, blank=True)
    agency_mempr = CharField(('Ministry of Energy, Mines and Petroleum Resources (MEMPR)'), max_length=50, blank=True)
    agency_ilmb = CharField(('Integrated Land Mgmt Bureau (ILMB)'), max_length=50, blank=True)
    agency_mal = CharField(('Ministry of Agriculture & Lands (MAL)'), max_length=50, blank=True)
    agency_mot = CharField(('Ministry of Transportation & Infrastructure (MOT)'), max_length=50, blank=True)
    agency_mtca = CharField(('Ministry of Tourism, Culture, and the Arts (MTCA)'), max_length=50, blank=True)
    agency_mofr = CharField(('Ministry of Forest and Range (MOFR)'), max_length=50, blank=True)
    agency_mcd = CharField(('Ministry of Community Development (MCD)'), max_length=50, blank=True)
    agency_other = CharField(('Other'), max_length=50, blank=True)
    contact_person = CharField(('Proponent Contact Person(s)'), max_length=50)
    status = ForeignKey(ReferralStatus)

    def __unicode__(self):
        return unicode('%s' % self.proposal_desc)

    class Meta:
        verbose_name = _('Referral Information')
        verbose_name_plural = _('Referral Information')

class ReferralReport(Model):
    name = CharField('Internal Report Name', max_length=50)
    title = CharField('Report Title', max_length=50)
    user_group = ForeignKey(UserGroup)
    template = CharField('Report Template', max_length=50, blank=True, default='referral_report.html')
    
    def get_layers(self):
        return ReferralReportLayer.objects.filter(report=self).values()
    
    def get_queries(self):
        return ReferralReportQuery.objects.filter(report=self).values()
    
    def __unicode__(self):
        return unicode('%s' % self.name)

    class Meta:
        verbose_name = _('Referral Report')
        verbose_name_plural = _('Referral Reports')

class ReferralReportQuery(Model):
    report = ForeignKey(ReferralReport)
    title = CharField('Question', max_length=255)
    header1 = CharField('Header 1', max_length=50, blank=True)
    header2 = CharField('Header 2', max_length=50, blank=True)
    sql = TextField('SQL Statement')

    def __unicode__(self):
        return unicode('%s' % self.title)

    class Meta:
        verbose_name = _('Referral Report Query')
        verbose_name_plural = _('Referral Report Queries')

class ReferralReportLayer(Model):
    report = ForeignKey(ReferralReport)
    table = CharField('Table Name', max_length=50)
    title = CharField('Layer Title', max_length=50)
    area_units = CharField('Area Units', max_length=10, blank=True)
    where_clause = CharField('Where Clause', max_length=255, blank=True)
    
    def __unicode__(self):
        return unicode('%s' % self.title)

    class Meta:
        verbose_name = _('Referral Report Layer')
        verbose_name_plural = _('Referral Report Layers')

class referral_report_layer_form(ModelForm):
    table = ChoiceField(required=False)

    def __init__(self, *args, **kwargs):
        super(referral_report_layer_form, self).__init__(*args, **kwargs)
        self.fields['table'].choices = [('','')]
        cursor = connection.cursor()
        sqlstr = "select table_name from information_schema.tables where table_name in (select f_table_name from geometry_columns)"
        cursor.execute(sqlstr)
        if cursor.rowcount: 
            tables = cursor.fetchall()
            for table in tables:
                table = str(table[0])
                self.fields['table'].choices.append((table, table))
    
    class Meta:
        model = ReferralReportLayer

