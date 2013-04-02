from django.contrib import admin

from wms_layers.models import *

class ExternalAdmin(admin.ModelAdmin):
    list_display = ('name','wms_name', 'order',
                    'transparent', 'hide_in_legend', 
                    'visibility', 'display_in_layer_switcher', 
                    'active', 'is_base_layer', 'url')

admin.site.register(External, ExternalAdmin)
admin.site.register(wms_format)
admin.site.register(spatial_reference)

class RectifierAdmin(admin.ModelAdmin):
    fieldsets = (
        (None, {
            'fields': ('name','wms_name', 'url', 'layers', 'format', 
                       'srs', 'opacity', 'transparent', 'hide_in_legend', 
                       'visibility', 'active', 'is_base_layer',)
        }),
    )
    
    list_display = ('name','wms_name', 'transparent', 'hide_in_legend', 
                    'visibility', 'active', 'is_base_layer', 'url')

admin.site.register(Rectifier, RectifierAdmin)

class PrivateAdmin(admin.ModelAdmin):
    class Media:
      js = ('/media/js/jquery.js','/media/js/wms_admin.js','/media/js/farbtastic.js')
      css = {
          'all': ('/media/css/farbtastic.css',)
      }
    
    # prevent users from delete multiple records
    # (this removes the delete action for more than one selected record)
    actions = None
    
    form = user_loaded_private_layer_form

    fieldsets = (
        (None, {
            'fields': ('name','description','metadata', 'owner','order')
        }),
        ('Advanced options', {
            'classes': ('collapse',),
            'fields': ('user_file','style','url', 'layers', 'label_field_name','label_style','visibility', 'opacity', 'format', 'show_legend', 'tag', 'user_file_type')
        }),
    )

    list_display = ('name','description','owner')

admin.site.register(Private, PrivateAdmin)

