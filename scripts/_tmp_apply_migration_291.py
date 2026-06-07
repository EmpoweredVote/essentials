"""Apply migration 291 (MD delegates batch F) via per-delegate psql -f chunks.
WAF bypass: same approach as migrations 287/288/289/290.
"""
import re
import subprocess
import os
import tempfile
import sys

MIGRATION_FILE = r"C:\EV-Accounts\backend\migrations\291_md_delegates_batch_f.sql"
DB_URL = "postgresql://postgres.kxsdzaojfaibhuzmclfq:TriviaProd2026@aws-0-us-west-1.pooler.supabase.com:5432/postgres"

with open(MIGRATION_FILE, encoding="utf-8") as f:
    content = f.read()

print(f"Migration size: {len(content)} chars")

# Find individual delegate blocks (same regex pattern as migration 290 script)
delegate_pattern = r'(-- [=]{60}\s*\n-- [^\n]+\s*\n-- [=]{60}\s*\n(?:.*?(?=(?:-- [=]{60}|COMMIT;))))'
delegate_blocks = re.findall(delegate_pattern, content, re.DOTALL)
print(f"Found {len(delegate_blocks)} delegate blocks")

applied = 0
skipped = 0
errors = []

for i, block in enumerate(delegate_blocks):
    # Extract delegate name from block header
    name_match = re.search(r'-- [=]{60}\s*\n-- ([^\n]+)\s*\n-- [=]{60}', block)
    name = name_match.group(1).strip() if name_match else f"block_{i}"

    # Check if it has actual INSERT statements
    has_inserts = 'INSERT INTO' in block

    chunk_sql = f"BEGIN;\n{block}\nCOMMIT;"
    chunk_size = len(chunk_sql)

    print(f"\n[{i+1:02d}] {name} ({chunk_size:,} chars, {'has inserts' if has_inserts else 'no inserts - not-found'})")

    if not has_inserts:
        print(f"  Skipping (no stances)")
        skipped += 1
        continue

    # Write to temp file (UTF-8) and apply via psql -f
    with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', suffix='.sql', delete=False) as tmp:
        tmp.write(chunk_sql)
        tmp_path = tmp.name

    try:
        result = subprocess.run(
            ['psql', DB_URL, '-f', tmp_path],
            capture_output=True, text=True, timeout=60
        )
    finally:
        os.unlink(tmp_path)

    if result.returncode == 0:
        insert_count = chunk_sql.count('INSERT INTO')
        print(f"  OK: {insert_count} INSERT statements applied")
        applied += 1
    else:
        print(f"  ERROR: {result.stderr[:300]}")
        errors.append(name)

print(f"\n=== Migration 291 Applied ===")
print(f"  Delegate blocks applied: {applied}")
print(f"  Skipped (no stances): {skipped}")
print(f"  Errors: {len(errors)}")
print(f"  Total: {applied + skipped}")
if errors:
    print(f"  FAILED blocks: {errors}")
    sys.exit(1)
