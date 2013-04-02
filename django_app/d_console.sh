#!/bin/bash
#Use to run a python console. Sets up django environment
export PYTHONPATH=$PYTHONPATH:/usr/local/django-trunk/:..
export DJANGO_SETTINGS_MODULE=settings
export GDAL_DATA=/usr/local/gdal15
export PYTHONSTARTUP=util/shell_config.py
python $@