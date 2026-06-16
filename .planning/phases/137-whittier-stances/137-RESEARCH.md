# Phase 137: Whittier Stances - Research

**Researched:** 2026-06-16 · **Confidence:** HIGH

## Summary
Evidence-only stances for Whittier Mayor + 4 council. Whittier (~87k, eastern LA County; Quaker-founded, suburban, diverse/significant Latino). **Directly elected Mayor** (James Becerra, LOCAL_EXEC) — "Mayor Becerra", not rotational — plus 4 district council. More moderate/suburban profile (public-safety + neighborhood-character + economic development common). Wave 0: no excluded officials, 0 pre-existing, 44 active topics. Migrations **769–773**.

**Seed note:** DB district labels show some drift vs current reality (e.g., Dutra seeded as D1 but ran D4 in 2026; Macedo defeated Dutra in D4 in 2026; Martinez seeded D3 but reported as D2). All 5 seeded officials receive evidence-based stances per milestone scope; reasoning avoids asserting district numbers. District-label drift flagged for Phase 138 retrospective.

## Roster (Wave 0, 2026-06-16)
| ext_id | official | UUID | migration | stances |
|--------|----------|------|-----------|---------|
| -700400 | James Becerra (Mayor) | 46a247f2-fa5c-49fc-8fa5-af215e728672 | 769 | 3 |
| -700401 | Fernando Dutra | 99929a73-8c32-4921-8c12-f5a0f5d4847d | 770 | 4 |
| -700402 | Vicky Santana | db9870be-3e29-4d62-9e7c-8dafe61c2663 | 771 | 3 |
| -700403 | Octavio Cesar Martinez (Mayor Pro Tem) | 77fc9ed7-79ca-4f83-862c-fc35cf18203f | 772 | 3 |
| -700404 | Aida Susana Macedo | 06f7fe4a-b57c-4de3-824e-077498605e82 | 773 | 3 |

## Topic UUIDs used
public-safety-approach=e9ebefcd-c496-45e8-b816-a79f8442ba85 · growth-and-development=fb25c1ac-91cc-49bf-8afc-c7fa22ef45e4 · economic-development=eb3d1247-0de1-4b7f-baec-7259861efd53 · housing=669cac97-66a6-4087-b036-936fbe62efb3 · transportation-priorities=ba59337e-30e2-4aba-a39a-426b3366eb27 · local-environment=1935979c-b290-42e4-baa5-8cb0138b4ffa

## Per-official evidence
- **Becerra (Mayor):** strengthening public safety, "safer, more predictable streets" → public-safety-approach 4.0; "growth that strengthens neighborhoods instead of erasing them," development reflecting neighborhood character → growth-and-development 4.0; supporting small businesses + local economic growth → economic-development 2.0.
- **Dutra:** "highest priority to public safety," fighting crime → public-safety-approach 4.0; smart economic growth, businesses prosper + quality jobs → economic-development 2.0; Metro Board Chair (transit/infrastructure leadership) → transportation-priorities 2.0; "protecting and enhancing the environment" → local-environment 2.0.
- **Santana:** strong partnerships with law enforcement/first responders, oversaw $4B public-safety budgets → public-safety-approach 4.0; "responsible housing solutions that increase affordability while protecting neighborhood character" → housing 3.0; reduce red tape, encourage local entrepreneurship → economic-development 2.0.
- **Martinez (Mayor Pro Tem):** "public safety is his number one priority" → public-safety-approach 4.0; expanded affordable housing options → housing 2.0; investing in businesses, cutting red tape, Uptown redevelopment → economic-development 2.0.
- **Macedo:** "practical, lawful solutions that protect public safety while preserving quality of life," concern for constitutional rights → public-safety-approach 3.0; "growth should serve families/seniors/small businesses, not special interests; I am not a developer; priority will always be residents" → growth-and-development 4.0; storefront-revitalization grant program for small business → economic-development 2.0.

Hard rules: float values; `::text[]::text[]`; `BEGIN;..COMMIT;`; `$$..$$`; no-evidence=no-row; "Mayor Becerra" (directly elected); no offices/districts/chambers inserts.
