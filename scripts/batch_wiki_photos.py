"""
Batch Wikipedia photo fetcher for MA legislators with square/missing legislature thumbnails.
Searches Wikipedia by name, downloads original image, processes to 600x750 4:5 JPEG.
"""
import requests, json, pickle, os, time
from PIL import Image
from io import BytesIO

TEMP = os.environ.get('TEMP', '/tmp')
OUT_DIR = os.path.join(TEMP, 'ma_wiki_legislators')
os.makedirs(OUT_DIR, exist_ok=True)

LEGISLATORS = [
    ("e2daa3aa-02b6-4a4d-859b-fb75f674625b", "Aaron L. Saunders"),
    ("78ae3786-e71e-4dc4-8b84-0ab28b555632", "Adam Gómez"),
    ("ac853e6e-d419-4d05-b89c-77d11bb68fb2", "Alice H. Peisch"),
    ("2dcaf90d-f476-4fcf-af03-3d0a7aa5d3bf", "Amy M. Sangiolo"),
    ("19b7c45b-57a7-468c-9762-82b926080646", "Andres X. Vargas"),
    ("15f59b0c-f71c-4199-b195-7b653a05a310", "Barry R. Finegold"),
    ("99457307-afa4-4045-aebf-06ee8b39d28f", "Brendan P. Crighton"),
    ("63df70bd-91d8-4576-8136-d2128ea5e9b9", "Bridget M. Plouffe"),
    ("913143ad-c39b-4dde-9a93-8252a98b0181", "Carole A. Fiola"),
    ("fd3bf15c-265b-46a9-aa72-c9097749d762", "Chynah Tyler"),
    ("c8f917f9-f6c4-49f8-b5a4-c330b07f90d2", "Colleen M. Garry"),
    ("b46a6774-2d85-4750-813a-6d4ef2eefb5b", "Cynthia S. Creem"),
    ("ca6d9c06-e613-46a1-b938-0d89d488b583", "Daniel F. Cahill"),
    ("5c36a94c-9006-4550-a37e-978a65d2725c", "Daniel J. Hunt"),
    ("6ab8e9cc-6315-40d8-bb99-eb00faed61fa", "Daniel J. Ryan"),
    ("3d9354a8-e7ee-4381-b91a-a40d0a2e8d3a", "Danielle W. Gregoire"),
    ("73afbe36-aa0c-4474-a2fc-6ff13bf20d71", "Edward R. Philips"),
    ("77ceaab2-846e-4bc8-b09d-faff40ddbc60", "Francisco E. Paulino"),
    ("8167ef8d-b8c8-44aa-86a2-9128c9078547", "Greg Schwartz"),
    ("03e35156-c179-4dd5-9c8c-8d418976914e", "Hadley Luddy"),
    ("d54b9791-0668-4397-b488-160d06f7c420", "Hannah E. Kane"),
    ("04a9edee-5d51-49f3-a2c9-585e2231bd08", "Jack P. Lewis"),
    ("95d5e111-b7dd-4440-8b51-070b72e33126", "James K. Hawkins"),
    ("a40f234e-1790-4b52-8670-090b6379eb03", "Jason M. Lewis"),
    ("1f4c93e7-37a6-4577-a2bc-d77218ad1feb", "Jessica A. Giannino"),
    ("6d8717ca-45f9-42cf-bd28-6786a50d254f", "Joan B. Lovely"),
    ("5cd1c798-31dc-4e53-b578-7e2d81378478", "John F. Keenan"),
    ("ef888471-24a9-4a9f-9115-e530c16986ae", "John J. Cronin"),
    ("50838d91-2ce4-4aa6-8950-b87579860a4b", "John J. Mahoney"),
    ("08a2dfdf-43fb-408a-b758-aa94497fd871", "John R. Gaskey"),
    ("c4c3ed02-2592-4505-a26c-0195d0b5314e", "Judith A. Garcia"),
    ("bd451748-111f-461d-9752-95e7c243769e", "Julian A. Cyr"),
    ("37e88d74-8fdf-4a66-8685-989248512b29", "Kate Lipper-Garabedian"),
    ("bb235d49-c91a-45da-8d91-bf3d5b766196", "Kathleen P. LaNatra"),
    ("8512ef88-a285-4c6f-89d3-41fb4f8cfd48", "Kenneth P. Sweezey"),
    ("2f7d598c-c3d7-48ba-ac9c-fb059e032bfe", "Liz Miranda"),
    ("11d73e67-bcd9-419a-8b0d-a26447eb0c0b", "Lydia M. Edwards"),
    ("a0dc1cc3-efcf-4109-9f9b-4d8b36452361", "Margaret R. Scarsdale"),
    ("8658e02a-1456-45ba-96bb-19ff438d8e1b", "Mark D. Sylvia"),
    ("541efc37-b332-4c80-8264-7b655efed5ac", "Nicholas A. Boldyga"),
    ("c77f1324-a106-4d45-a044-0174bddfe8e0", "Norman J. Orrall"),
    ("444ac209-7bfa-4f3a-a733-5666fd74fd66", "Sean Reid"),
    ("8995a410-276d-4a84-87f2-b097c1535f90", "Shirley A. Arriaga"),
    ("a4e6e14a-46f7-4574-94c6-5b7edd484d91", "Steven J. Ouellette"),
    ("3107f5d0-2cfd-43bc-a8eb-6b8ddc75bfc1", "Steven S. Howitt"),
]

HEADERS = {'User-Agent': 'EmpoweredVote/1.0 (info@empowered.vote)'}

def search_wikipedia_page(name):
    """Search Wikipedia and return the best matching page title."""
    # Strip middle initial for cleaner search
    parts = name.split()
    if len(parts) == 3 and len(parts[1]) <= 2:
        search_name = f"{parts[0]} {parts[2]}"
    else:
        search_name = name

    url = "https://en.wikipedia.org/w/api.php"
    params = {
        'action': 'query',
        'list': 'search',
        'srsearch': f"{search_name} Massachusetts politician",
        'format': 'json',
        'srlimit': 3,
    }
    r = requests.get(url, params=params, headers=HEADERS, timeout=10)
    data = r.json()
    results = data.get('query', {}).get('search', [])
    if not results:
        return None
    # Return first result title
    return results[0]['title']


def get_page_image(title):
    """Get the main image URL from a Wikipedia page summary."""
    url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{requests.utils.quote(title)}"
    r = requests.get(url, headers=HEADERS, timeout=10)
    if r.status_code != 200:
        return None, None
    data = r.json()
    # Prefer originalimage over thumbnail
    img = data.get('originalimage') or data.get('thumbnail')
    if not img:
        return None, None
    page_url = data.get('content_urls', {}).get('desktop', {}).get('page', '')
    return img['source'], page_url


def check_headspace(img):
    """Returns (head_top_y, headspace_pct, category)."""
    w, h = img.size
    rgb = img.load()
    head_top_y = None

    # Hair detection first
    for y in range(h):
        hair = sum(
            1 for x in range(w)
            if rgb[x, y][0] < 90 and rgb[x, y][1] < 90 and rgb[x, y][2] < 90
            and rgb[x, y][2] < rgb[x, y][0] + 30
        )
        if hair > w * 0.06:
            head_top_y = y
            break

    # Fallback: skin detection
    if head_top_y is None:
        for y in range(h):
            skin = sum(
                1 for x in range(w)
                if rgb[x, y][0] > 100 and rgb[x, y][0] > rgb[x, y][2] + 20
            )
            if skin > w * 0.08:
                head_top_y = y
                break

    headspace_pct = (head_top_y / h * 100) if head_top_y is not None else 0.0
    return head_top_y, headspace_pct


def process_image(img_bytes, pid, name):
    """
    Crop to 4:5, resize to 600x750, check headspace.
    Returns (processed_img, warns) or raises.
    """
    img = Image.open(BytesIO(img_bytes)).convert('RGB')
    w, h = img.size
    warns = []

    # Check aspect before processing
    aspect = w / h
    if aspect > 0.95:
        return None, ['BAD_ASPECT']

    # Crop to 4:5 ratio
    target_ratio = 4 / 5
    current_ratio = w / h
    if current_ratio > target_ratio:
        # Too wide — crop sides
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        img = img.crop((left, 0, left + new_w, h))
    elif current_ratio < target_ratio:
        # Too tall — crop bottom
        new_h = int(w / target_ratio)
        img = img.crop((0, 0, w, new_h))

    # Check headspace on cropped image
    head_top_y, headspace_pct = check_headspace(img)
    cw, ch = img.size

    if head_top_y is not None and head_top_y < 12:
        warns.append('TIGHT_TOP')
    elif head_top_y is not None and headspace_pct > 15.0:
        crop_top = max(0, head_top_y - 12)
        img = img.crop((0, crop_top, cw, ch))
        warns.append(f'AUTOCROPPED:{crop_top}px')

    # Resize to 600x750
    img = img.resize((600, 750), Image.LANCZOS)
    return img, warns


found = []
not_found = []
bad_aspect = []

for i, (pid, name) in enumerate(LEGISLATORS):
    print(f"[{i+1}/{len(LEGISLATORS)}] {name}...", end=' ', flush=True)
    try:
        title = search_wikipedia_page(name)
        if not title:
            print("no wiki page")
            not_found.append((pid, name, "no_search_result"))
            time.sleep(0.3)
            continue

        img_url, page_url = get_page_image(title)
        if not img_url:
            print(f"no image on '{title}'")
            not_found.append((pid, name, f"no_image:{title}"))
            time.sleep(0.3)
            continue

        # Download image
        r = requests.get(img_url, headers=HEADERS, timeout=15)
        if r.status_code != 200:
            print(f"download failed {r.status_code}")
            not_found.append((pid, name, f"download_failed:{r.status_code}"))
            time.sleep(0.3)
            continue

        # Process
        processed, warns = process_image(r.content, pid, name)
        if processed is None:
            print(f"BAD_ASPECT — {img_url[:60]}")
            bad_aspect.append((pid, name, img_url, page_url))
            time.sleep(0.3)
            continue

        # Save
        out_path = os.path.join(OUT_DIR, f"{pid}.jpg")
        processed.save(out_path, 'JPEG', quality=90)
        warn_str = ','.join(warns) if warns else 'clean'
        print(f"{warn_str} — saved")
        found.append((pid, name, img_url, page_url, warns))

    except Exception as e:
        print(f"ERROR: {e}")
        not_found.append((pid, name, str(e)))

    time.sleep(0.4)

print(f"\n{'='*50}")
print(f"Found+processed: {len(found)}")
print(f"  - clean:       {sum(1 for _,_,_,_,w in found if not w)}")
print(f"  - tight_top:   {sum(1 for _,_,_,_,w in found if 'TIGHT_TOP' in w)}")
print(f"  - autocropped: {sum(1 for _,_,_,_,w in found if any('AUTOCROPPED' in x for x in w))}")
print(f"Bad aspect:      {len(bad_aspect)}")
print(f"Not found:       {len(not_found)}")

if not_found:
    print("\nNot found:")
    for pid, name, reason in not_found:
        print(f"  {name}: {reason}")

if bad_aspect:
    print("\nBad aspect (still square on Wikipedia):")
    for pid, name, url, page in bad_aspect:
        print(f"  {name}: {url[:80]}")

# Save for upload step
with open(os.path.join(TEMP, 'ma_wiki_results.pkl'), 'wb') as f:
    pickle.dump({'found': found, 'not_found': not_found, 'bad_aspect': bad_aspect}, f)
print("\nSaved to ma_wiki_results.pkl")
