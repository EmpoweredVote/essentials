# Collin 2026 Roster Reconcile — Verification

**Applied:** 2026-07-24 via Supabase MCP; EV-Accounts migs 1411 + 1412 pushed (`ddbf139c`, Render deploy).
**Source:** RECONCILE-RESEARCH.md (all HIGH/MEDIUM confidence, combined multi-county canvass per the mig-1404 lesson).

## Root cause found
Phase 219 left a **half-seated** state for 6 seats: the 2026 winner was inserted as an active
politician row with `office_id` set, but `offices.politician_id` still pointed at the old
(now-inactive) holder, and the old holder kept a dangling `office_id`. A 23-gov scan confirmed
the pattern was contained to exactly these 6.

## 16 seats reconciled (mig 1411)

**Reseated (6 half-seated winners — repoint office, detach old holder, set term + contact):**
| Seat | Now seated | Term | Contact |
|------|-----------|------|---------|
| Celina Place 4 | Shea Scott | 2026→2029 | sbscott@celina-tx.gov |
| Celina Place 5 | Shane Lambert | 2026→2029 | rlambert@celina-tx.gov |
| Frisco Place 6 | Brittany Colberg | 2026→2029 | bcolberg@friscotexas.gov |
| Murphy Place 3 | Debbie Ison | 2026→2029 | web_form_url (email GAP) |
| Murphy Place 5 | Kevin Kelley | 2026→2029 | web_form_url (email GAP) |
| Prosper Place 5 | Doug Charles | 2026→2029 | dcharles@prospertx.gov + form |

**New insert (Frisco Mayor):** Cheney termed out (18-yr limit); **Mark Hill** won the June-13-2026
runoff (58.12%, combined-county), sworn July 7 2026 → seated 2026-07-07→2029, mhill@friscotexas.gov.
The pre-existing "Mark Hill" row is the **FISD school-board** member (different office) — NOT reused;
a fresh Mayor row was inserted.

**valid_to corrections (9 continuing/re-elected incumbents):**
- → 2029 (3-yr): Allen P2 Baril, Celina Mayor Tubbs, Frisco P5 Rummel, Murphy Mayor Bradley, Prosper P3 Bartley.
- → 2027 (2-yr terms, corrected): Nevada P3 Wilson, P4 Laughter, P5 Little; Fairview Seat 3 Hawkins.

**Email dedupe (mig 1412):** 3 Fairview officials (Hawkins, Hubbard, Sheehan) had a lowercase +
mixed-case duplicate from mig 1407's append → collapsed to the single mixed-case form.

## Post-reconcile verification (live DB)
- Half-seated pattern remaining across 23 govs: **0**
- Case-duplicate emails remaining: **0**
- All 16 offices point at the correct current holder with a plausible term-end and (where published) a contact method.

## Held for human decision — Plano "Council Place 6"
DB still shows this office as **VACANT**. Research (MEDIUM, Wikipedia/Ballotpedia; plano.gov
JS-blocked) indicates Plano numbers the **Mayor** as "Place 6" — i.e. there is **no separate
Place-6 councilmember**. Fixing this changes the data model (merge/alias Place 6 to the Mayor
office, or remove the phantom office), so it was deliberately NOT auto-applied. **Operator
decision needed** + a Playwright/operator confirmation of plano.gov before altering the office
structure. Also: Plano Place 6 email remains GAP.

## Still owed (unchanged from Phase 220)
- Murphy councilmember emails (none published anywhere — confirmed GAP; web_form_url covers them).
- GAP-city form-URL refresh: Josephine, Plano, Richardson (Migration C, Playwright/operator).
