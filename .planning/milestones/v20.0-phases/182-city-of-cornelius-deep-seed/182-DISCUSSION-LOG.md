# Phase 182: City of Cornelius Deep-Seed - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-03
**Phase:** 182-city-of-cornelius-deep-seed
**Areas discussed:** Banner subject hint, Spanish-language sources, Deploy & template hygiene

---

## Area Selection

A single multi-select question offered the three Cornelius-specific gray areas (all other
decisions carried forward from the 176–181 chain and were not re-asked). **The user was AFK
(no response after 60s)** — following the Phase 181 precedent, all three areas were selected
and resolved with the recommended option. Each is flagged in the CONTEXT.md header note and
can be amended before planning.

| Option | Description | Selected |
|--------|-------------|----------|
| Banner subject hint | Cornelius-specific priority for the community banner (Adair/Baseline main-street couplet recommended; sparse Wikimedia gallery expected). Analog of Sherwood's D-14. | ✓ (AFK default) |
| Spanish-language sources | Whether Spanish-only articles/city communications count as stance evidence and photo sources — first bilingual-majority city of the chain. Recommend: yes, cite original + English summary. | ✓ (AFK default) |
| Deploy & template hygiene | Lock the 181 Render bundle-content-grep deploy lesson into the surfacing plan; optionally adopt IN-01 chamber-lookup CTE hoist in the structural migration. | ✓ (AFK default) |

---

## Banner subject hint

**Resolved (recommended default):** Priority hint = the **Adair/Baseline main-street couplet
street scene** (OR-8/TV Highway couplet through downtown); alternate = **Cornelius Place /
Cornelius Public Library** civic landmark. Wave-0 browses Wikimedia Category:Cornelius, Oregon
and presents street-level candidates to the operator first. Standing failure-mode rules apply
(no single-roof crops, no aerials, no AI images). → CONTEXT.md D-14.

**Alternatives considered:** letting Wave-0 present the gallery with no subject hint (rejected —
every prior city benefited from a priority hint); a landmark-first hint (rejected — landmark
searches decay into single-building crops, the documented failure mode).

## Spanish-language sources

**Resolved (recommended default):** Spanish-language sources are **admitted** as stance evidence
and photo sources under the same triple-gate rigor — cite the original Spanish URL, write
reasoning in English faithfully summarizing the source; no machine-translation fabrication.
→ CONTEXT.md D-15.

**Alternatives considered:** English-only evidence (rejected — would systematically blank
stances for officials in Oregon's most heavily Latino city, contradicting the evidence-only
ethos); translation-required-in-sources-field (rejected — sources field cites URLs, reasoning
already carries the English summary).

## Deploy & template hygiene

**Resolved (recommended default):** (1) Render deploy verification by bundle CONTENT grep,
never hash comparison (181's 45-min false-wait lesson) — directive in the surfacing plan.
(2) Adopt 181-REVIEW IN-01: hoist the repeated chamber-lookup subquery into a single CTE in
the structural migration clone. (3) Check `git -C C:/EV-Accounts status` staged state before
any commit there. → CONTEXT.md D-16.

**Alternatives considered:** verbatim clone without the CTE hoist (rejected — IN-01 is a
zero-risk readability fix and 182 is the last city clone of the chain); skipping the deploy
directive as "already learned" (rejected — lessons not written into plans get re-learned).

---

## Claude's Discretion

- Council office title labeling (city-verbatim vs plain; 180/181 used plain).
- External_id block (Wave-0 probe picks; natural analog -4115351.. subject to verified geo_id).
- Next migration number (memory says 1196; Wave-0 confirms on-disk MAX).
- Custom X00xx mtfcc + district_type (only if the D-02 ward branch fires).

## Deferred Ideas

- School boards (183–184), 2026 elections + discovery (185), milestone close (186) — own phases.
- Cornelius appointed boards/commissions and non-voting/ex-officio seats — out of scope (D-13).
