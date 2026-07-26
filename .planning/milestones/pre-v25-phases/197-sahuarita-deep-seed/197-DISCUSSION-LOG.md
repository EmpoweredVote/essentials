# Phase 197: Sahuarita Deep-Seed - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-16
**Phase:** 197-sahuarita-deep-seed
**Areas discussed:** Council seat model, Banner imagery, Headshot source, Roster currency

---

## Council seat model

| Option | Description | Selected |
|--------|-------------|----------|
| Mirror OV/Marana | Mayor = LOCAL_EXEC + one shared LOCAL district, at-large + nonpartisan; researcher verifies against sahuaritaaz.gov; fall back to by-district only if Sahuarita elects by ward | ✓ |
| Force by-district | Lock a by-district model with per-seat geofences now regardless of research | |

**User's choice:** Mirror OV/Marana
**Notes:** Expected/default path. Researcher MUST verify form of government + seat count against sahuaritaaz.gov before planner locks.

---

## Banner imagery

| Option | Description | Selected |
|--------|-------------|----------|
| Pecan orchards | FICO / Green Valley Pecan — most distinctive Sahuarita identity | |
| Santa Rita Mtns | Southern range, distinct from Catalinas/Tortolitas | |
| Sahuarita Lake | Rancho Sahuarita waterfront / community scene | |
| You decide | Source 2–3 licensed candidates across subjects, present for review; avoid Catalinas + AI/aerial | ✓ |

**User's choice:** You decide
**Notes:** Claude sources candidates one at a time, presents options. Must avoid Catalina-range (collides with Pima 193 / Oro Valley 195) and Tortolita/Dove Mountain (Marana 196). Pecan orchards is the front-runner for distinctiveness.

---

## Headshot source

| Option | Description | Selected |
|--------|-------------|----------|
| gov site → fallback | sahuaritaaz.gov direct first; /find-headshots Playwright WAF fallback, then Ballotpedia/Wikimedia; 600×750 4:5 Lanczos q90 | ✓ |
| Ballotpedia first | Skip Town site, pull from Ballotpedia/Wikimedia directly | |

**User's choice:** gov site → fallback
**Notes:** Same approach as Marana/Oro Valley.

---

## Roster currency

| Option | Description | Selected |
|--------|-------------|----------|
| BLOCKING re-verify | Re-verify full seated roster against sahuaritaaz.gov immediately before apply; block if changed | ✓ |
| Flag a known change | Note a specific known vacant/mid-cycle seat for the researcher | |

**User's choice:** BLOCKING re-verify
**Notes:** 2026 is an active election year; same guard as Oro Valley 195. No known Sahuarita vacancy/mid-cycle change flagged.

---

## Claude's Discretion

- Banner subject selection (per "you decide") — source and present candidates; pecan orchards front-runner.
- Migration numbering (disk-authoritative), ext_id ranges, geofence source (Pima County GIS / TIGER place FIPS 04).
- Exact headshot fetch mechanics within the gov-site → WAF-fallback order.

## Deferred Ideas

None — discussion stayed within phase scope.
