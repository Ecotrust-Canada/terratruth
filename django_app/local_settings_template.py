DEBUG = True
MINIFY = True

DATABASE_PASSWORD = ''
SECRET_KEY = ''
GOOGLE_API_MAPS_KEY = ''

ACCOUNT_ACTIVATION_DAYS=14
DEFAULT_FROM_EMAIL=''
EMAIL_HOST=''
EMAIL_PORT=25
EMAIL_USE_TLS = False
EMAIL_HOST_USER = ''
EMAIL_HOST_PASSWORD = ''

HOST = 'http://terratruth.info'
WEB_URL = '/var/www/html/'

BASE_DIR = '/usr/local/apps/amndss/'
PRIVATE_MAPFILE = BASE_DIR + '/mapserver/private_map_files/amndss-private.map'
USER_LOADED_MAPFILE = BASE_DIR + '/mapserver/private_map_files/user_shapes.map'

GDAL_PATH = '/usr/bin'
GDAL_DATA = '/usr/share/gdal16'

DEFAULT_REFERRAL_INFO_STATUS = 'submitted'

SPATIAL_REFERENCE_ID = 3005
