import urllib.request
import urllib.error

paths = ['/', '/index.html', '/frontend/index.html', '/api/', '/favicon.svg', '/frontend/favicon.svg']

for p in paths:
    url = f'https://staffcheck-full.vercel.app{p}'
    try:
        response = urllib.request.urlopen(url)
        print(f"OK {p} - {response.getcode()}")
    except urllib.error.HTTPError as e:
        print(f"FAIL {p} - {e.code}")
    except Exception as e:
        print(f"ERROR {p} - {e}")
