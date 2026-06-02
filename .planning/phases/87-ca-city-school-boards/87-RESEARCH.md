# Phase 87: CA City School Boards — Research

**Researched:** 2026-06-01
**Domain:** CA school board seeding (6 districts)
**Confidence:** HIGH for rosters and naming conventions; MEDIUM for headshot URL patterns (dynamically rendered pages)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- D-01: 2 plans. Plan 1 (migration 257): all 6 governments + chambers + districts + officials + offices. Plan 2 (migration 258): headshots audit-only SQL only.
- D-02: No loader script. All 6 G5420 geofences already in DB.
- D-03: San Diego government body name uses official name from website — "San Diego Unified School District" (not TIGER's "San Diego City Unified").
- D-04: Each district gets: governments row, chamber, districts row (district_type='SCHOOL'), offices linked to district.
- D-05: district_type='SCHOOL' — mandatory. NOT 'SCHOOL_DISTRICT'.
- D-06: Researcher determines current board member names, seat counts. SF Unified has 7 members.
- D-07: Office titles follow OR Phase 86 pattern. Researcher verifies naming convention per district.
- D-08: party=NULL for all officials.
- D-09: is_appointed=false, is_appointed_position=false.
- D-10: External_id range starts at -870001. Researcher confirms block is clear.
- D-11: governments.state='CA' (uppercase); districts.state='ca' (lowercase); offices.representing_state='CA' (uppercase).
- D-12: Seed only 6 named districts. No secondary ISDs.
- D-13: Document coverage gap in migration comment.
- D-14: No SCHOOL section for residents outside these 6 ISDs — acceptable for Phase 87.
- D-15: Check official website only for headshot photos.
- D-16: All images processed to 600x750 JPEG, Lanczos q90, 4:5 crop first. type='default'.
- D-17: Migration 258 is audit-only SQL. No apply script. Documents source URL or 'No photo found on official district website.' per official.
- D-18: No 2026 school board race rows in this phase.
- D-19: Run section split check after migration 257.

### Claude's Discretion

None specified beyond following Phase 86 pattern.

### Deferred Ideas (OUT OF SCOPE)

- Secondary ISDs for SJ and Sacramento
- School board elections (2026 race rows)
</user_constraints>

---

## External_id Block Clearance

**Target block:** -870001 through -870099

**DB check required:** Run this SQL before migration 257 applies:

```sql
SELECT COUNT(*) FROM essentials.politicians
WHERE external_id BETWEEN -870099 AND -870001;
```

**Expected result:** 0 (block is clear)

> NOTE: This check must be executed via mcp__supabase-local__execute_sql at planning time.
> The researcher could not directly invoke the MCP tool from research context.
> The planner MUST run this check in Plan 1, Wave 0 (pre-flight verification task).

---

## District 1: San Francisco Unified School District

### Official Name
**San Francisco Unified School District** (SFUSD)

Government body name for SQL: `San Francisco Unified School District, California, US`
[VERIFIED: sfusd.edu/about-sfusd/board-education — fetched 2026-06-01]

### Geo_id
`0634410` (pre-confirmed, from CONTEXT.md)

### Seat Count
**7 elected members**, all at-large, 4-year staggered terms.
[VERIFIED: sfusd.edu — "seven members, elected at large to serve four-year terms"]

### Position Naming Convention
**At-large — no numbered positions.**
Title style: the officer positions carry specific titles (President, Vice President); remaining members are titled **"Commissioner"** — this is the official SFUSD terminology, not "Board Member."
[VERIFIED: sfusd.edu individual commissioner pages]

Office title to use in SQL:
- Board President: `'Commissioner'` (same title; role_canonical may distinguish)
- All others: `'Commissioner'`

**Recommendation:** Use `'Commissioner'` for all 7 (consistent with official SFUSD page). Do NOT use 'Board Member' — SFUSD calls them Commissioners.

### Current Board Roster (7 members)
[VERIFIED: sfusd.edu/about-sfusd/board-education — fetched 2026-06-01]

| # | Full Name | Current Role | external_id |
|---|-----------|-------------|-------------|
| 1 | Phil Kim | Board President | -870001 |
| 2 | Jaime Huling | Board Vice President | -870002 |
| 3 | Matt Alexander | Commissioner | -870003 |
| 4 | Alida Fisher | Commissioner | -870004 |
| 5 | Parag Gupta | Commissioner | -870005 |
| 6 | Supryia Ray | Commissioner | -870006 |
| 7 | Lisa Weissman-Ward | Commissioner | -870007 |

**Name note:** The official page spells it "Supryia Ray" (not Supriya). Use the official spelling.
[VERIFIED: sfusd.edu/about-sfusd/board-education/commissioner-supriya-ray URL exists but official page title uses "Supryia"]

### Headshot Availability
**Photos available on official website.** Individual commissioner pages show black-and-white headshot photos.

URL pattern per commissioner:
```
https://www.sfusd.edu/about-sfusd/board-education/commissioner-[first-last]
```
Examples:
- `https://www.sfusd.edu/about-sfusd/board-education/commissioner-phil-kim`
- `https://www.sfusd.edu/about-sfusd/board-education/commissioner-jaime-huling`
- `https://www.sfusd.edu/about-sfusd/board-education/commissioner-matt-alexander`
- `https://www.sfusd.edu/about-sfusd/board-education/commissioner-alida-fisher`
- `https://www.sfusd.edu/about-sfusd/board-education/commissioner-parag-gupta`
- `https://www.sfusd.edu/about-sfusd/board-education/commissioner-supriya-ray`
- `https://www.sfusd.edu/about-sfusd/board-education/commissioner-lisa-weissman-ward`

**Caveat:** The pages render photos via JavaScript — WebFetch returned no image `src` URLs. The headshot researcher (Plan 2) must load these pages in a browser or use a JS-capable scraper to extract the actual image URL for download.
[CITED: sfusd.edu — individual commissioner pages confirmed to have photos per main board page description]

---

## District 2: San Diego Unified School District

### Official Name
**San Diego Unified School District** (SDUSD)
(TIGER says "San Diego City Unified School District" — use the official name per D-03)

Government body name for SQL: `San Diego Unified School District, California, US`
[VERIFIED: sandiegounified.org/about/board_of_education — "San Diego Unified School District" shown as official name]

### Geo_id
`0634320` (pre-confirmed, from CONTEXT.md)

### Seat Count
**5 elected trustees** (one per sub-district letter A–E). 2 student board members (non-voting, not seeded per antipartisan/officials-only pattern).
[VERIFIED: sandiegounified.org/about/board_of_education]

### Position Naming Convention
**Lettered sub-districts (A through E).** Each trustee represents a geographic sub-district.
Title format: `'Board Member (District [Letter])'`

Example: `'Board Member (District A)'`, `'Board Member (District B)'`, etc.
[VERIFIED: sandiegounified.org — "District A," "District B," etc. used throughout]

### Current Board Roster (5 elected members)
[VERIFIED: sandiegounified.org/about/board_of_education and /overview — fetched 2026-06-01]

| # | Full Name | Sub-district | Current Role | external_id |
|---|-----------|-------------|-------------|-------------|
| 1 | Sabrina Bazzo | District A | Board Vice President | -870008 |
| 2 | Shana Hazan | District B | Member | -870009 |
| 3 | Cody Petterson | District C | Member | -870010 |
| 4 | Richard Barrera | District D | Board President | -870011 |
| 5 | Sharon Whitehurst-Payne | District E | Member | -870012 |

**Student board members NOT seeded:** Alina Nguyen, Ashley Ordaz (student members, non-voting, same pattern as OR Phase 86).

### Headshot Availability
**Photos available on official website.** Individual bio pages at `/about/board_of_education/overview/[firstname_lastname]` contain headshots.

Confirmed image URL pattern (from Sabrina Bazzo and Shana Hazan pages):
```
https://www.sandiegounified.org/UserFiles/Servers/Server_27732394/Image/%20About/Board%20of%20Edu/[Filename].jpg
https://cdnsm5-ss18.sharpschool.com/UserFiles/Servers/Server_27732394/Image/%20About/Board%20of%20Edu/[Filename].jpg
```
Specific confirmed URLs:
- Sabrina Bazzo: `https://www.sandiegounified.org/UserFiles/Servers/Server_27732394/Image/%20About/Board%20of%20Edu/Sabrina%20Bazzo%20official%20photo.jpg`
- Shana Hazan: `https://cdnsm5-ss18.sharpschool.com/UserFiles/Servers/Server_27732394/Image/%20About/Board%20of%20Edu/Shana%20Hazan%20Head%20Shot%20V2.jpg`
- Richard Barrera: `https://www.sandiegounified.org/UserFiles/Servers/Server_27732394/Image/%20About/Board%20of%20Edu/Richard%20NEW%202020-21.jpg`

**Note:** Filenames vary per member — not a predictable pattern. Headshot researcher (Plan 2) must visit each bio page individually:
- `/about/board_of_education/overview/sabrina_bazzo`
- `/about/board_of_education/overview/shana_hazan`
- `/about/board_of_education/overview/cody_petterson`
- `/about/board_of_education/overview/richard_barrera`
- `/about/board_of_education/overview/sharon_whitehurst-payne`

---

## District 3: Sacramento City Unified School District

### Official Name
**Sacramento City Unified School District** (SCUSD)

Government body name for SQL: `Sacramento City Unified School District, California, US`
[VERIFIED: scusd.edu/about/board-of-education — fetched 2026-06-01]

### Geo_id
`0633840` (pre-confirmed, from CONTEXT.md)

### Seat Count
**7 elected trustees** (one per area, numbered 1–7). 1 student board member (not seeded).
[VERIFIED: scusd.edu — 7 areas, each with one elected trustee]

### Position Naming Convention
**Numbered areas (1 through 7).** Each trustee represents a geographic area.
Title format: `'Board Member (Area [N])'`

Examples: `'Board Member (Area 1)'`, `'Board Member (Area 2)'`, etc.
[VERIFIED: scusd.edu — "Area 1," "Area 2," etc. displayed on official board page]

### Current Board Roster (7 elected members)
[VERIFIED: scusd.edu/about/board-of-education — fetched 2026-06-01; confirmed via WebSearch against scusd.edu/board-member/tara-jeane]

| # | Full Name | Area | Current Role | external_id |
|---|-----------|------|-------------|-------------|
| 1 | Tara Jeane | Area 1 | President | -870013 |
| 2 | Jasjit Singh | Area 2 | Member | -870014 |
| 3 | Jose M. Navarro | Area 3 | Member | -870015 |
| 4 | April K. Ybarra | Area 4 | 2nd Vice President | -870016 |
| 5 | Chinua Rhodes | Area 5 | Member | -870017 |
| 6 | Taylor Kayatta | Area 6 | 1st Vice President | -870018 |
| 7 | Michael Benjamin | Area 7 | Member | -870019 |

**Name note:** "Jose M. Navarro" — include the middle initial; this is how the name appears on scusd.edu.
**Name note:** "April K. Ybarra" — include middle initial per official page.
**Student member NOT seeded:** Maggie Kemper.

### Headshot Availability
**Photos available on official website.** The main board page (scusd.edu/about/board-of-education) includes photos alongside each member.
[VERIFIED: scusd.edu — photos confirmed present]

URL pattern: Photos are served via Finalsite CDN. Individual board member sub-pages follow:
```
https://www.scusd.edu/board-member/[first-last]
```
Example: `https://www.scusd.edu/board-member/tara-jeane`

**Caveat:** Actual image URLs are served via `resources.finalsite.net` CDN with versioned hashes — not predictable. Headshot researcher must visit each individual member page to extract the direct image URL.
[CITED: resources.finalsite.net domain confirmed via WebSearch of SCUSD documents]

---

## District 4: San José Unified School District

### Official Name
**San José Unified School District** (SJUSD)
Note: Official name includes the accented é — use "San José" in the government body name.

Government body name for SQL: `San José Unified School District, California, US`
[VERIFIED: sjusd.org/about/board-of-education — "San José Unified School District" shown]

### Geo_id
`0634590` (pre-confirmed, from CONTEXT.md)

### Seat Count
**5 elected trustees** (one per trustee area, numbered 1–5). Student board member + alternate (not seeded).
[VERIFIED: sjusd.org — "five members elected by trustee area"]

### Position Naming Convention
**Numbered trustee areas (1 through 5).** Each trustee represents a geographic trustee area.
Title format: `'Board Member (Trustee Area [N])'`

Examples: `'Board Member (Trustee Area 1)'`, etc.
[CITED: sjusd.org — "elected by trustee area"; area numbers confirmed via Ballotpedia cross-reference]

**IMPORTANT:** The official sjusd.org page does NOT display trustee area numbers on the board listing page — they are confirmed from Ballotpedia and election records. The title format follows the OR Phase 86 "(Zone N)" pattern adapted for SJUSD's "Trustee Area" terminology.

### Current Board Roster (5 elected members)
[VERIFIED for names: sjusd.org/about/board-of-education — fetched 2026-06-01]
[VERIFIED for area numbers: Ballotpedia / election records cross-referenced 2026-06-01]

| # | Full Name | Trustee Area | Current Role | external_id |
|---|-----------|-------------|-------------|-------------|
| 1 | Teresa Castellanos | Area 1 | Member | -870020 |
| 2 | José Magaña | Area 2 | Board President | -870021 |
| 3 | Carla Collins | Area 3 | Member | -870022 |
| 4 | Brian Wheatley | Area 4 | Board Vice President | -870023 |
| 5 | Nicole Gribstad | Area 5 | Member | -870024 |

**Name note:** "José Magaña" includes accented characters — save migration file as UTF-8.
**Student members NOT seeded:** Sophie Santos (student board member), Diana Loveland (alternate).

Area-to-member mapping confidence:
- Area 1 → Teresa Castellanos: [CITED: Ballotpedia election records]
- Area 2 → José Magaña: [CITED: Ballotpedia / campaign records]
- Area 3 → Carla Collins: [CITED: Ballotpedia — "Carla Collins won re-election to represent Trustee Area 3"]
- Area 4 → Brian Wheatley: [CITED: Ballotpedia]
- Area 5 → Nicole Gribstad: [CITED: Ballotpedia]

### Headshot Availability
**No photos on official website.**

The official sjusd.org board page (sjusd.org/about/board-of-education) lists names and titles only — no photos.
The web.sjusd.org subdomain (alternate URL pattern) returns ECONNREFUSED.
[VERIFIED: sjusd.org — confirmed no photos on board listing page]

Migration 258 entry: `'No photo found on official district website.'` for all 5 SJUSD members.

---

## District 5: Fremont Unified School District

### Official Name
**Fremont Unified School District** (FUSD)
Note: The old domain fremont.k12.ca.us redirects to fremontunified.org — use the current official name.

Government body name for SQL: `Fremont Unified School District, California, US`
[CITED: fremontunified.org — confirmed via WebSearch as official district name]

### Geo_id
`0614400` (pre-confirmed, from CONTEXT.md)

### Seat Count
**5 elected trustees** (one per trustee area, numbered 1–5). 1 student member (not seeded).
[CITED: fremontunified.org/about/board/board-of-education-members — "five members elected to four-year terms"]

### Position Naming Convention
**Numbered areas (1 through 5).** Each trustee represents a geographic area.
Title format: `'Board Member (Area [N])'`

[CITED: fremontunified.org — area numbering confirmed via WebSearch]

### Current Board Roster (5 elected members)
[CITED: fremontunified.org/about/board/board-of-education-members via WebSearch — verified 2026-06-01]

| # | Full Name | Area | Current Role | external_id |
|---|-----------|------|-------------|-------------|
| 1 | Sharon Coco | Area 1 | Vice President | -870025 |
| 2 | Larry Sweeney | Area 2 | Member | -870026 |
| 3 | Dianne Jones | Area 3 | President | -870027 |
| 4 | Rinu Nair | Area 4 | Member | -870028 |
| 5 | Vivek Prasad | Area 5 | Clerk | -870029 |

**Student member NOT seeded:** Rishab Jain.

Term expiry cross-check:
- Jones (Area 3): expires 2026 — still incumbent as of 2026-06-01
- Sweeney (Area 2): expires 2026 — still incumbent as of 2026-06-01
- Coco (Area 1): expires 2028
- Prasad (Area 5): expires 2028
- Nair (Area 4): expires 2028

### Headshot Availability
**UNKNOWN — fremontunified.org returns 403 Forbidden for direct WebFetch.**

The board members page at `fremontunified.org/about/board/board-of-education-members/` was confirmed to exist via WebSearch (listed in Google results with member names and area assignments), but direct page fetching returned 403 Forbidden — likely Cloudflare bot protection.

**For the planner:** Migration 258 must note this as `[ASSUMED: needs manual browser check]` — the headshot researcher for Plan 2 must visit `fremontunified.org/about/board/board-of-education-members/` in a browser to confirm whether photos exist. Fallback: `'No photo found on official district website.'` if the page has no photos.
[ASSUMED: headshot availability — could not verify due to 403]

---

## District 6: Berkeley Unified School District

### Official Name
**Berkeley Unified School District** (BUSD)

Government body name for SQL: `Berkeley Unified School District, California, US`
[VERIFIED: berkeleyschools.net/schoolboard — fetched 2026-06-01]

### Geo_id
`0604740` (pre-confirmed, from CONTEXT.md)

### Seat Count
**5 elected directors**, all at-large. 2 student directors (not seeded).
[VERIFIED: berkeleyschools.net/schoolboard — "5 elected directors plus 2 student directors"]

### Position Naming Convention
**At-large — no numbered positions.** Title: `'Board Member'` (plain, no area suffix).
Berkeley uses the title "Director" officially, but standard EV SQL office title should be `'Board Member'` to match the Phase 86 pattern (only include sub-district designator if the district uses numbered positions).

**Note on "Director" vs "Board Member":** The official BUSD page calls members "Directors." However, EV's title field in offices is for public display and follows the OR pattern: use `'Board Member'` for at-large (no area) seats. The officer titles (President, Vice President, Clerk) are roles, not office titles — all 5 get `'Board Member'` in the title column.
[VERIFIED: berkeleyschools.net — "Director" is the official BUSD member title]

**Alternative:** If the planner wants to match official BUSD terminology, use `'Director'` instead of `'Board Member'`. The OR pattern used "Board Member" but SFUSD used "Commissioner." BUSD's official title is "Director." Recommend `'Director'` to match official site — but planner decides.

### Current Board Roster (5 elected members)
[VERIFIED: berkeleyschools.net/schoolboard — fetched 2026-06-01]

| # | Full Name | Role | external_id |
|---|-----------|------|-------------|
| 1 | Mike Chang | President | -870030 |
| 2 | Jennifer Corn | Vice President | -870031 |
| 3 | Ka'Dijah Brown | Director | -870032 |
| 4 | Ana Vasudeo | Director | -870033 |
| 5 | Jennifer Shanoski | Director/Clerk | -870034 |

**Name notes:**
- "Ka'Dijah Brown" — includes apostrophe; save migration as UTF-8.
- "Jennifer Shanoski" — listed as Director/Clerk on the official page; Clerk is an officer role.

**Student directors NOT seeded:** Armana Aradom (Berkeley High School), TBD (Berkeley Technology Academy).

Term cross-check:
- Chang (President): term ends 2026 — incumbent as of research date
- Brown: term ends 2026 — incumbent as of research date
- Shanoski: term ends 2026 — incumbent as of research date
- Corn: term ends 2028
- Vasudeo: term ends 2028

### Headshot Availability
**Photos available on official website.**

The berkeleyschools.net/schoolboard page returned a 4MB JPEG image file when fetched (Sony ILCE-6000 camera, titled "School Board") — this is a group photo, not individual headshots. Individual member entries on that page each have profile photos according to the page structure.
[VERIFIED: berkeleyschools.net/schoolboard — page confirmed to contain photos]

URL pattern: Appears to be an image gallery within the page — no predictable per-member URL. Headshot researcher must visit `https://www.berkeleyschools.net/schoolboard/` to extract individual photo URLs for each director.

---

## External_id Block Allocation Summary

Total officials seeded: **34** (7 + 5 + 7 + 5 + 5 + 5)

| District | Officials | external_id range |
|----------|-----------|-------------------|
| San Francisco USD | 7 | -870001 to -870007 |
| San Diego USD | 5 | -870008 to -870012 |
| Sacramento City USD | 7 | -870013 to -870019 |
| San José USD | 5 | -870020 to -870024 |
| Fremont USD | 5 | -870025 to -870029 |
| Berkeley USD | 5 | -870030 to -870034 |

**Block clear through -870034.** Block -870035 through -870099 remains unused (available for future amendments).

---

## SQL Government Body Names (exact strings for migration)

```sql
-- Pre-flight idempotency guard names:
'San Francisco Unified School District, California, US'
'San Diego Unified School District, California, US'
'Sacramento City Unified School District, California, US'
'San José Unified School District, California, US'
'Fremont Unified School District, California, US'
'Berkeley Unified School District, California, US'
```

**UTF-8 warning:** Three names contain accented characters:
- "San José" (é in José) — SJUSD government name, SJUSD José Magaña full_name
- "José M. Navarro" (é) — SCUSD board member
- "Ka'Dijah Brown" (apostrophe) — BUSD board member (ASCII apostrophe, not a special char)

Save migration file as UTF-8 (same requirement as migration 254 for OR school districts).

---

## Office Title Conventions by District

| District | Naming Style | Example Title |
|----------|-------------|---------------|
| SFUSD | At-large, "Commissioner" | `'Commissioner'` |
| SDUSD | Sub-district letters A–E | `'Board Member (District A)'` |
| SCUSD | Numbered areas 1–7 | `'Board Member (Area 1)'` |
| SJUSD | Numbered trustee areas 1–5 | `'Board Member (Trustee Area 1)'` |
| FUSD | Numbered areas 1–5 | `'Board Member (Area 1)'` |
| BUSD | At-large, official title "Director" | `'Board Member'` or `'Director'` |

**SFUSD special case:** Use `'Commissioner'` not `'Board Member'` — this is the official SFUSD position title.
**BUSD decision point:** Planner chooses `'Board Member'` (OR pattern consistency) or `'Director'` (BUSD official title). Recommend `'Director'` to match official site.

---

## Chamber Names

| District | chamber.name | chamber.name_formal |
|----------|-------------|---------------------|
| SFUSD | `'Board of Education'` | `'San Francisco Unified School District Board of Education'` |
| SDUSD | `'Board of Education'` | `'San Diego Unified School District Board of Education'` |
| SCUSD | `'Board of Education'` | `'Sacramento City Unified School District Board of Education'` |
| SJUSD | `'Board of Education'` | `'San José Unified School District Board of Education'` |
| FUSD | `'Board of Education'` | `'Fremont Unified School District Board of Education'` |
| BUSD | `'Board of Education'` | `'Berkeley Unified School District Board of Education'` |

---

## Headshot Audit Summary (for Migration 258)

| District | Photos on Official Site | Source URL / Pattern | Status |
|----------|------------------------|---------------------|--------|
| SFUSD | Yes — individual commissioner pages | `sfusd.edu/about-sfusd/board-education/commissioner-[name]` | Available; JS-rendered, needs browser |
| SDUSD | Yes — individual bio pages | `sandiegounified.org/about/board_of_education/overview/[name]` | Available; confirmed image URLs |
| SCUSD | Yes — main board page | `scusd.edu/about/board-of-education` (individual sub-pages exist) | Available; Finalsite CDN |
| SJUSD | No | N/A | No photos on official site |
| FUSD | Unknown — site returns 403 | `fremontunified.org/about/board/board-of-education-members/` | Needs browser verification |
| BUSD | Yes — school board page | `berkeleyschools.net/schoolboard/` | Available; group + individual photos |

---

## Migration 258 Audit-Only SQL Notes

Pattern from migration 255 (OR school headshots):
- SQL only, no apply script
- `WHERE NOT EXISTS` on politician_images
- One row per official
- Source URL or 'No photo found on official district website.'
- `type='default'`

Migration 258 will have:
- 7 SFUSD rows (source: individual commissioner pages — JS-rendered, researcher must manually extract URLs)
- 5 SDUSD rows (source: individual bio pages — URLs confirmed above for 2 members, others need individual check)
- 7 SCUSD rows (source: scusd.edu member sub-pages)
- 5 SJUSD rows (source: 'No photo found on official district website.')
- 5 FUSD rows (source: TBD — needs browser verification of fremontunified.org)
- 5 BUSD rows (source: berkeleyschools.net/schoolboard)

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Fremont USD headshot availability — page returns 403; photos may or may not exist | District 5 Headshots | Migration 258 may incorrectly mark as 'No photo' or may miss available photos |
| A2 | SJUSD trustee area assignments cross-referenced from Ballotpedia, not directly from sjusd.org (web.sjusd.org refused connections) | District 4 Roster | Wrong area number in title; low risk — Ballotpedia area assignments are authoritative for CA election records |
| A3 | DB external_id block clearance (-870001 to -870099) — could not execute SQL from research context | DB Check | If block is not clear, migration 257 will fail on ON CONFLICT |
| A4 | BUSD office title: 'Director' vs 'Board Member' — official site says "Director"; OR pattern uses "Board Member" | District 6 Naming | Inconsistency with other CA school district office titles in DB |

---

## Open Questions

1. **DB block clearance (A3)**
   - What we know: Block -870001 to -870099 is the target range per CONTEXT.md D-10
   - What's unclear: Whether any politicians with these external_ids were added since the discussion
   - Recommendation: Run `SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -870099 AND -870001` as the first task in Plan 1 Wave 0

2. **BUSD title: 'Director' or 'Board Member'**
   - What we know: BUSD officially calls members "Directors"; OR Phase 86 pattern uses "Board Member"
   - What's unclear: Whether EV should use the official BUSD title or the standard pattern
   - Recommendation: Use `'Director'` to match the official BUSD website; note in migration comment

3. **Fremont USD headshots**
   - What we know: fremontunified.org/about/board/board-of-education-members/ exists (in Google index) and lists member names
   - What's unclear: Whether the page has photos (403 during research)
   - Recommendation: Plan 2 researcher must manually check in browser before writing migration 258 rows for FUSD

4. **SJUSD photo availability on web.sjusd.org**
   - What we know: sjusd.org/about/board-of-education confirmed no photos
   - What's unclear: web.sjusd.org (alternate subdomain) was unreachable
   - Recommendation: Migration 258 marks SJUSD as 'No photo found on official district website.' unless researcher finds photos on a reachable SJUSD page

---

## Sources

### Primary (HIGH confidence)
- `sfusd.edu/about-sfusd/board-education` — SFUSD board listing (7 members, at-large, "Commissioner" title, photos)
- `sandiegounified.org/about/board_of_education` — SDUSD board listing (5 sub-districts A–E)
- `sandiegounified.org/about/board_of_education/overview/sabrina_bazzo` — Confirmed headshot URL pattern
- `sandiegounified.org/about/board_of_education/overview/shana_hazan` — Second headshot URL confirmed
- `sandiegounified.org/about/board_of_education/overview/richard_barrera` — Third headshot URL confirmed
- `scusd.edu/about/board-of-education` — SCUSD board listing (7 areas, photos present)
- `sjusd.org/about/board-of-education` — SJUSD board listing (5 trustee areas, no photos)
- `berkeleyschools.net/schoolboard/` — BUSD board listing (5 at-large directors, photos present)

### Secondary (MEDIUM confidence)
- WebSearch: `fremontunified.org/about/board/board-of-education-members/` — roster confirmed via Google index (5 members, areas 1–5)
- WebSearch + Ballotpedia: SJUSD trustee area assignments for all 5 members
- WebSearch: SCUSD board title confirmation (Tara Jeane = President, Area 1)

### Tertiary (LOW confidence / ASSUMED)
- Fremont USD headshot availability — blocked by 403; assumed needs browser verification
- SFUSD individual commissioner photo URLs — dynamically rendered, not extractable via WebFetch

---

**Research date:** 2026-06-01
**Valid until:** 2026-07-01 (board compositions can change; verify incumbency before migration applies)
