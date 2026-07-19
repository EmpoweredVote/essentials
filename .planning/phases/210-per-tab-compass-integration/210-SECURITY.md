---
phase: 210
slug: per-tab-compass-integration
status: verified
threats_open: 0
asvs_level: 1
created: 2026-07-19
---

# Phase 210 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| URL → client state | The `?view=` query param is fully client-controllable and can name a stale/empty/unknown tab. | Untrusted tab identifier (string) |
| Tab/default → lens key → setActiveLens | The lens key applied to the global compass on tab entry originates from a tab default (incl. the not-yet-authored `education` key) and must never reach the render/chip layer unresolved. | Lens key (string) |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-210-01 | Tampering / DoS (broken UI) | `?view=` → effectiveActiveView → resolveTabLens → setActiveLens (Results.jsx) | mitigate | `effectiveActiveView` validates the raw `?view=` param and falls back to `'representatives'` for unknown/empty tabs (Results.jsx:1457-1470). `resolveTabLens` (compass.js:585-591) resolves any absent/unlit/uncalibrated default key — including `education` (TAB_DEFAULTS, compass.js:565-569) — to `'custom'` BEFORE `setActiveLens`, so `activeLensKey` always exists in the lens set and the chip row always lights a chip. Unit-tested (compass.test.js:244-284, 35/35). Live-reverified in 210-02 step 5. | closed |
| T-210-02 | DoS (render churn / effect loop) | tab-entry useEffect vs handleSelectLens (Results.jsx) | mitigate | Tab-entry effect deps (Results.jsx:1505) are `[effectiveActiveView, tabLensMemory, lenses, rawUserAnswers, setActiveLens]` and never include `activeLensKey`; `setActiveLens` is idempotent. The explicit pick is an event handler (`handleSelectLens`, Results.jsx:589-595) that writes memory before delegating — no back-sync effect loop or duplicate posthog fire. The CR-01 gap-closure seed effect (Results.jsx:1486-1491) is mount-once (`[]` deps), does not clear the marker, and adds no churn source. Full suite green (211/211, re-run live). | closed |
| T-210-03 | Information Disclosure (fabricated data) | Educators tab, zero educator stance data | accept | No code path fabricates spoke data for an unlit/uncalibrated lens: `MiniCompass.jsx:43-46` returns an empty state (`hasEnoughSpokes: false`) and renders `null` (MiniCompass.jsx:134) rather than synthesized spokes when data is insufficient. Shared component untouched by Phase 210. Live-verified in 210-02 step 5 (honest blanks). | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-210-01 | T-210-03 | Educators tab on a location with zero educator stance data shows honest blanks / Best Match — no spokes are fabricated. This is the designed D-05 honest-blanks behavior; no data is invented. | Chris Cantrell | 2026-07-19 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-07-19 | 3 | 3 | 0 | gsd-security-auditor (sonnet) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-07-19
