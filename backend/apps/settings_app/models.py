from django.db import models


class Setting(models.Model):
    key   = models.CharField(max_length=100, unique=True)
    value = models.TextField()

    class Meta:
        db_table     = 'settings'
        verbose_name = 'Sozlama'
        verbose_name_plural = 'Sozlamalar'

    def __str__(self):
        return f"{self.key} = {self.value}"

    @classmethod
    def get_value(cls, key: str, default: str = '') -> str:
        """Sozlamani kalit bo'yicha oladi, topilmasa default qaytaradi"""
        try:
            return cls.objects.get(key=key).value
        except cls.DoesNotExist:
            return default

    @classmethod
    def set_value(cls, key: str, value: str):
        """Sozlamani saqlaydi yoki yangilaydi"""
        obj, _ = cls.objects.update_or_create(
            key=key,
            defaults={'value': value}
        )
        return obj
