# Phase 90: Post-Election Follow-up + MiniCompass UI - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-04
**Phase:** 90-post-election-follow-up-minicompass-ui
**Areas discussed:** ME Primary Timing, MiniCompass Size (UI-01), MiniCompass Labels (UI-02), lavote Election ID (POST-ELECTION-02), ev-ui 0.9.2 update

---

## ev-ui 0.9.2 Update (pre-discussion discovery)

During codebase scouting, ev-ui 0.9.2 was discovered to have been published today (2026-06-04). Installed version is 0.8.14; package.json requires ^0.9.1. PR #43 (ea(cards) compass card polished) is likely the source of 0.9.x changes.

| Option | Description | Selected |
|--------|-------------|----------|
| Run npm install first, then test | Install 0.9.2 now. If compass looks right, skip UI-01/UI-02. | ✓ |
| Assume PR #43 fixed it, skip UI planning | Trust 0.9.2 covers both requirements. |  |
| Ignore ev-ui update, plan UI changes ourselves | Write changes in essentials regardless. |  |

**User's choice:** Run npm install first, then test
**Notes:** PR #43 may have already fixed label rendering and/or added dotRadius prop. Plan should check this before doing any MiniCompass work.

---

## ME Primary Timing

| Option | Description | Selected |
|--------|-------------|----------|
| Split: plan rest now, POST-ELECTION-01 after June 9 | Execute lavote + UI changes now; POST-ELECTION-01 as plan 90-02 after June 9. |  |
| Wait — start Phase 90 after June 9 | Don't execute anything until ME results are known. | ✓ |
| Plan everything now, execute POST-ELECTION-01 manually | Migration stub approach for winners. |  |

**User's choice:** Wait — start Phase 90 after June 9
**Notes:** Today is June 4; ME primary is June 9. Keeping the phase atomic. No execution before June 9.

---

## lavote Election ID (POST-ELECTION-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Researcher should find it | Scrape lavote.gov / Socrata API for CA November 2026 general election_id. | ✓ |
| I know the ID — I'll provide it | User has it ready. |  |

**User's choice:** Researcher should find it
**Notes:** Current discovery_jurisdictions row has the June 2026 cycle election_id. Researcher must identify the correct November 4, 2026 value.

---

## MiniCompass Labels (UI-02)

User clarified that `labelFontSize={0}` is already set but labels "got added back somehow." The actual problem: RadarChartCore still reserves 40px padding each side for labels even at labelFontSize=0 (minPadding floor in sidePadding calculation). This eats chart space.

| Option | Description | Selected |
|--------|-------------|----------|
| Both: callers + MiniCompass INNER_SVG_SIZE | Was offered as size fix — user redirected to actual problem |  |
| Callers only | Was offered as size fix — user redirected |  |
| MiniCompass.jsx only | Was offered as size fix — user redirected |  |

**User's choice (free text):** "The size issue should fix itself normally if we get rid of the titles on the mini-compass. I had them removed and they got added back somehow. The labels are way too small to read and make the radar graph so small it becomes less helpful."
**Notes:** This completely reframed UI-01. The labels (invisible but space-reserving) are the real cause of the chart appearing small. Fallback fix: pass `padding={0}` and `labelOffset={0}` to RadarChartCore, or use `showLabels={false}` if 0.9.2 exposes it.

---

## MiniCompass Dot Size (UI-01)

User clarified: "When I talk about 50% smaller, the ONLY thing I am referring to is the size of the dots (black and yellow) at each inflection point. Those need to be smaller. But each still needs a tooltip."

| Option | Description | Selected |
|--------|-------------|----------|
| ev-ui change: add dotRadius prop, then update essentials | Cleanest long-term; requires ev-ui PR + release. | ✓ |
| MiniCompass.jsx overlay: render own smaller dots on top | No ev-ui change needed but more complex. |  |
| Check 0.9.2 first — decide after npm install | PR #43 may already have added dotRadius. | (implicit) |

**User's choice:** ev-ui change: add dotRadius prop, then update essentials
**Notes:** Dots currently r=5 (user) and r=6 (match/yellow) hardcoded in RadarChartCore. No prop to override. Target: r≈2.5. We own ev-ui so a PR is straightforward.

---

## ev-ui Ownership

| Option | Description | Selected |
|--------|-------------|----------|
| Chris Andrews owns ev-ui | Plan flags ev-ui changes as a dependency. |  |
| I handle ev-ui too | Plan can include ev-ui changes directly. | ✓ |

**User's choice:** I handle ev-ui too
**Notes:** Plan can include: clone/update C:/ev-ui/ev-ui-main → add dotRadius prop → publish → npm install in essentials.

---

## Claude's Discretion

- Whether to combine label fix and dotRadius prop in one ev-ui PR or ship them separately.
- Exact `dotRadius` value — `2.5` is the starting point, `3` is acceptable if 2.5 looks too faint.

## Deferred Ideas

None.
