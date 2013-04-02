from django import forms
from registration.forms import RegistrationForm
from django.utils.translation import ugettext_lazy as _
from registration.models import RegistrationProfile

class RegistrationFormFull(RegistrationForm):
    first_name = forms.CharField(_(u'Last Name'),widget=forms.TextInput(attrs={}),required=True, min_length=2)
    last_name = forms.CharField(_(u'Last Name'),widget=forms.TextInput(attrs={}),required=True, min_length=2)
    address = forms.CharField(_(u'Address'),widget=forms.TextInput(attrs={}),required=True)
    city = forms.CharField(_(u'Address'),widget=forms.TextInput(attrs={'size':'50'}),required=True)        
    state = forms.CharField(_(u'Address'),widget=forms.TextInput(attrs={'size':'2'}),required=True)
    zip = forms.CharField(_(u'Address'),widget=forms.TextInput(attrs={'size':'7'}),required=True)

    def save(self, profile_callback=None):
        """
        Create the new ``User``, ``RegistrationProfile``, 
        ``UserProfile`` and returns the ``User``.
        
        This is essentially a light wrapper around
        ``RegistrationProfile.objects.create_inactive_user()``,
        feeding it the form data and a profile callback (see the
        documentation on ``create_inactive_user()`` for details) if
        supplied.
        
        This overrides the default RegistrationForm.save and adds
        the additional info we collected including their first and
        last name and also their profile information   
        """        
        new_user = RegistrationProfile.objects.create_inactive_user(username=self.cleaned_data['username'],
                                                                    password=self.cleaned_data['password1'],
                                                                    email=self.cleaned_data['email'],
                                                                    profile_callback=profile_callback)
        #Save the extra information we collected
        new_user.first_name=self.cleaned_data['first_name'],
        new_user.last_name=self.cleaned_data['last_name'],
        new_user.save()   
        
        new_profile = new_user.userprofile_set.create(
            address=self.cleaned_data['address'],
            city=self.cleaned_data['city'],
            state=self.cleaned_data['state'],
            zip=self.cleaned_data['zip'],
        )        
        new_profile.save( )
             
        return new_user