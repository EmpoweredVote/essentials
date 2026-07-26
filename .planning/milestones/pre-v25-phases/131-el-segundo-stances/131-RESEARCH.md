# Phase 131: El Segundo Stances - Research

**Researched:** 2026-06-16 · **Confidence:** HIGH

## Summary
Evidence-only compass stances for 5 El Segundo Council members. El Segundo (~17k) is a small, affluent South Bay beach city anchored by aerospace/tech (LA Air Force/Space Force base, Mattel, Chevron El Segundo refinery). **Rotational mayor** — all 5 are "Council Member" (LOCAL); no separate Mayor office (Alhambra pattern). The council is nonpartisan but consistently **business-friendly, fiscally conservative, and preservationist** (pro-economic-development + protect single-family character + strong police/fire funding). Wave 0 confirmed: rotational mayor, **no excluded officials**, 0 pre-existing stances, 44 active topics. On-disk migration counter authoritative → **migrations 734–738**.

## Roster (Wave 0, 2026-06-16)
| ext_id | member | UUID | migration |
|--------|--------|------|-----------|
| -700650 | Chris Pimentel (Mayor since 2024; tech exec, ex-Marine) | 1c77d036-8c9e-4831-9bba-40af2d043ed2 | 734 |
| -700651 | Ryan Baldino (Mayor Pro Tem; attorney, 14yr Planning Comm) | eb515636-52b5-4c48-8052-f60d5d2f4652 | 735 |
| -700652 | Drew Boyles (Mayor 2018–24; entrepreneur/CEO) | 4e485d3a-79a0-40ce-a52f-f84d187bf5de | 736 |
| -700653 | Lance Giroux (business exec, Dynasty Footwear) | 70dec2bf-c58c-4e3e-abbb-59a600d444d7 | 737 |
| -700654 | Michelle Keldorf (commercial real estate; LA LCV-endorsed) | 2616c881-04da-4ec4-975b-4f82235ccf21 | 738 |

## Hard rules
Float values; `ARRAY[...]::text[]::text[]`; `BEGIN;..COMMIT;`; `$$..$$`; no evidence = no row (blank spoke, never default 3.0); "Council Member X" (rotational mayor); no offices/districts/chambers inserts.

## Topic UUIDs (subset used)
economic-development=eb3d1247-0de1-4b7f-baec-7259861efd53 · growth-and-development=fb25c1ac-91cc-49bf-8afc-c7fa22ef45e4 · residential-zoning=d4f18138-a2e0-4110-b925-7387d9d0d16d · housing=669cac97-66a6-4087-b036-936fbe62efb3 · public-safety-approach=e9ebefcd-c496-45e8-b816-a79f8442ba85 · taxes=f7e5678d-dadd-4556-a2fc-446e24642ceb · local-environment=1935979c-b290-42e4-baa5-8cb0138b4ffa

## Per-member evidence
- **Pimentel:** "Responsible Growth, Safety & Service"; preserve El Segundo's character; leads city pro-business strategic plan → growth-and-development 4.0, public-safety-approach 4.0, economic-development 2.0.
- **Baldino:** "spend tax dollars wisely / balanced budget"; "highest level of safety and community services"; "grow responsibly while maintaining small-town appeal" → taxes 4.0, public-safety-approach 4.0, growth-and-development 4.0.
- **Boyles:** economic-development champion (courted hundreds of businesses, highest VC/sq mi); advocated regionally/statewide to protect single-family neighborhoods; responsible fiscal management; preserve small-town charm → economic-development 2.0, residential-zoning 4.0, growth-and-development 4.0, taxes 4.0.
- **Giroux:** backs adopted city priorities — attract/retain business + land use that "encourages growth while preserving quality of life and small-town character" → economic-development 2.0, growth-and-development 4.0.
- **Keldorf:** "health and safety top priority," resource Police/Fire chiefs; policies addressing state housing requirements while maintaining character; LA League of Conservation Voters endorsement (coastline/environment) → public-safety-approach 4.0, housing 3.0, local-environment 2.0.
