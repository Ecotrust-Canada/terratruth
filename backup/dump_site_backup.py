#!/usr/bin/python
# Utility for backing up complete app with full configuration
#
# Tim Welch 

import datetime
import os

import sys
sys.path.append('../django_app')
import settings

now_str = datetime.datetime.now().strftime('%m-%d-%y-%Hh%Mm')
filename = settings.BASE_APP+'_site_backup_'+now_str+'.zip'

zip_start = 'zip -rg '+filename+' '
commands = [
    zip_start+settings.BASE_DIR,
    zip_start+settings.IMAGE_DIR,    
    zip_start+'/etc/httpd/conf/httpd.conf',        
    zip_start+'/etc/httpd/conf/deflate.conf',
    zip_start+'/etc/httpd/conf.d',
    zip_start+'/etc/init.d/postgresql'     
]

for command in commands:
    print command
    os.system(command)
