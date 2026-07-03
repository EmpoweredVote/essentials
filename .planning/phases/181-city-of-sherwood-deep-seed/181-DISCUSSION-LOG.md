# Phase 181: City of Sherwood Deep-Seed - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-03
**Phase:** 181-city-of-sherwood-deep-seed
**Areas discussed:** Banner subject hint, 180-REVIEW latent fixes, Pamplin Media workaround

> **AFK resolution:** The user did not respond to the gray-area selection prompt within the
> 60-second window. Per the Phase 180 precedent, all three areas were resolved with the
> recommended option, flagged in a note at the top of 181-CONTEXT.md, and the workflow stopped
> after commit (no auto-advance to plan-phase, per [[feedback_no_autostart_next_phase]]).

---

## Banner subject hint (Sherwood)

| Option | Description | Selected |
|--------|-------------|----------|
| Old Town Sherwood street view (recommended) | Historic Smockville main street / Cannery Square area; ground-level everyday scene per the 180 lesson; operator picks from Wikimedia Category:Sherwood, Oregon gallery | ✓ (AFK default) |
| Landmark subject | Rejected class — 180 operator rejected Old College Hall roofline crop | |
| Aerial view | Rejected class — 180 operator rejected the community aerial ("nobody sees their town from a plane") | |

**User's choice:** AFK — recommended option applied (D-14).
**Notes:** 180 lesson recorded in memory: street-level main-street scenes win; browse the Wikimedia city category and present ground-level candidates first. License + crop quality still beat subject preference.

---

## 180-REVIEW latent fixes adoption

| Option | Description | Selected |
|--------|-------------|----------|
| Lock all three (recommended) | WR-A note-text sync, WR-B pairwise (external_id, full_name) identity gate, WR-C empty-roster guard — fixed when cloning the 180 templates so 181–182 inherit | ✓ (AFK default) |
| Cherry-pick | Adopt a subset | |
| Defer to 182 | Leave templates as-is for 181 | |

**User's choice:** AFK — recommended option applied (D-15).
**Notes:** Mirrors 180's D-14 treatment of the 179-REVIEW fixes (WR-01/WR-02, already shipped in the 180 templates — clone from 180, not 179).

---

## Pamplin Media workaround

| Option | Description | Selected |
|--------|-------------|----------|
| Pre-authorize search-index extraction (recommended) | Sherwood Gazette is Pamplin Media; pamplinmedia.com fails TLS for all fetchers. Recover content via search-index extraction (180 workaround), cite original URLs, stay evidence-only | ✓ (AFK default) |
| Skip Pamplin sources entirely | Thinner evidence base for a small city | |
| Decide per-article at execution | Ambiguity for stance agents | |

**User's choice:** AFK — recommended option applied (D-16).
**Notes:** Same treatment extends to 403-on-direct-fetch sites (newsinthegrove-class). Never fabricate content the index doesn't actually show.

---

## Claude's Discretion

- Council office title labeling (city-verbatim vs plain; 180 used plain 'Mayor'/'Councilor').
- External_id block selection (Wave-0 probe; geo_id-derived analog -4167451..).
- Next migration number confirmation (on-disk counter authoritative; next = 1187).
- Custom X00xx mtfcc/district_type (only if the D-02 ward branch fires).

## Deferred Ideas

- Cornelius (182), Sherwood SD 88J board (184), 2026 elections + discovery (185) — already their own phases.
- Sherwood appointed boards/commissions and non-voting/ex-officio seats — out of scope (D-13).
