/**
 * SegmentedControl — iOS-style pill toggle with ARIA radiogroup semantics.
 * Used for the Elected/Appointed filter (Phase 100) and other filter dimensions.
 */
export default function SegmentedControl({ options, value, onChange, ariaLabel, minHeight }) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      style={{
        display: 'inline-flex',
        width: '100%',
        borderRadius: '9999px',
        backgroundColor: '#f0f8fa',
        border: '1px solid #e2e8f0',
        padding: '4px',
      }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          style={{
            flex: 1,
            textAlign: 'center',
            borderRadius: '9999px',
            padding: '8px 0',
            minHeight: minHeight || undefined,
            fontSize: '14px',
            fontWeight: value === option.value ? 600 : 400,
            color: value === option.value ? '#ffffff' : '#4a5568',
            backgroundColor: value === option.value ? '#00657c' : 'transparent',
            boxShadow: value === option.value ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'Manrope', sans-serif",
            transition: 'background-color 0.15s ease, color 0.15s ease',
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
