import urllib.request
import re

try:
    res = urllib.request.urlopen("http://localhost:3000")
    html = res.read().decode("utf-8", errors="ignore")
    css_files = re.findall(r'/_next/static/css/[^"]+\.css', html)
    print("Found CSS files:", set(css_files))
    for css in set(css_files):
        c_res = urllib.request.urlopen(f"http://localhost:3000{css}")
        print(f"CSS {css} -> status {c_res.getcode()}, size: {len(c_res.read())} bytes")
except Exception as e:
    print("Error testing CSS:", e)
