---
plan: 39-03
status: complete
commit: 325bd98
---

# Summary: MA House Representatives (Migration 152)

## What was done

Created and applied `152_ma_state_house_officials.sql` — 158 named representative politician rows + 160 office rows (including 2 vacant offices).

**Approach deviation:** Due to the 160-block SQL file exceeding the 32k output token limit on 6 consecutive attempts (4 executor agents + 2 direct attempts), the migration was generated via a PowerShell script (`generate_ma_house.ps1`) rather than written directly. The script stores the roster as a compact data structure and emits SQL from a template — a reusable pattern for future state legislative bodies.

**BOM fix:** The .ps1 script required a UTF-8 BOM so PowerShell 5.1 correctly reads diacritic characters (González, Gómez, Montaño). Added BOM before re-running.

## Verification results

| Check | Result |
|-------|--------|
| House office rows | 160 ✓ |
| Named representative rows | 158 ✓ |
| Vacant offices | 2 (25042, 25075) ✓ |
| 25042 is_vacant + politician_id=NULL | ✓ |
| 25075 is_vacant + politician_id=NULL | ✓ |
| Rogers (25082) email_addresses | {Dave.Rogers@mahouse.gov} ✓ |
| Decker (25083) email_addresses | {Marjorie.Decker@mahouse.gov} ✓ |
| Connolly (25084) email_addresses | {Mike.Connolly@mahouse.gov} ✓ |
| Idempotent re-run | 160 offices unchanged ✓ |

## Files

- `C:/EV-Accounts/backend/migrations/152_ma_state_house_officials.sql` — migration (generated)
- `C:/EV-Accounts/backend/migrations/generate_ma_house.ps1` — generator script (reusable pattern)
