// lib/suitability.js
//
// Aquaculture suitability scoring — V3.
//
// Now scoring NINE factors. Five of them are "critical" (can veto the
// overall verdict when in the Dangerous band):
//   1. Sea surface temperature        — thermal physiology
//   2. Dissolved oxygen               — respiration
//   3. pH                             — osmoregulation, calcification
//   4. Salinity                       — osmoregulation
//   5. Wave height                    — infrastructure
//
// Non-critical factors lower the score but don't force-fail:
//   6. Currents      — flushing, oxygen replenishment
//   7. Chlorophyll-a — natural productivity vs. HAB risk
//   8. Wind          — operations
//   9. Rainfall      — surface salinity proxy (less critical now that
//                      we have measured salinity)
//
// Tuned for warm-temperate marine finfish (sea bream, sea bass).
// Edit the `range`, `weight`, and `critical` fields below to retune.

// ─────────────────────────────────────────────────────────────────────
// Band thresholds
// ─────────────────────────────────────────────────────────────────────
export const BANDS = [
  { key: "excellent", label: "Excellent", min: 80, tone: "good"   },
  { key: "good",      label: "Good",      min: 60, tone: "signal" },
  { key: "moderate",  label: "Moderate",  min: 40, tone: "warm"   },
  { key: "dangerous", label: "Dangerous", min:  0, tone: "danger" },
];

export function scoreToBand(score) {
  if (score == null) {
    return { key: "unknown", label: "No data", tone: "mist", min: null };
  }
  return BANDS.find(b => score >= b.min);
}

// ─────────────────────────────────────────────────────────────────────
// Criterion definitions
// ─────────────────────────────────────────────────────────────────────
export const CRITERIA = {
  // ── Physical ───────────────────────────────────────────────────────
  sst: {
    key: "sst",
    label: "Sea Surface Temperature",
    unit: "°C",
    weight: 0.18,
    critical: true,
    range: { hardMin: 8, idealMin: 18, idealMax: 26, hardMax: 32 },
    reasoning: {
      excellent: "Within the ideal 18–26 °C band for warm-temperate marine finfish such as sea bream and sea bass.",
      good:      "Slightly outside the ideal band but well within species tolerance.",
      moderate:  "Suboptimal temperature — expect slower growth and reduced feed conversion.",
      dangerous: "Outside the safe physiological range — risk of thermal stress, disease, and mortality.",
    },
  },
  waveHeight: {
    key: "waveHeight",
    label: "Wave Height",
    unit: "m",
    weight: 0.12,
    critical: true,
    range: { hardMin: -1, idealMin: 0, idealMax: 1.0, hardMax: 3.5 },
    reasoning: {
      excellent: "Protected waters — minimal mechanical stress on cages and moorings.",
      good:      "Moderate exposure — standard cage systems perform reliably.",
      moderate:  "Significant swell — reinforced moorings and storm-grade cages recommended.",
      dangerous: "Heavy seas — high risk of cage deformation, escape events, or total loss.",
    },
  },

  // ── Chemical ───────────────────────────────────────────────────────
  salinity: {
    key: "salinity",
    label: "Salinity",
    unit: "PSU",
    weight: 0.13,
    critical: true,
    range: { hardMin: 25, idealMin: 33, idealMax: 37, hardMax: 40 },
    reasoning: {
      excellent: "Stable marine salinity (33–37 PSU) — optimal osmotic environment for marine finfish.",
      good:      "Salinity slightly off optimal but well within species tolerance.",
      moderate:  "Salinity drift detected — monitor for osmoregulatory stress, especially in juveniles.",
      dangerous: "Salinity outside species tolerance — high risk of osmotic shock and mortality.",
    },
  },
  ph: {
    key: "ph",
    label: "pH",
    unit: "",
    weight: 0.15,
    critical: true,
    range: { hardMin: 7.5, idealMin: 7.9, idealMax: 8.2, hardMax: 8.5 },
    reasoning: {
      excellent: "Stable marine pH (7.9–8.2) — normal physiology and shell formation.",
      good:      "Slight pH variation, within physiological tolerance.",
      moderate:  "pH approaching limits — possible acidification or eutrophication signal.",
      dangerous: "pH outside safe range — physiological stress; calcifying species especially affected.",
    },
  },
  dissolvedOxygen: {
    key: "dissolvedOxygen",
    label: "Dissolved Oxygen",
    unit: "mg/L",
    weight: 0.18,
    critical: true,
    range: { hardMin: 3, idealMin: 6, idealMax: 10, hardMax: 15 },
    reasoning: {
      excellent: "High dissolved oxygen (>6 mg/L) — supports active feeding and growth.",
      good:      "Adequate oxygen for fish respiration and routine metabolism.",
      moderate:  "Reduced oxygen — stress response possible during feeding or warm afternoons.",
      dangerous: "Hypoxic conditions (<4 mg/L) — risk of mass mortality, especially overnight.",
    },
  },

  // ── Biological / Dynamic ───────────────────────────────────────────
  chlorophyll: {
    key: "chlorophyll",
    label: "Chlorophyll-a",
    unit: "mg/m³",
    weight: 0.08,
    critical: false,
    range: { hardMin: 0.05, idealMin: 0.5, idealMax: 3, hardMax: 15 },
    reasoning: {
      excellent: "Moderate productivity (0.5–3 mg/m³) — healthy natural food web.",
      good:      "Productive waters; some algae present but well below bloom levels.",
      moderate:  "Unusual productivity — either oligotrophic or elevated (early bloom signal).",
      dangerous: "Very high chlorophyll — possible harmful algal bloom (HAB); urgent monitoring advised.",
    },
  },
  currentSpeed: {
    key: "currentSpeed",
    label: "Current Speed",
    unit: "m/s",
    weight: 0.08,
    critical: false,
    range: { hardMin: 0, idealMin: 0.05, idealMax: 0.5, hardMax: 1.5 },
    reasoning: {
      excellent: "Moderate flow — efficient waste flushing and oxygen replenishment.",
      good:      "Adequate water exchange for healthy cage operations.",
      moderate:  "Flow suboptimal — either stagnant (waste accumulation) or strong (mechanical stress).",
      dangerous: "Flow outside operational range — risk of stock injury or inadequate flushing.",
    },
  },
  wind: {
    key: "wind",
    label: "Wind Speed",
    unit: "km/h",
    weight: 0.05,
    critical: false,
    range: { hardMin: -1, idealMin: 0, idealMax: 20, hardMax: 50 },
    reasoning: {
      excellent: "Calm conditions — feeding and maintenance operations unaffected.",
      good:      "Manageable winds — normal day-to-day operations possible.",
      moderate:  "Persistent strong winds will disrupt feeding boats and surface work.",
      dangerous: "Storm-force winds — operations halted, surface infrastructure at risk.",
    },
  },
  rainfall: {
    key: "rainfall",
    label: "Rainfall",
    unit: "mm/day",
    weight: 0.03,
    critical: false,
    range: { hardMin: -1, idealMin: 0, idealMax: 8, hardMax: 40 },
    reasoning: {
      excellent: "Low precipitation — surface salinity stable.",
      good:      "Normal rainfall — no significant salinity concerns.",
      moderate:  "Sustained rain may form a low-salinity surface layer.",
      dangerous: "Heavy precipitation — risk of osmotic shock from freshwater layering.",
    },
  },
};

// ─────────────────────────────────────────────────────────────────────
// Scoring primitives
// ─────────────────────────────────────────────────────────────────────

function rangeScore(value, { hardMin, idealMin, idealMax, hardMax }) {
  if (value == null || Number.isNaN(value)) return null;
  if (value >= idealMin && value <= idealMax) return 100;
  if (value <= hardMin   || value >= hardMax)  return 0;
  if (value < idealMin) {
    return Math.round(((value - hardMin) / (idealMin - hardMin)) * 100);
  }
  return Math.round(((hardMax - value) / (hardMax - idealMax)) * 100);
}

export function evaluate(criterionKey, value) {
  const c = CRITERIA[criterionKey];
  if (!c) throw new Error(`Unknown criterion: ${criterionKey}`);
  const score = rangeScore(value, c.range);
  if (score == null) return null;
  const band = scoreToBand(score);
  return {
    key:      c.key,
    label:    c.label,
    unit:     c.unit,
    value,
    score,
    band,
    weight:   c.weight,
    critical: c.critical,
    reason:   c.reasoning[band.key] ?? "",
  };
}

/**
 * Full site evaluation across all 9 factors.
 *
 *  Input:  { sst, waveHeight, salinity, ph, dissolvedOxygen,
 *            chlorophyll, currentSpeed, wind, rainfall }
 *          Any field may be null.
 *
 *  Output: { overall, band, factors, vetoed, vetoReason }
 *
 *  When factors are missing, weights are renormalized over the
 *  factors we do have, so the score is still a coherent 0–100.
 */
export function evaluateSite(readings) {
  const keys = [
    "sst", "waveHeight",
    "salinity", "ph", "dissolvedOxygen",
    "chlorophyll", "currentSpeed",
    "wind", "rainfall",
  ];

  const factors = keys
    .map(k => evaluate(k, readings[k]))
    .filter(Boolean);

  if (factors.length === 0) {
    return {
      overall: null,
      band: scoreToBand(null),
      factors: [],
      vetoed: false,
      vetoReason: null,
    };
  }

  // Weighted average — weights renormalize over present factors
  const totalWeight = factors.reduce((s, f) => s + f.weight, 0);
  let overall = Math.round(
    factors.reduce((s, f) => s + f.score * f.weight, 0) / totalWeight
  );

  // Veto: any critical factor in Dangerous caps the overall score
  const vetoFactor = factors.find(f => f.critical && f.band.key === "dangerous");
  let vetoed = false;
  let vetoReason = null;
  if (vetoFactor) {
    vetoed = true;
    vetoReason = `${vetoFactor.label} is in the Dangerous range — this overrides the weighted average for safety.`;
    overall = Math.min(overall, 30);
  }

  return {
    overall,
    band: scoreToBand(overall),
    factors,
    vetoed,
    vetoReason,
  };
}
