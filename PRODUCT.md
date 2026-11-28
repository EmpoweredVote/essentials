# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Voters first. A voter enters where they live, sees every official and race that covers that place, and opens one
person to learn what they stand for and what they have actually done. Most visits are short and come close to an
election. A second audience digs deeper: journalists, advocates, and campaign volunteers who read every bill and vote.
Both must be served, voter first.

## Product Purpose

Empowered Essentials answers "who represents me, and what have they done?" for every level of government at one
address. Success is a voter who leaves knowing, in plain words, how a person has voted and what they have put their
name to, on the topics that voter cares about, with a source for every claim.

## Positioning

Essentials is part of Empowered Vote, which is antipartisan. It never shows a person's party (except where a voter
must pick a partisan primary ballot). It lets the record speak, ties actions to the same topics as the Empowered
Compass, and links every item to its official source.

## Operating Context

- Most visitors arrive from a location search or from Compass, on a phone, often signed out.
- Records come from different sources by level: Congress and state legislatures through LegiScan; city councils
  from each city's own legislation pages (for example Bloomington Common Council).
- A person's record can be from an earlier office (for example a mayor's votes from their time in Congress).

## Capabilities and Constraints

- Record data served today: committees and roles, sponsored and co-sponsored bills (number, title, status, date,
  sponsor or co-sponsor), roll-call votes (bill, question, position, result, yea and nay counts, date, source), and
  for councils, sponsorships (with co-sponsors and the sponsorship sentence) and every council vote.
- Bills carry a `topic_tags` field that is empty everywhere today. Topic tagging is not yet served by the API.
- Compass topics are served at `/compass/topics`, each with one or more categories.
- Shared UI comes from `@empoweredvote/ev-ui`. Live data only; never invented records.

## Brand Commitments

- Keep the Empowered Vote colors (teal `#00657c`, coral `#ff5740`, yellow `#fed12e`, light blue `#59b0c4`, navy dark
  mode `#0d1117`) and fonts (Manrope for display, Inter for text).
- New pages may take a new look, but must still read as part of Essentials. The legislative record redesign
  (2026-11) is a chance to move the design in a new direction.
- Never show party affiliation. Never cite OnTheIssues or Wikipedia.

## Evidence on Hand

Live public API at `https://accounts-api.empowered.vote/api`. Reference records: Karen Bass (mayor; votes from
Congress, 2022), Isabel Piedmont-Smith (Bloomington city council), Matt Pierce (Indiana House).

## Product Principles

1. The record speaks for itself: show actions and sources, not judgments.
2. Plain language first, full detail one step away.
3. Topics connect the record to what voters care about and to the Compass.
4. Never fill a gap with invented data; say what is missing.

## Accessibility & Inclusion

Plain language for non-experts. Works on phones. Light and dark mode.
