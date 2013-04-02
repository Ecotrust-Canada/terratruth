from django.contrib.auth.models import User, Group
from django.contrib.gis.db.models import *

'''
Users are associated with one or more groups. Groups can have one or more users.
'''
class UserGroup(Model):
    name = CharField('Name',max_length=100)
    members = ManyToManyField(User, through="UserGroupMembership") #User can be a member of many groups
    lat_coord = FloatField(null=True, blank=True)
    long_coord = FloatField(null=True, blank=True)
    mapzoom = IntegerField('Zoom Level', default=5)
    projection = IntegerField('Projection (e.g. 3005, 6627, 4326)', default=3005)

    def __unicode__(self):
        return unicode("%s" % (self.name))

    class Meta:
        verbose_name = 'User Group'
        verbose_name_plural = 'User Groups'
        db_table = 'user_groups'

'''
Custom manager for UserGroupMemberships
'''
class UserGroupMembershipManager(Manager):    
    def is_in_group(self, user, group):
        memberships = self.filter(user=user)
        for membership in memberships:
            if membership.group.name == group:
                return True
        return False
        
'''
Intermediate model defining group relationships and roles
'''
class UserGroupMembership(Model):
    user = ForeignKey(User)
    group = ForeignKey(UserGroup) 
    role = ForeignKey(Group) #Each group member has a role
    objects = UserGroupMembershipManager()
        
    class Meta:
        verbose_name = 'User Group Membership'
        verbose_name_plural = 'User Group Memberships'
        db_table = 'user_group_memberships'           