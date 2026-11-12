// components/MetricCard.jsx
//
// A single data tile: tiny label, big tabular number, unit.
// Designed to look like a readout on a piece of scientific equipment.

export default function MetricCard({ label, value, unit, hint, accent = "signal" }) {
  const isMissing = value == null || Number.isNaN(value);
  const accentClass = {
    signal: "text-signal",
    good:   "text-signal-good",
    warm:   "text-signal-warm",
    danger: "text-signal-danger",
  }[accent] ?? "text-signal";

  return (
    <div className="panel p-4 group hover:border-signal/40 transition-colors">
      <div className="flex items-center justify-between">
        <span className="label-mono">{label}</span>
        <span className="h-1 w-1 rounded-full bg-signal/60 group-hover:bg-signal" />
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span
          className={`data-num font-display text-3xl leading-none ${
            isMissing ? "text-mist" : accentClass
          }`}
        >
          {isMissing ? "—" : value}
        </span>
        {!isMissing && unit && (
          <span className="text-xs font-mono text-mist">{unit}</span>
        )}
      </div>
      {hint && (
        <p className="mt-2 text-[11px] leading-snug text-mist">{hint}</p>
      )}
    </div>
  );
}
