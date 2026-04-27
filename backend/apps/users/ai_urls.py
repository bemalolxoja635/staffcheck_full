from django.urls import path
from .views import AIAssistantView, AIOCRView, AIAnalyticsView

urlpatterns = [
    path('assistant/', AIAssistantView.as_view(), name='ai_assistant'),
    path('ocr/',       AIOCRView.as_view(),       name='ai_ocr'),
    path('analytics/', AIAnalyticsView.as_view(), name='ai_analytics'),
]
