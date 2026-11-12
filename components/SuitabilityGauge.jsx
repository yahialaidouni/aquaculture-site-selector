// components/SuitabilityGauge.jsx
//
// Circular SVG gauge showing the 0-100 suitability score.
// Uses stroke-dasharray to animate the arc.

export default function SuitabilityGauge({ score, band }) {
  const value = score ?? 0;
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  // Arc covers 75% of the circle (from -135° to +135°)
  const arcLength = circumference * 0.75;
  const fillLength = (value / 100) * arcLength;

  const tone = band?.tone ?? "mist";
  const strokeMap = {
    good:   "#34d399",
    signal: "#22d3ee",
    warm:   "#fbbf24",
    danger: "#f87171",
    mist:   "#2a3a55",
  };
  const stroke = strokeMap[tone];

  return (
    <div className="panel p-5 flex flex-col items-center">
      <div className="label-mono mb-3 self-start">Suitability index</div>

      <div className="relative">
        <svg width="160" height="160" viewBox="0 0 160 160">
          {/* Background track */}
          <circle
            cx="80" cy="80" r={radius}
            fill="none"
            stroke="#152238"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            transform="rotate(135 80 80)"
          />
          {/* Filled arc */}
          <circle
            cx="80" cy="80" r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${fillLength} ${circumference}`}
            transform="rotate(135 80 80)"
            style={{ transition: "stroke-dasharray 0.7s ease-out, stroke 0.3s" }}
          />
        </svg>

        {/* Center readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="data-num font-display text-5xl leading-none" style={{ color: stroke }}>
            {score ?? "—"}
          </div>
          <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.2em] text-mist">
            / 100
          </div>
        </div>
      </div>

      <div className="mt-3 text-sm font-mono uppercase tracking-[0.15em]" style={{ color: stroke }}>
        {band?.label ?? "—"}
      </div>
    </div>
  );
}
