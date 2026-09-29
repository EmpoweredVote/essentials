/**
 * Explains why a whole government body's members have no photograph.
 *
 * WHY IT SITS ABOVE THE CARDS, NOT ON THEM
 *
 * A result card is 448x127 and already carries three lines. There is no room for a paragraph on
 * it, and repeating the same paragraph on every member of a 105-seat legislature would be worse
 * than useless. More importantly (Cantrell, 2026-09-29): a reader should not be able to look at
 * the placeholders WITHOUT first being given the context. So this renders once, as the first
 * thing inside the body's section, above the first card.
 *
 * WHY IT IS NOT AN ERROR STYLE
 *
 * Nothing has gone wrong. A red box would read as a fault in the page; this is a decision taken
 * elsewhere, stated plainly. Amber, the same treatment the site uses for "read this", not "this
 * broke".
 *
 * The copy is NOT written here. It comes from essentials.photo_restrictions via the API, so
 * adding the next publisher that reserves its portraits is one database row, not a release.
 */
export default function PortraitRestrictionNotice({ restriction }) {
  if (!restriction || !restriction.body) return null;

  const paragraphs = String(restriction.body)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div
      style={{
        background: '#FFF8E6',
        border: '1px solid #F0DCA8',
        borderLeft: '4px solid #D0A301',
        borderRadius: 8,
        padding: '12px 14px',
        margin: '0 0 14px',
        maxWidth: 448,
      }}
    >
      <p
        style={{
          margin: '0 0 6px',
          fontSize: 13,
          fontWeight: 700,
          color: '#7B640E',
          display: 'flex',
          alignItems: 'center',
          gap: 7,
        }}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#D0A301"
          strokeWidth="2.2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9.5" />
          <path d="M12 7.5v5.5M12 16.4v.1" />
        </svg>
        {restriction.headline}
      </p>
      {paragraphs.map((p, i) => (
        <p
          key={i}
          style={{
            margin: i === paragraphs.length - 1 ? 0 : '0 0 7px',
            fontSize: 12,
            lineHeight: 1.5,
            color: '#5B4B10',
          }}
        >
          {p}
        </p>
      ))}
    </div>
  );
}
