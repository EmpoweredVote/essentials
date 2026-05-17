"""
Reprocess large-square bad-aspect images (Paulino 886x886, Lovely 768x768)
by center-cropping to 4:5 and adding them to the wiki results found list.
"""
import requests, pickle, os
from PIL import Image
from io import BytesIO

TEMP = os.environ.get('TEMP', '/tmp')
OUT_DIR = os.path.join(TEMP, 'ma_wiki_legislators')
os.makedirs(OUT_DIR, exist_ok=True)

with open(os.path.join(TEMP, 'ma_wiki_results.pkl'), 'rb') as f:
    r = pickle.load(f)

HEADERS = {'User-Agent': 'EmpoweredVote/1.0 (info@empowered.vote)'}

# Min size: narrow dimension must be >= 400px to upscale to 600px without obvious pixelation
MIN_NARROW = 400

extra_found = []
still_bad = []

for pid, name, img_url, page_url in r['bad_aspect']:
    resp = requests.get(img_url, headers=HEADERS, timeout=15)
    if resp.status_code != 200:
        still_bad.append((pid, name, img_url, page_url))
        continue

    try:
        img = Image.open(BytesIO(resp.content)).convert('RGB')
    except Exception:
        still_bad.append((pid, name, img_url, page_url))
        continue

    w, h = img.size
    narrow = min(w, h)

    if narrow < MIN_NARROW:
        print(f"  SKIP {name}: {w}x{h} — too small to upscale")
        still_bad.append((pid, name, img_url, page_url))
        continue

    # Center-crop to 4:5
    target_ratio = 4 / 5
    if w / h >= 1.0:
        # Square or landscape — crop to portrait by taking center strip
        new_w = int(h * target_ratio)
        if new_w > w:
            # Can't make portrait from pure landscape — skip
            print(f"  SKIP {name}: {w}x{h} — landscape, can't make portrait")
            still_bad.append((pid, name, img_url, page_url))
            continue
        left = (w - new_w) // 2
        img = img.crop((left, 0, left + new_w, h))
    else:
        # Portrait but barely — crop to exact 4:5
        new_h = int(w / target_ratio)
        img = img.crop((0, 0, w, new_h))

    img = img.resize((600, 750), Image.LANCZOS)
    out_path = os.path.join(OUT_DIR, f"{pid}.jpg")
    img.save(out_path, 'JPEG', quality=90)
    print(f"  OK {name}: {w}x{h} -> center-cropped -> 600x750")
    extra_found.append((pid, name, img_url, page_url, ['CENTER_CROP']))

# Merge into found list
r['found'].extend(extra_found)
r['bad_aspect'] = still_bad

with open(os.path.join(TEMP, 'ma_wiki_results.pkl'), 'wb') as f:
    pickle.dump(r, f)

print(f"\nAdded {len(extra_found)} from large-square crops")
print(f"Remaining bad_aspect: {len(still_bad)}")
print(f"Total found: {len(r['found'])}")
