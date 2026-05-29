from django.urls import path
from .views import (
    RegisterView, LoginView, LogoutView,
    MeView, ChangePasswordView,
    GetFaceDescriptorsView, SaveFaceDescriptorView,
    TaskListView, TaskUpdateView,
)

urlpatterns = [
    path('register/',         RegisterView.as_view(),           name='register'),
    path('login/',            LoginView.as_view(),              name='login'),
    path('logout/',           LogoutView.as_view(),             name='logout'),
    path('me/',               MeView.as_view(),                 name='me'),
    path('me/tasks/',         TaskListView.as_view(),           name='my-tasks'),
    path('me/tasks/<int:pk>/', TaskUpdateView.as_view(),        name='update-task'),
    path('change-password/',  ChangePasswordView.as_view(),     name='change-password'),
    path('face-descriptors/', GetFaceDescriptorsView.as_view(), name='face-descriptors'),
    path('save-face/',        SaveFaceDescriptorView.as_view(), name='save-face'),
]
