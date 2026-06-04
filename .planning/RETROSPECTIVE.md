# Retrospective

## Milestone: v10.0 — Multnomah County & School Boards

**Shipped:** 2026-06-04
**Phases:** 7 (83-89) | **Plans:** 22

### What Was Built

- Multnomah County Board of Commissioners government body + routing fix for unincorporated addresses
- 5 smaller Multnomah cities (Gresham/Troutdale/Fairview/Wood Village/Maywood Park) with officials + headshots
- 18 Multnomah 2026 race rows + discovery pipeline armed
- 6 OR school district G5420 geofences + 38 board members (PPS/Parkrose/Reynolds/Centennial/David Douglas/Riverdale)
- 6 CA city school boards (34 officials); 5 TX Collin County ISDs (35 board members); IN + ME school boards (37 ME officials)
- groupHierarchy.js: mayor-first + seat-label sort + chamber_name fallback (Rule 3.5) fixes
- ENCLAVE_CITY_ALIASES deployed for Maywood Park routing

### What Worked

- TIGER UNSD G5420 pattern: established once in Phase 86 (OR), reused cleanly for CA/TX/IN/ME — 4 state loaders, minimal rework
- Gap-closure discipline: Phase 87-88 UAT failures caught real bugs (groupHierarchy.js sort, SFUSD missing images, Allen Mayor stale data); fixes shipped atomically before close
- Audit-then-merge headshot workflow: Python PIL upload scripts + audit-only migrations = reproducible, traceable uploads

### What Was Inefficient

- Phase 87 and 88 each needed 3 gap-closure plans after initial UAT — school board title/sort conventions vary per district and can't be assumed
- Phase 89 headshots were a dead end: 0/40 uploaded due to CMS blocking. Browser automation (Playwright) should be scoped as a dedicated tool before attempting school board headshots at scale
- SFUSD politician_images gap: 4 rows missing was a seed bug caught only in UAT; pre-flight assertion on images count would have caught this earlier

### Patterns Established

- G5420 TIGER UNSD school board pattern: zip per state → filter GEOIDs → G5420 boundaries → district_type='SCHOOL' → chamber + officials
- Always verify office title from official district website — SFUSD uses 'Commissioner', BUSD uses 'Director', most use 'Board Member'
- groupHierarchy.js Rule 3.5: chamber_name fallback required for school board cards (no qualifyLocalTitle match)
- Richardson ISD hybrid: Districts 1-5 + At-Large Places 6-7 — 'Place N' in office_title needs explicit sort regex

### Key Lessons

- Assume 0 school board headshots when district uses Schoolblocks/Thrillshare/SmartSites/Cloudflare — plan browser automation or manual download before scoping headshot work
- ENCLAVE_CITY_ALIASES requires backend redeploy — coordinate geofence load + env var + deploy as a single unit to avoid routing gaps in production
- Run section-split detector after every school board seed (5 school districts across 4 states — district_type mismatch is easy to introduce)

### Cost Observations

- Agents: stance research pattern not used in v10.0 (data-seeding milestone)
- Sessions: ~5 work sessions across 4 days
- Notable: groupHierarchy.js gap closures consumed more sessions than expected — UI rendering bugs in school board context require app testing, not just SQL smoke tests
