 #! /usr/bin/ python
# Utility for backing up complete app with full configuration
#
# Tim Welch 

import settings
import datetime
import os

now_str = datetime.datetime.now().strftime('%m-%d-%y-%Hh%Mm')
filename = settings.BASE_APP+'_shapes_'+now_str+'.shp'

shp_query = 'select * from '+settings.DATABASE_NAME
#command = 'sudo su -c "/usr/local/pgsql_8_2_6/bin/pgsql2shp -f '+filename+' '+settings.DATABASE_NAME+' referrals_referralshape" postgres'
command = '/usr/local/pgsql_8_2_6/bin/pgsql2shp -f '+filename+' '+settings.DATABASE_NAME+' referrals_referralshape -u postgres'
print command
os.system(command)

