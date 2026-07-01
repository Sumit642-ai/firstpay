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

if settings.DEBUG:
    urlpatterns += static('/UploadFiles/', document_root=settings.BASE_DIR / 'UploadFiles')
    urlpatterns += static('/DownloadTemplates/', document_root=settings.BASE_DIR / 'DownloadTemplates')
    urlpatterns += static('/Content/MergedFiles/', document_root=settings.BASE_DIR / 'Content' / 'MergedFiles')
