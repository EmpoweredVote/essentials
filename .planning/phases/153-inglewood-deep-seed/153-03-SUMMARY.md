---
phase: 153-inglewood-deep-seed
plan: 03
wave: 3
status: complete
requirements: [INGL-01]
migration: "1020_inglewood_headshots.sql"
ev_accounts_commit: 2a0dbde9
ledger_unchanged: 1019
---

# 153-03 SUMMARY — Inglewood headshots (Wave 3, AUDIT-ONLY)

**Outcome:** All 5 current officials now carry exactly one `type='default'` 600×750 portrait at the canonical Storage path, sourced from cityofinglewood.org (NO-WAF), `press_use`, with `photo_origin_url` set. Migration `1020` (audit-only, ledger stays **1019**) applied live + committed to EV-Accounts `2a0dbde9`.

## Task 1 — pre-flight image state (Inglewood was PARTIALLY pre-seeded)
| Official | pol UUID | entering state |
|----------|----------|----------------|
| Butts -200740 | f5775ca1 | 1 img, old path `{uuid}/default.jpeg`, cc_by_sa, origin NULL → re-source |
| Gray 666261 | 7a04bf87 | 1 img, canonical-ish, press_use, origin docID 19000 → refresh to current 21642 |
| Padilla -701002 | 123c9a42-5715-4ab2-a8bd-76e7adbca27b | 0 img → greenfield INSERT |
| Eloy 666263 | 6ed19c10 | 1 migrated (Wave 1) scraped row 95919ace → UPDATE to current 21958 (Pitfall 3: no 2nd insert) |
| Faulk 666264 | 729bc539 | **2 rows** — scraped `aa6601a7` (DELETE) + canonical press_use `7db1ca7c` (keep+refresh) |

## Task 2 — source / verify / process / upload
- Downloaded 6 candidates from cityofinglewood.org/ImageRepository (Gray 21642, Padilla 21957, Eloy 21958, Faulk 21989, Butts 20637 **+ alt 20639**). All HTTP 200, high-res (~1733–2117×2600).
- **WRONG-PERSON GUARD — each image visually inspected (Read tool):**
  - Gray 21642 — older woman, red blazer, **"GG" monogram necklace**, Inglewood seal backdrop ✓
  - Padilla 21957 — older man, mustache, dark suit/maroon tie, seal backdrop ✓
  - Eloy 21958 — middle-aged man, navy suit/brown tie, seal backdrop (the councilman, not the painter) ✓
  - Faulk 21989 — woman, curly hair, blue blazer, pearls, seal backdrop ✓
  - Butts 20637 — distinguished man, navy pinstripe + city lapel pin, building backdrop ✓ (picked 20637 over 20639 — more headroom for a clean 4:5 crop)
  - No superimposed text/graphics on any; all professional official portraits.
- Processed: crop 4:5 center → resize **600×750** Lanczos q90 → uploaded x-upsert to `politician_photos/{uuid}-headshot.jpg`. All 5 public URLs return **HTTP 200**, all **600×750**.

## Migration 1020 (audit-only) — assertions ALL PASS
- each of 5 officials: exactly **1** `type='default'` image ✓
- Faulk deduped 2→1 ✓; Eloy single image (no Pitfall-3 dup) ✓
- all 5 urls = canonical `…storage.supabase.co/…/politician_photos/{uuid}-headshot.jpg`, all `press_use` ✓
- `photo_origin_url` set on all 5 politicians (documentIDs 20637/21642/21957/21958/21989) ✓
- ledger integer-family MAX UNCHANGED at **1019** (audit-only) ✓

## BLOCKING human-verify checkpoint — APPROVED 2026-06-21
Operator approved all 5 headshots. Browse: https://essentials.empowered.vote/results?browse_geo_id=0636546&browse_mtfcc=G4110

## Self-Check: PASSED
