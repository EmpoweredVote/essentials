import { useEffect, useRef, useState } from 'react';

/**
 * CompassIntro — three-step animated intro shown in the left zone of CompassCard
 * when the viewer has no compass yet (guest, or logged in with no answers).
 *
 * Mirrors the Compass app's "learn" onboarding (compass.empowered.vote): a visual
 * on a card with a soft halo, then a "Step N of 3" label, title and body. The text
 * slides vertically between steps; the visual swaps with a fade/scale. Users move
 * between steps with Next / Previous, the dots, or by swiping left/right on the visual.
 *
 * Step 1 shows answering: questions arrive, five positions slide in, one gets picked,
 *        and the next question takes its place — looping until the viewer moves on.
 * Step 2 shows the payoff: those answers drawn as a shape across all eight issues.
 * Step 3 shows comparing: your shape over this candidate's, alignment pulsing.
 *
 * Step 1 used to be the first half of step 2 — a single pick that flipped to the
 * radar after 2.3s. It read as someone choosing a topic rather than answering a
 * question, and was gone before it could be understood. It is now its own step,
 * paced to be read, and the radar it used to flip to is step 2.
 *
 * Animations are CSS-only (no motion library) and are disabled under
 * prefers-reduced-motion.
 */

// Compass app theme tokens (light / dark) — kept in sync with compass.empowered.vote.
const LIGHT = {
  card: '#FFFFFF', border: '#D3D7DE', divider: '#D3D7DE',
  textHead: '#2F3237', textBody: '#535964', textMuted: '#6d7a9a', textAccent: '#00657C',
  btnBg: '#FED12E', btnText: '#1C1C1C', yellow: '#FED12E', bg: '#F7F7F8',
};
const DARK = {
  card: '#2F3237', border: '#41454E', divider: '#41454E',
  textHead: '#EBEDEF', textBody: '#D3D7DE', textMuted: '#9CA3AF', textAccent: '#59B0C4',
  btnBg: '#FED12E', btnText: '#1C1C1C', yellow: '#FED12E', bg: '#131416',
};

const USER_COLOR = '#7C6B9E';
const POL_COLOR = '#5A9A6E';
const ALIGN_COLOR = '#FED12E';

const LABELS = ['Housing', 'Climate', 'Schools', 'Safety', 'Health', 'Jobs', 'Justice', 'Taxes'];
const USER_VALUES = [0.9, 0.55, 0.95, 0.5, 0.78, 0.8, 0.92, 0.6];
const POL_VALUES = [0.6, 0.82, 0.55, 0.72, 0.5, 0.8, 0.5, 0.8];

/**
 * Step 1's script. Written for the demo, NOT taken from the live compass: the real
 * ladders run 40-70 characters an option and none of the 43 live topics has five
 * that fit this column, so quoting them would either overflow or be truncated into
 * something the compass does not actually say. These are plainly illustrative.
 *
 * Each `label` is one of LABELS, so the shape step 2 draws reads as the result of
 * the questions just watched rather than a separate idea.
 */
const DEMO_QUESTIONS = [
  {
    label: 'Housing',
    question: 'How much new housing should we build?',
    pick: 1,
    options: [
      'Build a lot more, fast',
      'More homes near transit',
      'Keep today’s pace',
      'Grow slowly and carefully',
      'Keep things as they are',
    ],
  },
  {
    label: 'Schools',
    question: 'Where should school money go?',
    pick: 3,
    options: [
      'Split it evenly statewide',
      'More to schools with least',
      'Keep funding as it is',
      'Let it follow each student',
      'Hand it to families',
    ],
  },
  {
    label: 'Taxes',
    question: 'Who should pay more in tax?',
    pick: 0,
    options: [
      'Much more from top earners',
      'A little more from the top',
      'Keep rates where they are',
      'Lower rates for everyone',
      'Cut taxes as far as we can',
    ],
  },
];

// Step 1 pacing. Long enough to read all five before one is picked, then long
// enough to take in which one it was. A full three-question loop is ~15s.
const PICK_AT = 2.8;
const ADVANCE_AT = 5.0;

function prefersReducedMotion() {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

const STYLES = `
@keyframes evi-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes evi-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
@keyframes evi-fill { from { fill-opacity: 0 } to { fill-opacity: 0.2 } }
@keyframes evi-pop { 0% { transform: scale(0); opacity: 0 } 70% { transform: scale(1.15); opacity: 1 } 100% { transform: scale(1); opacity: 1 } }
@keyframes evi-ping { 0% { transform: scale(1); opacity: 0.75 } 100% { transform: scale(2.1); opacity: 0 } }
@keyframes evi-halo { 0%, 100% { transform: scale(1); opacity: 0.6 } 50% { transform: scale(1.12); opacity: 0.9 } }
@keyframes evi-visual-in { from { opacity: 0; transform: scale(0.97) } to { opacity: 1; transform: scale(1) } }
@keyframes evi-slide-from-below { from { transform: translateY(100%); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
@keyframes evi-slide-from-above { from { transform: translateY(-100%); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
@keyframes evi-option-in { from { opacity: 0; transform: translateX(-12px) } to { opacity: 1; transform: translateX(0) } }
/* The picked row is marked by its border, its filled dot and a tint — all of which
   only have to clear 3:1 as non-text marks. The TEXT goes to the heading colour,
   not to the accent: when it turned accent-blue it measured 2.23:1 in light mode,
   making the selected answer the faintest line on the card. It is now 10.5:1 light
   and 8.8:1 dark. --evi-pick is textAccent, so it is #00657C light / #59B0C4 dark. */
@keyframes evi-select { from { background-color: transparent; border-color: var(--evi-border); color: var(--evi-body) }
                        to { background-color: var(--evi-pick-tint); border-color: var(--evi-pick); color: var(--evi-head) } }
@keyframes evi-radio { from { background-color: transparent; border-color: var(--evi-border) }
                       to { background-color: var(--evi-pick); border-color: var(--evi-pick) } }
.evi-anim { animation-fill-mode: both; }
@media (prefers-reduced-motion: reduce) {
  .evi-anim, .evi-anim * { animation-duration: 0.01ms !important; animation-delay: 0ms !important; animation-iteration-count: 1 !important; }
}
`;

function point(value, i, r = 64, c = 120) {
  const a = (2 * Math.PI * i) / LABELS.length;
  return [c + r * value * Math.sin(a), c - r * value * Math.cos(a)];
}

function polygonPoints(values) {
  return values.map((v, i) => point(v, i).map((n) => n.toFixed(1)).join(',')).join(' ');
}

/** Radar with shapes that draw in, dots that pop, and optional alignment pulses. */
function IntroRadar({ t, shapes, align = false, baseDelay = 0 }) {
  const aligned = align && shapes.length > 1
    ? shapes[0].values.reduce((acc, v, i) => (shapes.every((s) => Math.abs(s.values[i] - v) < 0.001) ? [...acc, i] : acc), [])
    : [];
  const dotDelay = (s, i) => baseDelay + 0.9 + s * 0.45 + i * 0.05;

  return (
    <svg viewBox="0 0 240 240" className="w-full h-full overflow-visible evi-anim" aria-hidden="true">
      <g className="evi-anim" style={{ animation: 'evi-fade 0.4s ease both' }}>
        {[0.33, 0.66, 1].map((x) => (
          <circle key={x} cx={120} cy={120} r={64 * x} fill="none" stroke={t.divider} strokeWidth="1" />
        ))}
        {LABELS.map((_, i) => {
          const [x2, y2] = point(1, i);
          return <line key={i} x1={120} y1={120} x2={x2} y2={y2} stroke={t.divider} strokeWidth="1" />;
        })}
      </g>
      {LABELS.map((label, i) => {
        const a = (2 * Math.PI * i) / LABELS.length;
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        const anchor = Math.abs(sin) < 0.35 ? 'middle' : sin > 0 ? 'start' : 'end';
        const dy = cos > 0.35 ? -3 : cos < -0.35 ? 9 : 3;
        return (
          <text
            key={label}
            x={120 + 86 * sin}
            y={120 - 86 * cos + dy}
            textAnchor={anchor}
            fontSize="8"
            fontWeight="700"
            fill={t.textMuted}
            className="evi-anim"
            style={{ animation: `evi-fade 0.4s ease ${baseDelay + 0.5 + i * 0.05}s both` }}
          >
            {label}
          </text>
        );
      })}
      {shapes.map((s, si) => {
        const d = baseDelay + 0.3 + si * 0.45;
        return (
          <polygon
            key={si}
            points={polygonPoints(s.values)}
            pathLength="1"
            fill={s.color}
            fillOpacity="0.2"
            stroke={s.color}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeDasharray="1"
            className="evi-anim"
            style={{ animation: `evi-draw 0.9s ease-in-out ${d}s both, evi-fill 0.4s ease ${d + 0.5}s both` }}
          />
        );
      })}
      {shapes.map((s, si) => s.values.map((v, i) => {
        if (aligned.includes(i)) return null;
        const [cx, cy] = point(v, i);
        return (
          <circle
            key={`${si}-${i}`}
            cx={cx}
            cy={cy}
            r={3.4}
            fill={s.color}
            className="evi-anim"
            style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: `evi-pop 0.45s cubic-bezier(.34,1.56,.64,1) ${dotDelay(si, i)}s both` }}
          />
        );
      }))}
      {aligned.map((i) => {
        const [cx, cy] = point(shapes[0].values[i], i);
        const d = dotDelay(shapes.length - 1, i);
        return (
          <g key={`align-${i}`}>
            <circle
              cx={cx} cy={cy} r={4.6} fill="none" stroke={ALIGN_COLOR} strokeWidth="1.6"
              className="evi-anim"
              style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: `evi-ping 1.7s ease-out ${d}s infinite` , opacity: 0 }}
            />
            <circle
              cx={cx} cy={cy} r={4.6} fill={ALIGN_COLOR} stroke={t.bg} strokeWidth="1.6"
              className="evi-anim"
              style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: `evi-pop 0.45s cubic-bezier(.34,1.56,.64,1) ${d}s both` }}
            />
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Step 1 visual: a questionnaire answering itself. A question arrives, its five
 * positions slide in, one is picked, the answer holds, and the next question takes
 * its place. It loops through DEMO_QUESTIONS indefinitely — the viewer leaves by
 * going to the next step, not by waiting for it to finish.
 *
 * Under prefers-reduced-motion nothing cycles and nothing moves: the first question
 * sits there with its answer already selected. The CSS above collapses the enter and
 * select animations to their end state, so that is exactly what renders.
 */
function QuestionnaireVisual({ t }) {
  const [index, setIndex] = useState(0);
  const reduced = prefersReducedMotion();

  useEffect(() => {
    if (reduced) return undefined;
    const id = setInterval(() => setIndex((n) => (n + 1) % DEMO_QUESTIONS.length), ADVANCE_AT * 1000);
    return () => clearInterval(id);
  }, [reduced]);

  const q = DEMO_QUESTIONS[index];

  return (
    <div
      className="w-full max-w-[17rem]"
      style={{
        '--evi-border': t.border,
        '--evi-body': t.textBody,
        '--evi-head': t.textHead,
        '--evi-pick': t.textAccent,
        '--evi-pick-tint': `${t.textAccent}22`,
      }}
    >
      {/* Keyed on the question so every row remounts and replays its entrance.
          Spacing is tighter than the four-option version this replaced: a question
          plus five rows is two rows' worth taller, and on desktop the visual only
          gets the height the text block and controls leave it. */}
      <div key={index} className="flex flex-col gap-2">
        <p
          className="text-xs font-bold tracking-widest uppercase text-center evi-anim"
          style={{ color: t.textMuted, animation: 'evi-fade 0.4s ease both' }}
        >
          {q.label}
        </p>
        {/* Fixed height: the questions are one or two lines, and letting the block
            resize between them would make FitToBox rescale the whole card. */}
        <p
          className="text-[13px] font-semibold text-center leading-snug evi-anim"
          style={{ color: t.textHead, minHeight: '2.6em', animation: 'evi-fade 0.4s ease 0.05s both' }}
        >
          {q.question}
        </p>
        {q.options.map((label, i) => {
          const isPick = i === q.pick;
          const enter = `evi-option-in 0.45s cubic-bezier(.22,1,.36,1) ${0.15 + i * 0.12}s both`;
          return (
            <div
              key={`${index}-${i}`}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl evi-anim"
              style={{
                border: `1.5px solid ${t.border}`,
                color: t.textBody,
                animation: isPick ? `${enter}, evi-select 0.3s ease ${PICK_AT}s both` : enter,
              }}
            >
              <span
                className="w-4 h-4 rounded-full shrink-0 evi-anim"
                style={{
                  border: `2px solid ${t.border}`,
                  animation: isPick ? `evi-radio 0.3s ease ${PICK_AT}s both` : undefined,
                }}
              />
              <span className="text-sm font-medium text-left leading-snug">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Step 2 visual: the answers resolved into a shape. All eight spokes, drawn from
 * USER_VALUES — three of them are the topics step 1 just asked about, so the shape
 * reads as the result of what was watched rather than a new idea.
 */
function PrioritiesVisual({ t }) {
  return (
    <div className="w-full flex flex-col items-center gap-3">
      <div className="w-full max-w-[15rem] aspect-square">
        <IntroRadar t={t} shapes={[{ values: USER_VALUES, color: USER_COLOR }]} />
      </div>
      <span className="flex items-center gap-2 text-sm font-semibold evi-anim" style={{ color: t.textBody, animation: 'evi-option-in 0.4s ease 1.2s both' }}>
        <span className="w-3 h-3 rounded-full" style={{ background: USER_COLOR }} /> Your compass
      </span>
    </div>
  );
}

/** Step 2 visual: your shape over the candidate's, with aligned spokes pulsing. */
// The legend deliberately says "A candidate" rather than this profile's politician:
// the green shape is POL_VALUES, a fixed sample, and putting a real person's name on
// it would present invented positions as that person's record.
function CompareVisual({ t }) {
  return (
    <div className="w-full flex flex-col items-center gap-3">
      <div className="w-full max-w-[15rem] aspect-square">
        <IntroRadar
          t={t}
          align
          shapes={[{ values: POL_VALUES, color: POL_COLOR }, { values: USER_VALUES, color: USER_COLOR }]}
        />
      </div>
      <div className="flex items-center gap-5 evi-anim" style={{ animation: 'evi-option-in 0.4s ease 1.2s both' }}>
        <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: t.textBody }}>
          <span className="w-3 h-3 rounded-full" style={{ background: USER_COLOR }} /> You
        </span>
        <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: t.textBody }}>
          <span className="w-3 h-3 rounded-full" style={{ background: POL_COLOR }} /> A candidate
        </span>
      </div>
    </div>
  );
}

/**
 * Scales its child down (never up) so it fits the box it is placed in. The intro's
 * visual card takes its height from the viewport on desktop, and the visuals have
 * a fixed natural size, so on a short screen they shrink instead of overflowing.
 */
function FitToBox({ children }) {
  const boxRef = useRef(null);
  const contentRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const box = boxRef.current;
    const content = contentRef.current;
    if (!box || !content || typeof ResizeObserver === 'undefined') return undefined;
    const fit = () => {
      const w = content.offsetWidth;
      const h = content.offsetHeight;
      if (!w || !h) return;
      setScale(Math.min(1, box.clientWidth / w, box.clientHeight / h));
    };
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    ro.observe(content);
    fit();
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={boxRef} className="absolute inset-0 flex items-center justify-center">
      <div ref={contentRef} className="w-[17rem] max-w-full flex justify-center" style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
        {children}
      </div>
    </div>
  );
}

export default function CompassIntro({ politicianName, ctaHref, isDark }) {
  const t = isDark ? DARK : LIGHT;
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const dragStart = useRef(null);
  const cardRef = useRef(null);
  const [inView, setInView] = useState(typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    if (inView || !cardRef.current) return undefined;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); io.disconnect(); }
    }, { threshold: 0.4 });
    io.observe(cardRef.current);
    return () => io.disconnect();
  }, [inView]);

  const steps = [
    {
      title: 'Calibrate your compass',
      body: 'Pick the issues that decide your vote and mark where you stand on each one. Every question offers five positions, from one end of the debate to the other.',
      visual: <QuestionnaireVisual t={t} />,
    },
    {
      title: 'See your priorities take shape',
      body: 'The Compass draws your answers into a shape that is yours alone — eight issues, and how far you lean on each of them.',
      visual: <PrioritiesVisual t={t} />,
    },
    {
      title: `See where you stand with ${politicianName || 'this candidate'}`,
      body: 'Lay your compass over theirs and the overlap does the explaining. Where you agree lights up, where you split is obvious. No party labels, no homework.',
      visual: <CompareVisual t={t} />,
    },
  ];
  const last = step === steps.length - 1;

  const go = (next) => {
    if (next < 0 || next >= steps.length || next === step) return;
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  // Swipe left → next, swipe right → previous (touch or mouse drag on the visual).
  //
  // Horizontal, not vertical: below lg this card is full width and 22rem tall, so a
  // vertical drag starting on it is almost always someone scrolling the page. Taking
  // that axis (touch-action: none) meant a scroll flick anywhere on the card changed
  // step instead of scrolling — and on the last step did nothing at all, leaving the
  // page stuck. `touch-action: pan-y` hands vertical back to the browser and leaves
  // us the horizontal axis, which is the usual carousel gesture anyway.
  //
  // setPointerCapture so a drag that ends outside the card still reports: mouse
  // pointers get no implicit capture, and a 60px swipe started near an edge leaves it.
  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragStart.current = { x: e.clientX, time: e.timeStamp };
  };
  const onPointerUp = (e) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const velocity = dx / Math.max(1, e.timeStamp - dragStart.current.time); // px/ms
    dragStart.current = null;
    // Velocity alone is not enough: a plain click jitters a couple of px over a few
    // ms, which clears 0.4 px/ms easily and used to advance the step on a click.
    const travelled = Math.abs(dx) > 10;
    if (dx < -60 || (travelled && velocity < -0.4)) go(step + 1);
    else if (dx > 60 || (travelled && velocity > 0.4)) go(step - 1);
  };

  useEffect(() => { dragStart.current = null; }, [step]);

  const current = steps[step];

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4 lg:h-full">
      <style>{STYLES}</style>

      {/* Visual card */}
      <div
        className="relative w-full shrink-0 rounded-3xl flex items-center justify-center h-[22rem] sm:h-[23rem] lg:h-auto lg:flex-1 lg:min-h-0 overflow-hidden select-none"
        style={{ background: t.card, border: `1px solid ${t.border}`, touchAction: 'pan-y', cursor: 'grab' }}
        ref={cardRef}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { dragStart.current = null; }}
        role="group"
        aria-roledescription="slide"
        aria-label={`Step ${step + 1} of ${steps.length}`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute w-64 h-64 rounded-full evi-anim"
          style={{ background: `radial-gradient(circle, ${t.textAccent}22 0%, transparent 70%)`, animation: 'evi-halo 4.5s ease-in-out infinite' }}
        />
        {/* Every visual here is invented: the radars from fixed sample values
            (USER_VALUES / POL_VALUES), the questionnaire from DEMO_QUESTIONS. They
            show how the compass works, not anyone's actual positions and not the
            live ladders. Label the card so nothing on it can be read as a real
            record. Outside FitToBox, so it keeps its size when the visual is
            scaled down on a short screen. */}
        <span
          className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
          style={{ background: t.bg, color: t.textMuted, border: `1px solid ${t.border}` }}
        >
          Example
        </span>
        {/* Inset box the visual is scaled to fit (card padding lives here). */}
        <div className="absolute inset-x-4 inset-y-5 sm:inset-x-6 sm:inset-y-6">
          <FitToBox>
            <div key={step} className="w-full flex justify-center evi-anim" style={{ animation: 'evi-visual-in 0.3s ease both' }}>
              {inView && current.visual}
            </div>
          </FitToBox>
        </div>
      </div>

      {/* Text — slides vertically between steps. Every step's text is laid in the
          same grid cell (inactive ones invisible) so the block is exactly as tall
          as the longest step: no jump between steps, no slack under the short one. */}
      <div className="relative w-full shrink-0 overflow-hidden grid" aria-live="polite">
        {steps.map((s, i) => (
          <div
            key={i === step ? `active-${step}` : `ghost-${i}`}
            aria-hidden={i !== step}
            className={`[grid-area:1/1] flex flex-col text-center items-center lg:text-left lg:items-start ${i === step ? 'evi-anim' : 'invisible'}`}
            style={i === step ? { animation: `${dir > 0 ? 'evi-slide-from-below' : 'evi-slide-from-above'} 0.5s cubic-bezier(.25,1,.5,1) both` } : undefined}
          >
            <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: t.textAccent }}>
              Step {i + 1} of {steps.length}
            </p>
            <h3 className="text-xl sm:text-[22px] font-extrabold leading-tight mb-2" style={{ color: isDark ? '#EBEDEF' : '#2F3237', letterSpacing: '-0.02em' }}>
              {s.title}
            </h3>
            <p className="text-[14px] sm:text-[15px] leading-relaxed" style={{ color: isDark ? '#D3D7DE' : '#535964' }}>
              {s.body}
            </p>
          </div>
        ))}
      </div>

      {/* Controls: Previous · dots · Next / CTA */}
      <div className="shrink-0 flex items-center justify-between gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => go(step - 1)}
          disabled={step === 0}
          aria-label="Previous step"
          className="px-3 sm:px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all hover:opacity-80 cursor-pointer whitespace-nowrap disabled:opacity-0 disabled:pointer-events-none"
          style={{ borderColor: t.yellow, color: t.textBody, background: 'transparent' }}
        >
          ←<span className="hidden sm:inline"> Previous</span>
        </button>
        <div className="flex items-center gap-2">
          {steps.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`Go to step ${i + 1}`}
              aria-current={i === step ? 'step' : undefined}
              className="h-2 rounded-full transition-all cursor-pointer"
              style={{ width: i === step ? 24 : 8, background: i === step ? t.textAccent : t.divider }}
            />
          ))}
        </div>
        {last ? (
          <a
            href={ctaHref}
            className="px-4 sm:px-5 py-2 rounded-full font-bold text-sm transition-all hover:opacity-90 active:scale-95 shadow-md whitespace-nowrap"
            style={{ background: t.btnBg, color: t.btnText }}
          >
            Calibrate<span className="hidden sm:inline"> your compass</span> →
          </a>
        ) : (
          <button
            type="button"
            onClick={() => go(step + 1)}
            className="px-6 py-2 rounded-full font-bold text-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer shadow-md whitespace-nowrap"
            style={{ background: t.btnBg, color: t.btnText }}
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}
