from django.conf import settings
from django.db import models


class Attendance(models.Model):
    STATUS_CHOICES = [('on_time', 'Vaqtida'), ('late', 'Kechikdi')]
    METHOD_CHOICES = [('faceid', 'FaceID'), ('qr', 'QR-kod')]

    user       = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='attendances',
    )
    date       = models.DateField()
    check_in   = models.TimeField(null=True, blank=True)
    check_out  = models.TimeField(null=True, blank=True)
    att_status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='on_time')
    method     = models.CharField(max_length=10, choices=METHOD_CHOICES, default='faceid')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table        = 'attendance'
        unique_together = ['user', 'date']
        ordering        = ['-date', '-check_in']
        verbose_name       = 'Davomat'
        verbose_name_plural = 'Davomatlar'

    def __str__(self):
        return f"{self.user} — {self.date} ({self.att_status})"
