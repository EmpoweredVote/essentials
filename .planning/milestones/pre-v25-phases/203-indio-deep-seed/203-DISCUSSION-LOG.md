# Phase 203: Indio Deep-Seed - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-13
**Phase:** 203-indio-deep-seed
**Areas discussed:** Banner sourcing, Roster locking, Geofence source, Headshot fallback

**Context note:** A thorough CONTEXT.md already existed (compiled 2026-07-12 from recon). User
chose "Update it." The deep-seed shape itself was locked from Phases 201/202 and not
re-litigated — only genuinely-open decisions were discussed.

---

## Banner sourcing

| Option | Description | Selected |
|--------|-------------|----------|
| Indio-specific photo | Real, licensed Indio street-scene/skyline, one at a time | ✓ |
| Reuse CV / Mission Inn banner | Same banner as 201 & 202 | |
| You decide | Attempt Indio-specific, fall back to CV | |

**User's choice:** Indio-specific photo.
**Follow-up (subject):** Old Town / downtown streetscape preferred (over date-palm/heritage or
open judgment). Real photo only, no AI/aerial, source one at a time; CV banner is last resort.

---

## Roster locking

| Option | Description | Selected |
|--------|-------------|----------|
| Lock roster, executor reconfirms live | Keep Dec-2025 table; reconfirm each live before seeding | ✓ |
| Research fresh at execute | Rebuild roster from scratch, ignore table | |

**User's choice:** Lock roster, executor reconfirms live.
**Notes:** Live reconfirm also covers the Benjamin Guitron IV full-name question.

---

## Geofence source

| Option | Description | Selected |
|--------|-------------|----------|
| gis.indio.org ArcGIS REST primary | Pull ?f=geojson; verify 5 features + district-number attr | ✓ |
| Ord. 1775 PDF digitize primary | Digitize from official map PDF | |

**User's choice:** gis.indio.org ArcGIS REST primary; Ord. 1775 PDF digitize as fallback only.

---

## Headshot fallback

| Option | Description | Selected |
|--------|-------------|----------|
| civicweb.net primary, indio.org via UA fallback | members.aspx?id=10 first; Browser-UA/Playwright for gaps | ✓ |
| indio.org via Browser-UA/Playwright primary | StaffDirectory first, civicweb.net backstop | |

**User's choice:** civicweb.net primary, indio.org (Browser-UA/Playwright) for gaps.
**Notes:** Pipeline: 4:5 crop FIRST → 600×750 Lanczos q90.

---

## Claude's Discretion

- Exact banner photo selection within the Old Town/downtown preference (subject to licensing +
  no-AI/no-aerial).

## Deferred Ideas

None — discussion stayed within phase scope.
