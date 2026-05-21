# Phase 61: CA State Legislature - Context

**Gathered:** 2026-05-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Seed all 120 CA state legislators — 40 State Senators and 80 Assembly members — with offices linked to the correct SLDU/SLDL geofence districts and headshots at 600×750. Covers data migration and headshots only. Elections seeding is Phase 69.

</domain>

<decisions>
## Implementation Decisions

### Pre-existing Assembly seed (CRITICAL)
- CA Assembly members are already seeded with external_ids `-100049` through `-100119` (pre-existing from earlier work, like Phase 59 execs)
- **Approach: full dedup, same as Phase 59** — audit existing rows, update external_ids to `-60002xx` scheme, then insert office rows
- External_id scheme: `-6000201` (AD-01) through `-6000280` (AD-80)
- If gaps exist (Assembly districts with no pre-existing politician row), handling is Claude's discretion — researcher documents the extent during audit

### Senator external_id scheme
- CA State Senators have no pre-existing rows — all fresh INSERTs in 61-01
- External_id scheme: `-6000101` (SD-01) through `-6000140` (SD-40)
- Full CA scheme family: `-60001xx` senators, `-60002xx` assembly, `-60003xx` US House
- **Mandatory pre-check**: researcher must verify no pre-existing CA State Senator politician rows exist before drafting 61-01 (given two prior surprise pre-existing data discoveries)

### Headshot sourcing strategy
- Claude's discretion — researcher finds the most efficient path (official CA legislature pages, structured/bulk source, or hybrid)
- Batch structure (senators in 61-03 vs. combined all-120 run) is Claude's discretion
- Researcher should check which pre-existing Assembly rows already have `politician_images` entries to avoid redundant re-uploads

### Headshot quality standards
- **Low-res fallback**: upscale official photos using Lanczos (same as ME House thumbnails approved in Phase 52) — coverage over pixel-perfect quality
- **No-photo policy**: halt and flag (no skipping) — phase is not complete until every legislator has a photo
- **Source restriction**: official government or press pages only — no campaign materials, no text/graphic overlays
- 600×750 target, 4:5 crop, q90, Lanczos resize (established standard)

### Claude's Discretion
- Gap-fill strategy if Assembly districts have no pre-existing row
- Headshot batch structure within 61-03
- Which pre-existing Assembly rows already have headshots (determine during audit)
- Next migration number to use (currently 194; researcher verifies)

</decisions>

<specifics>
## Specific Ideas

- The Phase 59 dedup pattern is the model for 61-02: audit → update external_ids → insert office rows in a single migration
- Pre-check for existing senators should be a SQL query the researcher runs before planning 61-01

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 61-ca-state-legislature*
*Context gathered: 2026-05-21*
