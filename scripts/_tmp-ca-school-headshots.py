#!/usr/bin/env python3
"""
CA City School Board headshot download + process + upload to Supabase Storage.
Phase 87-02 / Migration 258
Uses direct HTTP (urllib) — no supabase SDK needed.

Districts: SFUSD (7), SDUSD (4 of 5), SCUSD (7), SJUSD (0), FUSD (5), BUSD (5)
Total: 28 photos uploaded
"""

import io
import json
import sys
import urllib.request
import urllib.error
import urllib.parse
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("ERROR: Pillow not installed. Run: python3 -m pip install Pillow")
    sys.exit(1)

# ============================================================
# Configuration
# ============================================================
SUPABASE_URL = "https://kxsdzaojfaibhuzmclfq.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4c2R6YW9qZmFpYmh1em1jbGZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDM2NTEwMywiZXhwIjoyMDY1OTQxMTAzfQ.6cZBx-L-pFiNOf3r6c9xolq2RHZT3pBsVdZxsVqYnYo"
BUCKET = "politician_photos"
STORAGE_BASE = f"https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/{BUCKET}/"
TMP_DIR = Path("C:/Transparent Motivations/essentials/scripts/tmp_ca_school_headshots")

TARGET_W = 600
TARGET_H = 750

# ============================================================
# Officials: (external_id, politician_id, name, source_url)
# Sharon Whitehurst-Payne (-870012) omitted — URL not found via automation
# SJUSD (-870020..-870024) omitted — no photos on official site
# ============================================================
OFFICIALS = [
    # ===== SFUSD (7) =====
    (-870001, "df88c679-1a6c-4ecf-8b55-3b6a59f01686", "Phil Kim",
     "https://www.sfusd.edu/sites/default/files/styles/max_635/public/2025-01/Phil%20Kim%20B%26W.jpg?itok=EUZO8Wq_"),
    (-870002, "6ef8e4aa-1262-4461-9124-93ef2aa34dc5", "Jaime Huling",
     "https://www.sfusd.edu/sites/default/files/styles/max_635/public/2025-01/Jaime%20Huling%20B%26W.jpg?itok=ik27of31"),
    (-870003, "f7d1b584-8c95-4e68-bedb-6f1b3fabab87", "Matt Alexander",
     "https://www.sfusd.edu/sites/default/files/styles/max_635/public/Matt%20Alexander%20-%20Headshot_%203.jpg?itok=0SftV0wW"),
    (-870004, "ab26f9f3-3cc1-43d3-b40a-717667af2284", "Alida Fisher",
     "https://www.sfusd.edu/sites/default/files/styles/max_635/public/2023-01/Alida%20bw%202.jpg?itok=0EVJMR-l"),
    (-870005, "8ca7781e-b688-4979-870d-80e36e21169f", "Parag Gupta",
     "https://www.sfusd.edu/sites/default/files/styles/max_635/public/2025-01/Parag%20Gupta%20B%26W.jpg?itok=W2YaVrR3"),
    (-870006, "61965a0c-e156-4a4a-bd4e-229ea6a15bf2", "Supryia Ray",
     "https://www.sfusd.edu/sites/default/files/styles/max_635/public/2025-01/Supryia%20Ray%20headshot%20B%26W.jpg?itok=vUF8d72u"),
    (-870007, "948dd349-1f56-4b65-bc1d-4a7affc05051", "Lisa Weissman-Ward",
     "https://www.sfusd.edu/sites/default/files/styles/max_635/public/2022-05/Lisa_BW.jpeg?itok=UNsNi4tK"),

    # ===== SDUSD (4 of 5 — Whitehurst-Payne not found) =====
    (-870008, "5b4fb4cc-a3ce-4f4f-95a5-47ebed1066b4", "Sabrina Bazzo",
     "https://cdnsm5-ss18.sharpschool.com/UserFiles/Servers/Server_27732394/Image/%20About/Board%20of%20Edu/Sabrina%20Bazzo%20official%20photo.jpg"),
    (-870009, "aef5973c-3d58-407a-82d2-8fa7a81fd5d1", "Shana Hazan",
     "https://cdnsm5-ss18.sharpschool.com/UserFiles/Servers/Server_27732394/Image/%20About/Board%20of%20Edu/Shana%20Hazan%20Head%20Shot%20V2.jpg"),
    (-870010, "c7eb0f8d-c993-4da8-96aa-54295cf9c74a", "Cody Petterson",
     "https://cdnsm5-ss18.sharpschool.com/UserFiles/Servers/Server_27732394/Image/%20About/Board%20of%20Edu/Cody%20Petterson.jpg"),
    (-870011, "b04e1f2d-d1a4-43de-80db-bdc29dadfaeb", "Richard Barrera",
     "https://www.sandiegounified.org/UserFiles/Servers/Server_27732394/Image/%20About/Board%20of%20Edu/Richard%20NEW%202020-21.jpg"),

    # ===== SCUSD (7) =====
    (-870013, "202e13fa-a2de-45f8-9fd2-8d0fd21bbd79", "Tara Jeane",
     "https://resources.finalsite.net/images/f_auto,q_auto/v1752791745/scusdedu/sksvju79a67qu49jjnco/jeane1.png"),
    (-870014, "4b876240-6925-48b9-a090-6ad2cded90df", "Jasjit Singh",
     "https://resources.finalsite.net/images/f_auto,q_auto/v1752791344/scusdedu/qzfhkawj2dolcm6eddwb/singh1.png"),
    (-870015, "bd4b42d0-b6d7-4b46-ac46-9b22e6ae3f3e", "Jose M. Navarro",
     "https://resources.finalsite.net/images/f_auto,q_auto/v1752792366/scusdedu/xjez6fqoedzzi197aeyi/navarro.png"),
    (-870016, "816e1e40-6d80-4736-acfd-4e540d25e81c", "April K. Ybarra",
     "https://resources.finalsite.net/images/f_auto,q_auto/v1752792669/scusdedu/vumecisyrtglkl9atesh/ybarra.png"),
    (-870017, "91afe003-a2e7-42b2-9803-a86ea9919587", "Chinua Rhodes",
     "https://resources.finalsite.net/images/f_auto,q_auto/v1752792006/scusdedu/vrywfan1apzfqnacaq4v/rhodes.png"),
    (-870018, "86af4aa5-ff19-47ea-95d3-1ee05edea659", "Taylor Kayatta",
     "https://resources.finalsite.net/images/f_auto,q_auto/v1752793725/scusdedu/hzojfcvvwnpefoktu6sz/kayatta.png"),
    (-870019, "0ab7bc87-a731-4ef1-8840-16be768a52e0", "Michael Benjamin",
     "https://resources.finalsite.net/images/f_auto,q_auto/v1752793933/scusdedu/xvqvvubib1usdpwko3h3/benjamin.png"),

    # ===== SJUSD (0) — no photos on official website — skipped =====

    # ===== FUSD (5) =====
    (-870025, "cff2ea49-6906-428e-b34f-d4082c5a68d1", "Sharon Coco",
     "https://fremontunified.org/wp-content/uploads/2023/05/sharon-coco.jpeg"),
    (-870026, "d2d867ac-746e-44bc-b93b-022fe0d28718", "Larry Sweeney",
     "https://fremontunified.org/wp-content/uploads/2023/06/l-sweeney.jpg"),
    (-870027, "b1f99ff3-8232-4da8-b240-fa36206d37ad", "Dianne Jones",
     "https://fremontunified.org/wp-content/uploads/2023/07/Dianne-Jones-240x300-1.jpg"),
    (-870028, "c5bafda7-20a1-49c6-9b80-e66a8d5ab5e4", "Rinu Nair",
     "https://fremontunified.org/wp-content/uploads/2024/12/Rinu-Nair-.jpg"),
    (-870029, "b6b167d5-0762-4913-b61a-c45c61f303ad", "Vivek Prasad",
     "https://fremontunified.org/wp-content/uploads/2023/05/vivek-prasad.jpeg"),

    # ===== BUSD (5) =====
    (-870030, "9c031e03-97ef-4e95-a431-ba0a998216aa", "Mike Chang",
     "https://www.berkeleyschools.net/wp-content/uploads/2022/12/Screen-Shot-2022-12-15-at-9.09.01-AM.png"),
    (-870031, "bf763a45-cf7a-4c6c-b75a-068edf41e64b", "Jennifer Corn",
     "https://www.berkeleyschools.net/wp-content/uploads/2024/12/2024-Jen-Headshots-250-1.jpg"),
    (-870032, "703b71c5-8014-4ace-8116-1c15bcde675f", "Ka'Dijah Brown",
     "https://www.berkeleyschools.net/wp-content/uploads/2018/12/KaDijah-320x342.jpg"),
    (-870033, "af0ff33b-75ce-4d02-892d-a0b262cf0478", "Ana Vasudeo",
     "https://www.berkeleyschools.net/wp-content/uploads/2025/01/DSC1433-2-scaled.jpg"),
    (-870034, "349b00a0-29e9-463e-9277-b651ac2e1678", "Jennifer Shanoski",
     "https://www.berkeleyschools.net/wp-content/uploads/2022/12/Screen-Shot-2022-12-15-at-9.16.22-AM.png"),
]


def crop_and_resize(img: Image.Image) -> Image.Image:
    """Crop to 4:5 ratio then resize to 600x750 Lanczos."""
    w, h = img.size
    target_ratio = 4 / 5  # 0.80
    current_ratio = w / h

    if current_ratio > target_ratio:
        # Too wide: center-crop width
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        img = img.crop((left, 0, left + new_w, h))
    elif current_ratio < target_ratio:
        # Too tall: top-crop (keep top portion)
        new_h = int(w / target_ratio)
        img = img.crop((0, 0, w, new_h))

    if img.mode != 'RGB':
        img = img.convert('RGB')
    return img.resize((TARGET_W, TARGET_H), Image.LANCZOS)


def download_image(url: str, name: str) -> bytes:
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
    }
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = resp.read()
    print(f"  Downloaded {len(data):,} bytes for {name}")
    return data


def process_image(raw_bytes: bytes, name: str) -> bytes:
    img = Image.open(io.BytesIO(raw_bytes))
    orig_w, orig_h = img.size
    print(f"  Original: {orig_w}x{orig_h} mode={img.mode}")
    img = crop_and_resize(img)
    out = io.BytesIO()
    img.save(out, format='JPEG', quality=90, optimize=True)
    data = out.getvalue()
    print(f"  Processed: {img.size[0]}x{img.size[1]} -> {len(data):,} bytes JPEG")
    return data


def upload_to_storage(politician_id: str, jpeg_bytes: bytes, name: str) -> str:
    """Upload JPEG to Supabase Storage via direct REST API (upsert)."""
    storage_path = f"{politician_id}-headshot.jpg"
    upload_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{storage_path}"

    req = urllib.request.Request(
        upload_url,
        data=jpeg_bytes,
        method="POST",
        headers={
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Content-Type": "image/jpeg",
            "x-upsert": "true",
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            resp.read()
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        raise RuntimeError(f"Storage upload HTTP {e.code} for {name}: {body}")

    public_url = f"{STORAGE_BASE}{storage_path}"
    print(f"  Uploaded to storage: {storage_path}")
    return public_url


def insert_politician_image(politician_id: str, url: str, name: str) -> None:
    """Insert row into essentials.politician_images via Supabase REST (service role)."""
    # Supabase REST API uses schema header to route to 'essentials' schema
    rest_url = f"{SUPABASE_URL}/rest/v1/politician_images"
    payload = json.dumps({
        "politician_id": politician_id,
        "url": url,
        "type": "default",
        "photo_license": "public_domain"
    }).encode()

    req = urllib.request.Request(
        rest_url,
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Bearer {SERVICE_KEY}",
            "apikey": SERVICE_KEY,
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Accept-Profile": "essentials",
            "Content-Profile": "essentials",
            "Prefer": "return=minimal",
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            resp.read()
        print(f"  Inserted politician_images row for {name}")
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if e.code == 409 or "duplicate" in body.lower() or "unique" in body.lower():
            print(f"  Row already exists for {name} — skipping")
        else:
            raise RuntimeError(f"DB insert HTTP {e.code} for {name}: {body}")


def main():
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    results = []

    for ext_id, pol_id, name, source_url in OFFICIALS:
        print(f"\n[{ext_id}] {name}")
        print(f"  Source: {source_url[:80]}")
        try:
            raw = download_image(source_url, name)
            jpeg = process_image(raw, name)
            # Save processed locally
            (TMP_DIR / f"{pol_id}-headshot.jpg").write_bytes(jpeg)
            storage_url = upload_to_storage(pol_id, jpeg, name)
            insert_politician_image(pol_id, storage_url, name)
            results.append((ext_id, name, source_url, "OK"))
        except Exception as e:
            print(f"  ERROR: {e}")
            results.append((ext_id, name, source_url, f"ERROR: {e}"))

    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    ok = [r for r in results if r[3] == "OK"]
    err = [r for r in results if r[3] != "OK"]
    print(f"Succeeded: {len(ok)}/{len(results)}")
    for r in ok:
        print(f"  OK  [{r[0]}] {r[1]}")
    if err:
        print(f"\nFailed: {len(err)}")
        for r in err:
            print(f"  ERR [{r[0]}] {r[1]}: {r[3]}")
        sys.exit(1)


if __name__ == "__main__":
    main()
