"""
CA State Senate Headshots - Process all 40 senators
Source: www.senate.ca.gov/senators page data-src attributes
All images are on senate.ca.gov official site = public domain government photos

Processing:
1. Download each senator's headshot from senate.ca.gov
2. Crop to 4:5 (center crop if wider, top crop if taller)
3. Resize to 600x750 Lanczos
4. Upload to Supabase Storage at {politician_id}-headshot.jpg
5. Insert politician_images row
"""

import os
import psycopg2
import requests
from PIL import Image
import io
import sys
import time

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: set DATABASE_URL in your environment")
    sys.exit(1)
SUPABASE_URL = "https://kxsdzaojfaibhuzmclfq.supabase.co"
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SECRET_KEY') or os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
if not SUPABASE_SERVICE_KEY:
    print("ERROR: set SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) in your environment")
    sys.exit(1)
SENATE_BASE_URL = "https://www.senate.ca.gov"
ORIGIN_URL = "https://www.senate.ca.gov/senators"

# Maps: district_num -> (data-src path from senate.ca.gov)
# Keyed by district number; data-src values are taken directly from page HTML
# The double-encoded %25xx paths are the correct ones to use as-is

# Format: district_num -> data_src_path (with itok stripped)
SENATOR_PHOTO_MAP = {
    # SD-24: Allen (Benjamin Allen)
    24: '/sites/senate.ca.gov/files/styles/large/public/media/ALLEN%252C%2520BEN%2520%2528D-26%2529_6.jpg',
    # SD-04: Alvarado-Gil
    4: '/sites/senate.ca.gov/files/styles/large/public/media/ALVARADO-GIL%252C%2520MARIE%2520%2528D-04%2529_9.jpg',
    # SD-30: Archuleta
    30: '/sites/senate.ca.gov/files/styles/large/public/media/ARCHULETA%252C%2520BOB%2520%2528D-30%2529_7.jpg',
    # SD-07: Arreguín
    7: '/sites/senate.ca.gov/files/styles/large/public/media/Portrait%2520Arreguin%2520Portrait_1.jpg',
    # SD-08: Ashby
    8: '/sites/senate.ca.gov/files/styles/large/public/media/ASHBY%252C%2520ANGELIQUE%2520%2528D-08%2529_8.jpg',
    # SD-13: Becker
    13: '/sites/senate.ca.gov/files/styles/large/public/media/BECKER%252C%2520JOSH%2520%2528D-13%2529_7.jpg',
    # SD-38: Blakespear
    38: '/sites/senate.ca.gov/files/styles/large/public/media/BLAKESPEAR%252C%2520CATHERINE%2520%2528D%2520-38%2529_9.jpg',
    # SD-03: Cabaldon
    3: '/sites/senate.ca.gov/files/styles/large/public/media/Portrait%2520Cabaldon%2520Portrait_1.jpg',
    # SD-14: Caballero
    14: '/sites/senate.ca.gov/files/styles/large/public/media/CABALLERO%252C%2520ANNA%2520%2528D-14%2529_7.jpg',
    # SD-31: Cervantes
    31: '/sites/senate.ca.gov/files/styles/large/public/media/Portrait%2520Cervantes_2.jpg',
    # SD-37: Choi
    37: '/sites/senate.ca.gov/files/styles/large/public/media/2016%2520New%2520Member%2520Headshots%2520Choi-268_2.jpg',
    # SD-15: Cortese
    15: '/sites/senate.ca.gov/files/styles/large/public/media/CORTESE%252C%2520DAVE%2520%2528D-15%2529_6.jpg',
    # SD-01: Dahle
    1: '/sites/senate.ca.gov/files/styles/large/public/media/Senator%2520Megan%2520Dahle%2520Headshot_1.jpg',
    # SD-26: Durazo
    26: '/sites/senate.ca.gov/files/styles/large/public/media/DURAZO%252C%2520M%2520%2528D-26%2529_8.jpg',
    # SD-33: Gonzalez
    33: '/sites/senate.ca.gov/files/styles/large/public/media/GONZALEZ%252C%2520LENA%2520%2528D-33%2529_8.jpg',
    # SD-09: Grayson
    9: '/sites/senate.ca.gov/files/styles/large/public/media/Portrait%2520Grayson_1.jpg',
    # SD-12: Grove
    12: '/sites/senate.ca.gov/files/styles/large/public/media/GROVE%252C%2520SHANNON%2520%2528R-12%2529_7.jpg',
    # SD-16: Hurtado
    16: '/sites/senate.ca.gov/files/styles/large/public/media/HURTADO%252C%2520MELISSA%2520%2528D-16%2529_6.jpg',
    # SD-40: Jones
    40: '/sites/senate.ca.gov/files/styles/large/public/media/Brian%2520Jones%2520Headshot%2520%2528Main%2529_0_3.jpg',
    # SD-17: Laird
    17: '/sites/senate.ca.gov/files/styles/large/public/media/LAIRD%252C%2520JOHN%2520%2528D-17%2529_6.jpg',
    # SD-21: Limón
    21: '/sites/senate.ca.gov/files/styles/large/public/media/sd21_limon_0.jpg',
    # SD-02: McGuire
    2: '/sites/senate.ca.gov/files/styles/large/public/media/MCGUIRE%252C%2520MIKE%2520%2528D-02%2529_8.jpg',
    # SD-05: McNerney
    5: '/sites/senate.ca.gov/files/styles/large/public/media/McNerney%2520new%2520headshot%25203_0_1.jpg',
    # SD-20: Menjivar
    20: '/sites/senate.ca.gov/files/styles/large/public/media/MENJIVAR%252C%2520CAROLINE%2520%2528D-20%2529_7.jpg',
    # SD-06: Niello
    6: '/sites/senate.ca.gov/files/styles/large/public/media/Niello%252C%2520Roger%2520%2528R-6%2529_6.jpg',
    # SD-19: Ochoa Bogh
    19: '/sites/senate.ca.gov/files/styles/large/public/media/2025%2520Ochoa%2520Bogh%2520headshot_1.jpg',
    # SD-18: Padilla
    18: '/sites/senate.ca.gov/files/styles/large/public/media/PADILLA%252C%2520STEVE%2520%2528D-18%2529_7.jpg',
    # SD-25: Pérez
    25: '/sites/senate.ca.gov/files/styles/large/public/media/Senator%2520Perez_2.jpg',
    # SD-29: Gómez Reyes
    29: '/sites/senate.ca.gov/files/styles/large/public/media/Portrait%2520Reyes%25201_2.jpg',
    # SD-35: Richardson
    35: '/sites/senate.ca.gov/files/styles/large/public/media/Portrait%2520Richardson_1.jpg',
    # SD-22: Rubio
    22: '/sites/senate.ca.gov/files/styles/large/public/media/RUBIO%252C%2520SUSAN%2520%2528D-22%2529_7.jpg',
    # SD-32: Seyarto
    32: '/sites/senate.ca.gov/files/styles/large/public/media/SEYARTO%252C%2520KELLY%2520%2528R-32%2529_5.jpg',
    # SD-28: Smallwood-Cuevas
    28: '/sites/senate.ca.gov/files/styles/large/public/media/SMALLWOOD-CUEVAS%252C%2520LOLA%2520%2528D-28%2529_6.jpg',
    # SD-27: Stern
    27: '/sites/senate.ca.gov/files/styles/large/public/media/STERN%252C%2520HENRY%2520%2528D-27%2529_7.jpg',
    # SD-36: Strickland
    36: '/sites/senate.ca.gov/files/styles/large/public/media/Senator%2520Strickland%2520Headshot%2520SD36_2.jpg',
    # SD-34: Umberg
    34: '/sites/senate.ca.gov/files/styles/large/public/media/UMBERG%252C%2520TOM%2520%2528D-34%2529_6.jpg',
    # SD-23: Valladares
    23: '/sites/senate.ca.gov/files/styles/large/public/media/Valladares%2520Headshot%2520update_1.JPG',
    # SD-10: Wahab
    10: '/sites/senate.ca.gov/files/styles/large/public/media/WAHAB%252C%2520AISHA%2520%2528D-10%2529_6.jpg',
    # SD-39: Weber Pierson
    39: '/sites/senate.ca.gov/files/styles/large/public/media/Portrait%2520Weber_2.jpg',
    # SD-11: Wiener
    11: '/sites/senate.ca.gov/files/styles/large/public/media/WIENER%252C%2520SCOTT%2520%2528D-11%2529_8.jpg',
}

def crop_and_resize(img_bytes):
    """Crop to 4:5 aspect ratio (center/top crop) then resize to 600x750."""
    img = Image.open(io.BytesIO(img_bytes))
    if img.mode in ('L', 'LA'):
        raise ValueError(f"Greyscale image rejected (mode={img.mode}) — find a color source photo")
    if img.mode != 'RGB':
        img = img.convert('RGB')

    w, h = img.size
    target_ratio = 4 / 5  # width/height
    current_ratio = w / h

    if current_ratio > target_ratio:
        # Image is wider than 4:5 — center crop width
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        img = img.crop((left, 0, left + new_w, h))
    elif current_ratio < target_ratio:
        # Image is taller than 4:5 — top crop (keep head visible)
        new_h = int(w / target_ratio)
        img = img.crop((0, 0, w, new_h))
    # else: already 4:5, no crop needed

    img = img.resize((600, 750), Image.LANCZOS)

    output = io.BytesIO()
    img.save(output, format='JPEG', quality=90)
    output.seek(0)
    return output.getvalue()


def upload_to_storage(politician_id, image_bytes):
    """Upload image to Supabase Storage. Returns public URL."""
    filename = f"{politician_id}-headshot.jpg"
    storage_url = f"{SUPABASE_URL}/storage/v1/object/politician_photos/{filename}"

    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "image/jpeg",
        "x-upsert": "true"
    }

    resp = requests.put(storage_url, data=image_bytes, headers=headers, timeout=30)
    if resp.status_code not in (200, 201):
        raise Exception(f"Storage upload failed: {resp.status_code} {resp.text[:200]}")

    public_url = f"{SUPABASE_URL}/storage/v1/object/public/politician_photos/{filename}"
    return public_url


def insert_politician_image(conn, politician_id, public_url, origin_url):
    """Insert politician_images row."""
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO essentials.politician_images
          (id, politician_id, url, type, photo_license, photo_origin_url)
        VALUES
          (gen_random_uuid(), %s, %s, 'default', 'public_domain', %s)
        ON CONFLICT DO NOTHING
    """, (politician_id, public_url, origin_url))
    conn.commit()
    cur.close()


def process_senator(district_num, full_name, politician_id, conn):
    """Process a single senator: download, crop, upload, insert."""
    if district_num not in SENATOR_PHOTO_MAP:
        raise Exception(f"HALT: No photo mapping for SD-{district_num:02d} ({full_name})")

    photo_path = SENATOR_PHOTO_MAP[district_num]
    photo_url = SENATE_BASE_URL + photo_path

    print(f"  Downloading from: {SENATE_BASE_URL}{photo_path[:60]}...")
    resp = requests.get(photo_url, timeout=15)
    if resp.status_code != 200:
        raise Exception(f"HALT: Photo download failed for SD-{district_num:02d} ({full_name}): HTTP {resp.status_code}")

    print(f"  Downloaded {len(resp.content)} bytes. Processing image...")
    processed = crop_and_resize(resp.content)
    print(f"  Processed to 600x750. Uploading to Supabase Storage...")

    public_url = upload_to_storage(politician_id, processed)
    print(f"  Uploaded: {public_url}")

    insert_politician_image(conn, politician_id, public_url, ORIGIN_URL)
    print(f"  DB row inserted for {full_name} (SD-{district_num:02d})")

    return public_url


def main():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # Fetch all senators that need headshots
    cur.execute("""
        SELECT p.external_id, p.full_name, p.id as politician_id,
               pi.id as existing_image_id
        FROM essentials.politicians p
        LEFT JOIN essentials.politician_images pi ON pi.politician_id = p.id
        WHERE p.external_id BETWEEN -6001040 AND -6001001
        ORDER BY p.external_id DESC
    """)
    senators = cur.fetchall()
    cur.close()

    need_headshot = [(row[0], row[1], row[2]) for row in senators if row[3] is None]
    already_done = [(row[0], row[1]) for row in senators if row[3] is not None]

    print(f"=== CA Senate Headshot Processing ===")
    print(f"Total senators: {len(senators)}")
    print(f"Already have headshot: {len(already_done)}")
    print(f"Need headshot: {len(need_headshot)}")

    if not need_headshot:
        print("All senators already have headshots!")
        conn.close()
        return

    print(f"\nProcessing {len(need_headshot)} senators...")

    success = []
    errors = []

    for ext_id, full_name, politician_id in need_headshot:
        district_num = abs(ext_id) - 6001000
        print(f"\n[SD-{district_num:02d}] {full_name} | id={politician_id}")

        try:
            public_url = process_senator(district_num, full_name, politician_id, conn)
            success.append((district_num, full_name))
            # Small delay to be polite
            time.sleep(0.5)
        except Exception as e:
            error_msg = str(e)
            if error_msg.startswith("HALT:"):
                print(f"  *** {error_msg} ***")
                print(f"  HALTING due to halt policy. {len(success)} processed before halt.")
                conn.close()
                sys.exit(1)
            else:
                print(f"  ERROR: {e}")
                errors.append((district_num, full_name, str(e)))

    print(f"\n=== SUMMARY ===")
    print(f"Successfully processed: {len(success)}")
    print(f"Errors: {len(errors)}")

    if errors:
        print("\nErrors:")
        for dn, name, err in errors:
            print(f"  SD-{dn:02d} {name}: {err}")

    if success:
        print("\nCompleted:")
        for dn, name in success:
            print(f"  SD-{dn:02d} {name}")

    conn.close()


if __name__ == "__main__":
    main()
