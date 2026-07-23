---
title: LocationCombobox non-blocking search refinements (from 214 review)
type: enhancement
priority: low
created: 2026-07-21
source: phase-214 code review (214-REVIEW.md WR-01/WR-02)
domain: frontend (essentials) — src/components/LocationCombobox.jsx
---

# LocationCombobox search refinements

Non-blocking warnings from the Phase 214 code review, deferred (phase shipped;
core behavior verified). Full detail in `214-REVIEW.md`.

- **WR-01 — debounced name search has no request cancellation/sequencing.** Fast
  typing can let an older `/location-search` response land after a newer one and
  overwrite the candidate list. Add an AbortController or a request-sequence guard
  so only the latest query's results render.
- **WR-02 — "press Enter to search as address" fallback not wired.** The
  zero-candidate hint row says "…or press Enter to search it as a street address,"
  but on a name-kind query with no matches, Enter currently does nothing (the
  classifier keeps it `name`, so `onSubmitAddress` never fires). Either wire Enter
  to fall back to an address lookup for that state, or soften the copy.

WR-03 (coordinate-mode Elections-tab gap), WR-05 (`<button>` nested in
`role="option"`), and the two info items are documented in 214-REVIEW.md for a
future accessibility/polish pass.
