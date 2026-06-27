# Phase 171: Banner Asset Pipeline & Exemplar Art - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-27
**Phase:** 171-banner-asset-pipeline-exemplar-art
**Areas discussed:** Bloomington exemplar, Storage consistency, Procedure doc (ASST-02), AI fallback path

> **Framing established up front:** Phase 170's UAT already produced nearly all of ASST-01's art
> (all 50 state panoramas incl. IN + CA, federal Capitol, LA + 10 LA-county skylines, graceful
> gradient fallback). Phase 171 thus reduced to Bloomington art + storage cleanup + the ASST-02
> procedure. The four areas below were chosen against that reduced scope.

---

## Bloomington exemplar

| Option | Description | Selected |
|--------|-------------|----------|
| Re-source to Storage | Source recognizable wide Bloomington shot, dark-overlay treatment, upload to Supabase Storage, rewire buildingImages.js. Matches LA exemplar + storage convention. | ✓ |
| Keep existing local photo | Leave public/images/bloomington-city-hall.jpg as-is. | |
| Upgrade in place (local path) | Better art but stay on local /public/images path. | |

**User's choice:** Re-source to Storage.
**Notes:** On the subject follow-up, user gave free-text direction: "a beautiful shot of a city from
the gate of IU, but of Bloomington more than the college." → wide view of the CITY from an IU
vantage (Sample Gates / campus rise), city as subject and campus as framing — NOT campus
architecture. Fallback: downtown / Monroe County Courthouse-square view if no usable-license shot.

---

## Storage consistency

| Option | Description | Selected |
|--------|-------------|----------|
| Storage canonical + clean dead code | Storage canonical for all banner art; delete unreachable local state-capitols/*.jpg + dead STATE_CAPITOLS branch. | ✓ |
| Storage canonical, leave leftovers | Move Bloomington only; leave dead local files + branch in place. | |
| Keep hybrid, just document it | Document the mixed local/Storage model as intentional. | |

**User's choice:** Storage canonical + clean dead code.
**Notes:** Surfaced that there is no Storage path convention for standalone cities (states/, national/,
la_county/ exist; Bloomington is the first standalone city) — folded into the procedure doc (D-05).
Also flagged the unused FALLBACK_*/generic-SVG branches for cleanup after unreachability verification.

---

## Procedure doc (ASST-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Doc + reusable script | Written procedure PLUS committed reusable PIL/upload script capturing the 170 workflow. | ✓ |
| Doc only | Thorough markdown procedure, no committed tooling. | |
| Script-light doc | Procedure with inline copy-paste snippets, no maintained script file. | |

**User's choice:** Doc + reusable script.

**Follow-up — where they live:**

| Option | Description | Selected |
|--------|-------------|----------|
| Essentials repo: docs/ + scripts/ | docs/banner-asset-pipeline.md + scripts/banners/; service-role key via env var; outside Tailwind scan paths. | ✓ |
| EV-Accounts repo | Script/doc where service-role key lives; split from buildingImages.js; avoid gitignored scripts/_*. | |
| Split: doc in .planning, script in repo | Procedure under .planning/; Tailwind-scan + Windows-path crash risk. | |

**User's choice:** Essentials repo: docs/ + scripts/.
**Notes:** Surfaced the Tailwind v4 prod-build crash hazard for raw Windows backslash paths — the doc
must keep `C:\...`-style paths (EV-Accounts .env) in code fences / forward slashes.

---

## AI fallback path

| Option | Description | Selected |
|--------|-------------|----------|
| Document-only, last resort | Describe AI generation as last resort in the procedure; build no tooling. | |
| Build + exercise it | Implement and prove an AI-generation fallback this phase. | |
| Drop AI fallback entirely | Graceful gradient is the only fallback; AI omitted from the procedure. | ✓ |

**User's choice:** Drop AI fallback entirely.
**Notes:** Real licensed photos → graceful gradient only. Intentional divergence from ASST-01
requirement text (which names "AI fallback") — flagged in CONTEXT so the verifier does not treat its
absence as a gap.

---

## Claude's Discretion

- Exact standalone-city Storage path prefix (e.g. `cities/<slug>.jpg`).
- Exact script language/structure under `scripts/banners/` (Python+PIL implied) and CLI shape.
- Whether the generic-SVG / FALLBACK_* cleanup proceeds after unreachability verification.
- Bloomington banner dimensions/aspect — match the existing state-panorama dims.

## Deferred Ideas

- Remaining covered states' art — already complete (170); procedure serves future states/cities only.
- Live banner stats + feature-icon links → future milestone (BANR-04 slots are structure-only).
- Elections-page dark treatment + banner dividers (DARK-03 / BANR-05) → Phase 172.
- Landing + politician profile pages to dark treatment → future milestone.
