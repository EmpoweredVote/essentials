---
plan: 176-04
status: complete
completed: 2026-07-01
---

# 176-04 Summary — Beaverton Evidence-Only Compass Stances

7 audit-only stance migrations (1133–1139) authored from **one-agent-at-a-time** evidence research,
applied to production, and committed in `C:/EV-Accounts`. **91 total cited stances**, 0 uncited,
all values 1–5 (chairs model), no defaults, honest blank spokes. None registered in the ledger.

| ext_id | Official | Migration | Stances |
|--------|----------|-----------|---------|
| -4105351 | Lacey Beaty (Mayor) | 1133 | 12 |
| -4105352 | Ashley Hartmeier-Prigg (Pos 1) | 1134 | 17 |
| -4105353 | Kevin Teater (Pos 2) | 1135 | 12 |
| -4105354 | Edward Kimmi (Pos 3) | 1136 | 12 |
| -4105355 | Allison Tivnon (Pos 4) | 1137 | 11 |
| -4105356 | John Dugger (Pos 5) | 1138 | 15 |
| -4105357 | Nadia Hasan (Pos 6) | 1139 | 12 |

**Depth:** far exceeds the 18–21 target (91 across the roster). Every official has 11–17 cited stances.

**Genuine differentiation (not defaulted):** individual roll-call votes drove distinct values — e.g.
armed school-officers IGA (Jul 2023, 5-2): Teater/Hartmeier-Prigg/Hasan voted NO (public-safety=2),
Kimmi/Tivnon/Dugger voted YES (public-safety=3); camping-ban Ord. 4841 split housing values 2–4 across
the roster. Hartmeier-Prigg carries broader coverage (HD-27 state-House candidate) including
abortion/healthcare/school-vouchers; Dugger uniquely has campaign-finance + city-sanitation.

**Honest blanks:** federal-scope topics (tariffs, ukraine-support, social-security, etc.) omitted for
all officials — no evidence a city councilor acts on them. Per-official ambiguity calls documented in
each research pass (e.g. Hasan homelessness 3-vs-4, Beaty abortion omitted for lack of evidence).

**Method:** each research agent wrote a cited JSON; `_tmp-gen-beaverton-stance-migration.py` generated
properly-escaped SQL (topic_id via live `compass_topics.topic_key`+`is_live` JOIN, dual ON CONFLICT
into `politician_answers` + `politician_context`). JSON + generator are gitignored `_tmp-*` helpers.
