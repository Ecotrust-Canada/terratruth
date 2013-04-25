#!/usr/bin/env python

import sys
sys.path += ['/usr/lib/python2.7/dist-packages'] + sys.path
from django.core.management import execute_manager
try:
    import settings # Assumed to be in the same directory.
except ImportError:
    import sys
    sys.stderr.write("Error: Can't find the file 'settings.py' in the directory containing %r. It appears you've customized things.\nYou'll have to run django-admin.py, passing it your settings module.\n(If the file settings.py does indeed exist, it's causing an ImportError somehow.)\n" % __file__)
    sys.exit(1)

import os
os.environ['GDAL_DATA'] = '/usr/share/gdal/1.7'
os.environ['GDAL_LIBRARY_PATH'] = '/usr/lib/libgdal1.7.0.so'

if __name__ == "__main__":
    execute_manager(settings)
