import urllib.request, urllib.error  
req = urllib.request.Request('https://staffcheck-full.vercel.app/api/auth/login/', method='GET')  
try:  
    print(urllib.request.urlopen(req).read().decode('utf-8'))  
except urllib.error.HTTPError as e:  
    print(e.code, e.read().decode('utf-8'))  
