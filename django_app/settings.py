# Django settings for amndss project.  IMPORTANT! Override all settings
# using your own local_settings.py.  This file should contain the
# settings for the production tool only.  Passwords and other sensitive
# information should never be stored here as it is maintained in the
# code repository.  The procedure for a new checkout is to copy
# local_settings_template.py as local_settings.py and set the appropriate
# values for your local environment.  The local settings are then 
#imported at the bottom of this settings file.
import django

ADMINS = (
     ('Grant Gilron', 'grant@ecotrust.ca'),
     ('Clark Van Oyen', 'echo85@gmail.com')
)

MANAGERS = ADMINS

if django.VERSION[1] < 2:
    DATABASE_ENGINE = 'postgresql_psycopg2' # 'postgresql_psycopg2', 'postgresql', 'mysql', 'sqlite3' or 'oracle'.
    CSRF = False
else:
    CSRF = True
    DATABASE_ENGINE = 'django.contrib.gis.db.backends.postgis' # 'postgresql_psycopg2', 'postgresql', 'mysql', 'sqlite3' or 'oracle'.
DATABASE_NAME = 'amndss'                # Or path to database file if using sqlite3.
DATABASE_USER = 'amndss'                # Not used with sqlite3.
DATABASE_PASSWORD = ''                  # Not used with sqlite3.
DATABASE_HOST = ''                      # Set to empty string for localhost. Not used with sqlite3.
DATABASE_PORT = ''                      # Set to empty string for default. Not used with sqlite3.

DATABASES = {
    'default': {
        'ENGINE': DATABASE_ENGINE, # Add 'postgresql_psycopg2', 'postgresql', 'mysql', 'sqlite3' or 'oracle'.
        'NAME': DATABASE_NAME,                      # Or path to database file if using sqlite3.
        'USER': DATABASE_USER,                      # Not used with sqlite3.
        'PASSWORD': '',                  # Not used with sqlite3.
        'HOST': '',                      # Set to empty string for localhost. Not used with sqlite3.
        'PORT': '',                      # Set to empty string for default. Not used with sqlite3.
    }
}
#interop. with newer libraries.


BASE_APP_URL = '' #'amndss-django'
BASE_APP = 'django_app'
TEMP_DIR = '/tmp/'

IMAGE_DIR = '/projects/amndss/rectified_images/'

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# If running in a Windows environment this must be set to the same as your
# system time zone.
TIME_ZONE = 'America/Vancouver'

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'en-us'

SITE_ID = 1

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash if there is a path component (optional in other cases).
# Examples: "http://media.lawrence.com", "http://example.com/media/"
MEDIA_URL = ''

# URL prefix for admin media -- CSS, JavaScript and images. Make sure to use a
# trailing slash.
# Examples: "http://foo.com/media/", "/media/".
ADMIN_MEDIA_PREFIX = '/media-admin/'

#Local Setting. Make this unique, and don't share it with anybody.
SECRET_KEY = ''

from local_settings import *
#-------
#Settings below here make use of settings that might have been overridden
#in local_settings.py
#-------

# Absolute path to the directory that holds media.
MEDIA_ROOT = BASE_DIR+'/media/'

#Used for serving static files through django dev server
AMN_ROOT = BASE_DIR+'media/'
WEBMAP_ROOT = '/var/www/webmap/'

AMN_URL = WEB_URL+'amndss-media/'

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.load_template_source',
    'django.template.loaders.app_directories.load_template_source',
)

MIDDLEWARE_CLASSES = (
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.flatpages.middleware.FlatpageFallbackMiddleware',
)
if django.VERSION[1] > 1:
    MIDDLEWARE_CLASSES = MIDDLEWARE_CLASSES + ('django.middleware.csrf.CsrfViewMiddleware',)

ROOT_URLCONF = 'urls'
AUTH_PROFILE_MODULE = 'profiles.UserProfile'

import os
TEMPLATE_DIRS = (
    # Put strings here, like "/home/html/django_templates" or "C:/www/django/templates".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
    BASE_DIR+BASE_APP+'/templates',
    BASE_DIR+BASE_APP+'/dst/templates',
    BASE_DIR+BASE_APP+'/batchadmin/templates',
    BASE_DIR+BASE_APP+'/referrals/templates'
)

TEMPLATE_CONTEXT_PROCESSORS = (
    "context_processors.csrf_hack",
    'django.core.context_processors.auth'
)

INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.humanize',    
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.admin',
    'django.contrib.flatpages',
    'django_evolution',
    'registration',
    'profiles',
    'batchadmin',
    'registration_amn',
    'referrals',
    'user_groups',
    'wms_layers',
    'amndssprint'
)

ACCOUNT_ACTIVATION_DAYS=7
DEFAULT_FROM_EMAIL='referrals@ecotrust.ca'
EMAIL_HOST='mail.ecotrust.ca'
EMAIL_PORT=25
EMAIL_USE_TLS = False
EMAIL_HOST_USER = 'referrals'

LOGIN_URL = '/accounts/login'
LOGIN_REDIRECT_URL = '/main'

MAPSERVER_DIR = '/usr/local/apps/terratruth/mapserver/'
