// Alpha Community coverage — the single source of truth for which areas Essentials
// has ingested. Consumed by the landing page (the browse list) and by the locality
// search fallback (resolving a city/state query to a covered browse target).
//
// hasContext: true = city has compass stances seeded (rendered as a purple chip).

export const COVERAGE_STATES = [
  {
    name: 'California', abbrev: 'CA',
    areas: [
      // [2026-10-06] Seven LA County cities added: Arcadia, Claremont, Diamond Bar,
      // Duarte, Glendora, La Verne, South Pasadena. All seven were ALREADY reachable
      // when the 2026-09-29 pass ran — CA_0173/CA_0176 re-modelled them by district on
      // 2026-09-23, six days earlier — so that pass simply missed them. Every one of its
      // own 13 additions happened to have a curated banner and these seven did not,
      // which is the likeliest reason they fell out.
      //
      // Verified against production through the live browse API, not row counts: each
      // geo_id returns its own council and no other city's (the state-tier roster comes
      // back on every request, so count the rows whose government_name matches before
      // concluding anything). Rosters: Duarte 7, the other six 5 each, no vacancies.
      //
      // hasContext is FALSE on all seven, measured against inform.politician_answers:
      // zero rows for zero officials, so there is nothing to claim yet.
      //
      // ⚠ representing_city is NULL on all 35 offices and the chambers are plain
      // "City Council", so NEITHER local-tier banner route fires. That does not matter
      // here — browse mode takes the label from THIS file (resolveRepresentingCity) —
      // but an address-routed reader gets the CA state shot until Accounts backfills it.
      // hasContext restored true 2026-08-06: migration 1564 had flipped this false after retiring all
      // 19 of Alhambra's rows (every one cited a fabricated sgvtribune.com path or a 404 agendas index).
      // Migration 1567 re-researched the council from the city's own AgendaCenter minutes and restored
      // 16 rows across all five councilmembers, so the coverage claim is true again. Homelessness
      // Response is deliberately still blank for Lee, Wang and Maza — no position statement exists.
      { label: 'Agoura Hills', browseGovernmentList: ['0600394'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Alhambra', browseGovernmentList: ['0600884'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Arcadia', browseGovernmentList: ['0602462'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Artesia', browseGovernmentList: ['0602896'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Avalon', browseGovernmentList: ['0603274'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Azusa', browseGovernmentList: ['0603386'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Baldwin Park', browseGovernmentList: ['0603666'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Bell', browseGovernmentList: ['0604870'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Bell Gardens', browseGovernmentList: ['0604996'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Bellflower', browseGovernmentList: ['0604982'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Berkeley', browseGovernmentList: ['0606000'], browseStateAbbrev: 'CA', hasContext: true },
      // hasContext flipped false 2026-08-02: migration 1538 retired all 5 of Beverly Hills'
      // stanced officials (Mirisch, Friedman, Nazarian, Corman, Wells). Every one of their rows
      // cited only URLs that never existed, so there was no evidence a reader could check.
      // ⚠ RE-MEASURED 2026-10-06 AND THAT REASON NO LONGER DESCRIBES WHAT IS THERE. Corman was
      // re-researched on 2026-08-26 and now holds ONE row (Residential Zoning) citing two
      // beverlypress.com articles that both resolve 200 and both name him — the fabricated-URL
      // defect is gone. The chip stays FALSE on DEPTH, not on evidence: 1 of 6 seated.
      // 🔴 Operator ruling 2026-10-06: one covered official out of six is not city coverage.
      // Do not re-grey it citing mig 1538; that is a closed defect. See Miami/Bradenton, same call.
      { label: 'Beverly Hills', browseGovernmentList: ['0606308'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Bradbury', browseGovernmentList: ['0607946'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Burbank', browseGovernmentList: ['0608954'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Calabasas', browseGovernmentList: ['0609598'], browseStateAbbrev: 'CA', hasContext: false },
      // hasContext flipped TRUE 2026-10-06. Carson was never commented and never judged; it was
      // simply grey. Measured: 3 of 7 seated hold rows (Hicks, Dear, Davis-Holmes), 4 rows over
      // two local topics, every one sourced to the city's OWN Legistar meeting minutes.
      // 🔑 VERIFIED, not assumed: all three PDFs fetched and parsed, and each one's header date
      // matches the date the reasoning cites — April 4 2023 (Dear to Assemblyman Gipson),
      // September 19 2023 (Dear, Economic Development Strategic Plan) and January 23 2024
      // (Hicks and Davis-Holmes on homelessness). 43% of seats on primary-source minutes clears
      // the bar comfortably.
      { label: 'Carson', browseGovernmentList: ['0611530'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Cerritos', browseGovernmentList: ['0612552'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Claremont', browseGovernmentList: ['0613756'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Commerce', browseGovernmentList: ['0614974'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Compton', browseGovernmentList: ['0615044'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Covina', browseGovernmentList: ['0616742'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Cudahy', browseGovernmentList: ['0617498'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Culver City', browseGovernmentList: ['0617568'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Diamond Bar', browseGovernmentList: ['0619192'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Downey', browseGovernmentList: ['0619766'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Duarte', browseGovernmentList: ['0619990'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'El Monte', browseGovernmentList: ['0622230'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'El Segundo', browseGovernmentList: ['0622412'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Fremont', browseGovernmentList: ['0626000'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Gardena', browseGovernmentList: ['0628168'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Glendale', browseGovernmentList: ['0630000'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Glendora', browseGovernmentList: ['0630014'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Hawaiian Gardens', browseGovernmentList: ['0632506'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Hawthorne', browseGovernmentList: ['0632548'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Hermosa Beach', browseGovernmentList: ['0633364'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Hidden Hills', browseGovernmentList: ['0633518'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Huntington Beach', browseGovernmentList: ['0636000'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Indio', browseGovernmentList: ['0636448'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Industry', browseGovernmentList: ['0636490'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Inglewood', browseGovernmentList: ['0636546'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Irwindale', browseGovernmentList: ['0636826'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'La Canada Flintridge', browseGovernmentList: ['0639003'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'La Habra Heights', browseGovernmentList: ['0639304'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'La Mirada', browseGovernmentList: ['0640032'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'La Palma', browseGovernmentList: ['0640256'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'La Puente', browseGovernmentList: ['0640340'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'La Verne', browseGovernmentList: ['0640830'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Lakewood', browseGovernmentList: ['0639892'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Lancaster', browseGovernmentList: ['0640130'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Lawndale', browseGovernmentList: ['0640886'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Lomita', browseGovernmentList: ['0642468'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Long Beach', browseGovernmentList: ['0643000'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Los Alamitos', browseGovernmentList: ['0643224'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Los Angeles', browseGovernmentList: ['0644000'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Lynwood', browseGovernmentList: ['0644574'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Malibu', browseGovernmentList: ['0645246'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Manhattan Beach', browseGovernmentList: ['0645400'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Maywood', browseGovernmentList: ['0646492'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Monrovia', browseGovernmentList: ['0648648'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Montebello', browseGovernmentList: ['0648816'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Monterey Park', browseGovernmentList: ['0648914'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Norwalk', browseGovernmentList: ['0652526'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Palm Springs', browseGovernmentList: ['0655254'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Palmdale', browseGovernmentList: ['0655156'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Palos Verdes Estates', browseGovernmentList: ['0655380'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Paramount', browseGovernmentList: ['0655618'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Pasadena', browseGovernmentList: ['0656000'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Pico Rivera', browseGovernmentList: ['0656924'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Pomona', browseGovernmentList: ['0658072'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Rancho Palos Verdes', browseGovernmentList: ['0659514'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Redondo Beach', browseGovernmentList: ['0660018'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Rolling Hills', browseGovernmentList: ['0662602'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Rolling Hills Estates', browseGovernmentList: ['0662644'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Rosemead', browseGovernmentList: ['0662896'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Sacramento', browseGovernmentList: ['0664000'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'San Diego', browseGovernmentList: ['0666000'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'San Dimas', browseGovernmentList: ['0666070'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'San Fernando', browseGovernmentList: ['0666140'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'San Francisco', browseGovernmentList: ['0667000'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'San Gabriel', browseGovernmentList: ['0667042'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'San Jose', browseGovernmentList: ['0668000'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'San Marino', browseGovernmentList: ['0668224'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Santa Clarita', browseGovernmentList: ['0669088'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Santa Fe Springs', browseGovernmentList: ['0669154'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Santa Monica', browseGovernmentList: ['0670000'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Sierra Madre', browseGovernmentList: ['0671806'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Signal Hill', browseGovernmentList: ['0671876'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'South El Monte', browseGovernmentList: ['0672996'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'South Gate', browseGovernmentList: ['0673080'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'South Pasadena', browseGovernmentList: ['0673220'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Temple City', browseGovernmentList: ['0678148'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Torrance', browseGovernmentList: ['0680000'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Vernon', browseGovernmentList: ['0682422'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Walnut', browseGovernmentList: ['0683332'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'West Covina', browseGovernmentList: ['0684200'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'West Hollywood', browseGovernmentList: ['0684410'], browseStateAbbrev: 'CA', hasContext: true },
      { label: 'Westlake Village', browseGovernmentList: ['0684438'], browseStateAbbrev: 'CA', hasContext: false },
      { label: 'Whittier', browseGovernmentList: ['0685292'], browseStateAbbrev: 'CA', hasContext: true },
    ],
  },
  {
    name: 'Indiana', abbrev: 'IN',
    areas: [
      // Bloomington was the LAST entry in this file routing by a hard-coded STREET ADDRESS
      // (`address: '100 W Kirkwood Ave, Bloomington, IN 47404'`), which geocodes a string at
      // runtime through a third party; all 198 other chips resolve their government directly.
      // It kept that shape only because `City of Bloomington` carried no geo_id. It has one
      // now — 1805860 — so it joins the rest.
      //
      // 🔑 Verified 2026-09-30 by loading BOTH routes side by side rather than assuming the
      // swap was neutral: they return the SAME five government blocks (City of Bloomington,
      // Bloomington Township, Monroe County, Monroe County Circuit Court, School Board) and
      // the SAME two banners (cities/bloomington.jpg + states/IN.jpg). Nothing is lost. The
      // only differences favour this route — the header reads 'Bloomington, IN' instead of
      // the raw street address, and there is no geocoder round-trip.
      // ⚠ The banner was NOT broken on the old route, despite all 12 offices carrying
      // representing_city = NULL: resolution also parses the city out of the address string.
      // Worth knowing before assuming a NULL representing_city means a missing banner.
      //
      // hasContext TRUE and unusually well-earned for this file: 10 of the 11 seated
      // officials hold rows, 93 answers, measured 2026-09-30.
      // ⚠ The 'bloomington' banner key is state-scoped IN but has NO match:'exact'. Nothing
      // collides today because only Indiana is seeded, but Bloomington MN and Bloomington IL
      // both exist — if either is ever seeded, that key needs match:'exact' FIRST.
      { label: 'Bloomington', browseGovernmentList: ['1805860'], browseStateAbbrev: 'IN', hasContext: true },
      // Ellettsville and Stinesville, 2026-10-06. ev-accounts CC_0189 gave both towns a geo_id;
      // until now nothing surfaced them -- seeded and reachable by address, but absent from the
      // grid and from the name typeahead.
      // hasContext FALSE on both, measured 2026-10-06 through inform.politician_answers joined to
      // inform.politician_context on (politician_id, topic_id, season_id): Ellettsville 4 seated,
      // Stinesville 2 seated, ZERO answers and ZERO rows with reasoning between them. Claiming it
      // would not be DB-honest -- the Deschutes rule.
      // Neither needs match:'exact'. Verified by running the matcher over every coverage label
      // before and after: both resolve Local = null and fall through to the Indiana state banner,
      // and no other label's resolution moves. Unlike the LA County 55, no CURATED_LOCAL key is
      // reachable by substring from either name.
      { label: 'Ellettsville', browseGovernmentList: ['1820800'], browseStateAbbrev: 'IN', hasContext: false },
      // Knight program slice 4 (2026-09-10/11). Seeded and banner-backed, and absent from this
      // list until now -- an address search reached them, but the name typeahead did not.
      // No hasContext on either: measured 2026-09-11, no sitting official in Fort Wayne (11) or
      // Gary (6) carries a row in inform.politician_answers, so claiming it would not be
      // DB-honest -- the Deschutes rule.
      { label: 'Fort Wayne', browseGovernmentList: ['1825000'], browseStateAbbrev: 'IN' },
      { label: 'Gary', browseGovernmentList: ['1827000'], browseStateAbbrev: 'IN' },
      // Indianapolis, 2026-09-30. ev-accounts CC_0185 consolidated the city and Marion County into
      // ONE government on the COUNTY fips 18097 -- the Nashville shape -- so the browse key is the
      // county code, not a place code. 1836003 names no district in the database and never did.
      // ⚠ MARION COUNTY MUST NOT BE ADDED TO COVERAGE_COUNTIES. One place, one entry, exactly as
      // Davidson County is absent for Nashville. It is not in that list today; do not add it.
      // No hasContext: measured 2026-09-29, no Indianapolis or Marion County officeholder holds a
      // row in inform.politician_answers, so claiming it would not be DB-honest -- the Deschutes rule.
      // ▶ Chip-reachable only. No council-district polygons exist, so an address cannot route to a
      // council district; Nashville has the same property and ships fine.
      { label: 'Indianapolis', browseGovernmentList: ['18097'], browseStateAbbrev: 'IN' },
      { label: 'Stinesville', browseGovernmentList: ['1873232'], browseStateAbbrev: 'IN', hasContext: false },
    ],
  },
  {
    name: 'Maine', abbrev: 'ME',
    areas: [
      { label: 'Auburn',        browseGovernmentList: ['2302060'], browseStateAbbrev: 'ME' },
      { label: 'Bangor',        browseGovernmentList: ['2302795'], browseStateAbbrev: 'ME' },
      { label: 'Biddeford',     browseGovernmentList: ['2304860'], browseStateAbbrev: 'ME' },
      { label: 'Lewiston',      browseGovernmentList: ['2338740'], browseStateAbbrev: 'ME' },
      { label: 'Portland',      browseGovernmentList: ['2360545'], browseStateAbbrev: 'ME' },
      { label: 'South Portland',browseGovernmentList: ['2371990'], browseStateAbbrev: 'ME' },
    ],
  },
  {
    name: 'Maryland', abbrev: 'MD',
    areas: [
      { label: 'Leonardtown',      browseGovernmentList: ['2446475'], browseStateAbbrev: 'MD' },
    ],
  },
  {
    name: 'Massachusetts', abbrev: 'MA',
    areas: [
      { label: 'Boston',      browseGovernmentList: ['2507000'], browseStateAbbrev: 'MA', hasContext: true },
      { label: 'Brockton',    browseGovernmentList: ['2509000'], browseStateAbbrev: 'MA', hasContext: true },
      { label: 'Cambridge',   browseGovernmentList: ['2511000'], browseStateAbbrev: 'MA', hasContext: true },
      { label: 'Fall River',  browseGovernmentList: ['2523000'], browseStateAbbrev: 'MA', hasContext: true },
      // hasContext flipped false 2026-08-05: Lowell now holds ZERO stance answers. Migration 1562
      // (ev-accounts) retired all 17 remaining rows across 9 of its 12 seated officials, including the
      // mayor, because every one cited lowellsun.com articles that never existed — the host is the real
      // Lowell Sun and is live, but all 15 cited paths 404 and none was ever archived, while sibling
      // articles from the same months are densely captured. The 14 rows that also cited
      // lowellma.gov/council or /mayor lost their only other source to the landing-page ruling.
      { label: 'Lowell',      browseGovernmentList: ['2537000'], browseStateAbbrev: 'MA', hasContext: false },
      { label: 'Lynn',        browseGovernmentList: ['2537490'], browseStateAbbrev: 'MA', hasContext: false },
      { label: 'Medford',     browseGovernmentList: ['2539835'], browseStateAbbrev: 'MA', hasContext: true },
      { label: 'New Bedford', browseGovernmentList: ['2545000'], browseStateAbbrev: 'MA', hasContext: true },
      // hasContext flipped false 2026-08-04 under the operator ruling "landing pages don't count
      // as coverage" (mig 1548 retired 48 of 55 answers; the 7 survivors cited only
      // `newtonma.gov/government/mayor` and a Suffolk Law faculty profile).
      // ✅ FLIPPED BACK TRUE 2026-10-06 — THE RE-RESEARCH THAT RULING ASKED FOR HAS HAPPENED.
      // 🔴 Those 7 rows are GONE. Do not look for them. A pass on 2026-08-26/09-03 replaced them:
      // 10 of 25 seated now hold 17 rows across five LOCAL topics (residential zoning, housing,
      // growth and development, local environment, transportation), sourced to Fig City News and
      // the Newton Beacon — two real hyperlocal outlets, not a nav page in sight.
      // 🔑 VERIFIED ROW BY ROW, not sampled: all 12 Newton URLs fetched (12/12 HTTP 200) and every
      // quoted phrase in the reasoning found VERBATIM in the cited article — Kalis's "the more cash
      // we have, the more we can do", Malakie's "The surest way to get a unit is to get a unit",
      // Krintzman's "Absolutely not", Roche's "We don't need anybody's permission", Laredo seconding
      // Lipof's motion, Baker moving BERDO on 27 November 2024. The landing-page ruling has not
      // been overridden; its premise no longer holds.
      { label: 'Newton',      browseGovernmentList: ['2545560'], browseStateAbbrev: 'MA', hasContext: true },
      { label: 'Quincy',      browseGovernmentList: ['2555745'], browseStateAbbrev: 'MA', hasContext: true },
      { label: 'Somerville',  browseGovernmentList: ['2562535'], browseStateAbbrev: 'MA', hasContext: true },
      { label: 'Springfield', browseGovernmentList: ['2567000'], browseStateAbbrev: 'MA', hasContext: true },
      // hasContext flipped TRUE 2026-10-06. Like Carson, Waltham carried no comment and had never
      // been judged. 4 of 16 seated, 8 rows, all one topic (housing) — but the evidence class is
      // the strongest in the audit: a RECORDED ROLL CALL in the city's own minutes.
      // 🔑 THE TALLY IS IN A PLACE YOU WILL NOT FIND BY SEARCHING THE OBVIOUS HEADING. The
      // Affordable Housing Zoning Amendment passed its third and final reading on 2026-06-22 under
      // **Tabled Items**, not under Ordinances and Rules — whose three 13-0-1-1 roll calls that
      // same night were RCI overlay districts for named developers. Reading the first matching
      // tally would have credited the wrong vote. Bradley-MacArthur, Brasco, King and LeBlanc are
      // all listed in favour; "13-0" in the prose is the yes-no part of a 13-0-1-1 (1 absent,
      // 1 presiding), which is fair.
      // ⚠ ONE SOFT SPOT, recorded rather than fixed: the rows describe the ordinance as "Article IX
      // Section 9.1" requiring 15% at 80% AMI and 5% at 50% AMI. Those specifics are in NEITHER
      // cited source — uncited background. The chair rests on the vote, which is sourced; the
      // description is not. Worth citing properly on the next pass.
      // 🔑 Tim King's second citation is the 2026-01-04 INAUGURATION minutes, which state no
      // position — it is there to date his tenure ("took office January 4, 2026"), which is a
      // legitimate use. Do not flag it as a landing-page defect; it was checked.
      { label: 'Waltham',     browseGovernmentList: ['2572600'], browseStateAbbrev: 'MA', hasContext: true },
      { label: 'Worcester',   browseGovernmentList: ['2582000'], browseStateAbbrev: 'MA', hasContext: true },
    ],
  },
  {
    name: 'Missouri', abbrev: 'MO',
    areas: [
      { label: 'Springfield', browseGovernmentList: ['2970000', '2928860'], browseStateAbbrev: 'MO', hasContext: true },
      // St. Louis added 2026-09-29, and the ONLY thing that was blocking it was the
      // banner. CC_0183 gave the government geo_id 2965000 on 2026-09-11; the chip was
      // held back because cities/st-louis.jpg did not exist, the same rule that gated
      // Nashville. It exists now (operator-certified 2026-09-29): THE GATEWAY ARCH, which
      // this city got by taking its own state's photograph — Missouri moved to an Ozarks
      // landscape at states/MO-v2.jpg the same day. See the 'st. louis' key in
      // buildingImages.js for the swap, and for why that asset is deliberately 1700x387
      // rather than the 1700x540 spec (a wider asset loses less to the 6:1 desktop crop,
      // which is what keeps the whole Arch on screen).
      // 23 offices, 22 seated. hasContext FALSE: measured 2026-09-29 through the
      // occupancy chain, zero of the 22 hold any row in inform.politician_answers.
      // ⚠ Do NOT add St. Louis County MO (29189) here — counties stay off the grid, and
      // its 10 offices carry representing_city='Clayton' anyway, so it would key a
      // 'clayton' banner rather than this one.
      { label: 'St. Louis',   browseGovernmentList: ['2965000'], browseStateAbbrev: 'MO', hasContext: false },
    ],
  },
  {
    name: 'Oregon', abbrev: 'OR',
    areas: [
      { label: 'Beaverton',    browseGovernmentList: ['4105350'], browseStateAbbrev: 'OR', hasContext: true },
      // Bend (2026-07-24 deep seed) — first Central Oregon city; the rest of this block is
      // Portland west/east metro. browseGovernmentList = [place FIPS, Bend-La Pine SD GEOID];
      // Bend Metro Park & Recreation District (synthetic geo_id 'bend-or-park-rec-district',
      // mtfcc X0024) is NOT listed because browse geo-pair resolution only walks TIGER MTFCCs —
      // its 5 directors still surface from an in-district address via the coordinate feed.
      // hasContext:true is DB-honest: Mayor Kebler carries evidence-only compass stances.
      // Deschutes County lives in COVERAGE_COUNTIES (unrelated array) — do NOT add it here.
      { label: 'Bend',         browseGovernmentList: ['4105800', '4101980'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Cornelius',    browseGovernmentList: ['4115550'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Fairview',     browseGovernmentList: ['4124250'], browseStateAbbrev: 'OR' },
      { label: 'Forest Grove', browseGovernmentList: ['4126200'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Gresham',      browseGovernmentList: ['4131250'], browseStateAbbrev: 'OR' },
      { label: 'Hillsboro',    browseGovernmentList: ['4134100'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Maywood Park', browseGovernmentList: ['4146730'], browseStateAbbrev: 'OR' },
      // hasContext restored true 2026-08-07. It was flipped false on 08-04 under the operator ruling
      // "landing pages don't count as coverage", after migration 1558 retired 57 rows sole-sourced to
      // fabricated Willamette Week articles and the 15 survivors turned out to rest on
      // `portland.gov/council/agenda` and `/mayor` (landing pages stating no position) or on
      // oregonlive URLs with zero Wayback captures.
      //
      // Migrations 1608-1614 (ev-accounts) rebuilt the cluster on portland.gov's PER-MEMBER ROLL-CALL
      // RECORDS (`/council/districts/<n>/<name>/votes`), which give each councillor's individual
      // Yea/Nay/Absent per council document, plus per-member topical pages and — for the mayor, who
      // votes only to break ties — his published agenda. All 12 now hold 3-9 answers each (56 rows,
      // 117 citations, every one portland.gov). Zero cite the two banned landing pages, oregonlive, or
      // willametteweek, so the coverage claim is true again on the standard that flipped it off.
      //
      // 13 topics are deliberately still blank (mig 1614): Criminalization for the 7 councillors
      // seated after the camping ordinance passed, School Vouchers for 2 (Portland has no K-12
      // jurisdiction), Rent for 2 and Homelessness for 2 — all verified unsourceable, not unresearched.
      { label: 'Portland',     browseGovernmentList: ['4159000'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Sherwood',     browseGovernmentList: ['4167100'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Tigard',       browseGovernmentList: ['4173650'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Troutdale',    browseGovernmentList: ['4174850'], browseStateAbbrev: 'OR' },
      { label: 'Tualatin',     browseGovernmentList: ['4174950'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Wood Village', browseGovernmentList: ['4183950'], browseStateAbbrev: 'OR' },
    ],
  },
  {
    name: 'Texas', abbrev: 'TX',
    // 🔴 THE ONE-COVERED-OFFICIAL RULING, 2026-10-06 (operator). A chip resting on a SINGLE
    // official out of three-to-seven seats is not city coverage, however good that one row is.
    // Eleven chips were flipped true → false under it in one pass — five here (Anna, Fairview,
    // Farmersville, Melissa, Parker) and six in Wisconsin (Dover, Norway, Raymond, Rochester,
    // Union Grove, Yorkville). Each is marked ⬜ at its own line with its measured counts.
    // ⚠ The rows themselves are NOT in question and were NOT retired — this is a DEPTH verdict,
    // not an evidence verdict, and conflating the two is what #190 had to go back and repair.
    // 🔑 After this pass no purple CITY rests on fewer than TWO covered officials, which is what
    // makes the EV-Accounts coverage-honesty gate enforceable rather than advisory.
    // ⚠ Kitsap County WA is the one 1-of-N purple left, and is deliberately NOT flipped: its second
    // chair-holder is a sheriff CANDIDATE, not a seated official, so it reads as 1 only to a
    // seated-officials measure. The gate reports it instead of failing on it.
    areas: [
      { label: 'Allen',         browseGovernmentList: ['4801924'], browseStateAbbrev: 'TX', hasContext: true },
      // ⬜ Anna: 1 of 7 seated, 2 rows — flipped false 2026-10-06, the one-covered-official ruling.
      { label: 'Anna',          browseGovernmentList: ['4803300'], browseStateAbbrev: 'TX', hasContext: false },
      // Tarrant County big-six (2026-08-08 seed, migs 1621-1628). This is a SECOND, unconnected
      // TX cluster — every other TX entry here is Collin County area (plus Longview). None of the
      // six carries hasContext: the seed was roster + geofence + browse only, with no compass
      // stances, so claiming context would not be DB-honest.
      { label: 'Arlington',     browseGovernmentList: ['4804000'], browseStateAbbrev: 'TX' },
      // Added 2026-09-11: Austin was seeded but had never been listed here. 11 of 11
      // councilmembers hold compass rows (65 total), so hasContext is true on arrival —
      // it is the only city in this audit that was complete and simply absent.
      { label: 'Austin',        browseGovernmentList: ['4805000'], browseStateAbbrev: 'TX', hasContext: true },
      { label: 'Blue Ridge',    browseGovernmentList: ['4808872'], browseStateAbbrev: 'TX' },
      { label: 'Celina',        browseGovernmentList: ['4813684'], browseStateAbbrev: 'TX', hasContext: true },
      // Euless: 4 of its 7 seats are seeded VACANT-by-design (Mayor, Places 2/4/5) — see mig 1628.
      { label: 'Euless',        browseGovernmentList: ['4824768'], browseStateAbbrev: 'TX' },
      // Phase 222 (2026-07-30/31): each of these four moved 0 -> >=1 evidence-cited compass
      // stance, so hasContext is DB-honest. Fairview: Works (residential-zoning).
      // Farmersville: Henry (residential-zoning). Lucas: Underhill + Orr. Parker: Sharpe.
      // ⬜ Fairview: 1 of 7 seated, 1 row — flipped false 2026-10-06, the one-covered-official ruling.
      { label: 'Fairview',      browseGovernmentList: ['4825224'], browseStateAbbrev: 'TX', hasContext: false },
      // ⬜ Farmersville: 1 of 6 seated, 1 row — flipped false 2026-10-06, the one-covered-official ruling.
      { label: 'Farmersville',  browseGovernmentList: ['4825488'], browseStateAbbrev: 'TX', hasContext: false },
      // Fort Worth: districts run 2-11 (there is no District 1) + Mayor = 11 seats.
      { label: 'Fort Worth',    browseGovernmentList: ['4827000'], browseStateAbbrev: 'TX' },
      { label: 'Frisco',        browseGovernmentList: ['4827684'], browseStateAbbrev: 'TX', hasContext: true },
      { label: 'Grapevine',     browseGovernmentList: ['4830644'], browseStateAbbrev: 'TX' },
      { label: 'Josephine',     browseGovernmentList: ['4838068'], browseStateAbbrev: 'TX' },
      { label: 'Lavon',         browseGovernmentList: ['4841800'], browseStateAbbrev: 'TX' },
      { label: 'Longview',      browseGovernmentList: ['4843888'], browseStateAbbrev: 'TX', hasContext: true },
      { label: 'Lowry Crossing',browseGovernmentList: ['4844308'], browseStateAbbrev: 'TX' },
      { label: 'Lucas',         browseGovernmentList: ['4845012'], browseStateAbbrev: 'TX', hasContext: true },
      { label: 'Mansfield',     browseGovernmentList: ['4846452'], browseStateAbbrev: 'TX' },
      { label: 'McKinney',      browseGovernmentList: ['4845744'], browseStateAbbrev: 'TX', hasContext: true },
      // ⬜ Melissa: 1 of 7 seated, 4 rows — flipped false 2026-10-06, the one-covered-official ruling.
      { label: 'Melissa',       browseGovernmentList: ['4847496'], browseStateAbbrev: 'TX', hasContext: false },
      { label: 'Murphy',        browseGovernmentList: ['4850100'], browseStateAbbrev: 'TX', hasContext: true },
      { label: 'Nevada',        browseGovernmentList: ['4850760'], browseStateAbbrev: 'TX' },
      { label: 'North Richland Hills', browseGovernmentList: ['4852356'], browseStateAbbrev: 'TX' },
      // ⬜ Parker: 1 of 6 seated, 1 row — flipped false 2026-10-06, the one-covered-official ruling.
      { label: 'Parker',        browseGovernmentList: ['4855152'], browseStateAbbrev: 'TX', hasContext: false },
      { label: 'Plano',         browseGovernmentList: ['4858016'], browseStateAbbrev: 'TX', hasContext: true },
      { label: 'Princeton',     browseGovernmentList: ['4859576'], browseStateAbbrev: 'TX', hasContext: true },
      { label: 'Prosper',       browseGovernmentList: ['4859696'], browseStateAbbrev: 'TX', hasContext: true },
      { label: 'Richardson',    browseGovernmentList: ['4861796'], browseStateAbbrev: 'TX', hasContext: true },
      { label: 'Saint Paul',    browseGovernmentList: ['4864220'], browseStateAbbrev: 'TX' },
      { label: 'Van Alstyne',   browseGovernmentList: ['4874924'], browseStateAbbrev: 'TX' },
      { label: 'Weston',        browseGovernmentList: ['4877740'], browseStateAbbrev: 'TX' },
    ],
  },
  {
    name: 'Utah', abbrev: 'UT',
    // 🔴 EIGHT CHIPS FLIPPED TRUE → FALSE 2026-10-06: Layton, Lehi, Ogden, Provo, Sandy,
    // St. George, West Jordan and West Valley City were claiming compass coverage that has never
    // existed. Measured twice, two different ways: zero rows in inform.politician_answers for any
    // CURRENTLY SEATED official, and then zero for any politician EVER linked to those governments
    // through office_terms — so this is not a stale-roster artifact, there was never anything.
    // Found while measuring the purple cohort to judge the grey chips, not by a detector.
    // ⚠ Orem (7 of 7, 55 rows) and Salt Lake City (7 of 8, 70 rows) are genuinely covered and keep
    // their chips. The Utah block carries no other comment; it was seeded flags-first.
    areas: [
      { label: 'Alpine', browseGovernmentList: ['4900540'], browseStateAbbrev: 'UT' },
      { label: 'American Fork', browseGovernmentList: ['4901310'], browseStateAbbrev: 'UT' },
      { label: 'Bluffdale', browseGovernmentList: ['4906810'], browseStateAbbrev: 'UT' },
      { label: 'Cedar Hills', browseGovernmentList: ['4911440'], browseStateAbbrev: 'UT' },
      { label: 'Cottonwood Heights', browseGovernmentList: ['4916270'], browseStateAbbrev: 'UT' },
      { label: 'Draper', browseGovernmentList: ['4920120'], browseStateAbbrev: 'UT' },
      { label: 'Eagle Mountain', browseGovernmentList: ['4920810'], browseStateAbbrev: 'UT' },
      { label: 'Herriman', browseGovernmentList: ['4934970'], browseStateAbbrev: 'UT' },
      { label: 'Holladay', browseGovernmentList: ['4936070'], browseStateAbbrev: 'UT' },
      { label: 'Layton', browseGovernmentList: ['4943660'], browseStateAbbrev: 'UT', hasContext: false },
      { label: 'Lehi', browseGovernmentList: ['4944320'], browseStateAbbrev: 'UT', hasContext: false },
      { label: 'Lindon', browseGovernmentList: ['4945090'], browseStateAbbrev: 'UT' },
      { label: 'Mapleton', browseGovernmentList: ['4947950'], browseStateAbbrev: 'UT' },
      { label: 'Midvale', browseGovernmentList: ['4949710'], browseStateAbbrev: 'UT' },
      { label: 'Millcreek', browseGovernmentList: ['4950150'], browseStateAbbrev: 'UT' },
      { label: 'Murray', browseGovernmentList: ['4953230'], browseStateAbbrev: 'UT' },
      { label: 'Ogden', browseGovernmentList: ['4955980'], browseStateAbbrev: 'UT', hasContext: false },
      { label: 'Orem', browseGovernmentList: ['4957300'], browseStateAbbrev: 'UT', hasContext: true },
      { label: 'Payson', browseGovernmentList: ['4958730'], browseStateAbbrev: 'UT' },
      { label: 'Pleasant Grove', browseGovernmentList: ['4960930'], browseStateAbbrev: 'UT' },
      { label: 'Provo', browseGovernmentList: ['4962470'], browseStateAbbrev: 'UT', hasContext: false },
      { label: 'Riverton', browseGovernmentList: ['4964340'], browseStateAbbrev: 'UT' },
      { label: 'Salem', browseGovernmentList: ['4965770'], browseStateAbbrev: 'UT' },
      { label: 'Salt Lake City', browseGovernmentList: ['4967000'], browseStateAbbrev: 'UT', hasContext: true },
      { label: 'Sandy', browseGovernmentList: ['4967440'], browseStateAbbrev: 'UT', hasContext: false },
      { label: 'Santaquin', browseGovernmentList: ['4967770'], browseStateAbbrev: 'UT' },
      { label: 'Saratoga Springs', browseGovernmentList: ['4967825'], browseStateAbbrev: 'UT' },
      { label: 'South Jordan', browseGovernmentList: ['4970850'], browseStateAbbrev: 'UT' },
      { label: 'South Salt Lake', browseGovernmentList: ['4971070'], browseStateAbbrev: 'UT' },
      { label: 'Spanish Fork', browseGovernmentList: ['4971290'], browseStateAbbrev: 'UT' },
      { label: 'Springville', browseGovernmentList: ['4972280'], browseStateAbbrev: 'UT' },
      { label: 'St. George', browseGovernmentList: ['4965330'], browseStateAbbrev: 'UT', hasContext: false },
      { label: 'Taylorsville', browseGovernmentList: ['4975360'], browseStateAbbrev: 'UT' },
      { label: 'Vineyard', browseGovernmentList: ['4980420'], browseStateAbbrev: 'UT' },
      { label: 'West Jordan', browseGovernmentList: ['4982950'], browseStateAbbrev: 'UT', hasContext: false },
      { label: 'West Valley City', browseGovernmentList: ['4983470'], browseStateAbbrev: 'UT', hasContext: false },
    ],
  },
  {
    name: 'Virginia', abbrev: 'VA',
    areas: [
      { label: 'Alexandria', browseGovernmentList: ['5101000', '51510'], browseStateAbbrev: 'VA', hasContext: true },
      { label: 'Falls Church', browseGovernmentList: ['5127200', '51610'], browseStateAbbrev: 'VA', hasContext: true },
    ],
  },
  {
    name: 'Nevada', abbrev: 'NV',
    areas: [
      { label: 'Las Vegas', browseGovernmentList: ['3240000'], browseStateAbbrev: 'NV', hasContext: true },
      { label: 'Henderson', browseGovernmentList: ['3231900'], browseStateAbbrev: 'NV', hasContext: true },
      { label: 'North Las Vegas', browseGovernmentList: ['3251800'], browseStateAbbrev: 'NV', hasContext: true },
      { label: 'Boulder City', browseGovernmentList: ['3206500'], browseStateAbbrev: 'NV', hasContext: true },
    ],
  },
  {
    // First Arizona CITY entry (Phase 194). Pima County lives in COVERAGE_COUNTIES
    // (unrelated array) — do NOT add cities there. hasContext:true is DB-honest:
    // Plan 04 seeded evidence-only compass stances for the 7 Tucson officials.
    name: 'Arizona', abbrev: 'AZ',
    areas: [
      { label: 'Tucson', browseGovernmentList: ['0477000'], browseStateAbbrev: 'AZ', hasContext: true },
      // Oro Valley (Phase 195). Appended to the EXISTING Arizona block (not a second
      // block). hasContext:true is DB-honest — Plan 03 seeded evidence-only compass
      // stances for the 7 Oro Valley officials. Pima County stays in COVERAGE_COUNTIES.
      { label: 'Oro Valley', browseGovernmentList: ['0451600'], browseStateAbbrev: 'AZ', hasContext: true },
      // Marana (Phase 196). Appended to the EXISTING Arizona block (not a second block);
      // Plan 03 seeded 21 evidence-only compass stances across the 7 Marana officials, so
      // hasContext:true is honest. Pima County stays in COVERAGE_COUNTIES (untouched).
      { label: 'Marana', browseGovernmentList: ['0444270'], browseStateAbbrev: 'AZ', hasContext: true },
      // Sahuarita (Phase 197). Appended to the EXISTING Arizona block (not a second block);
      // Plan 03 seeded 14 evidence-only compass stances across the 7 Sahuarita officials, so
      // hasContext:true is honest. Pima County stays in COVERAGE_COUNTIES (untouched).
      { label: 'Sahuarita', browseGovernmentList: ['0462140'], browseStateAbbrev: 'AZ', hasContext: true },
      // South Tucson (Phase 198). Appended to the EXISTING Arizona block (not a second block);
      // Plan 03 seeded 14 evidence-only compass stances across the 7 South Tucson officials, so
      // hasContext:true is honest. South Tucson is a full enclave (donut hole) inside Tucson —
      // the geofence (geo_id 0468850) routes an in-limits address to South Tucson exclusively,
      // NOT Tucson. Pima County stays in COVERAGE_COUNTIES (untouched); this is NOT a county entry.
      { label: 'South Tucson', browseGovernmentList: ['0468850'], browseStateAbbrev: 'AZ', hasContext: true },
    ],
  },
  {
    // First Wisconsin block (2026-07-28): the Racine County cluster — 2 cities,
    // 11 villages, 4 towns, all fully seeded. The "Town of X" labels (operator
    // preference: no parentheticals) disambiguate WI civil towns from their
    // city/village namesakes (Town of Burlington ≠ City of Burlington; Town of
    // Waterford ≠ Village of Waterford); Dover and Norway keep the prefix for
    // consistency. Towns use 10-digit county-subdivision geo_ids, not 7-digit
    // place FIPS — fine here because by-government-list matches
    // governments.geo_id directly (no TIGER MTFCC walk).
    // hasContext is DB-honest per the 2026-07-29 stance push (126 evidence-only
    // answers across 55 officials): every muni EXCEPT North Bay and Elmwood
    // Park has at least one official with compass stances — those two yielded
    // zero evidence rows and stay unflagged.
    // Racine County itself lives in COVERAGE_COUNTIES (unrelated array).
    name: 'Wisconsin', abbrev: 'WI',
    areas: [
      { label: 'Burlington',         browseGovernmentList: ['5511200'], browseStateAbbrev: 'WI', hasContext: true },
      { label: 'Caledonia',          browseGovernmentList: ['5511950'], browseStateAbbrev: 'WI', hasContext: true },
      { label: 'Elmwood Park',       browseGovernmentList: ['5523725'], browseStateAbbrev: 'WI' },
      // Madison (2026-07-29): the 2026-07-27 session created all 21 officials
      // (Mayor + 20 alders, headshots included) and the banner, but the
      // governments/chambers wiring was never finished, so browse couldn't see
      // them. Repaired in-DB (government 5548000 + Mayor/Common Council
      // chambers + office links). hasContext is DB-honest: the 2026-07-29
      // Madison stance push landed 92 evidence-only answers across ALL 21
      // officials (apply-madison-stances.ts).
      { label: 'Madison',            browseGovernmentList: ['5548000'], browseStateAbbrev: 'WI', hasContext: true },
      { label: 'Mount Pleasant',     browseGovernmentList: ['5554875'], browseStateAbbrev: 'WI', hasContext: true },
      { label: 'North Bay',          browseGovernmentList: ['5557700'], browseStateAbbrev: 'WI' },
      { label: 'Racine',             browseGovernmentList: ['5566000'], browseStateAbbrev: 'WI', hasContext: true },
      // ⬜ Raymond: 1 of 5 seated, 2 rows — flipped false 2026-10-06, the one-covered-official ruling.
      { label: 'Raymond',            browseGovernmentList: ['5566350'], browseStateAbbrev: 'WI', hasContext: false },
      // ⬜ Rochester: 1 of 7 seated, 1 row — flipped false 2026-10-06, the one-covered-official ruling.
      { label: 'Rochester',          browseGovernmentList: ['5568550'], browseStateAbbrev: 'WI', hasContext: false },
      { label: 'Sturtevant',         browseGovernmentList: ['5577925'], browseStateAbbrev: 'WI', hasContext: true },
      // WI civil towns. Dover and Norway have no city/village namesake so they
      // read plain; Burlington and Waterford keep the "Town of" prefix because
      // the City of Burlington and Village of Waterford are SEPARATE
      // governments with chips above — a plain duplicate label would be
      // indistinguishable on the grid AND would key the wrong banner
      // (buildingImages matches on the browse label).
      // ⬜ Dover: 1 of 3 seated, 1 row — flipped false 2026-10-06, the one-covered-official ruling.
      { label: 'Dover',              browseGovernmentList: ['5510120625'], browseStateAbbrev: 'WI', hasContext: false },
      // ⬜ Norway: 1 of 5 seated, 1 row — flipped false 2026-10-06, the one-covered-official ruling.
      { label: 'Norway',             browseGovernmentList: ['5510158600'], browseStateAbbrev: 'WI', hasContext: false },
      { label: 'Town of Burlington', browseGovernmentList: ['5510111225'], browseStateAbbrev: 'WI', hasContext: true },
      { label: 'Town of Waterford',  browseGovernmentList: ['5510183850'], browseStateAbbrev: 'WI', hasContext: true },
      // ⬜ Union Grove: 1 of 7 seated, 3 rows — flipped false 2026-10-06, the one-covered-official ruling.
      { label: 'Union Grove',        browseGovernmentList: ['5581775'], browseStateAbbrev: 'WI', hasContext: false },
      { label: 'Waterford',          browseGovernmentList: ['5583825'], browseStateAbbrev: 'WI', hasContext: true },
      { label: 'Wind Point',         browseGovernmentList: ['5587700'], browseStateAbbrev: 'WI', hasContext: true },
      // ⬜ Yorkville: 1 of 5 seated, 1 row — flipped false 2026-10-06, the one-covered-official ruling.
      { label: 'Yorkville',          browseGovernmentList: ['5589550'], browseStateAbbrev: 'WI', hasContext: false },
    ],
  },
  {
    // Washington (2026-08-14 Seattle deep seed, migs 1742-1753; Bainbridge Island
    // added 2026-08-17). King County and Kitsap County are standalone and live in
    // COVERAGE_COUNTIES (unrelated array) — a county is deliberately NOT a chip
    // here, same convention as Dane/Pima/Riverside/Clark and as school districts.
    // Operator ruling 2026-08-17, worth keeping because it is the reason this
    // block has two entries and not four: counties stay OFF the landing grid, and
    // are reached by name through the search box instead, where the resolver tags
    // them COUNTY and appends their state so "Los Angeles County, CA" cannot be
    // mistaken for "Los Angeles, CA".
    // The 147 WA legislators are reached BY ADDRESS, through their G5210/G5220
    // district geofences — never from this list, and (verified 2026-08-15) NOT
    // from browse_state_officials=WA either: that endpoint returns statewide
    // executives plus federal officials only, for every state.
    //
    // hasContext true 2026-08-14. ⚠ THIS COMMENT USED TO CLAIM 10 OF 11 SEATTLE
    // OFFICIALS WERE BLANK AND THAT IT WAS "a researched finding, not a backlog".
    // THAT WAS AN OVERCLAIM AND IT HAS BEEN CORRECTED. Task 10 (migs 1754 + 1759)
    // searched exactly ONE source class — Legistar roll calls and ordinance PDFs —
    // and reported its output in the vocabulary of exhaustive research. What it
    // actually established was that 10 of 11 had no ROLL-CALL-PROVABLE chair.
    //
    // Migration 1784 (2026-08-15) re-ran the same officials against web sources,
    // led by The Urbanist's candidate questionnaires: 42 seated rows and 5
    // documented blanks, covering ALL 11 of 11 Seattle city offices. Strauss's two
    // original rows were re-checked against the new sources and CONFIRMED
    // unchanged. Write-up: backend/data/stance-research/
    // 2026-08-15-seattle-council-web-sources.md (EV-Accounts repo). Migration 1787
    // (Rivera's tree amendment) took it to 48 rows; verified against the live DB
    // 2026-08-17 — 11 of 11 offices, 48 answers.
    //
    // 🔑 The lesson worth keeping: a blank is only as strong as the search behind
    // it, and "we read the whole roll-call corpus" is not "we researched them".
    //
    // The label doubles as the banner key: buildingImages matches CURATED_LOCAL
    // on the lowercased browse label, so 'Seattle' here is what resolves
    // cities/seattle.jpg. Do not retitle it without checking that map.
    name: 'Washington', abbrev: 'WA',
    areas: [
      // Bainbridge Island (2026-08-16 Kitsap seed, EV-Accounts 3e8400db / c359d077
      // / b1b1c422): 7 offices, all 7 seated on dated terms, routed by address off
      // its own place geofence.
      // 2026-08-17 (EV-Accounts migs 1822/1823): all 7 councilmembers now carry
      // portraits, and hasContext is now TRUE — but on a thin margin worth naming.
      // Exactly TWO of the seven hold a compass chair: Mike Nelson and Lara Lant,
      // both Growth and Development Pace = 2, from their 2025 Bainbridge
      // Conservation Coalition survey answers. The other five are blank ON PURPOSE.
      // ⚠ THE ISLAND'S DEFINING VOTES HAVE NOT HAPPENED YET. The Comprehensive Plan
      // and Winslow Subarea Plan — residential zoning, growth pace, affordable
      // housing, tree canopy — were still in Planning Commission as of 2026-07-24
      // after a unanimous council remand of mandatory inclusionary zoning, with
      // adoption expected SEPTEMBER 2026. Re-enter then: that roll call should
      // evidence most of the remaining spokes for all seven at once.
      // It now HAS a curated banner — buildingImages 'bainbridge island'.
      { label: 'Bainbridge Island', browseGovernmentList: ['5303736'], browseStateAbbrev: 'WA', hasContext: true },
      // Duvall + Redmond (2026-10-06 deep seed, EV-Accounts CC_0190/CC_0191/CC_0192).
      // Both are King County cities; the county and the Washington legislature were already
      // seeded, so these two chips complete the city layer rather than start it.
      // 8 offices each, 8 of 8 seated on dated terms, routed by address off their own place
      // geofence — both polygons were already loaded from census_tiger_2024, so no TIGER run
      // was needed. Each city has a Mayor and seven AT-LARGE councilmembers by numbered
      // position; neither has wards.
      //
      // hasContext is OMITTED on both, deliberately. The seed wrote no compass stances, and a
      // purple chip would promise some. Flip it only when a stance pass actually runs.
      //
      // Headshots: 13 of the 16 carry one (CC_0192). Three do not, and all three are on
      // purpose — Duvall Positions 2 and 3 (Conway and Taylor, both appointed in late 2026,
      // for whom the city publishes no portrait) and Redmond Position 2 (Vivek Prakriya,
      // whose official city portrait is black and white).
      //
      // ⚠ BOTH MAYORS ARE voting_powers = 'non_voting', so PoliticianCard prints the
      // "Non-voting seat" pill on them and Profile prints the representation_note. That is
      // correct and not a bug: RCW 35A.12.100 gives a Washington code-city mayor a vote only
      // to break a tie, and none at all on ordinances, franchises, licences or money
      // resolutions. Same shape as the Columbus GA and Macon-Bibb GA mayors already here.
      //
      // ⚠ 'Redmond' is also a city in OREGON (pop ~35k, Deschutes County) and is not seeded
      // today. Nothing breaks if it is later: buildingImages is state-scoped, so the 'redmond'
      // banner key resolves WA here and an OR Redmond would key separately, exactly as the two
      // Saint Pauls already do. Do not "de-duplicate" the label if that day comes.
      { label: 'Duvall', browseGovernmentList: ['5319035'], browseStateAbbrev: 'WA' },
      { label: 'Redmond', browseGovernmentList: ['5357535'], browseStateAbbrev: 'WA' },
      { label: 'Seattle', browseGovernmentList: ['5363000'], browseStateAbbrev: 'WA', hasContext: true },
    ],
  },
  // ── Four states added 2026-09-11 (Austin went into the TX block above) ──────
  // All of these were already seeded — full rosters, occupants resolving through
  // office_current_holder — but had never been listed here, so none of them was
  // reachable from the landing grid or the name typeahead. Found by diffing every
  // municipal government carrying occupants against the geo_ids in this file.
  // Array order does not matter: Landing.jsx:360 sorts by state name at render.
  //
  // ⚠ hasContext is NOT a judgement about the roster — it drives the CHIP COLOUR
  // (Landing.jsx:399-402): true renders purple, false renders teal. So it must mean
  // "this city has compass coverage", nothing more. Verified per city against
  // inform.politician_answers before being set either way below.
  {
    name: 'Colorado', abbrev: 'CO',
    areas: [
      // Boulder added 2026-09-29 (Knight slice 9 — Colorado Springs' own slice, but only
      // the Springs got a chip at the time). 9 of 9 seated, banner present ('boulder',
      // state-scoped CO, match:'exact' — it does NOT collide with the separate NV key
      // 'boulder city', which is Boulder City's chip). hasContext FALSE: measured
      // 2026-09-29, zero of the 9 hold any row in inform.politician_answers.
      { label: 'Boulder',          browseGovernmentList: ['0807850'], browseStateAbbrev: 'CO', hasContext: false },
      // 10 of 10 councilmembers stanced, 44 rows. Banner present ('colorado springs').
      { label: 'Colorado Springs', browseGovernmentList: ['0816000'], browseStateAbbrev: 'CO', hasContext: true },
    ],
  },
  {
    name: 'North Carolina', abbrev: 'NC',
    areas: [
      // Both complete: Asheville 7 of 7 stanced (27 rows), Durham 7 of 7 (14 rows).
      { label: 'Asheville', browseGovernmentList: ['3702140'], browseStateAbbrev: 'NC', hasContext: true },
      // Charlotte added 2026-09-29 (Knight NC-3 seeded it and its banner landed 2026-09-17,
      // but it never got a chip). 12 of 12 seated.
      //
      // 🔴 hasContext FLIPPED TRUE 2026-10-06, AND THE OLD COMMENT HERE WAS WRONG TWICE.
      // It said "zero of the 12 hold any row in inform.politician_answers" — true when written,
      // stale by 10-06: 4 of the 12 now hold 5 rows across 4 topics. It was then defended on a
      // re-check that read `politician_answers.write_in_text`, WHICH IS NOT WHERE REASONING LIVES.
      // Reasoning and sources live in **inform.politician_context (politician_id, topic_id,
      // season_id) → reasoning, sources** — the table Citations.jsx renders under "Why this
      // position?", as CLAUDE.md states. Measured there: all 5 rows carry reasoning AND at least
      // one source URL, e.g. Dimple Ajmera on data centres, sourced to an April 2026 WFAE
      // interview. Checking write_in_text and concluding "no reasoning" is a FALSE NEGATIVE that
      // can grey out a properly researched city.
      { label: 'Charlotte', browseGovernmentList: ['3712000'], browseStateAbbrev: 'NC', hasContext: true },
      { label: 'Durham',    browseGovernmentList: ['3719000'], browseStateAbbrev: 'NC', hasContext: true },
    ],
  },
  {
    name: 'Florida', abbrev: 'FL',
    areas: [
      // hasContext FALSE for all three. The 2026-09-11 reason — "ZERO compass rows exist for any
      // of their officials" — is STALE for two of them as of 2026-10-06, so it is restated here
      // rather than left to mislead the next reader:
      //   Bradenton  1 of 6 seated (Lisa Gonzalez Moore, local environment, The Bradenton Times)
      //   Miami      1 of 6 seated (Eileen Higgins, local immigration, Miami New Times)
      //   Tallahassee 0 of 5 — still literally zero, the original wording still fits.
      // ⚠ Those two rows are NOT a Florida stance pass. Both were created 2026-10-06 as spillover
      // from the Charlotte/Duluth/Saint Paul pass (38 rows that day, 35 of them in those three
      // cities). Both sources were fetched and both name their subject.
      // 🔴 Operator ruling 2026-10-06: one covered official out of six is not city coverage, so
      // these stay grey on DEPTH. Same call as Beverly Hills. Do not re-grey them citing "zero
      // rows" — that is no longer true and a wrong reason sends the next reader somewhere wrong.
      { label: 'Bradenton',   browseGovernmentList: ['1207950'], browseStateAbbrev: 'FL', hasContext: false },
      { label: 'Miami',       browseGovernmentList: ['1245000'], browseStateAbbrev: 'FL', hasContext: false },
      { label: 'Tallahassee', browseGovernmentList: ['1270600'], browseStateAbbrev: 'FL', hasContext: false },
    ],
  },
  {
    name: 'Georgia', abbrev: 'GA',
    areas: [
      // The Knight program cities. Same position as Florida: full rosters, curated
      // banners (the GA-3/4/5 waves in buildingImages.js), zero compass rows yet.
      // ⚠ Labels are the CITY names, but two of these governments are consolidated
      // city-counties: 'Columbus' is the Columbus Consolidated Government (1319000)
      // and 'Macon' is Macon-Bibb County Government (1349008). Do not "correct" these
      // labels to the government names — the banner keys in buildingImages.js
      // CURATED_LOCAL are 'columbus' (state-scoped GA, match:'exact') and 'macon',
      // and they resolve off these labels.
      { label: 'Columbus',      browseGovernmentList: ['1319000'], browseStateAbbrev: 'GA', hasContext: false },
      { label: 'Macon',         browseGovernmentList: ['1349008'], browseStateAbbrev: 'GA', hasContext: false },
      { label: 'Milledgeville', browseGovernmentList: ['1351492'], browseStateAbbrev: 'GA', hasContext: false },
    ],
  },
  {
    name: 'Tennessee', abbrev: 'TN',
    areas: [
      // Added 2026-09-11, once the banner existed. This was the largest single coverage gap on
      // the landing page: a complete 42-seat roster (Mayor, Vice Mayor, 5 at-large, 35 districts)
      // that no user could reach, because the chip was gated on cities/nashville.jpg.
      // hasContext TRUE as of 2026-09-11: 40 of the 42 Metro officials now hold evidenced compass
      // rows — 127 answers across 12 topics, every one sourced to a page that was actually fetched,
      // across three source classes now: the Nashville Banner 2023 Voter's Guide questionnaires
      // (CC BY-ND), the Banner's one-on-one with Mayor O'Connell, and nashville.legistar.com
      // enacted texts and roll calls. Verified through the occupancy chain, not
      // politicians.office_id: 40 with answers, 0 rows missing a source. Re-measured 2026-09-14.
      // ✅ BOTH REMAINING ZEROS ARE DOCUMENTED, so there is no unexplained gap left in this city.
      // The Vice Mayor's Banner piece is a procedural interview about running the council that
      // correctly yielded nothing (#138). Harrell (D8) was researched to a written zero
      // (ev-accounts #503): all 4,428 matters this term swept, 15 sponsorships found, 11 of them
      // recognitions or memorials, and no prime sponsorship of anything position-bearing.
      // ✅ D24 (Gadd) and D33 (Lee) were both closed by Legistar — Gadd on 4 topics (#502), Lee on
      // 2 (#505). That path was scoped before it was spent and it does NOT generalise: only 40 of
      // the 4,428 matters introduced this term are position-bearing at all, ~0.9%, the rest being
      // grant acceptances, appointments, easements and parcel zone changes. Gadd cleared it because
      // she is the council's most prolific sponsor of the few that are; Lee only because the sweep
      // was extended back to her FIRST term — she is a returning 2019 member, so the 2023 corpus
      // that covered everyone else holds half her record.
      // 🔑 SIX OF THEIR STRONGEST DOCUMENTS SEATED NOTHING BECAUSE NO LADDER REACHES THEM, and that
      // is a product finding rather than a research gap. An enacted eviction right-to-counsel
      // ordinance has nowhere to go while rent-regulation's chairs are all rent-control levels; a
      // grocery-tax resolution has nowhere to go while taxes' chairs read "wealthy people and large
      // companies"; and Lee's PRIME-sponsored resolution backing MNPS's refusal to arm teachers has
      // nowhere to go while gun-policy's chairs run ban / background checks / waiting periods /
      // repeal. That last one is the sharpest: a national weapon-class ladder has no rung for the
      // most salient LOCAL gun question in Tennessee. Season 3 decisions #5, #4 and one more.
      // ⚠ This flag speaks only for the 42 local officials, which is all it is allowed to claim.
      // Measured against the live browse this chip opens (by-government-list 47037 + browse_state=TN,
      // 2026-09-11): a visitor also meets 15 State of Tennessee officials — Davidson's own 10 House
      // seats and 4 Senate seats plus the Governor — and 14 of those 15 hold ZERO rows (only Gov. Lee
      // has any). The federal band is 39 shown / 8 with rows. Migration 1855 seeded 131 legislators
      // statewide, but 131 is NOT this chip's exposure; quoting it here would overstate the gap by 9x.
      //
      // ⚠ Label is 'Nashville' but the government is the Metropolitan Government of Nashville
      // and Davidson County (geo_id 47037 — a COUNTY fips, not a place fips, because the city
      // and county are consolidated). Do not "fix" either the label or the id: the label is what
      // the buildingImages 'nashville' key resolves off, and 47037 is what the government row
      // actually carries.
      //
      // ✅ GENERAL ASSEMBLY SEEDED 2026-09-11 (ev-accounts migration 1855): 99 House + 33 Senate
      // = 132 offices, 131 seated (House District 84 is vacant per the General Assembly's own
      // directory). The roster is real and correct.
      //
      // ✅ AND IT IS NOW REACHABLE — the polygons were loaded the same day. Legislators are routed
      // by polygon, and TN had ZERO G5210/G5220 geofences until TIGER 2024 FIPS 47 was loaded
      // (33 + 99, ev-accounts PR #458). Production's overlap query for Davidson County now returns
      // 4 Senate + 10 House districts, so this chip's State band shows 14 legislators plus the
      // Governor. Downtown Nashville resolves to Senate 21 / House 51, which is what the State of
      // Tennessee's own GIS service returns for the same point.
      // ⚠ The overlap resolution is CACHED FOR 1 HOUR (OVERLAP_CACHE_TTL_SECONDS), so immediately
      // after a geofence load the API still serves the old, thinner band. Do not read that as a
      // failed load — verify against the DB, not the cached response.
      //
      // 🔴 THE EXECUTIVE BAND IS STILL A SINGLE OFFICE — THE GOVERNOR — AND THAT IS CORRECT.
      // Tennessee popularly elects only the Governor. The Secretary of State, Treasurer and
      // Comptroller are chosen by joint vote of the General Assembly (Art. III §17, Art. VII §3),
      // the Attorney General by the judges of the Supreme Court (Art. VI §5), and the Lieutenant
      // Governor is the Senate Speaker, chosen by senators (TCA 8-2-102). Seeding four or five
      // statewide executives here by analogy with Georgia or North Carolina would invent popular
      // elections that do not exist. DO NOT "FIX" IT — the enacted text is quoted in the
      // migration header.
      { label: 'Nashville', browseGovernmentList: ['47037'], browseStateAbbrev: 'TN', hasContext: true },
    ],
  },
  // ── Eight states added 2026-09-29 (Boulder and Charlotte went into the CO and NC
  // blocks above) ────────────────────────────────────────────────────────────────
  // Same shape as the 2026-09-11 wave: every one of these was already seeded — full
  // roster, occupants resolving through office_current_holder, and (checked one by one)
  // a curated banner already in buildingImages.js — but none had ever been listed here,
  // so none was reachable from the landing grid or the name typeahead. Found by
  // re-running the same diff: every non-state government carrying at least one CURRENT
  // occupant, minus every geo_id already named in this file.
  //
  // These are the tail of the Knight city programme. The banner work ran ahead of the
  // chips all the way through — Biloxi and Aberdeen were certified 2026-09-28, the day
  // before this pass — so a banner existing is NOT evidence that a city is reachable.
  //
  // ⚠ hasContext is FALSE on all thirteen cities in this pass, and that is a measurement,
  // not a shrug. Counted 2026-09-29 against inform.politician_answers, joined through the
  // occupancy chain: twelve of the thirteen return ZERO rows for ZERO officials.
  // The thirteenth is Detroit — see its comment. These cities have rosters and banners
  // and have never had a stance pass, which is not the same as having been researched
  // and found blank.
  //
  // ✅ THE TWO UNREACHABLE KNIGHT CITIES ARE FIXED. This block used to say Lexington-Fayette
  // and Wichita were "deliberately not listed here, because a chip is keyed on
  // governments.geo_id and theirs is NULL", and asked for a geo_id. Migration CC_0183
  // (ev-accounts, applied to production 2026-09-29) set it: 2146027 for Lexington-Fayette
  // and 2079000 for Wichita, each verified against a district that exists and carries a
  // polygon rather than composed from the name. Both now have their chip, in the KS and KY
  // blocks below.
  //   ⚠ WICHITA NEEDED A SECOND FIX, AND THE geo_id ALONE WOULD NOT HAVE DONE IT. All seven
  //   of its offices carried chamber_id = NULL, so the browse query's JOIN on chambers
  //   dropped every one and its government reported 0 chambers and 0 offices. The note here
  //   read that as "ZERO occupants. Nothing to reach yet" — which was wrong: Wichita had
  //   SEVEN seated officials the whole time (Mayor Lily Wu and six council members), all
  //   answering an address. They were orphaned from their government, not absent.
  //   CC_0183 gave the city two chambers and attached all seven.
  //
  // 🔴 THE SAME TRAP IS STILL OPEN FOR THREE PLACES, AND ONE OF THEM CANNOT BE FIXED
  // THE SAME WAY:
  //   • City of St. Louis MO (22 seated) and St. Louis County MO (10 seated, seeded
  //     2026-09-29) both got their geo_id in CC_0183 — 2965000 and 29189 — so the DATA is
  //     ready. They get no chip yet because NEITHER HAS A BANNER in buildingImages.js.
  //     Add the chip when a banner is certified.
  //   • ✅ RESOLVED 2026-09-29/30 — Indianapolis has a chip. Left here because the reasoning
  //     is the record of how a consolidated city-county gets modelled.
  //     It read: "City of Indianapolis IN (6 seated) has NO geo_id available and was dropped
  //     from CC_0183 by its own gate, which refused the write. Indianapolis and Marion County
  //     are consolidated (Unigov) and its Mayor sits on the county polygon 18097 — but
  //     `Marion County, Indiana, US` ALREADY carries 18097, with 38 chambers. The place code
  //     1836003 names no district in the database at all. So 18097 would duplicate and 1836003
  //     would point at nothing. How a consolidated city-county should be modelled is a design
  //     question, not a data fix." That was right, and the gate refusing the write was right.
  //     The answer was the NASHVILLE shape: ev-accounts CC_0185 merged the two rows into ONE
  //     government on 18097, typed 'City' with city 'Indianapolis', holding a 25-seat
  //     City-County Council and the Mayor; the separate City of Indianapolis row was retired.
  //     The chip is keyed on the COUNTY fips as a result. 1836003 is still never used.
  {
    name: 'Kansas', abbrev: 'KS',
    areas: [
      // Reachable from 2026-09-29, after CC_0183 gave the government geo_id 2079000 and the
      // two chambers its seven offices had been missing. 7 of 7 seated: Mayor Lily Wu and
      // Council Members District 1-6, each on its own X0070 polygon. Banner 'wichita'.
      // hasContext FALSE: measured 2026-09-29 through the occupancy chain, zero of the 7
      // hold any row in inform.politician_answers.
      { label: 'Wichita', browseGovernmentList: ['2079000'], browseStateAbbrev: 'KS', hasContext: false },
    ],
  },
  {
    name: 'Kentucky', abbrev: 'KY',
    areas: [
      // Reachable from 2026-09-29, after CC_0183 gave the government geo_id 2146027. Unlike
      // Wichita this one was already fully wired — 4 chambers, 34 offices, 34 seated, zero
      // orphans — and the single NULL column was the only thing between it and a chip.
      // ⚠ The label is the city people search for; the government's real name is
      // 'Lexington-Fayette Urban County Government', a consolidated city-county. Banner
      // 'lexington' (certified 2026-09-26). hasContext FALSE: measured 2026-09-29, zero of
      // the 34 hold any row in inform.politician_answers.
      { label: 'Lexington', browseGovernmentList: ['2146027'], browseStateAbbrev: 'KY', hasContext: false },
    ],
  },
  {
    name: 'Michigan', abbrev: 'MI',
    areas: [
      // 18 of 18 seated (Mayor, Clerk, 9 council, and the rest of the citywide row).
      // ⚠ hasContext FALSE on a margin worth writing down, because the next person to
      // measure will find rows and think they are new: exactly ONE Detroit officeholder
      // carries any — Council Member At-Large Mary Waters, 5 rows across two seasons
      // (3 dated 2026-08-26, 2 dated 2026-09-03).
      // 🔴 CORRECTION 2026-10-06 — THE REASON BELOW WAS WRONG, AND IT WAS WRONG IN THE EXACT WAY
      // THAT CAUSED #188. This comment used to read "ALL FIVE HAVE NULL write_in_text: a bare
      // value with no reasoning a reader can check." That is the WRONG COLUMN. Reasoning lives in
      // `inform.politician_context` (politician_id, topic_id, season_id) → reasoning/sources, and
      // all five rows have it: 417–621 characters each, plus six distinct sources — BridgeDetroit
      // ×3, Detroit Free Press, Michigan Chronicle, Yahoo News. Four resolve 200 live; the Free
      // Press (402 paywall) and Michigan Chronicle (403 bot block) are both in the Wayback Machine
      // and were read there — the freep snapshot is dated 2024-07-31, the same day as the cited
      // URL, and it carries the quoted headline. Nothing here is fabricated.
      // ⚠ So the 2026-09-29 line below about "no evidence on any of it" is retracted. What
      // survives, and what still keeps the chip grey, is DEPTH and SCOPE:
      //
      // 🔑 AND THE 5 ROWS ARE ONLY 3 DISTINCT TOPICS, TWO OF THEM FEDERAL-SCOPE:
      // Affordable Housing (2 -> 3 across the two seasons), Same-Sex Marriage (2 -> 3)
      // and Social Security (2). A Detroit COUNCIL research pass would produce local
      // topics — zoning, homelessness, policing, transit. Two federal questions and one
      // local one, on a city council seat, is not what a municipal pass looks like:
      // these rows reached Waters by some other route. That route is NOT nameable from
      // this schema — the citation linkage lives in EV-Accounts, and nothing
      // supabase-local exposes joins an answer to its source — so do not guess at it,
      // and do not read these 5 rows as a Detroit stance pass having happened.
      //
      // That is the Newton/Lowell standard, and it did not clear it — 1 of 18 seats and one local
      // topic in the whole set. Purple would overstate the city by eighteenfold. Operator confirmed
      // 2026-09-29: no Detroit stance pass has run. Re-confirmed 2026-10-06 on the evidence above:
      // the rows are SOUND, the COVERAGE is not. Those are two different questions and this chip
      // turns on the second one.
      { label: 'Detroit', browseGovernmentList: ['2622000'], browseStateAbbrev: 'MI', hasContext: false },
    ],
  },
  {
    name: 'Minnesota', abbrev: 'MN',
    areas: [
      // Knight slice 5. Both banners certified 2026-09-16, both chips missing until now.
      //
      // 🔴 BOTH FLIPPED TRUE 2026-10-06. They shipped false on 09-29 with no stance measurement
      // recorded at all — false was the default, not a finding. Measured against production on
      // 10-06 in **inform.politician_context**, which is where reasoning and sources live
      // (keyed politician_id, topic_id, season_id), NOT politician_answers.write_in_text:
      //   Duluth      9 of 10 seated, 18 rows, 18 with reasoning, 18 with a source URL
      //   Saint Paul  8 of 8  seated, 12 rows, 12 with reasoning, 12 with a source URL
      // Not one exception in either city. These are among the best-covered local rosters in the
      // file and were rendering grey.
      { label: 'Duluth',     browseGovernmentList: ['2717000'], browseStateAbbrev: 'MN', hasContext: true },
      // ⚠ 'Saint Paul' is ALSO a chip in the Texas block (Saint Paul, TX — 4864220).
      // Nothing breaks: buildingImages is state-scoped, so the 'saint paul' key resolves
      // MN here and the TX town keys separately, and the chips live under different
      // state cards. Do not "de-duplicate" these two labels into one.
      { label: 'Saint Paul', browseGovernmentList: ['2758000'], browseStateAbbrev: 'MN', hasContext: true },
    ],
  },
  {
    name: 'Mississippi', abbrev: 'MS',
    areas: [
      // Knight slice 16 — the last city of the programme to get a banner (certified
      // 2026-09-28) and the only MS city in it. 8 of 8 seated.
      { label: 'Biloxi', browseGovernmentList: ['2806220'], browseStateAbbrev: 'MS', hasContext: false },
    ],
  },
  {
    name: 'North Dakota', abbrev: 'ND',
    areas: [
      // Knight slice 12. ND's first and only city. 9 of 9 seated.
      { label: 'Grand Forks', browseGovernmentList: ['3832060'], browseStateAbbrev: 'ND', hasContext: false },
    ],
  },
  {
    name: 'Ohio', abbrev: 'OH',
    areas: [
      // Knight slice 8. 14 of 14 seated.
      { label: 'Akron', browseGovernmentList: ['3901000'], browseStateAbbrev: 'OH', hasContext: false },
    ],
  },
  {
    name: 'Pennsylvania', abbrev: 'PA',
    areas: [
      // Knight slice 6, both cities. Philadelphia is the largest single roster added in
      // this pass: 25 of 25 seated (Mayor, Council President, 10 districts, 7 at-large,
      // and the citywide row officers).
      { label: 'Philadelphia',  browseGovernmentList: ['4260000'], browseStateAbbrev: 'PA', hasContext: false },
      // ⚠ Label is 'State College' but the government is the BOROUGH of State College —
      // Pennsylvania has no "City of State College". Do not "correct" it to Borough:
      // the buildingImages key is 'state college' and it resolves off this label.
      { label: 'State College', browseGovernmentList: ['4273808'], browseStateAbbrev: 'PA', hasContext: false },
    ],
  },
  {
    name: 'South Carolina', abbrev: 'SC',
    areas: [
      // Knight slice 7, both cities, banners certified together.
      // ⚠ 'Columbia' (SC) and 'Columbus' (GA) are different keys one letter apart and
      // both are state-scoped match:'exact' in buildingImages. Check the state before
      // touching either.
      { label: 'Columbia',     browseGovernmentList: ['4516000'], browseStateAbbrev: 'SC', hasContext: false },
      { label: 'Myrtle Beach', browseGovernmentList: ['4549075'], browseStateAbbrev: 'SC', hasContext: false },
    ],
  },
  {
    name: 'South Dakota', abbrev: 'SD',
    areas: [
      // Knight slice 15, banner certified 2026-09-28. 9 of 9 seated.
      { label: 'Aberdeen', browseGovernmentList: ['4600100'], browseStateAbbrev: 'SD', hasContext: false },
    ],
  },
];

// state name (long) -> USPS abbrev, for matching a geocoded administrative_area_level_1.
export const STATE_NAME_TO_ABBREV = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA',
  hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA', kansas: 'KS',
  kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD', massachusetts: 'MA',
  michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO', montana: 'MT',
  nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND',
  ohio: 'OH', oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI',
  'south carolina': 'SC', 'south dakota': 'SD', tennessee: 'TN', texas: 'TX',
  utah: 'UT', vermont: 'VT', virginia: 'VA', washington: 'WA', 'west virginia': 'WV',
  wisconsin: 'WI', wyoming: 'WY', 'district of columbia': 'DC',
};

/** Normalize a place label for fuzzy comparison: lowercase, drop punctuation,
 *  expand the "st."/"saint" abbreviation, collapse whitespace. */
export function normalizePlace(s) {
  return (s || '')
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\bsaint\b/g, 'st')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Covered counties — browsable like cities (the county government's geo_id routes
// through browse-by-government-list, returning the county's own officials —
// supervisors/commissioners, sheriff, DA, assessor — plus statewide officials).
// Not shown on the landing grid, by operator ruling (reaffirmed 2026-08-17):
// counties are cities' peers in the data but read out of place among city chips.
//
// ⚠ Nothing in the BROWSER BUNDLE imports this array, so Rollup tree-shakes it out
// of the app — but it is NOT dead code: `scripts/gen-coverage.mjs` (the `prebuild`
// hook) reads it to emit `public/coverage.json`, the public catalog Treasury Tracker
// reads to decide where its banner may tether back into Essentials. So a row added
// here does nothing for this app's UI and everything for TT's cross-links. The JSON
// itself is gitignored and rebuilt by `prebuild` on every deploy, so there is
// nothing to commit but this file — run `npm run gen:coverage` only when you want
// to eyeball the catalog locally. What the header used to call "search-only"
// overstated it in the other direction: nothing here powers search either.
// What actually makes a county findable is the LocationCombobox, which queries
// GET /essentials/location-search live and tags each row from the resolver's own
// fields (mtfcc → COUNTY pill, plus the state in the label). Confirmed on the
// deployed site 2026-08-17: "los angeles" returns "Los Angeles County, CA" tagged
// COUNTY above "Los Angeles, CA", and "kitsap" returns "Kitsap County, WA".
// So a county missing from this array is still searchable; keep the rows in sync
// with essentials.governments anyway, because this list is where the coverage
// reasoning is written down.
export const COVERAGE_COUNTIES = [
  { label: 'Los Angeles County', browseGovernmentList: ['06037'], browseStateAbbrev: 'CA', hasContext: true },
  // Knight slice 4, stage 4 (2026-09-10). Allen is 3 commissioners elected COUNTY-WIDE + 4
  // council districts + 3 at large + 9 officers; Lake seats 12 of 19, its seven council
  // districts deferred for want of a published map. No hasContext on either (measured
  // 2026-09-11: no sitting official in either county has a compass answer).
  { label: 'Allen County', browseGovernmentList: ['18003'], browseStateAbbrev: 'IN' },
  { label: 'Lake County, IN', browseGovernmentList: ['18089'], browseStateAbbrev: 'IN' },
  { label: "St. Mary's County", browseGovernmentList: ['24037'], browseStateAbbrev: 'MD' },
  { label: 'Greene County', browseGovernmentList: ['29077'], browseStateAbbrev: 'MO', hasContext: true },
  // Deschutes County (2026-07-24 Bend deep seed): 3 at-large commissioners + 4 countywide row
  // officers (Clerk, Assessor, Treasurer, Sheriff). No hasContext yet — the seeded compass
  // stances belong to 2026 CANDIDATES for county seats, not to sitting officeholders, so
  // claiming context here would not be DB-honest.
  { label: 'Deschutes County', browseGovernmentList: ['41017'], browseStateAbbrev: 'OR' },
  { label: 'Multnomah County', browseGovernmentList: ['41051'], browseStateAbbrev: 'OR' },
  { label: 'Washington County, OR', browseGovernmentList: ['41067'], browseStateAbbrev: 'OR', hasContext: true },
  { label: 'Box Elder County', browseGovernmentList: ['49003'], browseStateAbbrev: 'UT' },
  { label: 'Cache County', browseGovernmentList: ['49005'], browseStateAbbrev: 'UT' },
  { label: 'Davis County', browseGovernmentList: ['49011'], browseStateAbbrev: 'UT' },
  { label: 'Iron County', browseGovernmentList: ['49021'], browseStateAbbrev: 'UT' },
  { label: 'Salt Lake County', browseGovernmentList: ['49035'], browseStateAbbrev: 'UT', hasContext: true },
  { label: 'Summit County', browseGovernmentList: ['49043'], browseStateAbbrev: 'UT' },
  { label: 'Tooele County', browseGovernmentList: ['49045'], browseStateAbbrev: 'UT' },
  { label: 'Utah County', browseGovernmentList: ['49049'], browseStateAbbrev: 'UT', hasContext: true },
  { label: 'Washington County', browseGovernmentList: ['49053'], browseStateAbbrev: 'UT' },
  { label: 'Weber County', browseGovernmentList: ['49057'], browseStateAbbrev: 'UT' },
  { label: 'Clark County', browseGovernmentList: ['32003'], browseStateAbbrev: 'NV', hasContext: true },
  // Racine County (2026-07-28 WI cluster): county executive + 21-member County
  // Board + row officers + 10 Circuit Court judges. hasContext per the WI-muni
  // convention (>=1 official with evidence rows): supervisors Renee Kelly +
  // Tom Preusker carry stances from the 2026-07-29 cluster push. Thin (2/38)
  // but DB-honest.
  { label: 'Racine County', browseGovernmentList: ['55101'], browseStateAbbrev: 'WI', hasContext: true },
  // Dane County (2026-07-29 seed): county executive + 37-member County Board +
  // row officers + 17 Circuit Court branches. hasContext is DB-honest: 170
  // evidence-only answers across 42 officials (exec + officers + all 37
  // supervisors researched; Treasurer + Register of Deeds have no evidenced
  // positions; judges excluded by design).
  { label: 'Dane County', browseGovernmentList: ['55025'], browseStateAbbrev: 'WI', hasContext: true },
  { label: 'Pima County', browseGovernmentList: ['04019'], browseStateAbbrev: 'AZ', hasContext: true },
  { label: 'Riverside County', browseGovernmentList: ['06065'], browseStateAbbrev: 'CA', hasContext: true },
  // First two TEXAS counties (2026-08-08, migs 1621/1622). Each is a Commissioners Court:
  // County Judge + 4 precinct Commissioners. No hasContext — roster-only seed, no stances.
  // ⚠ Both share ONE countywide district (the Clark County NV pattern) because no commissioner
  // precinct geofences are loaded, so an address returns all five members rather than just its
  // own precinct's. Correct for the County Judge, over-inclusive for the commissioners.
  // ⚠ Collin's geo_id 48085 is ambiguous — it is also TX House District 85 (G5220). Anything
  // resolving this entry must qualify by mtfcc/district_type, never by geo_id alone.
  { label: 'Tarrant County', browseGovernmentList: ['48439'], browseStateAbbrev: 'TX' },
  { label: 'Collin County', browseGovernmentList: ['48085'], browseStateAbbrev: 'TX' },
  // King County WA (2026-08-14 Seattle deep seed): County Executive, 9-member
  // County Council, Assessor, Prosecuting Attorney, Director of Elections, and an
  // APPOINTED Sheriff (2020 charter amendment). Moved to even-year elections under
  // the 2022 charter change.
  // hasContext true 2026-08-15, Task 10 landed (migs 1754 + 1759): Balducci,
  // Dembowski, Perry, Zahilay, Barón and Mosqueda carried 9 rows between them
  // (jail-capacity, growth-and-development, local-immigration, taxes).
  // ⚠ The "other 8 of 14 are blank, which is a researched finding" note that used
  // to sit here did NOT survive re-research, the same way Seattle's did not: those
  // blanks came out of roll-call instruments only. Migrations 1785, 1786 and the
  // 2025 County Executive questionnaires (Zahilay + Balducci) re-ran them against
  // web sources and took the county to 11 of 14 offices at 35 rows — verified
  // against the live DB 2026-08-17. Dunn and von Reichbauer's no-vote reasoning
  // still holds for the 3 that remain blank; the lesson is that a no-vote finding
  // is a fact about one source class, not about a person.
  // ⚠ The flag was MISSING from the entry below until 2026-08-15 even though the
  // comment (and commit da64983c) claimed it was set. Set now.
  // ⚠ This flag has NO RUNTIME EFFECT: COVERAGE_COUNTIES has no importers, so
  // Rollup tree-shakes the whole array out of the production bundle. It is
  // source-only documentation. Verified: 53033 returns 0 occurrences in the live
  // bundle while Seattle's 5363000 returns 2.
  // ⚠ geo_id 53033 is NOT unique across MTFCCs — it is also LD33 Senate (G5210)
  // and LD33 House (G5220). Anything resolving this entry must qualify by
  // mtfcc/district_type, never by geo_id alone. Same trap as Collin County above.
  // ⚠ This entry is also what gives cities/king-county.jpg a browse label to key
  // off, since all 14 county offices carry representing_city = NULL.
  { label: 'King County', browseGovernmentList: ['53033'], browseStateAbbrev: 'WA', hasContext: true },
  // Kitsap County WA (2026-08-16 seed, EV-Accounts 3e8400db / c359d077): 9 offices,
  // all 9 seated on dated terms, seven of them on the 2026 general ballot.
  // Commissioner-district and city-ward boundaries are loaded as REFERENCE geometry
  // only, so an in-county address returns all three commissioners rather than just
  // its own district — the same over-inclusive shape as Tarrant/Collin above.
  // hasContext was TRUE from 2026-08-17 (EV-Accounts mig 1823) on a thin margin the comment named
  // honestly: exactly TWO Kitsap people hold a chair — Commissioner Katie Walters (Growth and
  // Development Pace = 3) and sheriff candidate Brandon L. Myers (Public Safety Approach = 4), both
  // from their own filed 2026 voters'-pamphlet statements. The Assessor, Auditor, Clerk and
  // Treasurer are blank ON PURPOSE and should stay blank — they are administrative offices and none
  // of the 22 local-scope topics applies to them.
  //
  // ⬜ FLIPPED FALSE 2026-10-06, operator ruling, closing the last 1-of-N purple in the file.
  // 🔑 THE OLD COMMENT WAS NOT WRONG — IT COUNTED A DIFFERENT THING. Two PEOPLE hold a chair, but
  // only ONE OFFICEHOLDER does: Myers is a candidate and carries no office_terms row at all, so by
  // the measure the chip actually makes — 'this government's officials have stances' — Kitsap is
  // 1 of 9 seated, the same shape as the eleven city chips greyed in #191.
  // ⚠ Checked before flipping, because the name invites it: there is a second `Brandon G. Myers` in
  // the DB with a seat and no stance rows. NOT the same person and NOT a split record — he is a
  // school board trustee in Inglewood Unified, CALIFORNIA. Do not merge them.
  // ⚠ COVERAGE_COUNTIES is tree-shaken out of the browser bundle, so this flag changes nothing in
  // this app's UI — it changes /coverage.json, which Treasury Tracker reads and which the
  // ev-accounts `coverage honesty` gate checks. Verify it there, never by a bundle diff.
  // ⚠ This entry also gives cities/kitsap-county.jpg its only path to screen: all 9 county offices
  // carry representing_city = NULL, so the banner key resolves through browse_label alone.
  // Its city, Bainbridge Island, is a chip in COVERAGE_STATES — do NOT add it here.
  { label: 'Kitsap County', browseGovernmentList: ['53035'], browseStateAbbrev: 'WA', hasContext: false },
  // Travis County TX (2026-08-18 Austin/Travis deep seed, EV-Accounts migs 1827-1831): 12 elected
  // executives — County Judge, four Commissioners, DA, County Attorney, Sheriff, Tax
  // Assessor-Collector, County Clerk, District Clerk, County Treasurer. All 12 seated on dated
  // terms; Commissioner Pct 4 (George Morales III) holds his by APPOINTMENT from 2026-06-11 and
  // starts a fresh elected term 2027-01-01, so this entry needs a look in January.
  // The ~30 district/county/probate court seats, 5 Justices of the Peace and 5 Constables are
  // NOT seeded yet — deliberately out of wave 1.
  // hasContext FALSE: no Travis County officeholder holds a compass chair yet. Stance work was
  // scoped to the 11 Austin CITY seats and has not run.
  // ⚠ Precinct boundaries are not loaded, so an in-county address returns all four commissioners
  // rather than its own — the same over-inclusive shape as Tarrant/Collin/Kitsap above.
  // ⚠ geo_id 48453 is unique, but 48015 (Austin COUNTY, a different place) is shared with TX SD15
  // and TX HD15. Anything resolving these must qualify by mtfcc/district_type, never geo_id alone.
  // ⚠ This entry gives cities/travis-county.jpg (Hamilton Pool) its browse label, since all 12
  // county offices carry representing_city = NULL. Its city, Austin, is keyed off
  // representing_city='Austin' instead — do NOT add Austin here.
  { label: 'Travis County', browseGovernmentList: ['48453'], browseStateAbbrev: 'TX', hasContext: false },
];

// Covered school districts (school-board deep-seeds). Search-only (not shown on
// the landing grid — a district chip among city chips reads out of place), same
// convention as counties. Each routes through browse-by-geofence to the board.
export const COVERAGE_SCHOOL_DISTRICTS = [
  { label: 'Clark County School District', browseGeoId: '3200060', browseMtfcc: 'G5420', browseStateAbbrev: 'NV' },
  { label: 'Beaverton School District 48J', browseGeoId: '4101920', browseMtfcc: 'G5420', browseStateAbbrev: 'OR' },
  { label: 'Hillsboro School District 1J', browseGeoId: '4100023', browseMtfcc: 'G5420', browseStateAbbrev: 'OR' },
  { label: 'Tigard-Tualatin School District 23J', browseGeoId: '4112240', browseMtfcc: 'G5420', browseStateAbbrev: 'OR' },
  { label: 'Forest Grove School District 15', browseGeoId: '4105160', browseMtfcc: 'G5420', browseStateAbbrev: 'OR' },
  { label: 'Sherwood School District 88J', browseGeoId: '4111290', browseMtfcc: 'G5420', browseStateAbbrev: 'OR' },
];

// Browsable states — every US state (each has statewide officials seeded:
// governor/AG/etc. + US Senators). A state routes to the "browse a state" view.
// Built from STATE_NAME_TO_ABBREV; DC excluded (no statewide executives).
const titleCasePlace = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());
export const COVERAGE_BROWSE_STATES = Object.entries(STATE_NAME_TO_ABBREV)
  .filter(([, abbrev]) => abbrev !== 'DC')
  .map(([name, abbrev]) => ({ label: titleCasePlace(name), browseState: abbrev }));

// ── City/area name search (locality typeahead) ───────────────────────────────

// Flattened, searchable view of every covered area, tagged with its kind + state.
// Name typeahead is intentionally limited to CITIES + STATES only — counties and
// school districts are excluded from search (they cluttered results and read out of
// place among city names). They remain reachable via direct browse links / the grid;
// COVERAGE_COUNTIES and COVERAGE_SCHOOL_DISTRICTS are still exported for that routing.
const ALL_COVERAGE_AREAS = [
  ...COVERAGE_STATES.flatMap((s) =>
    s.areas.map((a) => ({ ...a, kind: 'city', stateAbbrev: a.browseStateAbbrev || s.abbrev, stateName: s.name }))
  ),
  ...COVERAGE_BROWSE_STATES.map((s) => ({ ...s, kind: 'state' })),
];

/**
 * Search covered cities/areas by name for the search-box typeahead. Returns
 * ranked matches (name-prefix first, then stance-seeded, then alphabetical).
 * Returns [] for queries that look like a street address (leading digit) so the
 * address-lookup path owns that input and the two result lists don't collide.
 */
export function searchCoverageAreas(query, limit = 6) {
  const raw = (query || '').trim();
  if (raw.length < 2 || /^\d/.test(raw)) return [];
  const q = normalizePlace(raw);
  if (!q) return [];
  const matches = [];
  for (const area of ALL_COVERAGE_AREAS) {
    const idx = normalizePlace(area.label).indexOf(q);
    if (idx !== -1) matches.push({ area, idx });
  }
  matches.sort((a, b) =>
    a.idx - b.idx ||
    (b.area.hasContext ? 1 : 0) - (a.area.hasContext ? 1 : 0) ||
    a.area.label.localeCompare(b.area.label)
  );
  return matches.slice(0, limit).map((m) => m.area);
}

/**
 * Build the /results browse URL for a covered area. Mirrors Landing's
 * handleAreaClick routing so the typeahead and the grid navigate identically.
 */
export function coverageAreaToPath(area) {
  if (area.kind === 'state' || (area.browseState && !area.browseGovernmentList)) {
    const params = new URLSearchParams({ browse_state_officials: area.browseState, browse_label: area.label });
    return `/results?${params.toString()}`;
  }
  if (area.browseGovernmentList) {
    const params = new URLSearchParams({
      browse_government_list: area.browseGovernmentList.join(','),
      browse_label: area.label,
    });
    if (area.browseStateAbbrev) params.set('browse_state', area.browseStateAbbrev);
    if (area.browseCountyGeoId) params.set('browse_county_geo_id', area.browseCountyGeoId);
    // A county browse shows only the county government's own officials + statewide
    // (not every official inside the county-sized geofence).
    if (area.kind === 'county') params.set('browse_skip_overlap', '1');
    return `/results?${params.toString()}`;
  }
  if (area.browseGeoId) {
    const params = new URLSearchParams({
      browse_geo_id: area.browseGeoId,
      browse_label: area.label,
    });
    if (area.browseMtfcc) params.set('browse_mtfcc', area.browseMtfcc);
    if (area.browseCityFilter) params.set('browse_city_filter', area.browseCityFilter);
    if (area.browseSchoolFilter) params.set('browse_school_filter', area.browseSchoolFilter);
    return `/results?${params.toString()}`;
  }
  return `/results?q=${encodeURIComponent(area.address)}`;
}
