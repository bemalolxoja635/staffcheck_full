import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'staffcheck.settings')
django.setup()

from django.db import connection
with connection.cursor() as cursor:
    cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='settings'")
    row = cursor.fetchone()
    if row:
        print(row[0])
    else:
        print("Table 'settings' not found")
