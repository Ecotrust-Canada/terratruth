from django.contrib.auth.models import User, Group
from django.contrib.gis.db.models import *

class UserProfile(Model):  
    
    PROVINCES = (
        ('AB', 'AB'),
        ('BC', 'BC')                
    )  
    user = ForeignKey(User, unique=True, verbose_name='Username')  
    address = CharField('Address or Location',null=True,blank=True,max_length=100)
    city = CharField(max_length=50)
    state = CharField(max_length=2,choices=PROVINCES)
    zip = CharField(max_length=7)
    is_public = BooleanField('Should my site profile be viewable by others?',default=False)

    def __unicode__(self):
        name = self.user.get_full_name()
        if name:
            return unicode("%s" % self.user.get_full_name())
        else:
            return unicode("%s" % self.user.username)          

    def first_name(self):
        return u"%s" % self.user.first_name
    
    def last_name(self):
        return u"%s" % self.user.last_name

    def full_name(self):
        return u"%s %s" % (self.user.first_name, self.user.last_name)

    def email(self):
        return u"%s" % self.user.email

    def email(self):
        return u"%s" % self.user.email

    def account_activated(self):
        return self.user.is_active
    account_activated.boolean = True

    def account_diff(self):
        if self.user.is_active:
            return (self.user.date_joined - datetime.datetime.now())


    def remove(self):
            return '<input type="button" value="Remove" onclick="location.href=\'%s/delete/\'" />' % (self.pk)
    
    remove.short_description = ''
    remove.allow_tags = True

    class Meta:
        verbose_name = 'Profile'
        verbose_name_plural = 'Profiles' 