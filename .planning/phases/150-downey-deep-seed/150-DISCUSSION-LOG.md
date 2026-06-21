# Phase 150: Downey deep-seed - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-20
**Phase:** 150-downey-deep-seed
**Areas discussed:** Form of gov + mayor, Roster 6→5, Headshots/WAF, (confirm & write)

---

## Area selection

| Option | Description | Selected |
|--------|-------------|----------|
| Form of gov + mayor | Rotational mayor + stray LOCAL_EXEC row handling | ✓ |
| Roster 6→5 | 6 seeded for 5 seats; identify stale, unlink-not-delete | ✓ |
| Headshots/WAF | downeyca.org direct-first, operator fallback | ✓ |
| Just confirm & write | Apply locked precedent, write now | ✓ |

**User's choice:** All four — signaled they trust the locked 142–149 precedent and want the substantive
recommendations applied without long per-area deep-dives.

---

## Form of government + rotational mayor

| Option | Description | Selected |
|--------|-------------|----------|
| Palmdale pattern (rec) | 5 districts; rotational mayor = title on seat; collapse LOCAL_EXEC row; no Mayor office | |
| Keep LOCAL_EXEC Mayor | Preserve separate LOCAL_EXEC Mayor row (directly-elected model) | |
| Let research decide | Verify form against downeyca.org; apply Palmdale only if rotational confirmed | ✓ |

**User's choice:** Let research decide.
**Notes:** Evidence-first. CONTEXT D-02a records the default as the Palmdale rotational pattern, applied only
after the researcher confirms Downey's CVRA rotational structure against the official site. Keep a LOCAL_EXEC
Mayor row only if research positively finds a directly-elected mayor (very unlikely).

---

## Claude's Discretion

- Exact district→member mapping (research-determined).
- Rotational-mayor / `LOCAL_EXEC`-row resolution (research-confirmed; Palmdale default).
- Per-member stance chairs, dedupe mechanics, reconcile SQL ordering (follow 146/147/149 idempotent patterns).
- Roster reconcile (6→5) and headshot sourcing follow locked precedent (unlink-not-delete; direct-first/operator fallback).

## Deferred Ideas

- Downey Unified school district (gov `32e2fad0`) deep-seed — separate government, out of scope.
- Downey split-section check post-reconcile (expect 0 rows).
- Phase 157 Wave-2 close-out consumes Downey's final per-city counts.
