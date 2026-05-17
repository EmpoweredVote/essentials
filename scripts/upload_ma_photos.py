import pickle, os, subprocess, json

TEMP = os.environ.get('TEMP', '/tmp')
OUT_DIR = os.path.join(TEMP, 'ma_legislators')
SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
BUCKET_BASE = "https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object"
SUPABASE_URL = "https://kxsdzaojfaibhuzmclfq.supabase.co"

if not SERVICE_KEY:
    print("ERROR: SUPABASE_SERVICE_ROLE_KEY not set")
    exit(1)

with open(os.path.join(TEMP, 'ma_batch_results.pkl'), 'rb') as f:
    r = pickle.load(f)

# Collect all importable: ok + autocropped + tight_top (all have saved files)
importable = list(r['ok'])
for pid, name, code, warns in r['flagged']:
    if not any('BAD_ASPECT' in w for w in warns):
        importable.append((pid, name, code))

print(f"Uploading {len(importable)} photos...")

uploaded = []
failed = []

for i, entry in enumerate(importable):
    pid, name, code = entry[0], entry[1], entry[2]
    local_file = os.path.join(OUT_DIR, f"{pid}.jpg")
    if not os.path.exists(local_file):
        print(f"  SKIP {name}: file not found at {local_file}")
        failed.append((pid, name, code, "file_not_found"))
        continue

    filename = f"{pid}-headshot.jpg"
    upload_url = f"{BUCKET_BASE}/politician_photos/{filename}"

    result = subprocess.run([
        'curl', '-s', '-X', 'POST', upload_url,
        '-H', f'Authorization: Bearer {SERVICE_KEY}',
        '-H', 'Content-Type: image/jpeg',
        '--data-binary', f'@{local_file}'
    ], capture_output=True, text=True, timeout=30)

    try:
        resp = json.loads(result.stdout)
        if 'Key' in resp or 'Id' in resp:
            cdn_url = f"{BUCKET_BASE}/public/politician_photos/{filename}"
            source_url = f"https://malegislature.gov/Legislators/Profile/{code}"
            uploaded.append((pid, name, code, cdn_url, source_url))
        else:
            print(f"  FAIL {name}: {result.stdout[:100]}")
            failed.append((pid, name, code, result.stdout[:100]))
    except Exception as e:
        print(f"  FAIL {name}: {e} | {result.stdout[:100]}")
        failed.append((pid, name, code, str(e)))

    if (i + 1) % 20 == 0:
        print(f"  {i+1}/{len(importable)} uploaded...")

print(f"\nUploaded: {len(uploaded)}")
print(f"Failed:   {len(failed)}")

# Save for SQL step
with open(os.path.join(TEMP, 'ma_upload_results.pkl'), 'wb') as f:
    pickle.dump({'uploaded': uploaded, 'failed': failed}, f)
print("Saved upload results.")
