from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('django-admin/', admin.site.urls),

    # Auth
    path('api/auth/', include('apps.users.auth_urls')),

    # Users (admin CRUD)
    path('api/users/', include('apps.users.user_urls')),

    # Attendance
    path('api/attendance/', include('apps.attendance.urls')),

    # Settings
    path('api/settings/', include('apps.settings_app.urls')),

    # AI Service
    path('api/ai/', include('apps.users.ai_urls')),

    # JWT refresh
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Catch-all for React/Vite SPA
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
