# Phase 220 — Preflight Ledger

**Produced:** 2026-07-24 (plan 220-01, Wave 1)
**Consumed by:** plans 220-02 … 220-06

---

## 1. Frisco Place 4 — RESOLVED (seating error corrected, not just held)

**Resolution: HOLD Frisco Place 4 in the contact batch (220-04 omits it) — it was handled directly by a seating-correction migration, mig 1409.**

The RESEARCH.md Pitfall 3 discrepancy turned out to be a genuine **data error in
migration 1404**, not a stale city page:

- Mig 1404 (applied 2026-07-24, Phase 219 close) seated **Gopal Ponangi** citing the
  **Collin County-only** runoff canvass (Ponangi 3,826 – Elad 3,274).
- Frisco spans **Collin AND Denton counties**. The **combined** June 7 2025 runoff shows
  **Jared Elad won 7,162 – 6,434 (52.68%)** — Community Impact, KERA, Ballotpedia, and
  friscotexas.gov all agree. Mig 1404 scored a two-county race on one county's partial
  canvass and seated the loser.

**Operator decision (checkpoint GO/HOLD, 2026-07-24):** HOLD contact-batch seeding for
Frisco Place 4 **and fix the seating now**.

**Action taken (this plan):** authored + applied **migration 1409** (seating correction):
- Reactivated **Jared Elad** (`5d8acfc7-5643-418b-a474-3d87898f4e17`), pointed the Place 4
  office at him, term `2025-06-01 → 2028-05-01` (`month`).
- Retired **Gopal Ponangi** (`d6e0d762-f7a2-4566-8718-452e4c33781b`): `is_active=false`,
  `office_id=NULL`, `valid_to=2025-06-07`.
- Seeded Elad's sourced email **`jelad@friscotexas.gov`** (Cloudflare-decoded from
  friscotexas.gov/1970/Jared-Elad-Place-4).
- Applied to production via Supabase MCP; verified (Elad active + email set, Ponangi retired).
- Committed to `C:/EV-Accounts` as `7f6592da` (NOT pushed — batched with Wave 3).

**Consequence for 220-04 (migration 1407, personal emails A):** **OMIT Frisco Place 4.**
Elad's email is already seeded by mig 1409. 220-04 still seeds Frisco Places 1, 2, 3, 5, 6.

---

## 2. Locked migration-number map

Next-free number confirmed by `ls C:/EV-Accounts/backend/migrations` → MAX prefix was 1404;
1405 is the first free number. The four Wave-2 authoring plans keep their pre-assigned
numbers (no shift needed). The seating correction took the next free slot after the batch.

| Migration | Plan | Content | Status |
|-----------|------|---------|--------|
| **1405** | 220-02 | `web_form_url` batch (11 form-publishing cities) | to author (Wave 2) |
| **1406** | 220-03 | seat-alias emails (Blue Ridge, Nevada, Melissa) | to author (Wave 2) |
| **1407** | 220-04 | personal emails A (Frisco **[Places 1,2,3,5,6 only]**, Princeton, Prosper, Allen, Fairview, Celina) | to author (Wave 2) |
| **1408** | 220-05 | personal emails B (Parker, Saint Paul, Weston, Lowry Crossing, Lucas) | to author (Wave 2) |
| **1409** | 220-01 | Frisco Place 4 seating correction + Elad email | **DONE — authored + applied 2026-07-24** |
| **1410** | 220-06 | RESERVED — optional `valid_to` correction, only if spot-check surfaces an outlier | conditional |

Each Wave-2 authoring plan MUST consume its assigned number above rather than re-deriving
MAX+1 (prevents filename collisions / out-of-order gaps). Note 1409 already occupies the
next-free slot, so a Wave-2 plan that naively took MAX+1 would now collide — they must use
this map.

---

## 3. Apply-batch note for Wave 3 (220-06)

- **mig 1409 is already applied** (production + committed). Do NOT re-apply as new work; it is
  idempotent (skip-if-already-Elad) so a re-run is net-zero, but treat it as done.
- Wave 3 applies 1405–1408 (+ 1410 if needed) via Supabase MCP, then **one** `git -C
  "C:/EV-Accounts" push origin master` carries 1409 + the contact batch in a single Render
  deploy (accounts-api push deploys all ahead commits).
