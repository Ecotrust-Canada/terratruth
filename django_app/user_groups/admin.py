from django.contrib import admin

from user_groups.models import *

class UserGroupAdmin(admin.ModelAdmin):
    list_display = ('id','name','lat_coord','long_coord','mapzoom','projection')

admin.site.register(UserGroup, UserGroupAdmin)

class UserGroupMembershipAdmin(admin.ModelAdmin):
    list_display = ('user','group','role')
    
admin.site.register(UserGroupMembership, UserGroupMembershipAdmin)