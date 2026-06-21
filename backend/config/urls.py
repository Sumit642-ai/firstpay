from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def home(request):
    return JsonResponse(
        {
            'service': 'FirstPay Phase 2 backend',
            'api': '/api/',
            'loginEndpoint': '/api/login/',
        }
    )

urlpatterns = [
    path('', home, name='home'),
    path('admin/', admin.site.urls),
    path('api/', include('login.urls')),
]
