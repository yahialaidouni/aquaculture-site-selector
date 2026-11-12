// components/StatsPanel.jsx
//
// Right-side panel. V3 additions:
//   • New "Biogeochemistry" hint when Copernicus is not configured
//   • Raw measurements section expanded with salinity, chl, currents
//   • Compass-rose arrow showing current direction

import MetricCard from "./MetricCard";
import SuitabilityGauge from "./SuitabilityGauge";
import ReasoningList from "./ReasoningList";

function formatCoord(value, positive, negative) {
  if (value == null) return "—";
  const abs = Math.abs(value).toFixed(3);
  return `${abs}° ${value >= 0 ? positive : negative}`;
}

function fmt(value, digits = 1) {
  if (value == null || Number.isNaN(value)) return null;
  return Number(value).toFixed(digits);
}

// Compass bearing → cardinal direction abbreviation
function compass(deg) {
  if (deg == null) return "";
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(((deg % 360) / 45)) % 8];
}

// Small SVG arrow rotated to the current's flow direction
function CurrentArrow({ direction }) {
  if (direction == null) return null;
  return (
    <svg
      width="40" height="40" viewBox="0 0 40 40"
      style={{ transform: `rotate(${direction}deg)`, transition: "transform 0.5s" }}
      aria-label={`Flowing toward ${Math.round(direction)}°`}
    >
      <circle cx="20" cy="20" r="18" fill="none" stroke="#152238" strokeWidth="1" />
      <path d="M20 6 L24 18 L20 15 L16 18 Z" fill="#22d3ee" />
      <line x1="20" y1="15" x2="20" y2="32" stroke="#22d3ee" strokeWidth="1.5" />
    </svg>
  );
}

export default function StatsPanel({ location, data, loading, error }) {
  if (data?.invalidMarine && !loading && !error) {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="panel p-5 max-w-sm">
        <div className="label-mono text-signal-danger mb-2">
          LOCATION NOT SUPPORTED
        </div>

        <p className="text-sm text-bone">
          Marine environmental data is unavailable for this location. The selected site may be inland, freshwater, or outside the coverage area of the marine datasets used by this application.
        </p>
      </div>
    </div>
  );
}
  if (!location) {
    
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-8">
        <div className="font-display text-2xl text-bone mb-2">
          Select a marine site
        </div>
        <p className="text-sm text-mist max-w-xs leading-relaxed">
          Click anywhere on the map to evaluate a site across nine
          environmental factors.
        </p>
        <div className="scan-line w-32 h-px mt-6" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-5 space-y-5 animate-fade-up">
      {/* Coordinates */}
      <header className="pb-4 border-b border-steel">
        <div className="label-mono">Selected coordinates</div>
        <div className="mt-1 font-mono text-sm text-bone data-num">
          {formatCoord(location.lat, "N", "S")} &nbsp;·&nbsp;{" "}
          {formatCoord(location.lon, "E", "W")}
        </div>
      </header>

      {/* Loading */}
      {loading && (
        <div className="panel p-5">
          <div className="label-mono mb-2">Fetching</div>
          <div className="text-sm text-bone">
            Querying Open-Meteo, NOAA ERDDAP…
          </div>
          <div className="scan-line w-full h-px mt-3" />
          <p className="mt-2 text-[11px] text-mist">
            Marine data can take 5–15 seconds — ERDDAP is slow on cold queries.
          </p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="panel p-5 border-signal-danger/40">
          <div className="label-mono text-signal-danger mb-2">Error</div>
          <div className="text-sm text-bone">{error}</div>
        </div>
      )}

      {/* Data */}
      {data && !loading && !error && (
        <>
          <SuitabilityGauge
            score={data.suitability.overall}
            band={data.suitability.band}
          />

          {/* Veto callout */}
          {data.suitability.vetoed && (
            <div className="panel border-signal-danger/50 bg-signal-danger/[0.04] p-4">
              <div className="flex items-start gap-2.5">
                <span className="text-signal-danger text-sm font-mono leading-none mt-0.5">⚠</span>
                <div className="flex-1">
                  <div className="label-mono text-signal-danger mb-1">
                    Critical factor override
                  </div>
                  <p className="text-[12px] leading-relaxed text-bone">
                    {data.suitability.vetoReason}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Copernicus configuration hint */}
          {!data.biogeochemistry.copernicusConfigured && (
            <div className="panel border-signal/30 p-4">
              <div className="label-mono text-signal mb-1">
                Unlock pH & dissolved oxygen
              </div>
              <p className="text-[12px] leading-relaxed text-bone/80">
                Configure Copernicus Marine credentials in{" "}
                <code className="text-bone">.env.local</code> to add two
                more factors to the score. See{" "}
                <code className="text-bone">README.md</code> for setup.
              </p>
            </div>
          )}

          {/* The WHY */}
          <ReasoningList factors={data.suitability.factors} />

          {/* Raw measurements */}
          <details className="panel group" open>
            <summary className="cursor-pointer p-4 select-none flex items-center justify-between hover:bg-steel/20 rounded-t-xl">
              <span className="label-mono">Raw measurements</span>
              <span className="text-mist text-xs transition-transform group-open:rotate-180">▾</span>
            </summary>
            <div className="px-4 pb-4 space-y-4">
              {/* Physical */}
              <div>
                <div className="label-mono mb-2">Physical</div>
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard label="Air temp"   value={fmt(data.weather.airTemperature)} unit="°C" />
                  <MetricCard label="Humidity"   value={fmt(data.weather.humidity, 0)}    unit="%" />
                  <MetricCard label="Wind gusts" value={fmt(data.weather.windGusts, 0)}   unit="km/h" />
                  <MetricCard label="Wave period" value={fmt(data.ocean.wavePeriod, 1)}   unit="s" />
                </div>
              </div>

              {/* Currents detail with arrow */}
              {data.ocean.currents && (
                <div>
                  <div className="label-mono mb-2">Surface current</div>
                  <div className="panel p-4 flex items-center gap-4">
                    <CurrentArrow direction={data.ocean.currents.direction} />
                    <div className="flex-1">
                      <div className="font-mono text-xs text-mist">
                        Speed
                      </div>
                      <div className="font-display text-2xl text-signal data-num leading-none">
                        {fmt(data.ocean.currents.speed, 2)}{" "}
                        <span className="text-xs font-mono text-mist">m/s</span>
                      </div>
                      <div className="mt-1 font-mono text-[11px] text-mist">
                        Toward {compass(data.ocean.currents.direction)} ({Math.round(data.ocean.currents.direction)}°)
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Source summary */}
              <div>
                <div className="label-mono mb-2">Conditions</div>
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard
                    label="Weather"
                    value={data.weather.weatherLabel}
                    unit=""
                  />
                  <MetricCard
                    label="Sources active"
                    value={data.meta.sources.length}
                    unit=""
                  />
                </div>
              </div>
            </div>
          </details>

          {/* Footer sources */}
          <footer className="pt-3 border-t border-steel">
            <div className="label-mono mb-1">Data sources</div>
            <ul className="text-[10.5px] text-mist leading-relaxed font-mono space-y-0.5">
              {data.meta.sources.map((s) => (
                <li key={s}>· {s}</li>
              ))}
            </ul>
          </footer>
        </>
      )}
    </div>
  );
}
