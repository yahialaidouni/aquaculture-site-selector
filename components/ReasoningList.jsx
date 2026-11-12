// components/ReasoningList.jsx
//
// Renders the per-factor breakdown: for each criterion we received,
// show its value, score, band label, and the one-line reason that
// explains *why* it falls into that band.
//
// The shape of each factor matches what `evaluate()` in suitability.js
// returns:  { key, label, unit, value, score, band, weight, reason }

const TONE_TEXT = {
  good:   "text-signal-good",
  signal: "text-signal",
  warm:   "text-signal-warm",
  danger: "text-signal-danger",
  mist:   "text-mist",
};
const TONE_BG = {
  good:   "bg-signal-good",
  signal: "bg-signal",
  warm:   "bg-signal-warm",
  danger: "bg-signal-danger",
  mist:   "bg-mist",
};

function formatValue(value, unit) {
  if (value == null) return "—";
  // Wave height needs 2 decimals; everything else 1
  const digits =
  unit === "m" || unit === "m/s"
    ? 2
    : unit === "%"
    ? 0
    : 1;
  return `${Number(value).toFixed(digits)} ${unit}`;
}

export default function ReasoningList({ factors }) {
  if (!factors?.length) return null;

  return (
    <section className="panel p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="label-mono">Why this score</h2>
        <span className="text-[10px] font-mono text-mist">
          {factors.length} factors evaluated
        </span>
      </div>

      <ul className="space-y-4">
        {factors.map((f) => (
          <li key={f.key} className="flex gap-3">
            {/* Per-factor color dot — matches its own band, not the overall */}
            <span
              className={`mt-1.5 h-2.5 w-2.5 flex-none rounded-full ${TONE_BG[f.band.tone]}`}
              aria-hidden
            />

            <div className="flex-1 min-w-0">
              {/* Header row: factor name + band badge */}
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-bone">{f.label}</span>
                <span
                  className={`text-[10px] font-mono uppercase tracking-[0.15em] ${TONE_TEXT[f.band.tone]}`}
                >
                  {f.band.label}
                </span>
              </div>

              {/* Measured value + score + weight share */}
              <div className="mt-0.5 flex items-baseline gap-2 flex-wrap">
                <span className="font-mono text-sm text-bone data-num">
                  {formatValue(f.value, f.unit)}
                </span>
                <span className="font-mono text-[11px] text-mist">
                  · {f.score}/100 · {Math.round(f.weight * 100)}% weight
                </span>
                {f.critical && (
                  <span className="font-mono text-[10px] uppercase tracking-wider text-signal-warm/80">
                    critical
                  </span>
                )}
              </div>

              {/* The "why" sentence */}
              <p className="mt-1.5 text-[12px] leading-relaxed text-bone/80">
                {f.reason}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
