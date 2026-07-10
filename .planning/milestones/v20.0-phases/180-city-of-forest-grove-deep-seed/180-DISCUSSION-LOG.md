# Phase 180: City of Forest Grove Deep-Seed - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-03
**Phase:** 180-city-of-forest-grove-deep-seed
**Areas discussed:** 179 template fixes (WR-01/WR-02), Banner subject hint, Headshot fallback policy, Roster edge-case handling

> **AFK resolution:** The area-selection question timed out with no user response (60s, user away
> from keyboard — same situation as Phase 179's discussion). Per the 179 precedent, all four
> presented gray areas were resolved with the recommended option, each following established
> milestone precedent. The user can amend `180-CONTEXT.md` before planning.

---

## 179 template fixes (WR-01/WR-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Fold both fixes in (recommended) | Headshot pipeline exits non-zero on any upload failure; structural migration gets an in-file identity gate on the ON CONFLICT (external_id) DO UPDATE path | ✓ (AFK default) |
| Defer to a separate hardening pass | Keep 180 identical to 179 templates; fix later | |

**Resolution:** Both locked into Phase 180's artifacts as **D-14** — latent defects flagged by 179's code review, cheapest to fix at the template level so 181–182 inherit them.

---

## Banner subject hint

| Option | Description | Selected |
|--------|-------------|----------|
| Pacific University / Old College Hall (recommended) | Forest Grove's signature landmark | ✓ (AFK default) |
| Historic downtown / Main Street | Classic small-town civic horizon | |
| Wine-country horizon | Surrounding Tualatin Valley vineyards | |

**Resolution:** **D-15** — Pacific University campus / Old College Hall as priority hint; downtown and wine-country as alternates. License + crops-well-to-1700×540 still beats subject preference.

---

## Headshot fallback policy

| Option | Description | Selected |
|--------|-------------|----------|
| Make D-16 a standing rule for 180–182 (recommended) | City site → Ballotpedia/Wikimedia → local-news/community-paper photos pre-authorized as documented last resort | ✓ (AFK default) |
| Keep it per-city | Re-decide each phase | |

**Resolution:** **D-16** — standing rule for 180–182 (tigardlife precedent from 178; adopted per-city in 179; now standing).

---

## Roster edge-case handling

| Option | Description | Selected |
|--------|-------------|----------|
| Carry 179 D-14 forward (recommended) | Non-voting/ex-officio seats excluded; vacancies documented, never placeholder-seeded | ✓ (AFK default) |
| Revisit per finding | Decide case-by-case at plan time | |

**Resolution:** **D-17** — non-voting/ex-officio excluded; vacancies documented not fabricated; recent appointees count if confirmed on the official city site.

---

## Claude's Discretion

- Council office title labeling (city-verbatim vs simplified) — planner picks after seeing the roster page.
- External_id block — Wave-0 probe picks an unused OR range.
- Next migration number — Wave-0 confirms on-disk MAX (expected 1178).
- Custom X00xx mtfcc + district_type — only if the ward branch fires.

## Deferred Ideas

- Sherwood (181), Cornelius (182), Forest Grove SD 15 board (184), 2026 elections + discovery (185) — already scoped as their own phases.
- Forest Grove appointed boards/commissions and city-manager staff — not elected officials.
