from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static


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

from django.views.static import serve
from django.urls import re_path

urlpatterns += [
    re_path(r'^UploadFiles/(?P<path>.*)$', serve, {'document_root': settings.BASE_DIR / 'UploadFiles'}),
    re_path(r'^DownloadTemplates/(?P<path>.*)$', serve, {'document_root': settings.BASE_DIR / 'DownloadTemplates'}),
    re_path(r'^Content/MergedFiles/(?P<path>.*)$', serve, {'document_root': settings.BASE_DIR / 'Content' / 'MergedFiles'}),
]
