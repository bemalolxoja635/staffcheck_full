import urllib.request, urllib.error, json  
req = urllib.request.Request('https://staffcheck-full.vercel.app/api/auth/login/', method='POST', headers={'Content-Type': 'application/json'}, data=json.dumps({'username': 'marjona', 'password': '18061806'}).encode('utf-8'))  
try:  
    print(urllib.request.urlopen(req).read().decode('utf-8'))  
except urllib.error.HTTPError as e:  
    print(e.code, e.read().decode('utf-8'))  
