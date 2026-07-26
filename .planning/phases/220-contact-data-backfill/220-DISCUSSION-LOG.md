# Phase 220: Contact Data Backfill - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-24
**Phase:** 220-contact-data-backfill
**Areas discussed:** web_form_url policy, Email policy, valid_to disposition, Contact-method bar

---

## web_form_url policy

| Option | Description | Selected |
|--------|-------------|----------|
| City-wide form on all officials | Apply the city's single contact-form URL to every official; blank only where no form exists | ✓ |
| Person-specific forms only | Only populate where a per-official form exists; most stay blank | |
| Form only, no contact pages | Require a submittable form; plain contact/mailto pages don't count | |

**User's choice:** City-wide form on all officials
**Notes:** Small TX cities publish one city-wide CivicPlus `/FormCenter` form, not per-member forms; the shared form is a valid working method per official. (The "form vs contact page" distinction from option 3 was still adopted as D-04 — a plain listing/mailto does not qualify.)

---

## Email policy

| Option | Description | Selected |
|--------|-------------|----------|
| Seat aliases + generic fallback | Seed seat aliases; where only a generic city/council alias exists, seed it on every official | |
| Seat aliases yes, generic no | Seed seat-specific aliases (District1@, mayor@) but not shared generic council@/info@; leave blank and rely on the form | ✓ |
| Personal/seat only, no generic | Only addresses resolving to the individual or specific seat | |

**User's choice:** Seat aliases yes, generic no
**Notes:** Matches the McKinney seat-alias pattern already in the DB. Generic catch-alls are not seeded on individuals; the city-wide contact form (D-01) covers those officials for the contact-method bar.

---

## valid_to disposition

| Option | Description | Selected |
|--------|-------------|----------|
| Spot-check + fix outliers | Treat as met: sample-verify, correct obvious errors, document complete | ✓ |
| Full re-verification | Verify all ~160 officials against public sources | |
| Accept as-is, no action | Consider met by 218/219, zero valid_to work | |

**User's choice:** Spot-check + fix outliers
**Notes:** Live query showed valid_to already 100% populated with plausible derived term-end dates from 218/219 seeding, so COLLIN-CONTACT-03 is essentially met; a light spot-check guards against stale/expired dates without a mass re-write.

---

## Contact-method bar (Success Criterion #4)

| Option | Description | Selected |
|--------|-------------|----------|
| Form OR email required | Bar met only by a web_form_url or email entry; urls[] council page doesn't count | ✓ |
| urls[] council page counts | Existing profile page in urls[] counts as reachable | |
| Honest-blank is acceptable | Where nothing is published, leave blank and document | |

**User's choice:** Form OR email required
**Notes:** Consistent with D-01 — every official in a city that publishes any form meets the bar; officials in a city with neither form nor published email are honest-blank and documented (the honest-blank principle from option 3 still applies as the floor).

---

## Claude's Discretion

- Per-city sourcing order and which fully-missing email cities to work first.
- Exact `web_form_url` value per city (top-level `/FormCenter` vs a specific council contact form).
- Spot-check sample size for `valid_to`.

## Deferred Ideas

- `urls[]` backfill — out of COLLIN-CONTACT scope.
- Compass stances — deferred this milestone (local-compass-question lock).
- Collin County Headshots → Phase 221; Collin County Stances → Phase 222.
