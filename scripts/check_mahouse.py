import requests, re
from bs4 import BeautifulSoup

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'text/html'}

# Test a few senators and house members
urls = [
    ("Alice H. Peisch", "https://www.mahouse.gov/Members/Alice-Hanlon-Peisch"),
    ("Cynthia Creem", "https://www.malegislature.gov/Legislators/Profile/CSC0"),
    ("Alice Peisch direct", "https://malegislature.gov/Legislators/Profile/AHP1"),
]

for name, url in urls:
    try:
        r = requests.get(url, headers=headers, timeout=15, verify=False)
        print(f"\n{name} ({url}): {r.status_code}")
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, 'html.parser')
            for img in soup.find_all('img')[:10]:
                src = img.get('src', '')
                w = img.get('width', '?')
                h = img.get('height', '?')
                if src and not src.endswith('.svg') and not 'logo' in src.lower():
                    print(f"  {w}x{h}: {src[:100]}")
    except Exception as e:
        print(f"\n{name}: ERROR {e}")
