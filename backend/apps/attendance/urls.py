from django.urls import path
from .views import (
    FaceAttendanceView,
    AttendanceChallengeView,
    QRAttendanceView,
    AttendanceListView,
    MonitorView,
    AnalyticsView,
    ExportAttendanceView,
)

urlpatterns = [
    path('face/',     FaceAttendanceView.as_view(),      name='face-attendance'),
    path('challenge/', AttendanceChallengeView.as_view(), name='attendance-challenge'),
    path('qr/',       QRAttendanceView.as_view(),        name='qr-attendance'),
    path('list/',     AttendanceListView.as_view(),   name='attendance-list'),
    path('monitor/',  MonitorView.as_view(),          name='monitor'),
    path('analytics/', AnalyticsView.as_view(),       name='analytics'),
    path('export/',   ExportAttendanceView.as_view(), name='export-attendance'),
]
