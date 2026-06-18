"""
CA State Senate - Insert politician_images rows
Images are already uploaded to Supabase Storage.
Just needs to insert the DB rows with correct schema (no photo_origin_url column).
"""

import os
import sys
import psycopg2

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: set DATABASE_URL in your environment")
    sys.exit(1)
SUPABASE_URL = "https://kxsdzaojfaibhuzmclfq.supabase.co"
ORIGIN_URL = "https://www.senate.ca.gov/senators"

conn = psycopg2.connect(DATABASE_URL)

# Check which senators still need DB rows
cur = conn.cursor()
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

need_row = [(row[0], row[1], row[2]) for row in senators if row[3] is None]
have_row = [(row[0], row[1]) for row in senators if row[3] is not None]

print(f"Senators with DB row: {len(have_row)}")
print(f"Senators needing DB row: {len(need_row)}")

if not need_row:
    print("All senators already have DB rows!")
    conn.close()
    exit(0)

success = []
errors = []

for ext_id, full_name, politician_id in need_row:
    district_num = abs(ext_id) - 6001000

    # Public URL (already uploaded to Storage)
    public_url = f"{SUPABASE_URL}/storage/v1/object/public/politician_photos/{politician_id}-headshot.jpg"

    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO essentials.politician_images
              (id, politician_id, url, type, photo_license)
            VALUES
              (gen_random_uuid(), %s, %s, 'default', 'public_domain')
            ON CONFLICT DO NOTHING
        """, (politician_id, public_url))
        conn.commit()
        cur.close()
        print(f"  [SD-{district_num:02d}] {full_name} -> inserted")
        success.append((district_num, full_name))
    except Exception as e:
        conn.rollback()
        print(f"  [SD-{district_num:02d}] {full_name} -> ERROR: {e}")
        errors.append((district_num, full_name, str(e)))

print(f"\n=== SUMMARY ===")
print(f"Successfully inserted: {len(success)}")
print(f"Errors: {len(errors)}")
if errors:
    for dn, name, err in errors:
        print(f"  SD-{dn:02d} {name}: {err}")

conn.close()
