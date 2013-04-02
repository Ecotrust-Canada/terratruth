import sys
import os

sys.stdout = sys.stderr
sys.path = ['/usr/local/Django-1.1.1'] + sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'
os.environ['GDAL_DATA'] = '/usr/share/gdal16'

import django.core.handlers.wsgi

application = django.core.handlers.wsgi.WSGIHandler()

