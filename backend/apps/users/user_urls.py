from django.urls import path
from .admin_views import (
    UserListView, UserDetailView,
    ApproveUserView, BanUserView,
    AdminStatsView, ActionLogView,
    AdminTaskListView, AdminTaskCreateView,
)

urlpatterns = [
    path('',               UserListView.as_view(),   name='user-list'),
    path('<int:pk>/',      UserDetailView.as_view(),  name='user-detail'),
    path('<int:pk>/approve/', ApproveUserView.as_view(), name='user-approve'),
    path('<int:pk>/ban/',     BanUserView.as_view(),     name='user-ban'),
    path('stats/',         AdminStatsView.as_view(), name='admin-stats'),
    path('logs/',          ActionLogView.as_view(),  name='action-logs'),
    path('tasks/',         AdminTaskListView.as_view(), name='admin-tasks-list'),
    path('tasks/create/',  AdminTaskCreateView.as_view(), name='admin-tasks-create'),
]
