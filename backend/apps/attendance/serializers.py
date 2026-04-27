from rest_framework import serializers
from .models import Attendance


class AttendanceSerializer(serializers.ModelSerializer):
    user_name     = serializers.CharField(source='user.get_full_name', read_only=True)
    user_position = serializers.CharField(source='user.position', read_only=True)
    user_avatar   = serializers.CharField(source='user.avatar', read_only=True)

    class Meta:
        model  = Attendance
        fields = [
            'id', 'user', 'user_name', 'user_position', 'user_avatar',
            'date', 'check_in', 'check_out',
            'att_status', 'method', 'created_at',
        ]
