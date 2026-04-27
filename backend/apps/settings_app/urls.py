from django.urls import path
from .views import SettingsView, PublicSettingsView

urlpatterns = [
    path('',       SettingsView.as_view(),       name='settings'),
    path('public/', PublicSettingsView.as_view(), name='public-settings'),
]
