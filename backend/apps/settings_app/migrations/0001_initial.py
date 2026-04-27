from django.db import migrations


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.RunSQL(
            sql="""
            CREATE TABLE IF NOT EXISTS settings (
                id    SERIAL PRIMARY KEY,
                key   VARCHAR(100) NOT NULL UNIQUE,
                value TEXT NOT NULL DEFAULT ''
            );

            INSERT INTO settings (key, value) VALUES
                ('start_time',             '09:00:00'),
                ('end_time',               '18:00:00'),
                ('late_threshold_minutes', '15'),
                ('company_name',           'StaffCheck')
            ON CONFLICT (key) DO NOTHING;
            """,
            reverse_sql="DROP TABLE IF EXISTS settings;"
        )
    ]
