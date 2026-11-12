// app/api/environment/route.js
//
// Backend endpoint: GET /api/environment?lat=..&lon=..
//
// Aggregates THREE upstream sources in parallel:
//   1. Open-Meteo        — air weather + sea surface temp + waves
//   2. NOAA ERDDAP       — salinity, chlorophyll, currents (no auth)
//   3. Copernicus Marine — pH, dissolved oxygen (requires creds)
//
// Each upstream returns null gracefully when data is missing.
// We pass everything to evaluateSite() which scores whatever it gets.

import { NextResponse } from "next/server";
import { fetchWeather, fetchMarine, describeWeatherCode } from "@/lib/openMeteo";
import { fetchSalinity, fetchChlorophyll, fetchCurrents } from "@/lib/erddap";
import { fetchPH, fetchDissolvedOxygen, isCopernicusConfigured } from "@/lib/copernicus";
import { evaluateSite } from "@/lib/suitability";

export async function GET(request) {
  // ── 1. Parse + validate params ──────────────────────────────────
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat"));
  const lon = parseFloat(searchParams.get("lon"));

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json(
      { error: "lat and lon query params are required and must be numbers" },
      { status: 400 }
    );
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return NextResponse.json(
      { error: "lat must be in [-90,90] and lon in [-180,180]" },
      { status: 400 }
    );
  }

  // ── 2. Fan out to all sources in parallel ───────────────────────
  //
  // Promise.allSettled (not Promise.all): a single source failure
  // shouldn't kill the response. We log warnings and treat the
  // failed source as "missing data" — the UI handles that.
  const [
    weatherResult,
    marineResult,
    salinityResult,
    chlorophyllResult,
    currentsResult,
    phResult,
    doResult,
  ] = await Promise.allSettled([
    fetchWeather(lat, lon),
    fetchMarine(lat, lon),
    fetchSalinity(lat, lon),
    fetchChlorophyll(lat, lon),
    fetchCurrents(lat, lon),
    fetchPH(lat, lon),
    fetchDissolvedOxygen(lat, lon),
  ]);

  const valueOr = (settled, fallback = null) =>
    settled.status === "fulfilled" ? settled.value : fallback;

  const weather = valueOr(weatherResult, {});
  const marine  = valueOr(marineResult,  {});

  // Pull individual readings out of the upstream payloads
  const w = weather.current ?? {};
  const m = marine.current  ?? {};

  const sst       = m.sea_surface_temperature ?? null;
  const waveH     = m.wave_height             ?? null;
  const wavePer   = m.wave_period             ?? null;
  const airTemp   = w.temperature_2m          ?? null;
  const humidity  = w.relative_humidity_2m    ?? null;
  const windKmh   = w.wind_speed_10m          ?? null;
  const gustsKmh  = w.wind_gusts_10m          ?? null;
  const precipDay = weather.daily?.precipitation_sum?.[0] ?? null;
  const weatherCode = w.weather_code          ?? null;

  const salinity      = valueOr(salinityResult);
  const chlorophyll   = valueOr(chlorophyllResult);
  const currents      = valueOr(currentsResult);   // { speed, direction, u, v }
  const ph            = valueOr(phResult);
  const oxygen        = valueOr(doResult);
  console.log({
  sst,
  waveH,
  salinity,
  currentSpeed: currents?.speed,
});
const hasMarineData =
  sst != null ||
  waveH != null ||
  salinity != null ||
  currents?.speed != null;

if (!hasMarineData) {
  return NextResponse.json({
    invalidMarine: true,
    location: { lat, lon },
    message: "Marine environmental data is unavailable for this location. The selected site may be inland, freshwater, or outside the coverage area of the marine datasets used by this application.",
  });
}
  // ── 3. Score the site ───────────────────────────────────────────
  const suitability = evaluateSite({
    sst,
    waveHeight:      waveH,
    salinity,
    ph,
    dissolvedOxygen: oxygen,
    chlorophyll,
    currentSpeed:    currents?.speed ?? null,
    wind:            windKmh,
    rainfall:        precipDay,
  });

  // ── 4. Reply ────────────────────────────────────────────────────
  return NextResponse.json({
    location: { lat, lon },
    weather: {
      airTemperature:   airTemp,
      humidity,
      windSpeed:        windKmh,
      windGusts:        gustsKmh,
      precipitationDay: precipDay,
      weatherCode,
      weatherLabel:     describeWeatherCode(weatherCode),
    },
    ocean: {
      seaSurfaceTemperature: sst,
      waveHeight:            waveH,
      wavePeriod:            wavePer,
      salinity,
      chlorophyll,
      currents,             // { speed, direction, u, v } or null
    },
    biogeochemistry: {
      ph,
      dissolvedOxygen: oxygen,
      // Hint for the UI when these are null because creds aren't set
      copernicusConfigured: isCopernicusConfigured(),
    },
    suitability,
    meta: {
      sources: [
        "open-meteo.com/v1/forecast",
        "marine-api.open-meteo.com/v1/marine",
        "coastwatch.noaa.gov/erddap (SMAP salinity)",
        "coastwatch.noaa.gov/erddap (VIIRS chlorophyll)",
        "cwcgom.aoml.noaa.gov/erddap (geostrophic currents)",
        ...(isCopernicusConfigured() ? ["marine.copernicus.eu (pH, O₂)"] : []),
      ],
      fetchedAt: new Date().toISOString(),
    },
  });
}
