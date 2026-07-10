# Phase 170: Section Banners & Continuous Scroll (Results) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-24
**Phase:** 170-section-banners-continuous-scroll-results
**Areas discussed:** Banner label & pin, School-board tier, Sticky vs scroll & size, Fallback treatment

---

## Banner label & pin

### Title text per tier
| Option | Description | Selected |
|--------|-------------|----------|
| City,ST / State / US | City `📍 Bloomington, IN`, State `📍 Indiana`, Federal `📍 United States` — matches mockup hero | ✓ |
| Full city + full state | `📍 Bloomington, Indiana` / `State of Indiana` / `United States` | |
| Generic tier names | `📍 City` / `📍 State` / `📍 Federal` | |

### Eyebrow treatment
| Option | Description | Selected |
|--------|-------------|----------|
| Eyebrow on banner, drop section eyebrow | Teal `YOUR CITY`/`YOUR STATE`/`FEDERAL` on banner; remove small section eyebrow | ✓ |
| Generic `YOUR LOCATION` on all | Same eyebrow on every banner | |
| Keep both | Banner eyebrow + existing small section eyebrow | |

### Pin
| Option | Description | Selected |
|--------|-------------|----------|
| Reuse coral pin asset | `noun-location-7814384-FF5740.svg` (coral #FF5740), inline before title | ✓ |
| Teal pin | Recolor to #00c8d7 | |
| No pin | Text only | |

**User's choice:** City,ST / State / US titles; per-tier teal eyebrow with the small section eyebrow dropped; reuse coral pin.
**Notes:** Mirrors the `scratchpad/figma/essentials-design.png` mockup hero (`YOUR LOCATION` + `📍 Bloomington, IN`).

---

## School-board tier

| Option | Description | Selected |
|--------|-------------|----------|
| Fold under City banner | City banner covers Local + School; 3 banners total; matches roadmap + 171 art | ✓ |
| Own School banner | 4th full-bleed banner for School (needs art + fallback) | |
| Banner-less School section | School sections render with no banner divider | |

**User's choice:** Fold School under the City banner.
**Notes:** `TIER_ORDER = ['Local','School','State','Federal']` (groupHierarchy.js:345) — School is a distinct top-level tier; folding it under City keeps the 3-banner City→State→Federal model.

---

## Sticky vs scroll & size

### Scroll behavior
| Option | Description | Selected |
|--------|-------------|----------|
| Scroll-through dividers | Inline dividers in normal flow; scroll away as passed; old scroll-spy retired | ✓ |
| Sticky tier headers | Each banner pins to top within its tier | |

### Size / bleed
| Option | Description | Selected |
|--------|-------------|----------|
| Compact full-bleed band | Edge-to-edge (-mx-6/-mx-12), ~180px desktop / ~120px mobile | ✓ |
| Tall hero band | Edge-to-edge ~280-320px desktop | |
| You decide | Planner discretion | |

**User's choice:** Scroll-through inline dividers; compact full-bleed band.
**Notes:** Legacy single swapping building image + `IntersectionObserver` scroll-spy (Results.jsx:1232–1259) retired.

---

## Fallback treatment

### Fallback look
| Option | Description | Selected |
|--------|-------------|----------|
| Dark gradient + label | Dark gradient band, eyebrow + pin + title, no image | ✓ |
| Reuse generic SVGs | city-hall-generic.svg / state-capitol-generic.svg behind overlay | |
| Solid dark surface | Flat #161b22 + label | |

### Gradient tint
| Option | Description | Selected |
|--------|-------------|----------|
| Neutral dark gradient | Same gradient all tiers | |
| Tier-tinted gradient | Subtle per-tier tint | ✓ |
| You decide | Planner discretion | |

**User's choice:** Dark gradient + label fallback; subtle per-tier tint.
**Notes:** Fallback is the common path at launch (most jurisdictions have no art). Existing generic SVGs are light line-art — rejected as off-theme.

---

## Claude's Discretion

- Exact `SectionBanner` prop names/signature, file location, internal markup.
- Exact banner height/aspect within ~180/120px bounds; exact fallback gradient hues within dark tokens.
- Removal vs repurposing of `data-tier` + retired scroll-spy.
- FilterBar row layout after tier-dropdown removal; implementation of the `selectedFilter` simplification.
- Whether banner labels reuse the 169 hero-title token (Manrope Bold 30px) or a smaller compact-band size.

## Deferred Ideas

- Banner art + sourcing pipeline + procedure → Phase 171.
- Elections page dark treatment + banner parity (BANR-05/DARK-03) → Phase 172.
- Live banner stats + feature-icon links → future milestone (slots structure-only now).
- Banner art for the ~10 other covered states → future.
- ROADMAP.md "Phase 171" mis-stitched body (goal vs criteria mismatch) — fix when planning 171/172.
