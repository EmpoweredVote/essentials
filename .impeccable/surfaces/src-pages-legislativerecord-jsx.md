---
version: 1
slug: "src-pages-legislativerecord-jsx"
primary_target: "src/pages/LegislativeRecord.jsx"
related_targets: []
---

# Legislative record page (/politician/:id/record)

Mode: Read. Visitor: a voter checking how a person voted and what they put their name to, by topic; researchers second.
Constraints: live data only; topics come from bills' topic_tags (empty today) with a dev-only stand-in in src/mocks/; ceremonial resolutions grouped separately; never show party; keep e2e headings (Committees, Authored and co-sponsored, Council votes) and link names (Legislation page for, City document for).

## Direction contract

THESIS: The record set like the official voter information pamphlet: a plain, ruled public document a voter already trusts. Refuses the dashboard of stat cards, tabs and a data table.
OWN-WORLD: White sheet (navy in dark mode), ink-black heavy rules (8px masthead rule, 3px section rules, 1px row rules), teal section numbers and links, one yellow tab label on the "At a glance" box, coral only for Failed or Vetoed. Manrope 800 for display and numbers, Inter for reading text. Yes and No set as ballot marks: filled ink box for Yes, outlined box for No.
STORY: The voter learns which office the record is from, reads a one-paragraph plain summary and a ruled At a glance box, picks a topic, then reads numbered sections (Committees, Bills, Votes) with a source link on every item.
FIRST VIEWPORT: Masthead rule with "THE RECORD" left and the legislature right; the name at 56px; one line saying what this is; the At a glance box with its yellow tab; a contents line linking the numbered sections; topic filter row below.
FORM: The Voter Guide, my first-ranked candidate (IMPECCABLE'S PICK, chosen over the rolled Subject Index). seed:e80c2df7ce91aa93
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
