#!/bin/bash
#Run python development server, Expects path to django app root to be
#passed in as an argument.  This is likly simply the parent directory
#Example >python d_server.sh ..
export PYTHONPATH=$PYTHONPATH:/usr/local/django-trunk:..
export DJANGO_SETTINGS_MODULE=settings
export GDAL_DATA=/usr/share/gdal15
python manage.py runserver 0.0.0.0:$1
