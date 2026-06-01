from django.db import migrations, models

def create_initial_settings(apps, schema_editor):
    Setting = apps.get_model('settings_app', 'Setting')
    defaults = {
        'start_time': '09:00:00',
        'end_time': '18:00:00',
        'late_threshold_minutes': '15',
        'company_name': 'StaffCheck',
    }
    for key, value in defaults.items():
        Setting.objects.get_or_create(key=key, defaults={'value': value})

class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Setting',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('key', models.CharField(max_length=100, unique=True)),
                ('value', models.TextField()),
            ],
            options={
                'verbose_name': 'Sozlama',
                'verbose_name_plural': 'Sozlamalar',
                'db_table': 'settings',
            },
        ),
        migrations.RunPython(create_initial_settings),
    ]
