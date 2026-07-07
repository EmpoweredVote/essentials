# Quote Curation Principles

**Status:** canonical · **Owner:** Empowered Vote · **Last updated:** 2026-07-07

This is the *why* behind how Empowered Vote selects, edits, and publishes the candidate
quotes used in **Read & Rank** (and surfaced in the **Compass** and **Essentials**). It is
written to be shown to a skeptical reader — a journalist, a campaign, a citizen — so they can
see exactly what our judgment process is and hold us to it. Accountability is the point.

The **operational procedure** (how to actually pull, split, edit, and store a quote) lives in
the `publish-quotes` skill (`on-the-record/.claude/skills/publish-quotes/` — `SKILL.md`,
`EDITORIAL.md`, `REFERENCE.md`). This document is the principles layer that skill implements;
where the two ever disagree, **this document states the intent and the skill should be updated
to match.**

> **Anti-partisan commitment.** Empowered Vote does not push candidates. Every principle below
> exists to make quote curation an accurate, neutral portrayal of what candidates think — never
> a lever that makes one look better or worse. Where a rule is a judgment call (most are), the
> curator records *why*, so the judgment can be inspected.

---

## 1. What a Read & Rank quote is (and is not)

Three surfaces touch what a candidate says or believes. Keeping them distinct is the first
principle:

- **Compass** — *where* a candidate stands: an abstracted position on a topic's spectrum (a
  numeric value synthesized from both their **words and their deeds**), plus context and
  citations.
- **Essentials / the record** — *what they have done*: votes, history, past actions.
- **Read & Rank** — *their own words articulating an approach* on a topic, shown **blind** and
  ranked by citizens against other candidates' words on the same topic.

A Read & Rank quote is therefore:

1. **Forward-looking, not retrospective.** It is the candidate reasoning about what should be
   done and why — "here's how I'd approach this" — not a recitation of their record. The record
   lives in Essentials and the Compass.
2. **A position, not an attack.** It articulates the candidate's *own* stance or approach.
   (See §4.1 — attacking a *policy or office* is allowed; attacking a *person* is not.)
3. **Anonymous.** The whole mechanic is that citizens rank quotes without knowing who said
   them. The words themselves must not reveal the speaker. (See §4.2.)

### The operative-clause test

Real speech is messy: a candidate may scaffold a forward position with a bit of record or a
glancing contrast with an opponent. Judge a quote by its **operative clause** — what it is
*mainly* asserting.

- ✅ The main assertion is a forward-looking position/approach → eligible, even if scaffolded
  by a little record or an opponent mention.
- ❌ The record or the attack *is the point* of the quote → not eligible.

---

## 2. The quote record

A published quote is not a string — it is a record with several artifacts and its metadata.
The accountability principles (§6) depend on all of them existing.

| Artifact | Purpose | Status today |
|---|---|---|
| **Full source passage** | The verbatim original span the quote was drawn from. Powers audit / show-your-work (§6.4). | **Net-new** — not yet a column; `quote_text` holds only the edited quote. |
| **Canonical (revealed) quote** | The edited quote shown everywhere **post-reveal** and in Compass/Essentials. Single source of truth. | `essentials.quotes.quote_text` |
| **Blind quote** | Canonical **plus extra de-identification** (§4.5). Shown only on the blind Read & Rank card; relaxes to canonical at reveal. | `essentials.quotes.deidentified_text` (public serves `COALESCE(deidentified_text, quote_text)`) |
| **Justification** | Why this quote was selected + what was edited and why. | `essentials.quotes.editor_note` (required) |
| **Provenance** | Speaker, source name, venue/event, date, **source tier** (§5), **medium**, **timestamp + deep-link**, URL. | Partial — `source_name`, `source_url` (timestamp via `&t=<s>s`); tier/medium/venue/date **net-new** |
| **Topic + stance relationship** | Canonical `topic_key`; whether the quote is *reinforcing / elaborating / in-tension* with the Compass value (§7). | `topic_key` exists; relationship tag **net-new** |
| **Review metadata** | Who reviewed/approved; **last-reviewed date** (staleness clock, §6.6). | **Net-new** |
| **Edit history** | Git/Wikipedia-style log of every change, attributable. | **Net-new** (`editor_note` is point-in-time, not a running log) |
| **Corrections log** | Any correction, its reason, and who made it. | **Net-new** |
| **Live flag** | The one selected quote per (politician, topic). | `readrank_selected` (unique: ≤1 true per politician+topic) |

> The "net-new" rows describe the target record. Until the schema catches up, capture the
> equivalent information in the `editor_note` so no judgment call goes unrecorded.

---

## 3. One quote per candidate per topic

- **Guiding rule:** one live quote per candidate per topic. The curator's job per topic-cell is
  to pick that candidate's single best-qualifying statement.
- Drafts may exceed this (house cap: ≤2 drafts per politician+topic); a human then selects the
  one live quote.
- **Known limitation:** some quotes feel like they should split into two. We hold to
  one-per-candidate-per-topic for now; revisit if it becomes a real constraint.
- A topic is rankable only when **≥2 candidates** have a qualifying quote ("a topic with one
  voice is not a comparison"). A candidate with no genuine public position on a topic is simply
  **absent** from it — a legitimate, unflagged absence — and the topic still runs with the 2+
  who do have positions.

---

## 4. Selection principles

### 4.1 Position, not attack — with a carve-out

- A quote must articulate the candidate's own position/approach, not primarily attack an
  opponent.
- **Carve-out:** critiquing a **policy, law, or institution** (CEQA, unions, an administration's
  program) is legitimate position speech and is allowed — even when it sounds combative. The
  line is the **target**: attacking a *policy or office* stays; attacking a *person* (character,
  family, fitness) goes.
- When a policy critique **names a person** (an opponent, a governor), that name is
  depersonalized **for the blind card only** — e.g. "Newsom" → "[the current administration]" —
  preserving the policy substance. The canonical/revealed quote keeps the name (accountability).
- **Divergence is not the goal.** Two candidates may hold nearly the same position; that's fine.
  The useful signal is often a difference in *approach* to the same end. Never reject a quote
  for being close to an opponent's, and never manufacture contrast.

### 4.2 Anonymity (a first-class selection axis)

The quote text must not reveal who said it. Touting one's own record is doubly disqualifying —
it's retrospective *and* it fingerprints the speaker ("as the mayor who passed Measure H…").

- Prefer quotes that are naturally anonymous.
- Where a great quote has a self-identifying clause, **de-identify by editing** (§4.5) rather
  than reject — **capped:** you may only remove/neutralize identifying material if doing so
  **does not change the position.** If the identity is load-bearing to the meaning, reject
  instead.
- De-identification is high-scrutiny (§6.3).

### 4.3 Representativeness / context-integrity

A quote can be verbatim, well-sourced, and forward-looking and *still* misrepresent. The
curator must read the **full surrounding answer**, not just the span, and be confident the quote
states a position the candidate is **genuinely asserting as their own**. Exclude:

- **Hypotheticals** stated to explore, not endorse.
- **Devil's advocate / steelmanning** of a view they then reject.
- **Concessions** where the real position is the "but…" that follows.
- **Sarcasm / rhetorical questions.**
- **Walked-back statements** — corrected or reversed within the same answer/event.
- **Quoting someone else approvingly** — that's not their own articulated position.

**Same-event contradiction duty:** you don't have to audit a candidate's whole career, but you
may not ignore a contradiction sitting in the *same transcript you are reading*. If they say one
thing in answer 3 and the opposite in answer 7, you can't present answer 3 as their clean
position without resolving the tension.

### 4.4 Recency / currency

- **Hard requirement:** the quote must reflect the candidate's **current** position. Never use a
  position they have since publicly reversed or abandoned — being out-of-date is a
  misrepresentation, like being out-of-context.
- **Strong preference (not absolute):** prefer the most recent clear articulation. A slightly
  older quote may win only if it states the *same* current position far more cleanly — noted in
  the justification.
- **Per topic:** surface each candidate's most recent articulation of their position on that
  topic.
- Currency is maintained over time, not just at first curation (§6.6).

### 4.5 Editing (see EDITORIAL.md for mechanics)

Governing principle: **an edit may improve readability or remove an identity leak, but must
never change the substance of the position — its strength, conditionality, scope, or object.**

**Marking policy** (readability and honesty coexist because the full passage is always
auditable, §6.4):

- **Silent removal (no mark):** pure verbal tics ("um," "you know"), stutters, and
  self-corrections / false starts.
- **`…` required:** any removal of substantive words or a span.
- **`[brackets]` required:** any inserted, substituted, or clarified word — including
  de-identification substitutions.

Rules:

- **Never reorder** the speaker's points.
- **Hedges vs. qualifiers:** anything that modifies the *certainty, conditionality, or scope* of
  the position is load-bearing and uncuttable ("I support X **but only if** Y"). Only pure
  conversational filler is cuttable. **When in doubt, keep it.**
- **Stitching:** join non-contiguous spans only **within a single continuous answer/thought**,
  with an honest `…` marking the gap. Never stitch across different questions or topics to
  assemble a position the candidate never stated as one.
- **Two-layer de-identification:**
  - *Canonical (revealed) quote* keeps names and speaker self-identification (accountability).
  - *Blind quote* additionally **depersonalizes named people** (§4.1) and **strips speaker
    self-identification** ("as governor," "in my district," own record). These extra redactions
    still obey the substance cap and are still honestly marked; they relax to the canonical
    quote at reveal.
  - **Speaker-blinding is a standard step**, not an afterthought — every quote gets a blind
    version, not just the occasional one.
- **Ellipsis-density as a quality signal:** if a quote needs many elisions to cohere, the source
  span is probably too scattered — prefer a more contiguous passage. Few marks = better span.

---

## 5. Source principles

Prefer sources where the candidate is **personally speaking, on the record, in a context of
public accountability** — ideally responding to a question. This favors authenticity and
verifiability (spoken sources deep-link to video).

**Hierarchy (best → worst):**

1. **Debates & candidate forums** — spoken, on-record, probed.
2. **News interviews** — spoken, on-record, questioned.
3. **Prepared public remarks** — stump/floor speeches, testimony (spoken, unprobed).
4. **Candidate-bylined written** — op-eds, official platform, *only if clearly the candidate's
   own words.*
5. **Hard-excluded — not merely deprioritized:** hot-mic, private, secretly-recorded, or clearly
   off-the-cuff "gotcha" remarks. Using off-guard speech is the manufactured-drama we reject and
   it corrodes trust. **Do not use.**

- **Hard filter, soft preference:** strongly prefer tiers 1–2; allow 3–4 *with a justification
  note explaining why*; hard-exclude tier 5.
- **Social media is a distribution channel, not a source type** — classify by the *utterance*:
  - Video of the candidate speaking, posted to social → slot by speaking context (tier 2–3);
    video-verifiable.
  - First-person **text** post stating a considered position → allowed at ~tier 4 but
    **high-scrutiny** (§6.3): confirm authorship (accounts are often staff-run) and watch that
    the post isn't an already-stripped qualifier.
  - Reactive posts — dunks, quote-tweets, jokes → excluded (position-not-attack + off-the-cuff).

**Accuracy floor (under everything):**

- **Correct speaker** — verify it's the candidate, not a moderator/another candidate/crosstalk.
- **No fabricated completions** — don't finish an interrupted sentence.
- **Transcription fidelity ≠ editing** — fixing an ASR error to match what was actually said
  (verified) is *accuracy*, not a substantive edit. Removing/altering words they *did* say is an
  edit (§4.5).
- **Verification-link integrity** — the timestamp/deep-link must actually contain the quote.
- **Primary-source (audio/video) verification is strongly preferred and is a stated future
  goal.** Today the working standard is a high-quality speaker-attributed transcript, with
  audio-checks for anything ambiguous. The transcript is a search index; the recording is truth.

---

## 6. Accountability

### 6.1 Justification (`editor_note`) — required

Every quote records, for a skeptical reader: **why this quote** (what position it captures, why
it's the clearest evidence) and, **if edited, exactly what changed and why.** If verbatim, say
so. This is the defense of the wording. The core curation act is **idea triage** — a rambling
answer contains many ideas; keep the ones most representative of the candidate's *distinctive
approach* and those that create a *genuine, legible contrast*; cut supporting stats,
mechanics-explainers, and topical asides. Record which and why.

### 6.2 Edit history *(net-new)*

Beyond the point-in-time `editor_note`, every change to a quote is logged — who changed what,
when — like a git or Wikipedia history, so authorship and evolution are attributable.

### 6.3 Human-in-the-loop, AI role, and review

- **A named human is accountable for every published quote.** AI assists; a human owns the
  result. The log attributes decisions to the human, never "the AI."
- **AI may:** locate quotes, propose trims and de-identification, draft the justification, flag
  high-scrutiny cases, suggest topic mapping, check length/parity. **Human must:** verify
  against the source, judge representativeness (§4.3), approve the final trim and every de-id
  call, sign the justification, own it. AI output is a draft, not a decision.
- **High-scrutiny class** (needs an explicit justification note, and ideally a second set of
  eyes): de-identification edits, tier 3–4 sources, text-only social, in-tension quotes (§7),
  older-quote exceptions.
- **Review model:** for now, a single accountable curator + full log + justification is the bar;
  a second human reviewer is aspirational — **except for dispute resolution, where the resolver
  must not be the sole original curator** (independence matters most when a call is contested).
  **Target state:** a standing panel of ~5–7 human reviewers for every quote (ideally
  ideologically balanced, to reinforce §8).

### 6.4 Show-your-work (auditable trimming)

The canonical stored artifact is the **full source passage**; the published quote is a **marked
subset** of it. Any provenance-bearing surface can let a reader **expand to the full context
with the retained spans highlighted** — every trim transparent and falsifiable.

> **Blindness constraint:** this expand-to-context view is a **reveal / Essentials / Compass**
> feature only — **never on the blind Read & Rank card.** Surrounding context is itself an
> identity vector.

### 6.5 Corrections & disputes

- **Intake:** a low-friction, public channel for anyone (candidate, campaign, citizen) to flag a
  quote.
- **Triage by claim type:** accuracy (misquote/ASR) · context (out-of-context/unrepresentative)
  · staleness (position changed) · identity (de-id failure) · parity/bias.
- **Resolution:** re-verify against the primary source, then correct / re-curate / replace /
  remove, and **log it with reason + who** (like a newspaper correction). Defer to the
  candidate's **current preferred articulation** when they say "that's not my position anymore /
  here's what I meant" (consistent with §4.4).
- **The removal/edit bar:** a change is warranted **only** for a violation of **accuracy,
  context-integrity, currency, anonymity, or parity.** It is **not** warranted because a
  candidate finds an accurate, in-context, current position **unflattering.** "This isn't what I
  said / meant / believe anymore" is grounds; "I don't like how this looks" is not. This line is
  what keeps the product from becoming a candidate-approved PR feed.
- **Visibility:** corrections are **public**, surfaced as close to the quote as blindness allows
  (at/after reveal, adjacent to the quote) — never buried far away, which reads as hiding them;
  never on the blind card.
- **Response time:** informal for now.

### 6.6 Staleness / re-review

Quotes have a shelf life. Re-review is:

- **Event-triggered** — a new debate, a public reversal, a major vote.
- **Time-triggered** — every quote carries a **last-reviewed date** and is flagged for
  re-review on a periodic clock (**~1 year** default). Not an expiration that removes the quote —
  a review-by date that surfaces it for a currency check.

Cadence is aspirational / informal for now.

---

## 7. The Compass coupling model

The shared unit between Read & Rank and the Compass is the **`topic_key`, not the stance value.**
The Compass value is a number synthesized from words *and* deeds across many sources; a Read &
Rank quote is one candidate's prose from one moment. **A quote can therefore never *be* the
Compass stance — at most it is one piece of evidence consistent with it.**

A quote attaches to a `topic_key` and must be genuinely *about* that topic and articulate the
candidate's approach on it. Mapping to the Compass axis is a bonus, not a requirement. The
relationship between a quote and the synthesized stance is one of three:

- **Reinforcing** — the quote clearly illustrates the direction of the numeric stance. →
  *Preferred* when surfacing a quote inside Compass/Essentials next to the value.
- **Elaborating / orthogonal** — genuinely about the topic but on a different sub-dimension than
  the axis measures (e.g. a "convene everyone" approach quote). → A valid Read & Rank quote;
  used as "in their words" color, not as Compass evidence.
- **In tension** — the quote pulls against the synthesized value. → **Flag, don't silently
  surface.** It means either the Compass value needs re-review or the quote is unrepresentative
  (a §4.3/§4.4 problem). Resolve before surfacing next to the value.

So: *same topics, not necessarily the same axes.* Prefer reinforcing quotes inside the Compass;
allow elaborating quotes as color; never drop an in-tension quote next to the value unresolved.

---

## 8. Topic-portfolio balance

Bias can hide in *which topics a race surfaces*, not just in the quotes.

- **Selection driver = voter salience + the shared Compass taxonomy, never candidate advantage.**
- **Neutral, evenly-applied availability filter** — the ≥2-qualifying-quotes rule (§3) is applied
  with **equal curation effort** across candidates and topics; you don't dig harder for one side.
- **Symmetry rule:** never omit a topic to protect a candidate; never include one to expose a
  candidate.
- **Standard = process neutrality with a skew audit.** Guarantee equal *effort* and neutral
  *criteria*; accept that *outcomes* may differ (a candidate may genuinely be more articulate or
  more on-record — that is information voters should have, not an artifact to sand down). Step
  back from the finished topic set: if it systematically flatters one candidate, that is a signal
  to *investigate* (true reflection, or an effort gap to fill), **not** license to engineer
  outcome balance.

---

## 9. Worked example — CA Governor, Housing

Topic `housing` (Compass axis ≈ government's role: *less ↔ more*), question: *"What role should
government play in making sure people can afford housing?"* Two candidates, real debate quotes.

**Hilton — full (debate):**

> "Get rid of the … mainly environmental regulations that are making it much more expensive to
> build housing… That's because of something called CEQA… the private right of action… 70% of
> CEQA lawsuits are used to block housing… filed by the unions, labor unions to extract… project
> labor agreements… There's this ideology of what they call density… They call it sprawl, I call
> it the California dream. A single family home where you can raise your family with a yard…
> Barely 5% of our land in California is developed at all. There is plenty of room to build
> outwards…"

**Hilton — curated (honestly marked, ~axis: deregulate / build out):**

> "Get rid of the … environmental regulations that are making it much more expensive to build
> housing — the basic cost of building is four or five times as high in California. … 70% of CEQA
> lawsuits are used to block housing … filed by … labor unions to extract … project labor
> agreements. … We have to end the war on single family homes. They call it sprawl, I call it the
> California dream — a home … with a yard. … Barely 5% of our land in California is developed …
> [there's] plenty of room to build outwards."

**Becerra — curated (honestly marked, ~axis: coordinate / build up):**

> "We've seen … a little more than a hundred thousand units built over the last few years. If we
> can double, triple that, get it to about 300,000, that would be a pretty good achievement — we
> have to go beyond that. Let's … streamline the regulatory process so that we can get developers
> through … much quicker, ask our local governments to stop imposing so many impact fees, [and] …
> have a statewide coordinated housing policy so it makes sense where we build — [building] up and
> by transit. … I will declare a state of emergency when I become a governor … to move this as
> quickly as possible."

What this example teaches:

- **Preserve divergence when trimming overlap.** Both bash regulation/impact fees. If you trim
  each to *just* that shared line you erase the real contrast, misrepresent Becerra by omission,
  and make the blind ranking meaningless. The genuine, legible contrast is **build up (Becerra:
  coordinate, transit, emergency powers) vs. build out (Hilton: deregulate, anti-union,
  single-family "California dream").** Protect it.
- **Attack carve-out (§4.1):** "war on single family homes," "Wall Street," "labor unions" are
  critiques of *policies/institutions*, not the opponent — allowed.
- **De-identification (§4.5):** Becerra's "state of emergency" is close to a signature pledge —
  high-scrutiny; it's load-bearing to his approach, so keep it and note it. Any named opponent
  would be depersonalized on the blind card only.
- **In-tension nuance (§7):** Becerra's "streamline / cut impact fees" could naively read toward
  the deregulate pole; the trim keeps his *coordinated-government* framing so the quote stays
  representative of his actual (more-government) stance.
- **Editing (§4.5):** the stutter "the last cog **in the in the** process" → silently repaired;
  substantive cuts (the fire-hazard/insurance asides, the CEQA mechanics-explainer) marked `…`.

---

## 10. Where this lives

- **This document** — canonical principles, in `essentials/docs/`.
- **Operational procedure** — the `publish-quotes` skill
  (`on-the-record/.claude/skills/publish-quotes/`): `SKILL.md` (workflow),
  `EDITORIAL.md` (editing mechanics), `REFERENCE.md` (`essentials.quotes` schema).
- **Related skills** — `research-stances` and `compass-topic-builder` (ev-accounts) should point
  here so stance/quote work stays consistent with these principles.
