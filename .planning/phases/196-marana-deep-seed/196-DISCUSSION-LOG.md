# Phase 196: Marana Deep-Seed - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-15
**Phase:** 196-marana-deep-seed
**Areas discussed:** Roster scope, At-large district modeling, Banner subject, Stances depth

---

## Roster scope

| Option | Description | Selected |
|--------|-------------|----------|
| Elected council only | Mayor + elected council members only; antipartisan (party never displayed). Matches Pima/Tucson/Oro Valley. | ✓ |
| Council + key appointees | Also seed appointed officials (e.g. Town Manager). | |

**User's choice:** Elected council only (recommended)
**Notes:** Consistent with every prior deep-seed and the app's antipartisan model.

---

## At-large district modeling

| Option | Description | Selected |
|--------|-------------|----------|
| Mirror Oro Valley | If researcher confirms at-large + nonpartisan: Mayor = new LOCAL_EXEC seat + ONE shared LOCAL district for all council seats. | ✓ |
| Force by-district | Model each council seat as its own district (requires district geofences). | |

**User's choice:** Mirror Oro Valley (recommended)
**Notes:** Contingent on researcher verifying Marana elects at-large; by-district fallback only if proven otherwise.

---

## Banner subject

| Option | Description | Selected |
|--------|-------------|----------|
| Claude sources, non-Catalina | One licensed real street-scene/skyline at a time (Dove Mountain, Marana Main St, Heritage River Park), avoiding Catalina-range overlap with Pima/Oro Valley banners. | ✓ |
| I have a specific scene | User specifies a particular Marana landmark/photo. | |

**User's choice:** Claude sources, non-Catalina (recommended)
**Notes:** Marana is by the Tortolita range; Catalina imagery would collide with Pima/Oro Valley banners.

---

## Stances depth

| Option | Description | Selected |
|--------|-------------|----------|
| Full, per convention | Evidence-only across all live compass topics, one agent at a time, 100% cited, honest blanks. | ✓ |
| Defer stances | Seed roster + headshots + banner now, defer compass stances. | |

**User's choice:** Full, per convention (recommended)
**Notes:** Same as every prior deep-seed.

---

## Claude's Discretion

- Headshot sourcing pipeline (direct fetch vs `/find-headshots` Playwright WAF fallback).
- Migration numbering, ext_id ranges, geofence source (TIGER place 04 already loaded in Phase 190).

## Deferred Ideas

None — discussion stayed within phase scope.
