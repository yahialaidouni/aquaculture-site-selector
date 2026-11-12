// lib/openMeteo.js
//
// Thin client around Open-Meteo's two free, no-auth APIs.
// Runs on the server (inside our /api/environment route),
// never directly from the browser.

const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";
const MARINE_URL  = "https://marine-api.open-meteo.com/v1/marine";

/**
 * Fetch current weather (air) for a point.
 * Docs: https://open-meteo.com/en/docs
 */
export async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "wind_speed_10m",
      "wind_gusts_10m",
      "precipitation",
      "weather_code",
    ].join(","),
    daily: "precipitation_sum",
    forecast_days: "1",
    timezone: "auto",
  });

  const res = await fetch(`${WEATHER_URL}?${params}`);
  if (!res.ok) throw new Error(`Weather API failed: ${res.status}`);
  return res.json();
}

/**
 * Fetch current marine conditions for a point.
 * Docs: https://open-meteo.com/en/docs/marine-weather-api
 *
 * Note: Marine API only covers ocean / sea areas. Clicks far inland
 * may return null values for sea_surface_temperature.
 */
export async function fetchMarine(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: [
      "sea_surface_temperature",
      "wave_height",
      "wave_period",
      "wave_direction",
    ].join(","),
    timezone: "auto",
  });

  const res = await fetch(`${MARINE_URL}?${params}`);
  if (!res.ok) throw new Error(`Marine API failed: ${res.status}`);
  return res.json();
}

/**
 * Translate Open-Meteo weather_code (WMO) to a short label.
 * Full table: https://open-meteo.com/en/docs (search "WMO Weather code")
 */
export function describeWeatherCode(code) {
  if (code === 0) return "Clear sky";
  if ([1, 2, 3].includes(code)) return "Partly cloudy";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55].includes(code)) return "Drizzle";
  if ([61, 63, 65].includes(code)) return "Rain";
  if ([71, 73, 75, 77].includes(code)) return "Snow";
  if ([80, 81, 82].includes(code)) return "Showers";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Unknown";
}
