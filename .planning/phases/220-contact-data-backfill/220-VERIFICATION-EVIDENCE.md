# Phase 220 — Verification & Honest-Blank Register

**Verified:** 2026-07-24 (plan 220-06, Wave 3) · applied to production via Supabase MCP + pushed to `C:/EV-Accounts` (`d99b4cf0`, Render auto-deploy).

## Migrations applied (in order)

| Mig | Content | Gates |
|-----|---------|-------|
| 1405 | web_form_url batch, 11 cities | ALL GREEN (seated==matched all cities; out-of-scope 0; split-section 0; idempotent) |
| 1406 | seat-alias emails (Blue Ridge, Nevada, Melissa) | ALL GREEN (19/19 aliases; generic-catchall 0; idempotent) |
| 1407 | personal emails A (Frisco P1/2/3/5/6, Princeton, Prosper, Allen, Fairview, Celina) | 36/37 (1 middle-initial miss → fixed in 1410); Frisco P4 untouched ✓; split-section 0 |
| 1408 | personal emails B (Parker, Saint Paul, Weston, Lowry Crossing, Lucas) | 33/34 (1 already-satisfied casing variant, Lucas Orr); split-section 0 |
| 1409 | **Frisco Place 4 seating correction** (Elad in, Ponangi out) — Wave-1 checkpoint | applied + verified (see 220-PREFLIGHT.md) |
| 1410 | post-apply reconcile: Fairview/Boggs email + Allen mayor valid_to | applied + verified |

> Migration-number note: PREFLIGHT reserved 1409 for the Frisco seating fix (not the
> plan's original "valid_to correction" slot), so the reconcile took **1410**.

## Verification-map queries (RESEARCH §"Phase Requirements → Verification Map")

- **(a) COLLIN-CONTACT-01 — web_form_url coverage:** all 11 sourced-form cities at **100%** of
  active seats (Blue Ridge 6/6, Farmersville 6/6, Lavon 6/6, Longview 7/7, Melissa 7/7,
  Murphy 5/5, Nevada 6/6, Princeton 8/8, Van Alstyne 7/7, Fairview 7/7, Prosper 6/6). ✓
- **(b) COLLIN-CONTACT-02 — generic-catch-all guard:** **0 rows** across all 24 geo_ids (no
  `info@`/`cityhall@`/`council@`/`contact@`/`townhall@`/`publiccomments@`/`ub@` seeded). ✓
- **(c) Success Criterion #4 — working-contact-method guard:** active officials with neither
  web_form_url nor email = **Anna (7)** + **Frisco Mayor (1, stale seat)** only. Both are
  documented honest/roster cases below — every other active official has a working method. ✓
- **(d) split-section (D-07):** **0 rows** (confirmed inside every apply-script's own gate;
  this phase only UPDATEs contact fields so a regression is structurally impossible). ✓

## valid_to spot-check (COLLIN-CONTACT-03, D-03 — light, no mass re-write)

5-city sample (Allen, Frisco, Saint Paul, Princeton, Nevada):
- **One outlier corrected:** Allen Mayor Chris Schulmeister had `valid_to = NULL` → set
  `2029-05-01` (derived from the 2026 election, RESEARCH 2026–2029) via mig 1410.
- All other sampled terms are plausible derived values. Several **expired-but-active** terms
  (`valid_to 2026-05-01`: Frisco Cheney/Rummel, Nevada P3/P4/P5, Allen Baril) are symptoms of
  the **May-2026 roster-currency gap** (below), NOT valid_to-derivation errors — deliberately
  NOT re-derived here (D-03 + contact-only scope). COLLIN-CONTACT-03 documented complete.

## Honest-Blank Register (D-04 — intentional blanks, NOT failures)

- **Anna (4803300) — all 7 seats blank.** The only submittable form is a mayor-named "Request
  to Contact Mayor Cain" (doesn't meet D-01's every-official bar) and no council emails are
  published. Genuine honest-blank. *Operator option:* the mayor-only form could be seeded on
  the Mayor seat alone if desired — deliberately not done (D-01 city-wide standard).
- **Email-blank but form-covered (meet Criterion #4 via the city form):** Farmersville, Lavon,
  Longview, Murphy, Van Alstyne — individual emails are genuinely unpublished; each city's
  form URL (mig 1405) is the working contact method for every official.
- **Form-blank but email-covered:** Parker, Saint Paul, Weston, Celina, Lucas, Lowry Crossing,
  Allen — no qualifying submittable form (only mailto/PDF/311); officials meet Criterion #4 via
  personal emails (migs 1407/1408).

## Roster-currency gap (out of scope — owed to a follow-up phase)

RESEARCH sourced the **current** (post-May-2026) officeholders from live city sites; the DB
still holds the **2023-term** occupants for several seats because Phase 219 was sourced-only.
The `full_name` guard in 1407/1408 correctly **no-op'd** the personal-email seed for these so a
current person's email is never attached to a former officeholder. Confirmed stale seats:

| Seat | DB seated (2023 term) | RESEARCH current | Effect |
|------|----------------------|------------------|--------|
| Frisco Mayor | Jeff Cheney (active) | Mark Hill | no contact seeded (Frisco has no form) |
| Frisco Place 6 | Brian Livingston (inactive) | Brittany Colberg | seat effectively unoccupied |
| Celina Place 4 | Wendie Wigginton (inactive) | Shea B. Scott | seat effectively unoccupied |
| Celina Place 5 | Mindy Koehne (inactive) | Shane R. Lambert | seat effectively unoccupied |
| Prosper Place 5 | Jeff Hodges (inactive) | Doug Charles | seat effectively unoccupied |

**Recommendation:** a dedicated Collin 2025/2026 municipal-election roster reconcile (Phase
219-style: seat the current winners, then their sourced emails from RESEARCH will attach).
NOT contact-backfill work; explicitly deferred. Frisco Place 4 (the one confirmed *wrong*
seating, not just stale) was fixed this phase via mig 1409.

## Migration C — deferred GAP cities (Josephine, Plano, Richardson)

All three WAF/JS-blocked automated fetch this session (RESEARCH §"Common Pitfalls"). **They are
NOT zero-contact** — each already carries a contact method from prior seeding (active officials
with no contact method = **0** in all three). Deferred work is *refresh/verify*, not fill:

- **Josephine (4838068):** 307 redirect loop. Candidate form `cityofjosephinetx.com/contact-us/`.
- **Plano (4858016):** JS-rendered `content.civicplus.com`. Candidate form
  `plano.gov/1859/Mayor-and-City-Council-Request-Form` (title-only, unconfirmed). **Do NOT seed
  Plano emails** — no pattern confirmed.
- **Richardson (4861796):** 403 WAF on `cor.net`. Candidate "City Council Public Comment Form".
  Only `Dan.Barrios@cor.gov` is directly confirmed; **do NOT seed the rest of the `cor.gov`
  pattern** (RESEARCH A3/A4).

**Recovery path:** a Playwright/JS-capable session (matching the `/find-headshots` WAF-fallback
pattern) or a human-operator phone call to each city secretary — then a small Migration C.

## Requirement disposition

| Req | Status | Evidence |
|-----|--------|----------|
| COLLIN-CONTACT-01 (web_form_url) | ✅ met | query (a) 100% on all 11 sourced-form cities |
| COLLIN-CONTACT-02 (emails) | ✅ met | 1406/1407/1408 seeded; query (b) 0 generic; honest-blanks documented |
| COLLIN-CONTACT-03 (valid_to) | ✅ met | spot-check clean; 1 outlier (Allen mayor) corrected; no mass re-write |
| Success Criterion #4 | ✅ met (documented exceptions) | query (c) remaining blanks = Anna (honest-blank) + stale roster seats (deferred) |
