import pickle, os

TEMP = os.environ.get('TEMP', '/tmp')

with open(os.path.join(TEMP, 'ma_upload_results.pkl'), 'rb') as f:
    r = pickle.load(f)

uploaded = r['uploaded']

# Build batched SQL
# politician_images INSERT (batch of all)
img_values = []
for pid, name, code, cdn_url, source_url in uploaded:
    cdn_esc = cdn_url.replace("'", "''")
    img_values.append(f"(gen_random_uuid(), '{pid}', '{cdn_esc}', 'default', 'press_use')")

img_sql = "INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)\nVALUES\n" + ",\n".join(img_values) + "\nON CONFLICT (politician_id) DO NOTHING;"

# photo_origin_url UPDATE (one per politician)
update_cases = []
for pid, name, code, cdn_url, source_url in uploaded:
    src_esc = source_url.replace("'", "''")
    update_cases.append(f"  WHEN id = '{pid}' THEN '{src_esc}'")

update_sql = ("UPDATE essentials.politicians\n"
              "SET photo_origin_url = CASE\n" +
              "\n".join(update_cases) +
              "\nEND\n"
              "WHERE id IN (\n" +
              ",\n".join(f"  '{pid}'" for pid, *_ in uploaded) +
              "\n);")

with open(os.path.join(TEMP, 'ma_insert_images.sql'), 'w') as f:
    f.write(img_sql)

with open(os.path.join(TEMP, 'ma_update_origins.sql'), 'w') as f:
    f.write(update_sql)

print(f"Image INSERT: {len(img_values)} rows")
print(f"Origin UPDATE: {len(update_cases)} rows")
print(f"\n--- INSERT SQL (first 3 values) ---")
print("INSERT INTO essentials.politician_images ...")
for v in img_values[:3]:
    print(f"  {v[:80]}...")
