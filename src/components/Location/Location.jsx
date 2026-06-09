import { useState, useEffect, useCallback, useRef } from "react";

// ─── Utilities ────────────────────────────────────────────────────────────────
const generateId = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const formatAge = (ts) => {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
};

const formatExpiry = (ms) => {
  const diff = Math.max(0, Math.floor((ms - Date.now()) / 1000 / 60));
  if (diff === 0) return "Expired";
  if (diff < 60) return `${diff}m left`;
  return `${Math.floor(diff / 60)}h left`;
};

const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getWeatherIcon = (code) => {
  if (code === 0) return "☀️";
  if (code <= 2) return "⛅";
  if (code <= 3) return "☁️";
  if (code <= 48) return "🌫";
  if (code <= 57) return "🌧";
  if (code <= 67) return "🌨";
  if (code <= 77) return "❄️";
  if (code <= 82) return "🌦";
  return "⛈";
};

const getWeatherDesc = (code) => {
  if (code === 0) return "Clear sky";
  if (code === 1) return "Mainly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code <= 48) return "Foggy";
  if (code <= 55) return "Drizzle";
  if (code <= 65) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Rain showers";
  return "Thunderstorm";
};

// ─── Color tokens (red & white theme) ────────────────────────────────────────
const C = {
  // Backgrounds
  pageBg:       "#fff5f5",
  cardBg:       "#ffffff",
  cardBgSoft:   "#fff0f0",
  headerBg:     "rgba(255,255,255,0.92)",
  inputBg:      "#fff8f8",
  codeBg:       "#fef2f2",

  // Reds
  primary:      "#dc2626",       // vivid red
  primaryHover: "#b91c1c",
  primaryLight: "rgba(220,38,38,0.1)",
  primaryBorder:"rgba(220,38,38,0.3)",
  primaryDark:  "#7f1d1d",

  // Borders
  border:       "rgba(220,38,38,0.18)",
  borderSoft:   "rgba(220,38,38,0.10)",
  borderStrong: "rgba(220,38,38,0.35)",

  // Text
  textPrimary:  "#1a0505",
  textSecondary:"#6b2929",
  textMuted:    "#b05252",
  textHint:     "#e07878",

  // Accents
  green:        "#16a34a",
  greenBg:      "rgba(22,163,74,0.08)",
  greenBorder:  "rgba(22,163,74,0.3)",
  amber:        "#b45309",
  amberBg:      "rgba(180,83,9,0.08)",
  amberBorder:  "rgba(180,83,9,0.28)",

  // Whites
  white:        "#ffffff",
};

// ─── Shared style objects ─────────────────────────────────────────────────────
const card = {
  background: C.cardBg,
  border: `1px solid ${C.border}`,
  borderRadius: "14px",
  boxShadow: "0 1px 4px rgba(220,38,38,0.07)",
};
const cardSoft = {
  background: C.cardBgSoft,
  border: `1px solid ${C.borderSoft}`,
  borderRadius: "12px",
};
const statCard = {
  padding: "11px 13px",
  borderRadius: "10px",
  background: C.cardBgSoft,
  border: `1px solid ${C.borderSoft}`,
};
const statLabel = {
  fontSize: 10,
  color: C.textHint,
  marginBottom: 4,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  fontWeight: 600,
};
const statVal = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 12,
  fontWeight: 600,
  color: C.textPrimary,
};
const sectionLabel = {
  fontSize: 10,
  color: C.textMuted,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  fontWeight: 700,
};
const inputStyle = {
  width: "100%",
  background: C.inputBg,
  border: `1px solid ${C.border}`,
  borderRadius: "9px",
  padding: "8px 12px",
  fontSize: 13,
  fontFamily: "'Sora', sans-serif",
  color: C.textPrimary,
  outline: "none",
};

// ─── Primitive Components ──────────────────────────────────────────────────────
function PulsingDot({ color = "red" }) {
  const map = {
    red:   C.primary,
    green: C.green,
    amber: "#f59e0b",
  };
  const c = map[color] ?? C.primary;
  return (
    <span style={{ position: "relative", display: "inline-flex", width: 9, height: 9, flexShrink: 0 }}>
      <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: c, opacity: 0.5, animation: "geoPing 1.4s cubic-bezier(0,0,0.2,1) infinite" }} />
      <span style={{ position: "relative", width: 9, height: 9, borderRadius: "50%", background: c }} />
    </span>
  );
}

function Spinner() {
  return (
    <span style={{ display: "inline-block", width: 16, height: 16, border: `2px solid ${C.primaryLight}`, borderTopColor: C.primary, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
  );
}

function Btn({ onClick, variant = "red", children, style: extraStyle = {}, disabled = false, href, target }) {
  const variants = {
    red:    { background: C.primary,       border: `1px solid ${C.primaryDark}`,  color: C.white,       fontWeight: 700 },
    redSoft:{ background: C.primaryLight,  border: `1px solid ${C.primaryBorder}`,color: C.primary,     fontWeight: 600 },
    green:  { background: C.greenBg,       border: `1px solid ${C.greenBorder}`,   color: C.green,       fontWeight: 600 },
    gray:   { background: C.cardBgSoft,    border: `1px solid ${C.border}`,        color: C.textSecondary, fontWeight: 600 },
    outline:{ background: C.white,         border: `1px solid ${C.primaryBorder}`, color: C.primary,     fontWeight: 600 },
  };
  const base = {
    padding: "9px 16px",
    borderRadius: "10px",
    fontFamily: "'Sora', sans-serif",
    fontSize: 12,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
    transition: "all 0.15s",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    ...(variants[variant] || variants.red),
    ...extraStyle,
  };
  if (href) return <a href={href} target={target} rel="noopener noreferrer" style={base}>{children}</a>;
  return <button onClick={onClick} disabled={disabled} style={base}>{children}</button>;
}

function Badge({ children, variant = "red" }) {
  const variants = {
    red:   { background: C.primaryLight,  border: `1px solid ${C.primaryBorder}`, color: C.primary },
    green: { background: C.greenBg,       border: `1px solid ${C.greenBorder}`,   color: C.green },
    amber: { background: C.amberBg,       border: `1px solid ${C.amberBorder}`,   color: C.amber },
  };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 9px", borderRadius: 99,
      fontSize: 10, fontWeight: 700,
      ...(variants[variant] || variants.red),
    }}>
      {children}
    </span>
  );
}

// ─── Map Embed ─────────────────────────────────────────────────────────────────
function GoogleMapEmbed({ lat, lng }) {
  return (
    <div style={{ borderRadius: "14px", overflow: "hidden", height: 240, background: "#ffe4e4", border: `1px solid ${C.border}`, position: "relative" }}>
      <iframe
        src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
        width="100%" height="100%"
        style={{ border: "none", display: "block" }}
        allowFullScreen loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Live Location Map"
      />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(circle at center,transparent 60%,rgba(220,38,38,0.08) 100%)" }} />
      <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(255,255,255,0.9)", border: `1px solid ${C.border}`, borderRadius: 20, padding: "4px 10px", fontSize: 10, color: C.textMuted, backdropFilter: "blur(8px)" }}>
        📍 Live · Google Maps
      </div>
    </div>
  );
}

// ─── Weather Panel ─────────────────────────────────────────────────────────────
function WeatherPanel({ lat, lng }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!lat || !lng) return;
    setLoading(true); setError(false);
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,apparent_temperature,precipitation&wind_speed_unit=kmh&timezone=auto`)
      .then((r) => r.json())
      .then((d) => { setWeather(d.current); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [lat, lng]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 16, color: C.textMuted, fontSize: 13 }}>
      <Spinner /> Fetching weather…
    </div>
  );
  if (error || !weather) return (
    <div style={{ textAlign: "center", padding: "40px 20px", color: C.textHint, fontSize: 13 }}>
      Weather unavailable
    </div>
  );

  const rows = [
    ["💧 Humidity",   `${weather.relative_humidity_2m}%`],
    ["💨 Wind",       `${weather.wind_speed_10m} km/h`],
    ["🌧 Rain",       `${weather.precipitation} mm`],
    ["📍 Coords",     `${lat.toFixed(4)}, ${lng.toFixed(4)}`],
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ padding: "20px 16px", borderRadius: 14, background: C.primaryLight, border: `1px solid ${C.primaryBorder}`, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 6 }}>{getWeatherIcon(weather.weather_code)}</div>
        <div style={{ fontSize: 38, fontWeight: 700, color: C.primary, letterSpacing: "-0.03em", lineHeight: 1 }}>
          {Math.round(weather.temperature_2m)}°C
        </div>
        <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 5 }}>{getWeatherDesc(weather.weather_code)}</div>
        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>Feels like {Math.round(weather.apparent_temperature)}°C</div>
      </div>

      <div style={{ ...cardSoft, padding: 13 }}>
        <div style={{ ...sectionLabel, marginBottom: 10 }}>Current Conditions</div>
        {rows.map(([label, val]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.borderSoft}`, fontSize: 12 }}>
            <span style={{ color: C.textMuted }}>{label}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", color: C.textPrimary, fontWeight: 600 }}>{val}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10, color: C.textHint, textAlign: "center" }}>Powered by Open-Meteo — free, no API key</div>
    </div>
  );
}

// ─── Distance Panel ────────────────────────────────────────────────────────────
function DistancePanel({ myCoords, isTracking }) {
  const [myLat, setMyLat] = useState(myCoords?.lat?.toFixed(6) ?? "");
  const [myLng, setMyLng] = useState(myCoords?.lng?.toFixed(6) ?? "");
  const [destLat, setDestLat] = useState("");
  const [destLng, setDestLng] = useState("");
  const [hospitalSearch, setHospitalSearch] = useState("");
  const [hospitalResults, setHospitalResults] = useState([]);
  const [distResult, setDistResult] = useState(null);
  const [postLog, setPostLog] = useState(null);

  const hospitalDebounceRef = useRef(null);

  useEffect(() => {
    if (myCoords) {
      setMyLat(myCoords.lat.toFixed(6));
      setMyLng(myCoords.lng.toFixed(6));
    }
  }, [myCoords]);

  const doSearch = (query, setter) => {
    if (!query || query.length < 3) { setter([]); return; }
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=4`)
      .then((r) => r.json()).then(setter).catch(() => {});
  };

  const onHospitalChange = (v) => {
    setHospitalSearch(v);
    clearTimeout(hospitalDebounceRef.current);
    hospitalDebounceRef.current = setTimeout(() => doSearch(v, setHospitalResults), 400);
  };

  const selectHospital = (p) => {
    setDestLat(parseFloat(p.lat).toFixed(6));
    setDestLng(parseFloat(p.lon).toFixed(6));
    setHospitalSearch(p.display_name.slice(0, 60));
    setHospitalResults([]);
  };

  const calculate = () => {
    const la1 = parseFloat(myLat), lo1 = parseFloat(myLng);
    const la2 = parseFloat(destLat), lo2 = parseFloat(destLng);
    if (isNaN(la1) || isNaN(la2)) return;
    const km = haversineKm(la1, lo1, la2, lo2);
    setDistResult({ km, mi: km * 0.621371, la1, lo1, la2, lo2 });
  };

  const handlePostCharity = () => {
    if (!isTracking || !myCoords) return;
    const la1 = parseFloat(myLat), lo1 = parseFloat(myLng);
    const la2 = parseFloat(destLat), lo2 = parseFloat(destLng);
    const km = (!isNaN(la1) && !isNaN(la2)) ? haversineKm(la1, lo1, la2, lo2) : null;

    const charityPayload = {
      liveLocation: {
        latitude: myCoords.lat,
        longitude: myCoords.lng,
        accuracy: myCoords.acc,
        timestamp: new Date(myCoords.ts).toISOString(),
        coords_raw: `${myCoords.lat.toFixed(6)}, ${myCoords.lng.toFixed(6)}`,
      },
      destination: {
        name: hospitalSearch || "Unknown",
        latitude: parseFloat(destLat) || null,
        longitude: parseFloat(destLng) || null,
        coords_raw: destLat && destLng ? `${destLat}, ${destLng}` : null,
      },
      distance: km !== null ? {
        km: parseFloat(km.toFixed(4)),
        miles: parseFloat((km * 0.621371).toFixed(4)),
        meters: parseFloat((km * 1000).toFixed(1)),
        display: km < 1 ? `${(km * 1000).toFixed(0)} m` : `${km.toFixed(2)} km`,
      } : null,
      postedAt: new Date().toISOString(),
      trackingActive: true,
    };

    console.log("🩸 [RaktoDaan] Post Charity Data:", charityPayload);
    setPostLog(charityPayload);
    if (km !== null) setDistResult({ km, mi: km * 0.621371, la1, lo1, la2, lo2 });
  };

  const DropDown = ({ results, onSelect }) =>
    results.length > 0 ? (
      <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 10, background: C.white, border: `1px solid ${C.border}`, borderRadius: 9, overflow: "hidden", maxHeight: 160, overflowY: "auto", boxShadow: "0 4px 16px rgba(220,38,38,0.1)" }}>
        {results.map((p) => (
          <div key={p.place_id} onClick={() => onSelect(p)}
            style={{ padding: "9px 12px", fontSize: 12, color: C.textSecondary, cursor: "pointer", borderBottom: `1px solid ${C.borderSoft}` }}
            onMouseEnter={(e) => (e.currentTarget.style.background = C.cardBgSoft)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
            {p.display_name.slice(0, 80)}{p.display_name.length > 80 ? "…" : ""}
          </div>
        ))}
      </div>
    ) : null;

  const postBtnDisabled = !isTracking || !myCoords;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={sectionLabel}>Calculate distance from your location</div>

      <div style={{
        padding: "10px 14px", borderRadius: 10, fontSize: 12,
        display: "flex", alignItems: "center", gap: 9,
        background: isTracking ? C.greenBg : C.primaryLight,
        border: `1px solid ${isTracking ? C.greenBorder : C.primaryBorder}`,
        color: isTracking ? C.green : C.primary,
        fontWeight: 600,
      }}>
        {isTracking
          ? <PulsingDot color="green" />
          : <span style={{ width: 9, height: 9, borderRadius: "50%", background: C.primary, display: "inline-block", flexShrink: 0 }} />}
        <span>
          {isTracking
            ? "Live location active — Post Charity is enabled"
            : "Live location is OFF — Start tracking to enable Post Charity"}
        </span>
      </div>

      <div style={{ ...card, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={statLabel}>Your position (auto-filled when tracking)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <input style={{ ...inputStyle, fontFamily: "'JetBrains Mono',monospace" }} placeholder="My Lat" type="number" step="any" value={myLat} onChange={(e) => setMyLat(e.target.value)} />
          <input style={{ ...inputStyle, fontFamily: "'JetBrains Mono',monospace" }} placeholder="My Lng" type="number" step="any" value={myLng} onChange={(e) => setMyLng(e.target.value)} />
        </div>

        <div style={{ ...statLabel, marginTop: 4 }}>🏥 Hospital / Donation Center</div>
        <div style={{ position: "relative" }}>
          <input style={inputStyle} placeholder="Search hospital or blood bank…" value={hospitalSearch} onChange={(e) => onHospitalChange(e.target.value)} />
          <DropDown results={hospitalResults} onSelect={selectHospital} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <input style={{ ...inputStyle, fontFamily: "'JetBrains Mono',monospace" }} placeholder="Dest Lat" type="number" step="any" value={destLat} onChange={(e) => setDestLat(e.target.value)} />
          <input style={{ ...inputStyle, fontFamily: "'JetBrains Mono',monospace" }} placeholder="Dest Lng" type="number" step="any" value={destLng} onChange={(e) => setDestLng(e.target.value)} />
        </div>

        <Btn onClick={calculate} variant="outline" style={{ width: "100%" }}>
          📏 Calculate Distance
        </Btn>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Btn onClick={handlePostCharity} variant={postBtnDisabled ? "gray" : "red"} disabled={postBtnDisabled} style={{ width: "100%" }}>
            🩸 Post Charity
            {postBtnDisabled && <span style={{ marginLeft: 8, fontSize: 10, opacity: 0.6 }}>(requires live location)</span>}
          </Btn>
          {postBtnDisabled && (
            <div style={{ fontSize: 10, color: C.textHint, textAlign: "center" }}>
              ⚠️ Go to Live tab → Start Tracking, then return here
            </div>
          )}
        </div>
      </div>

      {postLog && (
        <div style={{ background: C.primaryLight, border: `1px solid ${C.primaryBorder}`, borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 10, animation: "fadeIn 0.3s ease both" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>🩸</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>Charity Posted!</span>
            <Badge variant="red">Logged to Console</Badge>
          </div>

          <div style={{ ...card, padding: "10px 12px" }}>
            <div style={{ ...statLabel, marginBottom: 6 }}>📍 Donor Live Location</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {[
                ["Latitude",  postLog.liveLocation.latitude.toFixed(6)],
                ["Longitude", postLog.liveLocation.longitude.toFixed(6)],
                ["Accuracy",  `±${postLog.liveLocation.accuracy}m`],
                ["Captured",  new Date(postLog.liveLocation.timestamp).toLocaleTimeString()],
              ].map(([l, v]) => (
                <div key={l} style={statCard}>
                  <div style={statLabel}>{l}</div>
                  <div style={statVal}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {postLog.destination.name && (
            <div style={{ ...card, padding: "10px 12px" }}>
              <div style={{ ...statLabel, marginBottom: 6 }}>🏥 Destination</div>
              <div style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.5 }}>{postLog.destination.name}</div>
              {postLog.destination.coords_raw && (
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textHint, marginTop: 4 }}>{postLog.destination.coords_raw}</div>
              )}
            </div>
          )}

          {postLog.distance && (
            <div style={{ background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 12, padding: 14, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 3 }}>Straight-line distance</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: C.green, letterSpacing: "-0.03em" }}>{postLog.distance.display}</div>
              <div style={{ fontSize: 10, color: C.green, marginTop: 2, opacity: 0.7 }}>{postLog.distance.miles.toFixed(2)} miles</div>
            </div>
          )}

          <details style={{ cursor: "pointer" }}>
            <summary style={{ fontSize: 10, color: C.textHint, userSelect: "none", marginBottom: 6 }}>
              {"{ } View raw console.log payload"}
            </summary>
            <pre style={{ fontSize: 9, lineHeight: 1.6, color: C.textSecondary, background: C.codeBg, borderRadius: 8, padding: "10px 12px", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all", fontFamily: "'JetBrains Mono', monospace" }}>
              {JSON.stringify(postLog, null, 2)}
            </pre>
          </details>

          <div style={{ fontSize: 10, color: C.textHint, textAlign: "center" }}>
            Open browser DevTools → Console to see full logged output
          </div>
        </div>
      )}

      {distResult && !postLog && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 14, padding: "18px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Straight-line distance</div>
            <div style={{ fontSize: 34, fontWeight: 700, color: C.green, letterSpacing: "-0.03em" }}>
              {distResult.km < 1 ? `${(distResult.km * 1000).toFixed(0)} m` : `${distResult.km.toFixed(2)} km`}
            </div>
            <div style={{ fontSize: 11, color: C.green, marginTop: 3, opacity: 0.7 }}>{distResult.mi.toFixed(2)} miles</div>
          </div>
          <div style={{ ...card, padding: 12, display: "flex", flexDirection: "column", gap: 7 }}>
            <Btn href={`https://www.google.com/maps/dir/${distResult.la1},${distResult.lo1}/${distResult.la2},${distResult.lo2}`} target="_blank" variant="outline" style={{ width: "100%" }}>🗺 Google Maps Directions ↗</Btn>
            <Btn href={`https://www.openstreetmap.org/directions?from=${distResult.la1},${distResult.lo1}&to=${distResult.la2},${distResult.lo2}`} target="_blank" variant="outline" style={{ width: "100%" }}>🗺 OpenStreetMap Directions ↗</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Permission Denied ─────────────────────────────────────────────────────────
function PermissionDenied({ onRetry }) {
  return (
    <div style={{ background: C.primaryLight, border: `1px solid ${C.primaryBorder}`, borderRadius: 14, padding: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.primary, marginBottom: 8 }}>🚫 Location access blocked</div>
      <div style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.9 }}>
        1. Click the lock/info icon in your browser address bar<br />
        2. Set Location → Allow<br />
        3. Click Re-request below
      </div>
      <Btn onClick={onRetry} variant="red" style={{ marginTop: 12, width: "100%" }}>↺ Re-request Permission</Btn>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function RaktoDaan() {
  const [coords, setCoords] = useState(null);
  const [trackHistory, setTrackHistory] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [isTracking, setIsTracking] = useState(false);
  const [permState, setPermState] = useState("idle");
  const [accuracy, setAccuracy] = useState("high");
  const [activeTab, setActiveTab] = useState("live");
  const [sessionLabel, setSessionLabel] = useState("");
  const [expireMinutes, setExpireMinutes] = useState(60);
  const [copiedId, setCopiedId] = useState(null);
  const [coordsCopied, setCoordsCopied] = useState(false);
  const [address, setAddress] = useState(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [ageStr, setAgeStr] = useState("Just now");

  const watchIdRef = useRef(null);
  const permQueryRef = useRef(null);
  const expireTickRef = useRef(null);
  const ageRef = useRef(null);

  useEffect(() => {
    expireTickRef.current = setInterval(() => {
      setSessions((prev) => prev.map((s) => (s.expiresAt < Date.now() && s.active ? { ...s, active: false } : s)));
    }, 10000);
    return () => {
      clearInterval(expireTickRef.current);
      clearInterval(ageRef.current);
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const reverseGeocode = useCallback((lat, lng) => {
    setAddressLoading(true);
    setAddress(null);
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: { "Accept-Language": "en" } })
      .then((r) => r.json())
      .then((d) => setAddress(d.display_name || "Address not found"))
      .catch(() => setAddress("Address lookup unavailable"))
      .finally(() => setAddressLoading(false));
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) { setPermState("denied"); return; }
    if (navigator.permissions && !permQueryRef.current) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        permQueryRef.current = result;
        result.onchange = () => { if (result.state === "granted") { setPermState("idle"); setTimeout(startTracking, 100); } };
      });
    }
    setPermState("requesting");
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude, acc: Math.round(pos.coords.accuracy), ts: Date.now() };
        setCoords(c);
        setPermState("granted");
        setIsTracking(true);
        setAgeStr("Just now");
        clearInterval(ageRef.current);
        ageRef.current = setInterval(() => setAgeStr(formatAge(c.ts)), 1000);
        setTrackHistory((prev) => {
          const last = prev[prev.length - 1];
          if (last && Math.abs(last.lat - c.lat) < 0.00005 && Math.abs(last.lng - c.lng) < 0.00005) return prev;
          return [...prev.slice(-99), { lat: c.lat, lng: c.lng, ts: c.ts }];
        });
        reverseGeocode(c.lat, c.lng);
      },
      (err) => {
        if (err.code === 1) { setPermState("denied"); setIsTracking(false); }
        else if (err.code === 3) {
          if (watchIdRef.current != null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
          setTimeout(startTracking, 2000);
        }
      },
      { enableHighAccuracy: accuracy === "high", timeout: 12000, maximumAge: 0 }
    );
  }, [accuracy, reverseGeocode]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current != null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
    setIsTracking(false);
    clearInterval(ageRef.current);
  }, []);

  const createSession = () => {
    if (!coords) return;
    const s = { id: generateId(), label: sessionLabel.trim() || `Session ${sessions.length + 1}`, coords: { ...coords }, active: true, createdAt: Date.now(), expiresAt: Date.now() + expireMinutes * 60000 };
    setSessions((prev) => [s, ...prev]);
    setSessionLabel("");
  };

  const revokeSession  = (id) => setSessions((prev) => prev.map((s) => s.id === id ? { ...s, active: false } : s));
  const deleteSession  = (id) => setSessions((prev) => prev.filter((s) => s.id !== id));

  const copyLink = (id) => {
    navigator.clipboard.writeText(`${window.location.origin}/share/${id}`).then(() => {
      setCopiedId(id); setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const copyCoords = () => {
    if (!coords) return;
    navigator.clipboard.writeText(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`).then(() => {
      setCoordsCopied(true); setTimeout(() => setCoordsCopied(false), 2000);
    });
  };

  const exportCSV = () => {
    if (!trackHistory.length) return;
    const csv = "lat,lng,timestamp\n" + trackHistory.map((p) => `${p.lat},${p.lng},${new Date(p.ts).toISOString()}`).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `track-${Date.now()}.csv`;
    a.click();
  };

  const activeSessions  = sessions.filter((s) => s.active);
  const expiredSessions = sessions.filter((s) => !s.active);

  const TABS = [
    { id: "live",     label: "📡 Live" },
    { id: "weather",  label: "🌤 Weather" },
    { id: "distance", label: "📏 Donate Blood" },
    { id: "sessions", label: `🔗 Share${activeSessions.length > 0 ? ` (${activeSessions.length})` : ""}` },
    { id: "history",  label: "🗺 History" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.pageBg, color: C.textPrimary, fontFamily: "'Sora', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes geoPing { 75%,100% { transform:scale(2.2); opacity:0; } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing:border-box; margin:0; padding:0; }
        input,select,button,textarea { font-family:'Sora',sans-serif; }
        input,textarea { color-scheme:light; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(220,38,38,0.25); border-radius:99px; }
        .geo-anim { animation:fadeIn 0.3s ease both; }
        .tab-scroll { overflow-x:auto; scrollbar-width:none; }
        .tab-scroll::-webkit-scrollbar { display:none; }
        details summary::-webkit-details-marker { display:none; }
        details summary { list-style:none; }
        input:focus, textarea:focus, select:focus { border-color:rgba(220,38,38,0.5) !important; box-shadow:0 0 0 3px rgba(220,38,38,0.12); }
      `}</style>

      {/* ── Header ── */}
     <header
  style={{
    maxWidth: 900,
    margin: "0 auto",
    padding: "12px 16px",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap", // 🔥 important for responsiveness
      gap: 12,
    }}
  >
    {/* Left Section */}
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: C.primary,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          boxShadow: "0 2px 6px rgba(220,38,38,0.35)",
        }}
      >
        🩸
      </div>

      <div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: C.primary,
          }}
        >
          RaktoDaan
        </div>
        <div
          style={{
            fontSize: 11,
            color: C.textMuted,
            marginTop: 2,
          }}
        >
          ❤️ Blood Charity Platform
        </div>
      </div>
    </div>

    {/* Right Section */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {isTracking && <PulsingDot color="red" />}

      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          padding: "4px 8px",
          borderRadius: 999,
          background:
            isTracking
              ? "rgba(220,38,38,0.1)"
              : permState === "requesting"
              ? "rgba(245,158,11,0.1)"
              : "rgba(107,114,128,0.1)",
          color:
            isTracking
              ? C.primary
              : permState === "requesting"
              ? C.amber
              : C.textHint,
        }}
      >
        {isTracking
          ? "Live"
          : permState === "requesting"
          ? "Connecting…"
          : "Offline"}
      </span>
    </div>
  </div>
</header>

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* ── Control bar ── */}
        <div style={{ ...card, padding: "13px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ ...sectionLabel, marginBottom: 8 }}>Accuracy</div>
            <div style={{ display: "flex", gap: 6 }}>
              {["high", "low"].map((a) => (
                <button key={a} onClick={() => !isTracking && setAccuracy(a)} style={{
                  padding: "5px 13px", borderRadius: 9, fontSize: 11, fontWeight: 600,
                  cursor: isTracking ? "not-allowed" : "pointer",
                  opacity: isTracking ? 0.4 : 1,
                  fontFamily: "'Sora',sans-serif",
                  background: accuracy === a ? C.primaryLight : "transparent",
                  border: accuracy === a ? `1px solid ${C.primaryBorder}` : `1px solid ${C.borderSoft}`,
                  color: accuracy === a ? C.primary : C.textMuted,
                }}>
                  {a === "high" ? "🎯 High" : "⚡ Low"}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => (isTracking ? stopTracking() : startTracking())} style={{
            padding: "10px 22px", borderRadius: 12, fontSize: 13, fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
            fontFamily: "'Sora',sans-serif",
            background: isTracking ? C.primaryLight : C.primary,
            border: isTracking ? `1px solid ${C.primaryBorder}` : `1px solid ${C.primaryDark}`,
            color: isTracking ? C.primary : C.white,
            boxShadow: isTracking ? "none" : "0 2px 8px rgba(220,38,38,0.35)",
          }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: isTracking ? 2 : "50%", background: isTracking ? C.primary : C.white }} />
            {isTracking ? "Stop" : "Start Tracking"}
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="tab-scroll" style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 4, boxShadow: "0 1px 3px rgba(220,38,38,0.06)" }}>
          <div style={{ display: "flex", gap: 3, minWidth: "max-content" }}>
            {TABS.map(({ id, label }) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{
                padding: "7px 11px", borderRadius: 9, fontSize: 11, fontWeight: 600,
                cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'Sora',sans-serif",
                background: activeTab === id ? C.primary : "transparent",
                border: activeTab === id ? `1px solid ${C.primaryDark}` : "1px solid transparent",
                color: activeTab === id ? C.white : C.textMuted,
                transition: "all 0.15s",
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Live Tab ── */}
        {activeTab === "live" && (
          <div className="geo-anim" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {permState === "denied" && <PermissionDenied onRetry={startTracking} />}
            {!coords && permState !== "denied" && (
              <div style={{ ...card, padding: "52px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}>
                <div style={{ width: 68, height: 68, borderRadius: "50%", background: C.primaryLight, border: `1px solid ${C.primaryBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
                  {permState === "requesting" ? "⏳" : "📍"}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: C.textPrimary, marginBottom: 5 }}>
                    {permState === "requesting" ? "Requesting permission…" : "No location yet"}
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>
                    {permState === "requesting" ? "Allow location in the browser popup" : "Press Start Tracking to begin"}
                  </div>
                </div>
              </div>
            )}
            {coords && (
              <>
                <GoogleMapEmbed lat={coords.lat} lng={coords.lng} />
                <div style={{ background: C.cardBgSoft, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 13px", fontSize: 12, color: C.textSecondary, lineHeight: 1.6, display: "flex", alignItems: "center", gap: 8, minHeight: 42 }}>
                  {addressLoading ? <><Spinner /><span style={{ color: C.textHint }}>Fetching address…</span></> : address}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[["↕ Latitude", coords.lat.toFixed(6)], ["↔ Longitude", coords.lng.toFixed(6)], ["🎯 Accuracy", `±${coords.acc}m`], ["🕐 Updated", ageStr]].map(([label, val]) => (
                    <div key={label} style={statCard}>
                      <div style={statLabel}>{label}</div>
                      <div style={statVal}>{val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn href={`https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}&zoom=15`} target="_blank" variant="outline" style={{ flex: 1, fontSize: 11 }}>🗺 OSM ↗</Btn>
                  <Btn href={`https://www.google.com/maps?q=${coords.lat},${coords.lng}`} target="_blank" variant="outline" style={{ flex: 1, fontSize: 11 }}>📍 GMaps ↗</Btn>
                  <Btn onClick={copyCoords} variant={coordsCopied ? "green" : "outline"} style={{ flex: 1, fontSize: 11 }}>{coordsCopied ? "✓ Copied!" : "📋 Copy"}</Btn>
                </div>
                <div style={{ ...card, padding: 14, display: "flex", flexDirection: "column", gap: 11 }}>
                  <div style={sectionLabel}>Share This Location</div>
                  <input style={inputStyle} value={sessionLabel} onChange={(e) => setSessionLabel(e.target.value)} placeholder="Session label (e.g. Meeting point)" onKeyDown={(e) => e.key === "Enter" && createSession()} />
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <select value={expireMinutes} onChange={(e) => setExpireMinutes(Number(e.target.value))} style={{ ...inputStyle, flex: 1 }}>
                      {[[15, "15 min"], [30, "30 min"], [60, "1 hr"], [120, "2 hrs"], [360, "6 hrs"], [1440, "24 hrs"]].map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                    <Btn onClick={createSession} variant="red" style={{ whiteSpace: "nowrap" }}>+ Create Link</Btn>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Weather Tab ── */}
        {activeTab === "weather" && (
          <div className="geo-anim">
            {coords ? <WeatherPanel lat={coords.lat} lng={coords.lng} /> : (
              <div style={{ ...card, padding: "52px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🌤</div>
                <div style={{ fontSize: 13, color: C.textMuted }}>Start tracking to load live weather</div>
              </div>
            )}
          </div>
        )}

        {/* ── Distance / Donate Blood Tab ── */}
        {activeTab === "distance" && (
          <div className="geo-anim">
            <DistancePanel myCoords={coords} isTracking={isTracking} />
          </div>
        )}

        {/* ── Sessions Tab ── */}
        {activeTab === "sessions" && (
          <div className="geo-anim" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sessions.length === 0 ? (
              <div style={{ ...card, padding: "52px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🔗</div>
                <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 4 }}>No sessions yet</div>
                <div style={{ fontSize: 11, color: C.textHint }}>Go to Live tab → create a shareable link</div>
              </div>
            ) : (
              <>
                {activeSessions.length > 0 && <div style={{ ...sectionLabel, paddingLeft: 4 }}>Active ({activeSessions.length})</div>}
                {activeSessions.map((s) => (
                  <div key={s.id} style={{ ...card, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <PulsingDot color="red" />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>{s.label}</div>
                          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.textHint, marginTop: 2 }}>{s.id}</div>
                        </div>
                      </div>
                      <Badge variant="amber">{formatExpiry(s.expiresAt)}</Badge>
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, background: C.codeBg, borderRadius: 7, padding: "7px 10px", color: C.textSecondary, wordBreak: "break-all", border: `1px solid ${C.borderSoft}` }}>
                      {`${window.location.origin}/share/${s.id}`}
                    </div>
                    <div style={{ display: "flex", gap: 7 }}>
                      <Btn onClick={() => copyLink(s.id)} variant={copiedId === s.id ? "green" : "redSoft"} style={{ flex: 1 }}>{copiedId === s.id ? "✓ Copied!" : "📋 Copy Link"}</Btn>
                      <Btn href={`https://www.google.com/maps?q=${s.coords.lat},${s.coords.lng}`} target="_blank" variant="outline">🗺</Btn>
                      <Btn onClick={() => revokeSession(s.id)} variant="gray">Revoke</Btn>
                    </div>
                  </div>
                ))}
                {expiredSessions.length > 0 && (
                  <>
                    <div style={{ ...sectionLabel, paddingLeft: 4, paddingTop: 6, opacity: 0.5 }}>Expired ({expiredSessions.length})</div>
                    {expiredSessions.map((s) => (
                      <div key={s.id} style={{ ...card, padding: "11px 14px", opacity: 0.4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.textHint, display: "inline-block" }} />
                          <span style={{ fontSize: 13, color: C.textSecondary }}>{s.label}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Badge variant="red">Expired</Badge>
                          <button onClick={() => deleteSession(s.id)} style={{ background: "none", border: "none", color: C.textHint, cursor: "pointer", fontSize: 14 }}>✕</button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* ── History Tab ── */}
        {activeTab === "history" && (
          <div className="geo-anim" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 4 }}>
              <span style={{ fontSize: 11, color: C.textMuted }}>{trackHistory.length} point{trackHistory.length !== 1 ? "s" : ""} recorded</span>
              {trackHistory.length > 0 && (
                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={exportCSV} style={{ background: "none", border: "none", color: C.primary, fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>↓ Export CSV</button>
                  <button onClick={() => setTrackHistory([])} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>✕ Clear</button>
                </div>
              )}
            </div>
            <div style={{ ...card, overflow: "hidden" }}>
              {trackHistory.length === 0 ? (
                <div style={{ padding: "52px 20px", textAlign: "center" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>🗺</div>
                  <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 4 }}>No track history yet</div>
                  <div style={{ fontSize: 11, color: C.textHint }}>Points recorded as you move</div>
                </div>
              ) : (
                <>
                  <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.borderSoft}`, display: "flex", gap: 20, fontSize: 11 }}>
                    {[["First", formatAge(trackHistory[0].ts)], ["Latest", formatAge(trackHistory[trackHistory.length - 1].ts)], ["Total", `${trackHistory.length} pts`]].map(([l, v]) => (
                      <div key={l}>
                        <div style={{ color: C.textHint, marginBottom: 2 }}>{l}</div>
                        <div style={{ color: C.textSecondary, fontWeight: 600 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ maxHeight: 360, overflowY: "auto" }}>
                    {[...trackHistory].reverse().map((pt, i) => (
                      <div key={i} style={{ padding: "9px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.borderSoft}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 5, height: 5, borderRadius: "50%", flexShrink: 0, background: i === 0 ? C.primary : C.primaryBorder }} />
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.textSecondary }}>{pt.lat.toFixed(6)}, {pt.lng.toFixed(6)}</span>
                        </div>
                        <span style={{ fontSize: 10, color: C.textHint }}>{formatAge(pt.ts)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer style={{ marginTop: 32, padding: "32px 16px", textAlign: "center", fontSize: 10, color: C.textHint, lineHeight: 2.2, borderTop: `1px solid ${C.borderSoft}` }}>
        <div>🔒 Location data stays in your browser</div>
        <div>Maps: Google · Geocoding: Nominatim · Weather: Open-Meteo · All free, no API keys</div>
        <div style={{ marginTop: 6, color: C.primary, fontWeight: 700, fontSize: 11 }}>❤️ RaktoDaan — রক্ত দিন, জীবন বাঁচান</div>
      </footer>
    </div>
  );
}