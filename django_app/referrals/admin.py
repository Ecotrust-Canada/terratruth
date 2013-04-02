from django.contrib import admin

from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin

from referrals.models import *

admin.site.unregister(User)

class UserAdmin(UserAdmin):
    
    class Media:
        css = {
            "all": ("/media/css/admin.css",)
        }

admin.site.register(User, UserAdmin)

class ReferralShapeAdmin(admin.ModelAdmin):
    search_fields = ('owner', 'description', 'rts_id')
    list_display = ('id','owner','description','edit_notes', 'rts_id')

class ReferralImageAdmin(admin.ModelAdmin):
    search_fields = ('owner', 'title', 'image_id', 'content_type')
    list_display = ('id','owner','title','image_id', 'content_type', 'orig_extension')

class ReferralInfoAdmin(admin.ModelAdmin):
    search_fields = ('proposal_desc', 'proponent_name')
    list_display = ('proposal_desc','proponent_name')

class ReferralMetaDataAdmin(admin.ModelAdmin):
    search_fields = ('referral_shape',)
    list_display = ('referral_shape',)

admin.site.register(ReferralImage, ReferralImageAdmin) 
admin.site.register(ReferralShape, ReferralShapeAdmin) 
admin.site.register(ReferralInfo, ReferralInfoAdmin)
admin.site.register(ReferralShapeMetaData, ReferralMetaDataAdmin)

class ReferralReportQueryAdmin(admin.ModelAdmin):
    search_fields = ('title', 'report')
    list_display = ('title', 'report')

admin.site.register(ReferralReport)
admin.site.register(ReferralReportQuery, ReferralReportQueryAdmin)

class ReferralReportLayerAdmin(admin.ModelAdmin):

    form = referral_report_layer_form

    fieldsets = (
        (None, {
            'fields': ('report', 'title', 'table', 'area_units', 'where_clause')
        }),
    )

    list_display = ('title','report')

admin.site.register(ReferralReportLayer, ReferralReportLayerAdmin)

admin.site.register(ReferralStatus)
