# Phase 189: Smart-Banner Integration & Graceful Degradation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-08
**Phase:** 189-smart-banner-integration-graceful-degradation
**Areas discussed:** Shared abstraction shape, In-app vs ev-ui location, Population bundle size, Empty-state parity proof

---

## Shared abstraction shape

| Option | Description | Selected |
|--------|-------------|----------|
| `buildBannerProps` helper | Pure `buildBannerProps(tier, maps)` spread into the existing `<SectionBanner>`; SectionBanner stays the one presentational component | ✓ |
| `<LocationBanner>` wrapper | New wrapper component assembling props internally and rendering SectionBanner | |

**User's choice:** buildBannerProps helper (Recommended)
**Notes:** Lightest option; keeps ev-ui's SectionBanner free of app-specific data wiring; satisfies SBAN-03 single-source-of-truth without an extra component layer.

---

## In-app vs ev-ui location

| Option | Description | Selected |
|--------|-------------|----------|
| In-app now, promote later | Build in `src/`; promote to `@empoweredvote/ev-ui` in a later pass | ✓ |
| Author in ev-ui now | Write directly in the ev-ui repo (separate repo + tag-publish cycle) | |

**User's choice:** In-app now, promote later (Recommended)
**Notes:** Matches roadmap "promotable to ev-ui" wording; avoids blocking 189 on the ev-ui publish cycle.

---

## Population bundle size (carry-over from 188)

| Option | Description | Selected |
|--------|-------------|----------|
| Assess in research; do only if clean | Split via dynamic import only if low-risk ~1-liner, else defer | ✓ |
| Commit to splitting now | Make lazy-loading an explicit 189 deliverable | |
| Defer entirely | Leave as-is, log a separate perf task | |

**User's choice:** Assess in research; do only if clean (Recommended)
**Notes:** ~1.16 MB min / ~420 KB gzip. Keeps 189 focused on integration; don't let a bundle refactor expand scope.

---

## Empty-state parity proof (SBAN-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Lightweight: live check + unit guards | Code inspection + live no-data spot-check + keep existing guards unit-tested | ✓ |
| Add regression/snapshot test | Introduce visual/DOM snapshot infra | |

**User's choice:** Lightweight: live check + unit guards (Recommended)
**Notes:** Repo has no snapshot infra today; 189 shouldn't add it. `shouldRenderStat` / `featureIcons?.length` guards already exist and are testable.

---

## Claude's Discretion

- Exact helper filename/location and precise signature.
- Whether the helper returns a spread-ready object or pages destructure it.
- Which no-data location(s) to use for the live spot-check.

## Deferred Ideas

- Population bundle code-split (if research finds it non-trivial) — own perf task.
- Promoting the banner/helper into `@empoweredvote/ev-ui` — later pass.
- Additional stat facts / more product icons / reciprocal icons on other apps — future phases.
