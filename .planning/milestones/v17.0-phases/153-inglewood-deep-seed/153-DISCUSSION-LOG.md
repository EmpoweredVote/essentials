# Phase 153: Inglewood deep-seed — Discussion Log

**Date:** 2026-06-21
**Mode:** discuss (standard)

## Pre-discussion: live DB pre-check (orchestrator)
Surfaced the Inglewood-specific complications that grounded the gray areas: dual 'City Council' chambers
(`a25a6dea` survivor / `8b99bcf0` doomed), a duplicate Eloy Morales across both chambers, a directly-elected
LOCAL_EXEC Mayor (Butts), At-Large labels on a by-district city, suspected-departed George Dotson, and a Faulk
duplicate-image row.

## Gray areas presented → user selected ALL four
1. Eloy Morales duplicate
2. Form of government
3. Roster currency
4. Headshot dedup + gaps

## Decision: "Approve as proposed" (single consolidated confirmation)
The deep-seed pattern is locked by phases 142–152, so the discussion focused on Inglewood-specific mechanics.
Operator approved the proposed approach verbatim:

- **Eloy Morales dedup** — research confirms same person → keep bidirectional `666263`, migrate `-201081` headshot
  to it, unlink-not-delete `-201081`. If genuinely two people → keep both. (→ CONTEXT D-01b)
- **Form of government** — defer to research vs cityofinglewood.org; relabel At-Large→D1–4 if confirmed; keep
  Butts as directly-elected LOCAL_EXEC Mayor (El Monte model, not rotational); no guessed default. (→ D-02)
- **Roster currency** — research-verify current D1–4 + Mayor; unlink-not-delete departed (Dotson suspected);
  official_count=4 (Mayor excluded). (→ D-03)
- **Headshots** — dedup Faulk 2→1; verify-and-fix; fill 0-image gaps from cityofinglewood.org (check WAF);
  honest gaps; wrong-person guard. (→ D-04)

End-state council = Mayor (LOCAL_EXEC) + District 1–4 = 5 offices. Next migration = 1018.

## Deferred
- Inglewood Unified School District (out of scope), split-section check (expect 0), browse school-district-sliver
  follow-up, Phase 157 close-out.

## Claude's discretion
- Reconcile SQL ordering, shared-district split mechanics, per-member stance chairs, headshot pass/re-crop calls.
