"""
CA Legislature Headshot Skip Check
Queries which politicians already have headshots vs which still need them.
"""
import requests
import json

SUPABASE_URL = "https://kxsdzaojfaibhuzmclfq.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4c2R6YW9qZmFpYmh1em1jbGZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDM2NTEwMywiZXhwIjoyMDY1OTQxMTAzfQ.6cZBx-L-pFiNOf3r6c9xolq2RHZT3pBsVdZxsVqYnYo"

HEADERS = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json"
}

def run_query(sql):
    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
        headers=HEADERS,
        json={"query": sql}
    )
    if resp.status_code != 200:
        # Try direct REST query instead
        return None, resp.text
    return resp.json(), None

def query_via_rest(table, select, filter_str=None, order=None):
    params = {"select": select}
    if filter_str:
        params.update(filter_str)
    if order:
        params["order"] = order
    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/{table}",
        headers=HEADERS,
        params=params
    )
    return resp

# Use direct SQL via the postgres REST API
def run_sql(sql):
    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/rpc/query",
        headers=HEADERS,
        json={"sql": sql}
    )
    if resp.status_code == 200:
        return resp.json()

    # Try the pg endpoint
    resp2 = requests.post(
        f"{SUPABASE_URL}/rest/v1/rpc/exec",
        headers=HEADERS,
        json={"sql_query": sql}
    )
    return resp2.status_code, resp2.text

# Assembly skip check via Supabase REST with joins
# Need to use the database REST API
assembly_sql = """
SELECT p.external_id, p.full_name, p.id as politician_id,
       pi.id as existing_image_id
FROM essentials.politicians p
LEFT JOIN essentials.politician_images pi ON pi.politician_id = p.id
WHERE p.external_id BETWEEN -6002080 AND -6002001
ORDER BY p.external_id DESC
"""

senate_sql = """
SELECT p.external_id, p.full_name, p.id as politician_id,
       pi.id as existing_image_id
FROM essentials.politicians p
LEFT JOIN essentials.politician_images pi ON pi.politician_id = p.id
WHERE p.external_id BETWEEN -6001040 AND -6001001
ORDER BY p.external_id DESC
"""

print("Testing SQL access...")
result = run_sql(assembly_sql)
print(f"Result: {result}")
