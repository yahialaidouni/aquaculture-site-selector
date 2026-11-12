// app/page.js
"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import StatsPanel from "@/components/StatsPanel";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-mist text-sm">
      Loading map…
    </div>
  ),
});

// Legend bands — matches scoreToBand output. Single source = lib/suitability.js
const LEGEND = [
  { label: "Excellent", color: "#34d399" },
  { label: "Good",      color: "#22d3ee" },
  { label: "Moderate",  color: "#fbbf24" },
  { label: "Dangerous", color: "#f87171" },
];

export default function Home() {
  const [selected, setSelected] = useState(null);
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);

    fetch(`/api/environment?lat=${selected.lat}&lon=${selected.lon}`)
  .then(async (res) => {
    const json = await res.json();

    console.log("API RESPONSE:", json);

    if (!res.ok) {
      throw new Error(json.error || `Request failed (${res.status})`);
    }

    return json;
  })
  .then((json) => {
    if (!cancelled) {
      setData(json);
    }
  })
  .catch((err) => {
    if (!cancelled) {
      setError(err.message);
    }
  })
  .finally(() => {
    if (!cancelled) {
      setLoading(false);
    }
  });
    return () => { cancelled = true; };
  }, [selected]);

  // Tone to drive the marker color — falls back to neutral mist while loading
  const markerTone = data?.suitability?.band?.tone ?? "mist";

  return (
    <main className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex-none border-b border-steel bg-hull/60 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8">
              <div className="absolute inset-0 rounded-full border border-signal/60" />
              <div className="absolute inset-1.5 rounded-full bg-signal/20 animate-pulse-slow" />
              <div className="absolute inset-3 rounded-full bg-signal" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-lg text-bone">
                Aquaculture Site Selector
              </div>
              <div className="label-mono">
                v2 · Weighted scoring · 4-band classification
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-mist">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-signal-good animate-pulse" />
            Live feed
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 grid grid-cols-[1fr_250px] min-h-0">
        <div className="relative min-h-0">
          <MapView
            selected={selected}
            selectedTone={markerTone}
            onSelect={setSelected}
          />

          {/* Instruction tag */}
          {!selected && (
            <div className="pointer-events-none absolute top-4 left-4 panel px-4 py-2.5">
              <div className="label-mono">Tap the map</div>
              <div className="text-sm text-bone">Pick any coastal point</div>
            </div>
          )}

          {/* Suitability legend — always visible, bottom-left */}
          <div className="absolute bottom-4 left-4 panel px-3.5 py-2.5 z-[400]">
            <div className="label-mono mb-2">Suitability</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {LEGEND.map((b) => (
                <div key={b.label} className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full flex-none"
                    style={{ background: b.color }}
                  />
                  <span className="text-[11px] font-mono text-bone">
                    {b.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="border-t md:border-t-0 md:border-l border-steel bg-abyss/60 min-h-0">
          <StatsPanel
            location={selected}
            data={data}
            loading={loading}
            error={error}
          />
        </aside>
      </div>
    </main>
  );
}
