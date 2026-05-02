# Phase 16: Discovery Jurisdiction Setup - Context

**Gathered:** 2026-05-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Register all 23 confirmed-incorporated Collin County cities in `essentials.discovery_jurisdictions` so the weekly cron automatically discovers candidates from collincountyvotes.gov. Copeville excluded (possibly unincorporated CDP). This phase creates configuration rows only — no UI changes, no pipeline code changes.

</domain>

<decisions>
## Implementation Decisions

### Source URL strategy
- Each city gets its own **per-city scoped URL** on collincountyvotes.gov (not a single shared county page)
- Researcher determines the URL pattern — filing list, upcoming races page, or election results page — whichever is most useful for candidate discovery
- City's official website is a **secondary source**: included in `allowed_domains` for citations; researcher determines if it should also be a secondary `source_url`
- `source_url` is set now even for cities with no active races — cron runs will simply find zero candidates until a filing period opens

### Allowed domains
- **Strict config, identical for all tiers:** `{collincountyvotes.gov, co.collin.tx.us, <city-official-domain>}`
- No news sites, no TX SOS, no third-party sources
- City domains sourced from bio URLs already in the DB (set during Phases 13-15) — consistent with seeded data
- Collin County government domain (`co.collin.tx.us`) included alongside the votes subdomain

### Election date targeting
- Initial rows target **May 3, 2026** (the upcoming TX uniform election, 2 days away)
- After May 3 results are certified, a follow-up discovery run captures newly elected incumbents via the same pipeline (normal cron operation)
- Researcher verifies the next election date for **each city individually** — do not assume all 24 follow the TX uniform schedule
- Any cities with confirmed off-cycle election dates are noted explicitly

### City count
- **23 cities** — Copeville excluded
- If Copeville is later confirmed as an incorporated municipality, the correct sequence is: full retroactive backfill (government → chambers → offices → politicians, Phase 12-15 style) first, then add the discovery row

### Claude's Discretion
- Exact URL pattern for collincountyvotes.gov per-city filtering (researcher finds this)
- Whether to include city's official site as a second `source_url` or only in `allowed_domains`
- Migration number and SQL structure (verify next available with `ls /c/EV-Accounts/backend/migrations/ | sort | tail -5`)

</decisions>

<specifics>
## Specific Ideas

- Discovery rows should be valid starting points even before filing periods open — set source_url to the best available URL now; the agent finds nothing until filings appear
- Post-May 3: re-run discovery against the same rows once results are certified to pick up newly elected incumbents as staged candidates

</specifics>

<deferred>
## Deferred Ideas

- Copeville full backfill (government + offices + politicians + discovery row) — trigger only if confirmed incorporated
- Post-election May 3 winner updates for Allen/Frisco/Murphy/Celina seats — separate data task, not part of Phase 16

</deferred>

---

*Phase: 16-discovery-jurisdiction-setup*
*Context gathered: 2026-05-01*
