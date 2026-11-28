---
name: Empowered Essentials, The Voter Guide
description: A person's legislative record, set like an official voter information pamphlet.
colors:
  paper: "#ffffff"
  ink: "#0d1117"
  ink-soft: "#3d4852"
  rule-soft: "#cdd5da"
  wash: "#f2f6f7"
  teal: "#00657c"
  yellow: "#fed12e"
  coral: "#ff5740"
  paper-dark: "#0d1117"
  ink-dark: "#e6edf3"
  ink-soft-dark: "#a8b3bd"
  rule-soft-dark: "#30363d"
  wash-dark: "#161b22"
  teal-dark: "#00c8d7"
typography:
  display:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 6vw, 3.5rem)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  numeral:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 800
    lineHeight: 1
    fontFeature: "tnum"
  title:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 800
    lineHeight: 1.4
  label:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 800
    lineHeight: 1.3
    letterSpacing: "0.06em"
  lede:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.45
  meta:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  none: "0px"
spacing:
  row: "14px"
  gutter: "20px"
  gutter-mobile: "16px"
  glance-gap: "30px"
  section-gap: "44px"
  section-gap-mobile: "36px"
  number-column: "64px"
  billno-column: "112px"
components:
  ballot-mark-yes:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "3px 8px"
  ballot-mark-no:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "3px 8px"
  ballot-mark-other:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.none}"
    padding: "3px 8px"
  glance-tab:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "7px 18px 6px"
  chip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "7px 14px"
    height: "36px"
  chip-hover:
    backgroundColor: "{colors.wash}"
  chip-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  tag:
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.none}"
    padding: "3px 8px"
  tag-compass:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.teal}"
    rounded: "{rounded.none}"
    padding: "3px 8px"
  tag-compass-hover:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.paper}"
  button-more:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "9px 18px"
  button-more-hover:
    backgroundColor: "{colors.wash}"
  select:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "6px 10px"
    height: "36px"
  pocket-summary:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    padding: "12px 16px"
---

# Design System: Empowered Essentials, The Voter Guide

## Overview

**Creative North Star: "The Voter Guide"**

The record is set like the official voter information pamphlet a voter gets in the mail: a plain white sheet, heavy black rules, numbered sections, and a source for every item. It should feel like a public document that a voter already trusts, not like an app screen. There are no cards, no shadows, no rounded corners and no dashboard tiles. Structure comes from ink rules of three weights and from big teal numbers.

**Where this applies today.** This look ships on one page only: a person's legislative record (`src/pages/LegislativeRecord.jsx`, styled by `src/components/RecordGuide/recordGuide.css`). Every token lives inside the `.rg` wrapper, so nothing leaks to other pages. The rest of Essentials still uses the older `@empoweredvote/ev-ui` look. The record page may set the new direction for Essentials, but nothing outside it follows this file yet.

The page is calm and dense in the way a printed guide is dense. Reading text is Inter. Headings, numbers, labels and marks are Manrope at weight 800. Color is spent sparingly, and each color has one job.

**Key Characteristics:**
- White sheet in light mode, navy-black sheet in dark mode.
- Black rules in three weights: 8px under the masthead, 3px over each section and around the At a glance box, 1px between rows.
- Teal for section numbers, large figures and links.
- One yellow tab on the page, on the At a glance box. Yellow is also the focus ring and text selection.
- Coral only marks a bill that Failed or was Vetoed.
- Yes and No are set as ballot marks: a filled box and an empty box.
- Square corners everywhere. No shadows.

## Colors

A near-monochrome ink-and-paper palette with three brand accents, each held to one job. The accents are the Empowered Vote brand colors from PRODUCT.md.

### Primary
- **Record Teal** (`teal`): section numbers, the large figures in the At a glance box, contents numbers, every link, the "Show" action, and Compass topic tags. In dark mode it brightens to **Bright Teal** (`teal-dark`) so it stays readable on the navy sheet.

### Secondary
- **Tab Yellow** (`yellow`): the one tab label on the At a glance box, a committee leadership role (Chair, Vice Chair), the keyboard focus ring (3px outline), and selected text. Text on yellow is always the fixed ink color `#0d1117`, in both modes.

### Tertiary
- **Did-Not-Pass Coral** (`coral`): a 2px outline around the status word when a bill Failed or was Vetoed. Coral is a border only, never text and never a fill. It does not change in dark mode.

### Neutral
- **Paper** (`paper`, dark: `paper-dark`): the page sheet. White in light mode; the brand navy `#0d1117` in dark mode.
- **Ink** (`ink`, dark: `ink-dark`): all main text and every heavy rule, box border, chip border and ballot mark.
- **Soft Ink** (`ink-soft`, dark: `ink-soft-dark`): dates, sources, counts, intros, empty-state lines, tag text.
- **Hairline** (`rule-soft`, dark: `rule-soft-dark`): the 1px lines between list rows, the dashed lines between roll calls, plain tag borders.
- **Wash** (`wash`, dark: `wash-dark`): hover fill for chips and buttons, the ceremonial pocket's header, loading placeholders.

### Named Rules
**The One Job Rule.** Each accent does one thing. Teal points (numbers and links). Yellow labels the one tab and shows focus. Coral flags a bill that did not pass. Do not use an accent for decoration.

**The Coral Is Not a No Rule.** Coral marks an outcome (Failed, Vetoed), never a person's No vote. A No vote is an empty ballot box in ink. Color must not read as a judgment of the person.

**The Fixed Ink On Yellow Rule.** Text set on yellow is always `#0d1117`, in light and dark mode, because yellow does not change between modes.

## Typography

**Display Font:** Manrope (with ui-sans-serif, system-ui, sans-serif)
**Body Font:** Inter (with ui-sans-serif, system-ui, sans-serif)

**Character:** Manrope at weight 800 is the voice of the pamphlet: names, section titles, numbers, labels and ballot marks. Inter carries everything a voter reads at length. Figures use tabular numbers so counts and bill numbers line up.

### Hierarchy
- **Display** (Manrope 800, 36 to 56px, line height 1.05): the person's name, once per page.
- **Headline** (Manrope 800, 26px; 22px on phones): numbered section titles (Committees, Bills, Votes).
- **Numeral** (Manrope 800, 40px, tabular): section numbers and At a glance figures, in teal. On phones the section number drops to 28px and the figures to 26px.
- **Title** (Manrope 700 to 800, 15 to 16px): bill numbers, the contents line, the "Read by topic" heading, the ceremonial pocket header.
- **Label** (Manrope 800, 13 to 14px, uppercase, 0.06 to 0.08em tracking): only three places. The masthead running head, the At a glance tab, and the uppercase subheads inside a section (for example "Sponsor (12)").
- **Lede** (Inter 400, 18px; 16px on phones, line height 1.5, max 62ch): the one line under the name that says what the page is.
- **Body** (Inter 400, 16px, line height 1.45 to 1.6): bill titles, the plain summary.
- **Meta** (Inter 400 to 600, 12 to 14px, line height 1.5): dates, sources, counts, tags. Items in a meta line are separated by a middle dot.

### Named Rules
**The Heavy Voice Rule.** Manrope always appears at 700 or 800. Inter carries reading text. Do not set long reading text in Manrope.

**The Three Labels Rule.** Uppercase tracked text is used only for the masthead running head, the At a glance tab, and section subheads. Do not add small uppercase labels above headings.

## Layout

A single column, up to 1000px wide, centered, with 20px side padding (16px on phones) and generous space at the bottom (72px; 56px on phones).

The page reads top to bottom in a fixed order: back link, masthead, one-line lede, optional note box, At a glance box, contents line, topic filter, then numbered sections, then a credit line.

- **Numbered sections** use a two-column grid: a 64px column for the teal number and the content beside it. Sections are 44px apart (36px on phones). On phones the number sits above the title.
- **List rows** use three columns: bill number (112px), title and details, and a right column for status, date and source link. Rows have 14px of vertical padding. On phones they stack into one column.
- **Roll calls** under a bill are indented 130px so they sit under the bill title. On phones the indent is removed.
- **At a glance figures** sit in a grid of columns at least 150px wide; on phones, exactly three across.

Breakpoint: 640px.

## Elevation & Depth

This system is flat. There are no shadows anywhere. Depth and grouping come from ink rules of different weights and from the light wash fill. A heavier rule means a bigger division: 8px opens the page, 3px opens a section or frames the At a glance box, 2px frames a smaller box (note, pocket, chip, button), 1px separates rows.

### Named Rules
**The Rules Not Shadows Rule.** Group things with a ruled line or a ruled box, never with a shadow, a card or a tinted panel.

## Shapes

Every corner is square (0px). Boxes are drawn with solid ink borders. Dashed borders mean "not quite": a vote that was neither Yes nor No, a topic that is not a Compass topic, and the light divider between roll calls on one bill. The only rounding is the 2px corner on the yellow focus outline.

## Components

### Masthead
- A running head with "THE RECORD" on the left and the legislature on the right, in uppercase Manrope 800 at 13px (11px on phones), sitting on an 8px ink rule.
- Below it: the name (Display), the one-line lede, and, when needed, a note in a 2px ink box (for example, a record from an earlier office).

### At a glance box (signature component)
- A yellow tab, with a 3px ink border on three sides, sits on top of a 3px ink box. The tab is the page's `h2` for this box.
- Inside: a plain-language summary paragraph, then a 1px rule, then the figures. Each figure is a big teal numeral with its label underneath in soft ink. Figures are divided by 1px ink lines.

### Contents line
- A wrapped row of links to the numbered sections. Each link is a teal number followed by the section name in ink. The name underlines on hover.

### Topic chips
- **Style:** square, 2px ink border, paper fill, Manrope 700 at 14px, at least 36px tall. A small count in Inter sits after the label.
- **State:** hover fills with wash. Selected (pressed) is solid ink with paper text. The color change eases over 160ms; it is turned off when the user asks for reduced motion.

### Numbered sections
- A 3px ink rule across the top, the teal number in its own column, the headline title, an optional sort select on the right, and a short intro in soft ink.

### Ballot marks (signature component)
- A small square box, at least 46px wide, Manrope 800 at 13px, uppercase.
- **Yes:** filled ink box, paper text.
- **No:** empty box with a 2px ink border.
- **Anything else** (Absent, Present, Not voting): dashed border, soft-ink text, normal case.
- A key under the Votes section shows all three marks with what they mean.

### Status
- The outcome word (Passed, In committee, Failed, Vetoed) in Manrope 700 at 13px.
- Failed and Vetoed get a 2px coral outline. A committee leadership role gets a yellow fill with fixed ink text.

### Tags
- Small Inter 600 labels at 12px with a 1px border.
- **Compass topic:** teal border and teal text; on hover it fills teal with paper text. It is a button that links the record to the Compass.
- **Not a Compass topic:** dashed hairline border, soft-ink text.

### Ceremonial pocket (signature component)
- Recognitions, honors and memorials are gathered into one collapsible box with a 2px ink border, so they do not crowd the substantive bills.
- The header has a wash fill, a count ("4 ceremonial resolutions: recognitions, honors and memorials") and a teal "Show" action. When open, a 2px ink rule separates the header from the list.

### Source links
- Teal text links with a 1px underline that thickens to 2px on hover. Document links carry a small drawn document icon (inline SVG). Every bill, vote and sponsorship has one. The accessible name says which item it belongs to and that it opens in a new tab.

### Buttons and select
- **Show all:** centered under a long list, 2px ink border, paper fill, Manrope 700 at 14px; wash on hover.
- **Text buttons** (Back, Show the full text): teal, no box, underline.
- **Sort select:** 2px ink border, paper fill, Inter 600 at 14px, at least 36px tall.

### Long quotes
- A sponsorship sentence longer than 180 characters is clamped to two lines, in soft ink, with a "Show the full text" text button.

### States
- **Loading:** three wash-colored placeholder bars (name, line, block) that gently pulse. The pulse stops when the user asks for reduced motion.
- **Empty:** a plain sentence in soft ink that says what is missing (for example, no bills match the chosen topic, or every item here is ceremonial). Never a picture, never invented data.
- **Error:** a plain sentence that says the data could not be loaded and to try again later.
- **Focus:** a 3px yellow outline, 2px out from the element.

## Do's and Don'ts

### Do:
- **Do** scope every token to the `.rg` wrapper until the look is adopted by other pages.
- **Do** separate things with ink rules: 8px for the masthead, 3px for sections and the At a glance box, 2px for small boxes, 1px between rows.
- **Do** set section numbers and big figures in teal Manrope 800 with tabular numbers.
- **Do** show Yes as a filled ink box and No as an empty ink box; use a dashed box for anything else.
- **Do** keep coral as a 2px outline on Failed or Vetoed only.
- **Do** put a source link on every item.
- **Do** keep text on yellow at `#0d1117` in both light and dark mode.

### Don't:
- **Don't** use shadows, cards, rounded corners or dashboard stat tiles.
- **Don't** use coral for a No vote, for text, or as a fill.
- **Don't** add a second yellow tab or use yellow as decoration.
- **Don't** add small uppercase labels above headings; uppercase is for the running head, the tab and section subheads only.
- **Don't** show party affiliation anywhere.
- **Don't** fill an empty state with sample or invented records.
