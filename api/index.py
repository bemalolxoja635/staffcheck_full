import os
import sys

# Add the 'backend' directory to the path so django can find the 'apps' and 'staffcheck' modules
project_home = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_path = os.path.join(project_home, 'backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from django.core.wsgi import get_wsgi_application

# Ensure correct settings are used
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "staffcheck.settings")

try:
    app = get_wsgi_application()
except Exception as e:
    import traceback
    err_msg = traceback.format_exc()
    def app(environ, start_response):
        start_response('500 Internal Server Error', [('Content-Type', 'text/plain')])
        return [err_msg.encode('utf-8')]
