"""
Multi-source photo search for MA legislators with no usable image.
Tries: Wikipedia full article images, Ballotpedia.
"""
import requests, pickle, os, time, re
from PIL import Image
from io import BytesIO

TEMP = os.environ.get('TEMP', '/tmp')
OUT_DIR = os.path.join(TEMP, 'ma_remaining_legislators')
os.makedirs(OUT_DIR, exist_ok=True)

HEADERS = {'User-Agent': 'EmpoweredVote/1.0 (info@empowered.vote)'}

LEGISLATORS = [
    ("e2daa3aa-02b6-4a4d-859b-fb75f674625b", "Aaron L. Saunders", "ALS1"),
    ("ac853e6e-d419-4d05-b89c-77d11bb68fb2", "Alice H. Peisch", "AHP1"),
    ("2dcaf90d-f476-4fcf-af03-3d0a7aa5d3bf", "Amy M. Sangiolo", "AMS3"),
    ("19b7c45b-57a7-468c-9762-82b926080646", "Andres X. Vargas", "AXV1"),
    ("63df70bd-91d8-4576-8136-d2128ea5e9b9", "Bridget M. Plouffe", "BMP1"),
    ("c8f917f9-f6c4-49f8-b5a4-c330b07f90d2", "Colleen M. Garry", "CMG1"),
    ("b46a6774-2d85-4750-813a-6d4ef2eefb5b", "Cynthia S. Creem", "CSC0"),
    ("ca6d9c06-e613-46a1-b938-0d89d488b583", "Daniel F. Cahill", "DFC1"),
    ("6ab8e9cc-6315-40d8-bb99-eb00faed61fa", "Daniel J. Ryan", "djr1"),
    ("3d9354a8-e7ee-4381-b91a-a40d0a2e8d3a", "Danielle W. Gregoire", "DWG1"),
    ("8167ef8d-b8c8-44aa-86a2-9128c9078547", "Greg Schwartz", "G_S1"),
    ("03e35156-c179-4dd5-9c8c-8d418976914e", "Hadley Luddy", "H_L1"),
    ("d54b9791-0668-4397-b488-160d06f7c420", "Hannah E. Kane", "HEK1"),
    ("04a9edee-5d51-49f3-a2c9-585e2231bd08", "Jack P. Lewis", "JPL1"),
    ("95d5e111-b7dd-4440-8b51-070b72e33126", "James K. Hawkins", "JKH1"),
    ("1f4c93e7-37a6-4577-a2bc-d77218ad1feb", "Jessica A. Giannino", "JAG1"),
    ("ef888471-24a9-4a9f-9115-e530c16986ae", "John J. Cronin", "JJC0"),
    ("50838d91-2ce4-4aa6-8950-b87579860a4b", "John J. Mahoney", "JJM2"),
    ("08a2dfdf-43fb-408a-b758-aa94497fd871", "John R. Gaskey", "JRG2"),
    ("c4c3ed02-2592-4505-a26c-0195d0b5314e", "Judith A. Garcia", "JAG2"),
    ("37e88d74-8fdf-4a66-8685-989248512b29", "Kate Lipper-Garabedian", "KLG1"),
    ("bb235d49-c91a-45da-8d91-bf3d5b766196", "Kathleen P. LaNatra", "KPL1"),
    ("8512ef88-a285-4c6f-89d3-41fb4f8cfd48", "Kenneth P. Sweezey", "KPS1"),
    ("a0dc1cc3-efcf-4109-9f9b-4d8b36452361", "Margaret R. Scarsdale", "MRS1"),
    ("8658e02a-1456-45ba-96bb-19ff438d8e1b", "Mark D. Sylvia", "MDS1"),
    ("c77f1324-a106-4d45-a044-0174bddfe8e0", "Norman J. Orrall", "NJO1"),
    ("8995a410-276d-4a84-87f2-b097c1535f90", "Shirley A. Arriaga", "SBA1"),
    ("a4e6e14a-46f7-4574-94c6-5b7edd484d91", "Steven J. Ouellette", "SJO1"),
]

MIN_NARROW = 400  # minimum dimension to consider usable


def name_variants(full_name):
    """Generate search variants: strip middle initial, use full name."""
    parts = full_name.split()
    variants = [full_name]
    if len(parts) == 3 and len(parts[1]) <= 2:
        variants.append(f"{parts[0]} {parts[2]}")
    return variants


def wikipedia_search_images(name):
    """Search Wikipedia and return list of (img_url, page_url, width, height) for images > MIN_NARROW."""
    results = []
    for variant in name_variants(name):
        search_url = "https://en.wikipedia.org/w/api.php"
        params = {
            'action': 'query',
            'list': 'search',
            'srsearch': f"{variant} Massachusetts politician",
            'format': 'json',
            'srlimit': 3,
        }
        try:
            r = requests.get(search_url, params=params, headers=HEADERS, timeout=10)
            hits = r.json().get('query', {}).get('search', [])
        except Exception:
            continue

        for hit in hits[:2]:
            title = hit['title']
            # Skip obvious non-person pages
            if any(x in title for x in ['(name)', 'disambiguation', 'Hayden', 'List of']):
                continue
            # Check if title contains part of name (rough match)
            name_parts = [p.lower() for p in name.split() if len(p) > 2]
            title_lower = title.lower()
            matching = sum(1 for p in name_parts if p in title_lower)
            if matching < 1:
                continue

            # Get all images from the page via API
            img_params = {
                'action': 'query',
                'titles': title,
                'prop': 'images',
                'imlimit': 10,
                'format': 'json',
            }
            try:
                ir = requests.get(search_url, params=img_params, headers=HEADERS, timeout=10)
                pages = ir.json().get('query', {}).get('pages', {})
                page_images = []
                for p in pages.values():
                    page_images.extend(i['title'] for i in p.get('images', []))
            except Exception:
                continue

            page_url = f"https://en.wikipedia.org/wiki/{requests.utils.quote(title)}"

            # For each image, get its dimensions via imageinfo API
            for img_title in page_images:
                if not any(img_title.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png']):
                    continue
                info_params = {
                    'action': 'query',
                    'titles': img_title,
                    'prop': 'imageinfo',
                    'iiprop': 'url|size',
                    'format': 'json',
                }
                try:
                    infor = requests.get(search_url, params=info_params, headers=HEADERS, timeout=10)
                    info_pages = infor.json().get('query', {}).get('pages', {})
                    for ip in info_pages.values():
                        ii = ip.get('imageinfo', [{}])[0]
                        w, h = ii.get('width', 0), ii.get('height', 0)
                        url = ii.get('url', '')
                        if url and min(w, h) >= MIN_NARROW:
                            results.append((url, page_url, w, h, title))
                except Exception:
                    pass
                time.sleep(0.1)

        if results:
            break
        time.sleep(0.3)
    return results


def ballotpedia_image(name):
    """Try Ballotpedia with several URL formats."""
    parts = name.split()
    # Various name formats
    formats = []
    if len(parts) == 3:
        formats.append(f"{parts[0]}_{parts[2]}")  # First Last
        formats.append(f"{parts[0]}_{parts[1]}_{parts[2]}")  # First M. Last (with period)
        formats.append(f"{parts[0]}_{parts[1][0]}_{parts[2]}")  # First M_Last
    elif len(parts) == 2:
        formats.append(f"{parts[0]}_{parts[1]}")

    for fmt in formats:
        url = f"https://ballotpedia.org/{fmt}"
        try:
            r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=15)
            if r.status_code != 200:
                continue
            # Look for profile image
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(r.text, 'html.parser')
            # Ballotpedia profile photos are typically in div.widget-row.image
            for img in soup.find_all('img'):
                src = img.get('src', '')
                if 'ballotpedia' in src.lower() or 'wiki' in src.lower():
                    w = int(img.get('width', 0) or 0)
                    h = int(img.get('height', 0) or 0)
                    if w > 0 and h > 0 and min(w, h) >= 200:
                        return src, url, w, h
                    # Try fetching and checking size
                    if src.startswith('http') and any(src.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png']):
                        try:
                            ir = requests.get(src, headers=HEADERS, timeout=10)
                            img_obj = Image.open(BytesIO(ir.content))
                            iw, ih = img_obj.size
                            if min(iw, ih) >= MIN_NARROW:
                                return src, url, iw, ih
                        except Exception:
                            pass
        except Exception:
            pass
        time.sleep(0.3)
    return None, None, 0, 0


def process_image(img_bytes, pid):
    img = Image.open(BytesIO(img_bytes)).convert('RGB')
    w, h = img.size
    warns = []

    # Crop to 4:5
    target_ratio = 4 / 5
    current_ratio = w / h
    if current_ratio > target_ratio:
        new_w = int(h * target_ratio)
        if new_w < h * 0.5:  # Drastically different — skip
            return None, ['EXTREME_LANDSCAPE']
        left = (w - new_w) // 2
        img = img.crop((left, 0, left + new_w, h))
    elif current_ratio < target_ratio:
        new_h = int(w / target_ratio)
        img = img.crop((0, 0, w, new_h))

    cw, ch = img.size

    # Headspace check
    rgb = img.load()
    head_top_y = None
    for y in range(ch):
        hair = sum(1 for x in range(cw) if rgb[x,y][0] < 90 and rgb[x,y][1] < 90 and rgb[x,y][2] < 90 and rgb[x,y][2] < rgb[x,y][0] + 30)
        if hair > cw * 0.06:
            head_top_y = y
            break
    if head_top_y is None:
        for y in range(ch):
            skin = sum(1 for x in range(cw) if rgb[x,y][0] > 100 and rgb[x,y][0] > rgb[x,y][2] + 20)
            if skin > cw * 0.08:
                head_top_y = y
                break

    if head_top_y is not None:
        headspace_pct = head_top_y / ch * 100
        if head_top_y < 12:
            warns.append('TIGHT_TOP')
        elif headspace_pct > 15.0:
            crop_top = max(0, head_top_y - 12)
            img = img.crop((0, crop_top, cw, ch))
            warns.append(f'AUTOCROPPED:{crop_top}px')

    img = img.resize((600, 750), Image.LANCZOS)
    return img, warns


found = []
not_found = []

for i, (pid, name, code) in enumerate(LEGISLATORS):
    print(f"[{i+1}/{len(LEGISLATORS)}] {name}...", flush=True)

    # 1. Try Wikipedia full article images
    wiki_images = wikipedia_search_images(name)
    if wiki_images:
        # Sort by size (prefer largest), and prefer portrait (h > w)
        wiki_images.sort(key=lambda x: (x[3] >= x[2], min(x[2], x[3])), reverse=True)
        for img_url, page_url, w, h, title in wiki_images[:3]:
            try:
                r = requests.get(img_url, headers=HEADERS, timeout=15)
                if r.status_code != 200:
                    continue
                processed, warns = process_image(r.content, pid)
                if processed is None:
                    continue
                out_path = os.path.join(OUT_DIR, f"{pid}.jpg")
                processed.save(out_path, 'JPEG', quality=90)
                warn_str = ','.join(warns) if warns else 'clean'
                print(f"  WIKI({title[:30]}): {w}x{h} {warn_str}")
                found.append((pid, name, code, img_url, page_url, warns, 'wikipedia'))
                break
            except Exception as e:
                print(f"  wiki err: {e}")
            time.sleep(0.2)
        else:
            pass  # fell through without finding one

        if any(e[0] == pid for e in found):
            time.sleep(0.4)
            continue

    # 2. Try Ballotpedia
    bp_img, bp_page, bw, bh = ballotpedia_image(name)
    if bp_img:
        try:
            r = requests.get(bp_img, headers=HEADERS, timeout=15)
            processed, warns = process_image(r.content, pid)
            if processed is not None:
                out_path = os.path.join(OUT_DIR, f"{pid}.jpg")
                processed.save(out_path, 'JPEG', quality=90)
                warn_str = ','.join(warns) if warns else 'clean'
                print(f"  BALLOTPEDIA: {bw}x{bh} {warn_str}")
                found.append((pid, name, code, bp_img, bp_page, warns, 'ballotpedia'))
                time.sleep(0.4)
                continue
        except Exception as e:
            print(f"  bp err: {e}")

    print(f"  NOT FOUND")
    not_found.append((pid, name, code))
    time.sleep(0.4)

print(f"\n{'='*50}")
print(f"Found: {len(found)}")
print(f"Not found: {len(not_found)}")
if not_found:
    print("\nStill missing:")
    for pid, name, code in not_found:
        print(f"  {name} ({code})")

with open(os.path.join(TEMP, 'ma_remaining_results.pkl'), 'wb') as f:
    pickle.dump({'found': found, 'not_found': not_found}, f)
print("\nSaved to ma_remaining_results.pkl")
