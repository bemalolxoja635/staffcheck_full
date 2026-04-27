from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Faqat admin role uchun"""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'admin'
        )


class IsAdminOrSelf(BasePermission):
    """Admin yoki o'zining profili"""
    def has_object_permission(self, request, view, obj):
        return (
            request.user.role == 'admin' or
            obj.id == request.user.id
        )
