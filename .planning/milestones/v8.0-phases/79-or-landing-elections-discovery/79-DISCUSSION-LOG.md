# Phase 79: OR Landing + Elections + Discovery - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 79-or-landing-elections-discovery
**Areas discussed:** Portland city council 2026 races, OR primary handling, US Senate + legislative scope

---

## Portland City Council 2026 Races

### Are any seats up in 2026?

| Option | Description | Selected |
|--------|-------------|----------|
| No seats up — all 4-year terms, nothing until 2028 | All 12 councilors + Mayor + Auditor elected Nov 2024 for 4-year terms | |
| Some special elections may exist | Possible appointment-triggered specials | |
| Researcher should verify before writing anything | Don't pre-answer — check sos.oregon.gov + portlandoregon.gov/auditor | ✓ |

**User's choice:** Researcher verifies — if no 2026 races found, create no race rows.
**Notes:** New charter (effective Jan 2025) elected all officials Nov 2024. Likely no 2026 races but researcher confirms before writing migrations.

---

### If no Portland city races in 2026 — what should the discovery_jurisdictions row look like?

| Option | Description | Selected |
|--------|-------------|----------|
| Create row with election_date=2028-11-03, cron_active=true | Arms pipeline for 2028; SC-6 satisfied | ✓ |
| Skip discovery_jurisdictions for Portland if no 2026 races | Cleaner, but SC-6 requires row to exist | |
| Create row but cron_active=false | SC-6 unfulfilled as written | |

**User's choice:** Create the row with election_date=2028-11-03 and cron_active=true regardless of 2026 race findings.

---

## OR Primary Handling

### Bare election row or also create race rows for primary?

| Option | Description | Selected |
|--------|-------------|----------|
| Bare primary election row only, no race rows | Primary already done (May 19); focus race rows on November general; consistent with CA Phase 69 | ✓ |
| Election row + race rows for Governor + statewide showing top-two results | More complete but significant research work for a past event | |
| Election row + stub race rows (no candidates, cron_active=false) | Structurally satisfies SC-2 but adds unpopulated rows | |

**User's choice:** Bare primary election row only. No race rows for primary. All race rows link to the November 3 general.

---

### Pre-link top-two primary winners or leave empty for discovery?

| Option | Description | Selected |
|--------|-------------|----------|
| Leave empty for discovery to fill | Discovery agent finds candidates via sos.oregon.gov; consistent with CA Phase 69 | ✓ |
| Researcher pre-links top-two winners for Governor + US House | More accurate starting state; risk of duplicate if not careful | |
| Pre-link Governor only; leave House to discovery | Compromise | |

**User's choice:** Leave all race_candidates empty. Discovery fills via cron.

---

## US Senate + Legislative Scope

### Include Jeff Merkley's Senate race?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — Senate race row + discovery | Merkley up for reelection 2026; same pattern as Collins in ME Phase 55 | ✓ |
| No — Governor + US House only (match CA Phase 69) | Keeps scope tighter; CA didn't have an active Senate race | |
| Researcher decides | Pre-answered — Merkley is confirmed up in 2026 | |

**User's choice:** Include Merkley's Senate race row and discovery_jurisdictions.

---

### State legislative scaffold scope?

| Option | Description | Selected |
|--------|-------------|----------|
| Governor + Federal only (CA Phase 69 approach) | Lean phase: Governor + 6 US House + 1 US Senate | |
| Full scaffold — 90 OR legislative races (ME Phase 55 approach) | 30 Senate + 60 House, general only; complete coverage | ✓ |
| Partial — Governor + Federal + OR legislative, no Portland city | Includes all statewide races | |

**User's choice:** Full scaffold — 90 OR state legislative races (general election only), matching ME Phase 55 approach.

---

### Primary vs. general for legislative scaffold?

| Option | Description | Selected |
|--------|-------------|----------|
| General only | Consistent with primary-is-done decision; 90 race rows | ✓ |
| Both primary + general (180 rows) | Primary already over; double the work for past elections | |

**User's choice:** General only — consistent with OR primary handling decision.

---

## Claude's Discretion

- Exact sos.oregon.gov candidate listing URL format for discovery source rows
- Portland city elections source URL (portlandoregon.gov/auditor vs sos.oregon.gov)
- Whether to create one combined OR statewide discovery_jurisdictions row or separate rows per race type
- OR Governor 2026 race structure (Kotek seeking second term vs. open seat)
- Migration numbering (next is 236 per Phase 77.1 SUMMARY)
- Official OR primary date confirmation (sos.oregon.gov)

## Deferred Ideas

- Multnomah County Commissioner 2026 races — out of scope for Phase 79; deferred to a separate Multnomah County phase
- OR suburban city coverage (Salem, Eugene, Beaverton, etc.) — v8.1+ scope
- Voter education for STV/RCV — noted, future feature phase
- Post-November 2026 discovery_jurisdictions maintenance — update source URLs after November 3 general
