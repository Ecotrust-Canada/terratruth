#!/usr/bin/python
# Utility for backing up your postgres DB to binary db file and django fixture
#
# Tim Welch

import datetime
import os

import sys
sys.path.append('../django_app')
import settings

now_str = datetime.datetime.now().strftime('%m-%d-%y-%Hh%Mm')
filename = settings.BASE_APP+'_db_backup_'+now_str

#generate db file
db_filename = filename+'.db'
pg_command = 'pg_dump -f '+db_filename+' -i -x -O -R -U '+settings.DATABASE_USER

#zip db file up
zip_filename = filename+'.zip'
zip_command = 'zip '+zip_filename+' '+db_filename

#remove db file
del_command = 'rm '+db_filename

commands = [
    pg_command,
    zip_command,
    del_command            
]

for command in commands:
    os.system(command)
