import os
import sys

# Add backend directory to sys.path so staffcheck and apps can be imported
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'staffcheck.settings')

from django.core.wsgi import get_wsgi_application

# Vercel needs 'app' variable
app = get_wsgi_application()
