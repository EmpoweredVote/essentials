"""
CA Legislature Headshot Skip Check - using psycopg2 direct DB connection
"""
import os
import sys
import psycopg2
import json

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: set DATABASE_URL in your environment")
    sys.exit(1)

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

print("=== ASSEMBLY SKIP CHECK ===")
cur.execute("""
SELECT p.external_id, p.full_name, p.id as politician_id,
       pi.id as existing_image_id
FROM essentials.politicians p
LEFT JOIN essentials.politician_images pi ON pi.politician_id = p.id
WHERE p.external_id BETWEEN -6002080 AND -6002001
ORDER BY p.external_id DESC
""")
assembly_rows = cur.fetchall()
print(f"Total assembly politicians: {len(assembly_rows)}")
has_image = [(r[0], r[1], r[2], r[3]) for r in assembly_rows if r[3] is not None]
needs_image = [(r[0], r[1], r[2]) for r in assembly_rows if r[3] is None]
print(f"Already have headshot: {len(has_image)}")
print(f"Need headshot: {len(needs_image)}")
print("\nNEED HEADSHOT (Assembly):")
for ext_id, name, pid in needs_image:
    district = abs(ext_id) - 6002000
    print(f"  AD-{district:02d}: {name} | politician_id={pid}")

print("\n=== SENATE SKIP CHECK ===")
cur.execute("""
SELECT p.external_id, p.full_name, p.id as politician_id,
       pi.id as existing_image_id
FROM essentials.politicians p
LEFT JOIN essentials.politician_images pi ON pi.politician_id = p.id
WHERE p.external_id BETWEEN -6001040 AND -6001001
ORDER BY p.external_id DESC
""")
senate_rows = cur.fetchall()
print(f"Total senate politicians: {len(senate_rows)}")
senate_has = [(r[0], r[1], r[2], r[3]) for r in senate_rows if r[3] is not None]
senate_needs = [(r[0], r[1], r[2]) for r in senate_rows if r[3] is None]
print(f"Already have headshot: {len(senate_has)}")
print(f"Need headshot: {len(senate_needs)}")
print("\nNEED HEADSHOT (Senate):")
for ext_id, name, pid in senate_needs:
    district = abs(ext_id) - 6001000
    print(f"  SD-{district:02d}: {name} | politician_id={pid}")

cur.close()
conn.close()
