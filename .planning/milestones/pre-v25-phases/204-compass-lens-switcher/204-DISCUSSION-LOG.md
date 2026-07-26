# Phase 204: Compass Lens Switcher - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-13
**Phase:** 204-compass-lens-switcher
**Areas discussed:** Chip design & states, Custom label & framing, Overflow & mobile, Calibrate scope & touch

---

## Chip Design & States

| Option | Description | Selected |
|--------|-------------|----------|
| Separate pills | Individual rounded pills; reuses `stance-btn` styling | ✓ |
| Segmented control | Connected joined segments | |
| Underlined tabs | Text tabs with active underline | |

**User's choice:** Separate pills.

| Option (active style) | Description | Selected |
|--------|-------------|----------|
| Filled with lens's own color | Federal navy / Local green / Judicial orange, white text | ✓ |
| Filled brand coral | Uniform coral active | |

**User's choice:** Filled with the lens's own color.

| Option (purple state) | Description | Selected |
|--------|-------------|----------|
| Grey fill + purple ring + dimmed label | Clearly "not ready yet" | ✓ |
| Purple ring only | Subtler | |

**User's choice:** Grey fill + purple ring + dimmed label.

| Option (icon) | Description | Selected |
|--------|-------------|----------|
| Icon + label | Per-lens glyph (dome/gavel/house/target) + text | ✓ |
| Label only | Text-only | |

**User's choice:** Icon + label.

---

## Custom Label & Framing

| Option | Description | Selected |
|--------|-------------|----------|
| Best Match | Communicates the you-and-them overlap behavior | ✓ |
| Custom | Matches SPEC internal name; abstract to users | |
| My Compass | Frames as user's own compass | |

**User's choice:** "Best Match" (visible label); internal key stays `custom`.

| Option (position) | Description | Selected |
|--------|-------------|----------|
| First / leftmost | The always-LIT baseline leads | ✓ |
| Last / rightmost | Named lenses first | |

**User's choice:** First / leftmost.

| Option (treatment) | Description | Selected |
|--------|-------------|----------|
| Brand coral + target/compass icon | Peer of named lenses, clearly the house default | ✓ |
| Neutral grey + compass icon | Understated "no specific lens" | |

**User's choice:** Brand coral + target/compass icon.

---

## Overflow & Mobile

| Option | Description | Selected |
|--------|-------------|----------|
| Horizontal scroll strip | One line, scrolls sideways | |
| Wrap to multiple rows | Pills wrap onto a second line (current flex-wrap) | ✓ |
| Collapse to a dropdown | Active lens button opens a list | |

**User's choice (desktop):** Wrap to multiple rows.

| Option (mobile) | Description | Selected |
|--------|-------------|----------|
| Same strip, horizontal scroll | Reuse pill strip with swipe | ✓ |
| Dropdown on mobile only | Compact dropdown on phones | |

**User's choice (mobile):** Same strip, horizontal scroll.

**Notes:** Desktop wraps, mobile scrolls — two container behaviors by breakpoint, one shared chip component.

---

## Calibrate Scope & Touch

| Option | Description | Selected |
|--------|-------------|----------|
| Only that lens's unanswered topics | Fastest path to LIT | ✓ |
| Full quiz for that lens | Re-confirms answered topics | |

**User's choice:** Only that lens's unanswered topics.

| Option (touch) | Description | Selected |
|--------|-------------|----------|
| First tap = prompt, second = go | Inline "Calibrate?" prompt, then navigate | ✓ |
| Single tap = go straight | One tap to calibration | |

**User's choice:** First tap = prompt, second = go.

| Option (return) | Description | Selected |
|--------|-------------|----------|
| That lens now selected & active | Auto-apply on return | ✓ |
| Lens LIT but not auto-selected | Ready, but user clicks to apply | |

**User's choice:** That lens now selected & active.

---

## Claude's Discretion

- Exact pill dimensions/spacing/transition timing, focus-ring styling, dark-mode variants of each lens color.
- Whether "Best Match" renders visually selected at all times or only implicitly when nothing else is chosen.
- PostHog analytics event naming (mirror `essentials_compass_local_lens_toggled`).
- Switcher empty/loading state while `lenses` hydrate (fallback constants available immediately).

## Deferred Ideas

- State / International lenses — future data addition (switcher renders whatever the API returns).
- Reworking the standalone `JudicialCompassSection` — out of scope; Judicial becomes a grid lens only.
- Profile CompassCard switcher — grid-only this phase (per-card rejected as overwhelming).

## Research / Planning Flags

- ⚠ Confirm `GET /compass/lenses` returns `name`/`description`/`color` per lens.
- ⚠ Define the `compass.empowered.vote` calibrate-URL contract (lens-scoped unanswered topics + return URL) — needs EV-CompassV2 coordination.
