
import settings

def csrf_hack(request):
    
    ctx = {
        'settings':settings,
    }
    
    return ctx
        