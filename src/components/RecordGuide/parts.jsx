import { createContext, useContext, useState } from 'react';
import {
  formatBillNumber,
  positionKind,
  positionWord,
  outcomeWord,
  isNegativeOutcome,
} from '../../lib/recordGuide';

/** A numbered section of the guide. `n` is its place in the contents line. */
export function GuideSection({ id, n, title, controls, intro, withKey = false, children }) {
  return (
    <section className="rg-sec" id={id} aria-labelledby={`${id}-h`}>
      <div className="rg-num" aria-hidden="true">{n}</div>
      <div>
        <div className="rg-sec-head">
          <h2 id={`${id}-h`}>{title}</h2>
          {controls}
        </div>
        {intro && <p className="rg-sec-intro">{intro}</p>}
        {withKey && <MarkKey />}
        {children}
      </div>
    </section>
  );
}

/** Yes / No / other, set as a ballot mark. */
export function Mark({ position }) {
  return (
    <span className="rg-mark" data-kind={positionKind(position)} data-testid="position">
      {positionWord(position)}
    </span>
  );
}

/** "Passed", "Failed"…; only what did not go through gets the coral box. */
export function Status({ value }) {
  const word = outcomeWord(value);
  if (!word) return null;
  return (
    <span className="rg-status" data-negative={isNegativeOutcome(word) ? 'true' : 'false'} data-testid="status">
      {word}
    </span>
  );
}

export function BillNo({ number }) {
  return <span className="rg-billno">{formatBillNumber(number)}</span>;
}

/** Lets a topic tag set the page's topic filter. */
export const TopicFilterContext = createContext(null);

/**
 * Topic labels under an item. A Compass topic is a button that files the page under its category;
 * a topic the Compass does not cover is plain text, marked as outside the Compass.
 */
export function TopicTags({ topics }) {
  const setTopic = useContext(TopicFilterContext);
  if (!topics || topics.length === 0) return null;
  return (
    <div className="rg-tags">
      {topics.map((t) =>
        t.compass && setTopic ? (
          <button
            key={`${t.group}|${t.label}`}
            type="button"
            className="rg-tag"
            data-compass="true"
            aria-label={`${t.label}: show everything on this topic`}
            onClick={() => setTopic(t.group)}
          >
            {t.label}
          </button>
        ) : (
          <span key={`${t.group}|${t.label}`} className="rg-tag" data-compass="false" title="Not a Compass topic">
            {t.label}
          </span>
        ),
      )}
    </div>
  );
}

export function BackArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13.5 8h-11M6.5 3.5 2 8l4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 1.75h5.25L12.5 5v9.25H4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 1.75V5.25h3.5M6 8.25h4.5M6 11h4.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * A link to an outside source. The visible text is short ("Bill page"); the accessible name says
 * which item it belongs to ("Bill page for SB 239 (opens in a new tab)").
 */
export function SourceLink({ href, kind, of, doc = false }) {
  if (!href) return null;
  return (
    <a className="rg-doc" href={href} target="_blank" rel="noopener noreferrer" aria-label={`${kind} for ${of} (opens in a new tab)`}>
      {doc && <DocIcon />}
      {kind}
    </a>
  );
}

/** A long quotation, two lines until opened. */
export function Quote({ text }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  const long = text.length > 180;
  return (
    <>
      <p className="rg-quote" data-clamped={long && !open ? 'true' : 'false'}>{`“${text}”`}</p>
      {long && (
        <button type="button" className="rg-link-btn" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? 'Show less' : 'Show the full text'}
        </button>
      )}
    </>
  );
}

/** Ceremonial items, set aside in their own counted pocket. */
export function CeremonialPocket({ count, children }) {
  if (!count) return null;
  return (
    <details className="rg-pocket">
      <summary>
        <span>
          {count} ceremonial {count === 1 ? 'resolution' : 'resolutions'}: recognitions, honors and memorials
        </span>
        <span className="rg-pocket-action">
          <span className="rg-when-closed">Show</span>
          <span className="rg-when-open">Hide</span>
        </span>
      </summary>
      {children}
    </details>
  );
}

/** "Show all 34" for a long list. */
export function useShowMore(items, limit = 20) {
  const [all, setAll] = useState(false);
  const visible = all ? items : items.slice(0, limit);
  const button =
    !all && items.length > limit ? (
      <button type="button" className="rg-more" onClick={() => setAll(true)}>
        Show all {items.length}
      </button>
    ) : null;
  return [visible, button, () => setAll(false)];
}

/** "All years" plus each year, newest first. */
export function YearSelect({ years, value, onChange, label }) {
  if (!years || years.length < 2) return null;
  return (
    <select className="rg-select" aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="All">All years</option>
      {years.map((y) => (
        <option key={y} value={y}>{y}</option>
      ))}
    </select>
  );
}

/** The ballot marks, explained once. */
export function MarkKey() {
  return (
    <div className="rg-key" aria-hidden="true">
      <span><span className="rg-mark" data-kind="yes">Yes</span> voted yes</span>
      <span><span className="rg-mark" data-kind="no">No</span> voted no</span>
      <span><span className="rg-mark" data-kind="other">Absent</span> did not vote yes or no</span>
    </div>
  );
}

