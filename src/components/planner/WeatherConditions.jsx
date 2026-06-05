import React, { useState } from 'react';
import { MapPin, Wind, Waves, Thermometer, Eye, RefreshCw, ChevronUp, ChevronDown, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

function getDivingRating(waveHeight, windSpeed, visibility) {
  if (waveHeight > 2 || windSpeed > 30) return { label: 'Poor', color: '#ef4444' };
  if (waveHeight > 1 || windSpeed > 20) return { label: 'Marginal', color: '#f97316' };
  if (waveHeight > 0.5 || windSpeed > 12) return { label: 'Good', color: '#eab308' };
  return { label: 'Excellent', color: '#22c55e' };
}

function getWindDir(deg) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

function parseTides(times, heights) {
  // Find local highs and lows from hourly sea-level data for the next 24h
  const tides = [];
  for (let i = 1; i < Math.min(times.length - 1, 48); i++) {
    const prev = heights[i - 1];
    const curr = heights[i];
    const next = heights[i + 1];
    if (curr > prev && curr > next && curr - Math.min(prev, next) > 0.1) {
      tides.push({ time: times[i], height: curr, type: 'High' });
    } else if (curr < prev && curr < next && Math.max(prev, next) - curr > 0.1) {
      tides.push({ time: times[i], height: curr, type: 'Low' });
    }
  }
  return tides.slice(0, 6);
}

function formatTime(isoStr) {
  return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDay(isoStr) {
  return new Date(isoStr).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function WeatherConditions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [location, setLocation] = useState(null);

  const fetchConditions = async () => {
    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;

        // Reverse geocode using Open-Meteo geocoding
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
        );
        const geoData = await geoRes.json();
        const placeName =
          geoData?.address?.city ||
          geoData?.address?.town ||
          geoData?.address?.village ||
          geoData?.address?.county ||
          `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;

        // Open-Meteo weather (wind, visibility, temperature)
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
          `&current=wind_speed_10m,wind_direction_10m,temperature_2m,visibility,weather_code` +
          `&hourly=wind_speed_10m,visibility&forecast_days=1&timezone=auto`
        );
        const weather = await weatherRes.json();

        // Open-Meteo Marine (waves, swell, SST, sea level / tides)
        const marineRes = await fetch(
          `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}` +
          `&current=wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_period,sea_surface_temperature` +
          `&hourly=sea_level_height_msl,wave_height&forecast_days=2&timezone=auto`
        );
        const marine = await marineRes.json();

        // Parse tides from hourly sea level data
        const tides = marine?.hourly?.time
          ? parseTides(marine.hourly.time, marine.hourly.sea_level_height_msl)
          : [];

        setLocation({ lat, lon, name: placeName });
        setData({ weather, marine, tides });
        setLoading(false);
      },
      (err) => {
        setError('Location access denied. Please allow location access to view conditions.');
        setLoading(false);
      },
      { timeout: 10000 }
    );
  };

  const current = data?.weather?.current;
  const marineNow = data?.marine?.current;

  const waveH = marineNow?.wave_height ?? 0;
  const windSpd = current?.wind_speed_10m ?? 0;
  const vis = current?.visibility ?? 10000;
  const rating = current ? getDivingRating(waveH, windSpd, vis) : null;

  return (
    <div className="space-y-4">
      {/* Location prompt */}
      {!data && !loading && (
        <div className="rounded-xl p-8 flex flex-col items-center gap-4 text-center"
          style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: '#1a7cff22' }}>
            <MapPin className="w-7 h-7" style={{ color: '#1a7cff' }} />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg mb-1">Dive Site Conditions</h3>
            <p className="text-slate-400 text-sm">
              Detect your location to view live tides, wave heights, wind and marine conditions near you.
            </p>
          </div>
          <Button onClick={fetchConditions} className="hover:opacity-90"
            style={{ background: '#1a7cff' }}>
            <MapPin className="w-4 h-4 mr-2" />
            Detect My Location
          </Button>
        </div>
      )}

      {loading && (
        <div className="rounded-xl p-10 flex flex-col items-center gap-3"
          style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
          <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
          <p className="text-slate-400 text-sm">Fetching conditions…</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl p-5 flex items-start gap-3"
          style={{ background: '#1c1212', border: '1px solid #3a2020' }}>
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {data && location && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" style={{ color: '#1a7cff' }} />
              <span className="text-white font-medium text-sm">{location.name}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchConditions}
              className="text-slate-400 hover:text-white h-8 px-2">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Diving Rating Banner */}
          {rating && (
            <div className="rounded-xl px-4 py-3 flex items-center justify-between"
              style={{ background: rating.color + '22', border: `1px solid ${rating.color}44` }}>
              <span className="text-white text-sm font-medium">Overall Diving Conditions</span>
              <span className="font-bold text-sm" style={{ color: rating.color }}>{rating.label}</span>
            </div>
          )}

          {/* Marine Conditions Grid */}
          <div className="grid grid-cols-2 gap-3">
            <CondCard icon={<Waves className="w-4 h-4" style={{ color: '#1a7cff' }} />}
              label="Wave Height"
              value={marineNow?.wave_height != null ? `${marineNow.wave_height.toFixed(1)} m` : '–'}
              sub={marineNow?.wave_period != null ? `${marineNow.wave_period.toFixed(0)}s period` : ''} />
            <CondCard icon={<Waves className="w-4 h-4" style={{ color: '#60a5fa' }} />}
              label="Swell"
              value={marineNow?.swell_wave_height != null ? `${marineNow.swell_wave_height.toFixed(1)} m` : '–'}
              sub={marineNow?.swell_wave_period != null ? `${marineNow.swell_wave_period.toFixed(0)}s period` : ''} />
            <CondCard icon={<Wind className="w-4 h-4" style={{ color: '#34d399' }} />}
              label="Wind"
              value={current?.wind_speed_10m != null ? `${current.wind_speed_10m.toFixed(0)} km/h` : '–'}
              sub={current?.wind_direction_10m != null ? getWindDir(current.wind_direction_10m) : ''} />
            <CondCard icon={<Thermometer className="w-4 h-4" style={{ color: '#f97316' }} />}
              label="Sea Temp"
              value={marineNow?.sea_surface_temperature != null ? `${marineNow.sea_surface_temperature.toFixed(1)}°C` : '–'}
              sub={current?.temperature_2m != null ? `Air ${current.temperature_2m.toFixed(0)}°C` : ''} />
            <CondCard icon={<Eye className="w-4 h-4" style={{ color: '#a78bfa' }} />}
              label="Visibility"
              value={current?.visibility != null ? `${(current.visibility / 1000).toFixed(1)} km` : '–'}
              sub="" />
            <CondCard icon={<Waves className="w-4 h-4" style={{ color: '#94a3b8' }} />}
              label="Wave Direction"
              value={marineNow?.wave_direction != null ? getWindDir(marineNow.wave_direction) : '–'}
              sub="" />
          </div>

          {/* Tide Times */}
          {data.tides && data.tides.length > 0 && (
            <div className="rounded-xl overflow-hidden"
              style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
              <div className="px-4 py-3 flex items-center gap-2"
                style={{ borderBottom: '1px solid #2a2a2a' }}>
                <Clock className="w-4 h-4" style={{ color: '#1a7cff' }} />
                <span className="text-white font-medium text-sm">Tide Predictions (Nearest Coastal Point)</span>
              </div>
              <div className="divide-y" style={{ borderColor: '#1e1e1e' }}>
                {data.tides.map((tide, i) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {tide.type === 'High'
                        ? <ChevronUp className="w-4 h-4 text-blue-400" />
                        : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      <div>
                        <div className="text-white text-sm font-medium">{tide.type} Tide</div>
                        <div className="text-slate-500 text-xs">{formatDay(tide.time)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white text-sm font-medium">{formatTime(tide.time)}</div>
                      <div className="text-slate-400 text-xs">
                        {tide.height != null ? `${tide.height.toFixed(2)} m MSL` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-xs text-slate-600 text-center px-2">
            Marine data from Open-Meteo (~8 km grid). Tide estimates are model-derived — not a substitute for official tide tables. Verify with national hydrographic office data before diving.
          </p>
        </>
      )}
    </div>
  );
}

function CondCard({ icon, label, value, sub }) {
  return (
    <div className="rounded-xl px-4 py-3 flex flex-col gap-1"
      style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-slate-500 text-xs">{label}</span>
      </div>
      <span className="text-white font-semibold text-lg leading-none">{value}</span>
      {sub && <span className="text-slate-500 text-xs">{sub}</span>}
    </div>
  );
}