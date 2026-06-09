import { useEffect, useState, useRef } from "react";
import { useSocketContext } from "../../router/SocketProvider";
import GenerateImage from "../CommonAction/GenerateImage";

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
};

const statusConfig = {
  isProgress: { label: "In Progress", color: "#e53e3e", bg: "#fff5f5" },
  active:     { label: "Active",       color: "#38a169", bg: "#f0fff4" },
  inactive:   { label: "Inactive",     color: "#718096", bg: "#f7fafc" },
};

const Skeleton = () => (
  <div style={{ padding: "40px", display: "flex", flexDirection: "column", gap: 14 }}>
    <div className="shimmer" style={{ height: 32, width: "55%", borderRadius: 8 }} />
    <div className="shimmer" style={{ height: 16, width: "38%", borderRadius: 8 }} />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 12 }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="shimmer" style={{ height: 72, borderRadius: 14 }} />
      ))}
    </div>
  </div>
);

const ErrorState = ({ message }) => (
  <div style={{ padding: "60px 40px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
    <div style={{ fontSize: 40 }}>⚠️</div>
    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "#c53030" }}>Something went wrong</div>
    <div style={{ fontSize: 14, color: "#718096", textAlign: "center", maxWidth: 320 }}>
      {message || "Unable to load profile. Please try again."}
    </div>
  </div>
);

// ─── FIX 1: Separated geo-fetch and map-init into two distinct effects
// ─── FIX 2: Added a mapContainerRef wrapper div with explicit dimensions
// ─── FIX 3: Used setTimeout to ensure DOM is painted before initMap runs
// ─── FIX 4: Called map.invalidateSize() after a short delay to fix blank tiles
const IPMapSection = ({ ipAddress }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [geoData, setGeoData] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false); // FIX 5: track when container is visible

  // Effect 1: Fetch geo data
  useEffect(() => {
    if (!ipAddress) return;
    setGeoData(null);
    setGeoError(null);
    setMapReady(false);
    setGeoLoading(true);

    fetch(`https://ipapi.co/${ipAddress}/json/`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.reason || "IP lookup failed");
        setGeoData(data);
      })
      .catch((e) => setGeoError(e.message))
      .finally(() => setGeoLoading(false));
  }, [ipAddress]);

  // Effect 2: Signal that map container is mounted/visible after geoData arrives
  useEffect(() => {
    if (!geoData) return;
    // Wait one paint cycle for the DOM to render the map div
    const raf = requestAnimationFrame(() => {
      setTimeout(() => setMapReady(true), 50);
    });
    return () => cancelAnimationFrame(raf);
  }, [geoData]);

  // Effect 3: Init Leaflet only after container is confirmed visible
  useEffect(() => {
    if (!mapReady || !mapRef.current || !geoData) return;

    // Destroy any existing instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const initMap = () => {
      const L = window.L;
      if (!L || !mapRef.current) return;

      const map = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
        // FIX: prefer canvas renderer avoids tile blank on hidden containers
        preferCanvas: true,
      });
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 18,
      }).addTo(map);

      const lat = geoData.latitude;
      const lng = geoData.longitude;
      map.setView([lat, lng], 12);

      const pulseIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:18px;height:18px;border-radius:50%;
          background:#e53e3e;border:3px solid #fff;
          box-shadow:0 0 0 4px rgba(229,62,62,.35),0 4px 14px rgba(229,62,62,.5);
          animation:map-pulse 1.8s infinite;
        "></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      L.marker([lat, lng], { icon: pulseIcon })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:'DM Sans',sans-serif;font-size:13px;line-height:1.6">
            <strong style="color:#e53e3e">${geoData.city}, ${geoData.country_name}</strong><br/>
            ${geoData.ip} · ${geoData.org}
          </div>`,
          { maxWidth: 280 }
        )
        .openPopup();

      // FIX 4: invalidateSize after map is fully in DOM to fix blank/grey tiles
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 200);
    };

    if (window.L) {
      // Leaflet already loaded
      initMap();
    } else {
      // Load Leaflet CSS + JS dynamically
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (!document.getElementById("leaflet-js")) {
        const script = document.createElement("script");
        script.id = "leaflet-js";
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = () => {
          // Extra delay after script load to ensure L is fully initialized
          setTimeout(initMap, 100);
        };
        document.head.appendChild(script);
      } else {
        // Script tag exists but L might not be ready yet (race), poll briefly
        const poll = setInterval(() => {
          if (window.L) { clearInterval(poll); initMap(); }
        }, 50);
        setTimeout(() => clearInterval(poll), 3000);
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapReady, geoData]);

  if (!ipAddress) return null;

  return (
    <div className="ip-section-inner">
      <div className="section-header">
        <span className="section-icon">🌍</span>
        <span className="section-title">IP Geolocation</span>
        <span className="section-subtitle">{ipAddress}</span>
      </div>

      {geoLoading && (
        <div className="geo-loading">
          <div className="geo-spinner" />
          <span>Locating IP address…</span>
        </div>
      )}

      {geoError && (
        <div className="geo-error">⚠️ {geoError}</div>
      )}

      {geoData && (
        <>
          {/* FIX 6: Map wrapper with EXPLICIT height so Leaflet can measure it */}
          <div className="map-wrap">
            <style>{`
              @keyframes map-pulse {
                0%,100%{box-shadow:0 0 0 4px rgba(229,62,62,.35),0 4px 14px rgba(229,62,62,.5)}
                50%{box-shadow:0 0 0 10px rgba(229,62,62,.1),0 4px 14px rgba(229,62,62,.4)}
              }
            `}</style>
            {/* FIX: explicit inline dimensions guarantee Leaflet gets a real size */}
            <div
              ref={mapRef}
              style={{ height: "280px", width: "100%", display: "block" }}
            />
            <div className="map-coords">
              📍 {geoData.latitude.toFixed(4)}°N · {geoData.longitude.toFixed(4)}°E
            </div>
          </div>

          <div className="geo-grid">
            {[
              { label: "IP Address",    icon: "🌐", value: geoData.ip },
              { label: "Network",       icon: "🔗", value: geoData.network },
              { label: "Version",       icon: "📡", value: geoData.version },
              { label: "City",          icon: "🏙️", value: geoData.city },
              { label: "Region",        icon: "🗺️", value: geoData.region },
              { label: "Region Code",   icon: "🔤", value: geoData.region_code },
              { label: "Country",       icon: "🏳️", value: `${geoData.country_name} (${geoData.country_code})` },
              { label: "ISO3 Code",     icon: "🆔", value: geoData.country_code_iso3 },
              { label: "Capital",       icon: "🏛️", value: geoData.country_capital },
              { label: "TLD",           icon: "🔖", value: geoData.country_tld },
              { label: "Continent",     icon: "🌏", value: geoData.continent_code },
              { label: "In EU",         icon: "🇪🇺", value: geoData.in_eu ? "Yes" : "No" },
              { label: "Postal Code",   icon: "📮", value: geoData.postal },
              { label: "Latitude",      icon: "↕️",  value: `${geoData.latitude}°` },
              { label: "Longitude",     icon: "↔️",  value: `${geoData.longitude}°` },
              { label: "Timezone",      icon: "🕐", value: geoData.timezone },
              { label: "UTC Offset",    icon: "⏱️", value: geoData.utc_offset },
              { label: "Calling Code",  icon: "📞", value: geoData.country_calling_code },
              { label: "Currency",      icon: "💰", value: `${geoData.currency} — ${geoData.currency_name}` },
              { label: "Languages",     icon: "🗣️", value: geoData.languages },
              { label: "Country Area",  icon: "📐", value: `${geoData.country_area?.toLocaleString()} km²` },
              { label: "Population",    icon: "👥", value: geoData.country_population?.toLocaleString() },
              { label: "ASN",           icon: "🔢", value: geoData.asn },
              { label: "Organization",  icon: "🏢", value: geoData.org },
            ].map(({ label, icon, value }) => (
              <div key={label} className="geo-card">
                <div className="geo-label">{icon} {label}</div>
                <div className="geo-value">{value ?? "—"}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const EditModal = ({ profile, onClose, onSave }) => {
  const [name, setName] = useState(profile?.name ?? "");
  const [picture, setPicture] = useState(profile?.picture ?? "");
  const [preview, setPreview] = useState(profile?.picture ?? "");
  const [saving, setSaving] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setPreview(ev.target.result); setPicture(ev.target.result); };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({ name: name.trim(), picture });
    setSaving(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">Edit Profile</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-avatar-wrap">
          <div className="modal-avatar-ring">
            {preview ? (
              <img src={preview} alt="preview" className="modal-avatar-img" onError={() => setPreview("")} />
            ) : (
              <div className="modal-avatar-initials">
                {name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
              </div>
            )}
          </div>
          <label className="change-photo-btn">
            📷 Change Photo
            <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
          </label>
          {preview && (
            <button className="remove-photo-btn" onClick={() => { setPreview(""); setPicture(""); }}>
              Remove
            </button>
          )}
        </div>
        <div className="modal-field">
          <label className="modal-label">Full Name</label>
          <input className="modal-input" type="text" value={name}
            onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" />
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

const MyProfile = () => {
  const { socket, connected } = useSocketContext();
  const [profile,  setProfile]  = useState(null);
  const [error,    setError]    = useState(null);
  const [loaded,   setLoaded]   = useState(false);
  const [imgErr,   setImgErr]   = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    if (!socket || !connected) return;
    socket.emit("my_profile");
    socket.on("my_profile_success", (res) => {
      setProfile(res.data); setError(null); setLoaded(true);
    });
    socket.on("my_profile_error", (err) => {
      setError(err.message || "Unknown error"); setProfile(null); setLoaded(true);
    });
    return () => { socket.off("my_profile_success"); socket.off("my_profile_error"); };
  }, [socket, connected]);

   

const handleSave = async (updates) => {
  try {
    let newUpdates = { ...updates };

   
    if (newUpdates.picture?.startsWith("data:image")) {
      const uploadedUrl = await GenerateImage(newUpdates.picture);

      if (uploadedUrl) {
        newUpdates.picture = uploadedUrl;
      } else {
        setImgErr(true);
        throw new Error("Image upload failed");
      }
    }
    if (socket && connected) {
      socket.emit("update_profile", newUpdates, (res) => {
        if (!res.success) {
      
          setImgErr(true);
          return;
        }

        
      });
    }
    setProfile((prev) => ({
      ...prev,
      ...newUpdates,
    }));

    setImgErr(false);


  } catch (err) {
    console.error(err);
    setImgErr(true);
  }
};

  const status   = statusConfig[profile?.status] ?? statusConfig.isProgress;
  const initials = profile?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .profile-root {
          min-height: 100vh; background: #fafafa;
          font-family: 'DM Sans', sans-serif;
          padding: 32px 20px 60px; position: relative;
        }
        .profile-root::before {
          content: ''; position: fixed; top: 0; left: 0; right: 0; height: 340px;
          background: linear-gradient(150deg, #9b1c1c 0%, #c53030 40%, #e53e3e 70%, #fc8181 100%);
          z-index: 0; clip-path: ellipse(110% 100% at 50% 0%);
        }
        .profile-container { max-width: 1100px; margin: 0 auto; position: relative; z-index: 1; }

        .top-bar { display: flex; align-items: center; justify-content: space-between; padding: 0 4px 24px; }
        .top-brand { font-family: 'Cormorant Garamond', serif; color: rgba(255,255,255,.9); font-size: 14px; letter-spacing: 5px; text-transform: uppercase; }
        .online-badge { display: flex; align-items: center; gap: 7px; background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.3); padding: 5px 16px; border-radius: 20px; color: #fff; font-size: 12px; font-weight: 500; letter-spacing: .4px; backdrop-filter: blur(8px); }
        .online-dot { width: 7px; height: 7px; border-radius: 50%; background: #68d391; animation: pulse-dot 2s infinite; }
        @keyframes pulse-dot { 0%,100%{box-shadow:0 0 0 2px rgba(104,211,145,.4)} 50%{box-shadow:0 0 0 5px rgba(104,211,145,.15)} }

        .main-layout { display: grid; grid-template-columns: 300px 1fr; gap: 24px; align-items: start; }
        .left-col { display: flex; flex-direction: column; gap: 18px; }

        .identity-card { background: #fff; border-radius: 24px; box-shadow: 0 8px 40px rgba(229,62,62,.13), 0 2px 12px rgba(0,0,0,.06); overflow: hidden; opacity: 0; transform: translateY(24px); transition: opacity .5s .1s ease, transform .5s .1s ease; }
        .identity-card.visible { opacity: 1; transform: translateY(0); }
        .id-hero { height: 80px; background: linear-gradient(135deg, #9b1c1c, #e53e3e, #fc8181); position: relative; }
        .id-avatar-wrap { position: absolute; bottom: -42px; left: 50%; transform: translateX(-50%); }
        .id-avatar-ring { width: 86px; height: 86px; border-radius: 50%; padding: 3px; background: linear-gradient(135deg, #fff 30%, #feb2b2 100%); box-shadow: 0 6px 24px rgba(229,62,62,.3); position: relative; }
        .id-avatar-img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block; }
        .id-avatar-initials { width: 100%; height: 100%; border-radius: 50%; background: linear-gradient(135deg, #e53e3e, #9b1c1c); display: flex; align-items: center; justify-content: center; font-family: 'Cormorant Garamond', serif; font-size: 30px; font-weight: 700; color: #fff; }
        .verify-badge { position: absolute; bottom: 2px; right: 2px; width: 22px; height: 22px; background: #e53e3e; border-radius: 50%; border: 2px solid #fff; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 11px; font-weight: 700; }
        .id-body { padding: 52px 22px 24px; text-align: center; }
        .id-name { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 700; color: #1a202c; margin-bottom: 4px; }
        .id-role { display: inline-flex; align-items: center; gap: 4px; background: #fff5f5; border: 1.5px solid #feb2b2; color: #c53030; font-size: 10px; font-weight: 700; padding: 3px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
        .id-email { display: flex; align-items: center; justify-content: center; gap: 6px; color: #718096; font-size: 12.5px; word-break: break-all; }
        .status-pill { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 12px; border: 1.5px solid #fed7d7; background: #fff5f5; margin-top: 14px; }
        .status-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
        .status-lbl { font-size: 12px; color: #718096; }
        .status-val { font-size: 12px; font-weight: 700; margin-left: auto; }
        .edit-btn { width: 100%; padding: 11px; background: linear-gradient(135deg, #e53e3e, #9b1c1c); color: #fff; border: none; border-radius: 14px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: opacity .2s, transform .15s; margin-top: 14px; }
        .edit-btn:hover { opacity: .9; transform: translateY(-1px); }

        .meta-card { background: #fff; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,.06); padding: 18px; display: flex; flex-direction: column; gap: 10px; opacity: 0; transform: translateY(24px); transition: opacity .5s .2s ease, transform .5s .2s ease; }
        .meta-card.visible { opacity: 1; transform: translateY(0); }
        .meta-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-radius: 10px; background: #fafafa; border: 1px solid #fee2e2; font-size: 12.5px; }
        .meta-key { color: #718096; display: flex; align-items: center; gap: 5px; }
        .meta-val { font-weight: 700; }
        .meta-val.yes { color: #38a169; }
        .meta-val.no  { color: #e53e3e; }
        .meta-val.warn { color: #d69e2e; }

        .right-col { display: flex; flex-direction: column; gap: 20px; }

        .info-panel { background: #fff; border-radius: 24px; box-shadow: 0 8px 40px rgba(229,62,62,.1), 0 2px 12px rgba(0,0,0,.05); padding: 28px; opacity: 0; transform: translateY(24px); transition: opacity .5s .15s ease, transform .5s .15s ease; }
        .info-panel.visible { opacity: 1; transform: translateY(0); }

        /* FIX 7: ip-section starts VISIBLE (opacity:1) so Leaflet measures real dimensions */
        .ip-section { background: #fff; border-radius: 24px; box-shadow: 0 8px 40px rgba(229,62,62,.1), 0 2px 12px rgba(0,0,0,.05); padding: 28px; opacity: 0; transform: translateY(24px); transition: opacity .5s .25s ease, transform .5s .25s ease; }
        .ip-section.visible { opacity: 1; transform: translateY(0); }

        .section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; padding-bottom: 14px; border-bottom: 2px solid #fff5f5; }
        .section-icon { font-size: 18px; }
        .section-title { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 700; color: #1a202c; flex: 1; }
        .section-subtitle { font-size: 11px; color: #a0aec0; background: #f7fafc; padding: 3px 10px; border-radius: 20px; border: 1px solid #e2e8f0; }

        .info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
        .info-card { background: #fff; border: 1.5px solid #fee2e2; border-radius: 14px; padding: 13px 15px; transition: border-color .2s, box-shadow .2s, transform .2s; cursor: default; }
        .info-card:hover { border-color: #e53e3e; box-shadow: 0 4px 16px rgba(229,62,62,.1); transform: translateY(-2px); }
        .info-label { font-size: 9.5px; font-weight: 700; color: #e53e3e; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 5px; }
        .info-value { font-size: 13px; font-weight: 500; color: #2d3748; word-break: break-all; line-height: 1.4; }

        /* Map */
        .map-wrap { border-radius: 16px; overflow: hidden; border: 2px solid #fee2e2; position: relative; margin-bottom: 18px; }
        .map-coords { position: absolute; bottom: 10px; left: 10px; background: rgba(255,255,255,.9); backdrop-filter: blur(8px); border: 1px solid #fee2e2; padding: 5px 12px; border-radius: 20px; font-size: 11.5px; color: #c53030; font-weight: 600; z-index: 1000; pointer-events: none; }

        .geo-loading { display: flex; align-items: center; gap: 12px; padding: 32px; justify-content: center; color: #718096; font-size: 14px; }
        .geo-spinner { width: 20px; height: 20px; border-radius: 50%; border: 2.5px solid #fee2e2; border-top-color: #e53e3e; animation: spin .7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .geo-error { background: #fff5f5; border: 1.5px solid #fed7d7; border-radius: 12px; padding: 14px 18px; color: #c53030; font-size: 13px; margin-bottom: 14px; }

        .geo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 10px; }
        .geo-card { background: linear-gradient(135deg, #fff, #fff5f5); border: 1.5px solid #fee2e2; border-radius: 12px; padding: 11px 13px; transition: border-color .2s, box-shadow .2s, transform .2s; cursor: default; }
        .geo-card:hover { border-color: #e53e3e; box-shadow: 0 3px 14px rgba(229,62,62,.1); transform: translateY(-2px); }
        .geo-label { font-size: 9px; font-weight: 700; color: #e53e3e; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 4px; }
        .geo-value { font-size: 12px; font-weight: 500; color: #2d3748; word-break: break-all; line-height: 1.4; }

        /* Modal */
        .modal-overlay { position: fixed; inset: 0; background: rgba(26,32,44,.65); backdrop-filter: blur(6px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fade-in .2s ease; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .modal-box { background: #fff; border-radius: 24px; box-shadow: 0 24px 80px rgba(229,62,62,.2), 0 4px 24px rgba(0,0,0,.1); width: 100%; max-width: 440px; animation: slide-up .25s ease; overflow: hidden; }
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .modal-header { background: linear-gradient(135deg, #9b1c1c, #e53e3e); padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; }
        .modal-title { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 700; color: #fff; letter-spacing: .5px; }
        .modal-close { background: rgba(255,255,255,.2); border: none; color: #fff; width: 30px; height: 30px; border-radius: 50%; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background .2s; }
        .modal-close:hover { background: rgba(255,255,255,.35); }
        .modal-avatar-wrap { padding: 28px 24px 8px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .modal-avatar-ring { width: 90px; height: 90px; border-radius: 50%; padding: 3px; background: linear-gradient(135deg, #e53e3e, #feb2b2); box-shadow: 0 6px 24px rgba(229,62,62,.3); }
        .modal-avatar-img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block; }
        .modal-avatar-initials { width: 100%; height: 100%; border-radius: 50%; background: linear-gradient(135deg, #e53e3e, #9b1c1c); display: flex; align-items: center; justify-content: center; font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 700; color: #fff; }
        .change-photo-btn { background: #fff5f5; border: 1.5px solid #feb2b2; color: #c53030; font-size: 12px; font-weight: 600; padding: 7px 16px; border-radius: 20px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background .2s, border-color .2s; }
        .change-photo-btn:hover { background: #fee2e2; border-color: #e53e3e; }
        .remove-photo-btn { background: none; border: none; color: #718096; font-size: 12px; cursor: pointer; font-family: 'DM Sans', sans-serif; text-decoration: underline; }
        .modal-field { padding: 0 24px 20px; }
        .modal-label { display: block; font-size: 11px; font-weight: 700; color: #e53e3e; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 8px; }
        .modal-input { width: 100%; padding: 12px 16px; border: 1.5px solid #fed7d7; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 14px; color: #1a202c; background: #fff; outline: none; transition: border-color .2s, box-shadow .2s; }
        .modal-input:focus { border-color: #e53e3e; box-shadow: 0 0 0 3px rgba(229,62,62,.12); }
        .modal-actions { padding: 0 24px 24px; display: flex; gap: 10px; }
        .btn-cancel { flex: 1; padding: 11px; background: #f7fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; color: #718096; font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 600; cursor: pointer; transition: background .2s; }
        .btn-cancel:hover { background: #edf2f7; }
        .btn-save { flex: 2; padding: 11px; background: linear-gradient(135deg, #e53e3e, #9b1c1c); border: none; border-radius: 12px; color: #fff; font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 600; cursor: pointer; transition: opacity .2s, transform .15s; }
        .btn-save:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
        .btn-save:disabled { opacity: .55; cursor: not-allowed; }

        .shimmer { background: linear-gradient(90deg, #fee2e2 25%, #fff5f5 50%, #fee2e2 75%); background-size: 200% 100%; animation: shimmer 1.3s infinite; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        @media (max-width: 820px) {
          .main-layout { grid-template-columns: 1fr; }
          .left-col { flex-direction: row; flex-wrap: wrap; }
          .identity-card { flex: 1; min-width: 240px; }
          .meta-card { flex: 1; min-width: 200px; }
        }
        @media (max-width: 480px) {
          .left-col { flex-direction: column; }
          .info-grid { grid-template-columns: 1fr 1fr; }
          .geo-grid  { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 360px) {
          .info-grid, .geo-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="profile-root">
        <div className="profile-container">
          <div className="top-bar">
            <div className="top-brand">My Profile</div>
            {profile?.isOnline && (
              <div className="online-badge">
                <div className="online-dot" /> Online Now
              </div>
            )}
          </div>

          {!loaded && !error && <Skeleton />}
          {error && <ErrorState message={error} />}

          {loaded && profile && (
            <div className="main-layout">
              <div className="left-col">
                <div className={`identity-card ${loaded ? "visible" : ""}`}>
                  <div className="id-hero">
                    <div className="id-avatar-wrap">
                      <div className="id-avatar-ring">
                        {profile.picture && !imgErr ? (
                          <img className="id-avatar-img" src={profile.picture} alt={profile.name} onError={() => setImgErr(true)} />
                        ) : (
                          <div className="id-avatar-initials">{initials ?? "?"}</div>
                        )}
                        {profile.isVerify && <div className="verify-badge" title="Verified">✓</div>}
                      </div>
                    </div>
                  </div>
                  <div className="id-body">
                    <div className="id-name">{profile.name}</div>
                    <div className="id-role">♥ {profile.role}</div>
                    <div className="id-email">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" strokeWidth="2">
                        <rect x="2" y="4" width="20" height="16" rx="2"/>
                        <path d="m2 7 10 7 10-7"/>
                      </svg>
                      {profile.email}
                    </div>
                    <div className="status-pill">
                      <div className="status-dot" style={{ background: status.color }} />
                      <span className="status-lbl">Status</span>
                      <span className="status-val" style={{ color: status.color }}>{status.label}</span>
                    </div>
                    <button className="edit-btn" onClick={() => setShowEdit(true)}>✏️ Edit Profile</button>
                  </div>
                </div>

                <div className={`meta-card ${loaded ? "visible" : ""}`}>
                  {[
                    { icon: "🟢", key: "Online",   val: profile.isOnline, yes: "Active",   no: "Offline" },
                    { icon: "✅", key: "Verified", val: profile.isVerify, yes: "Verified", no: "Unverified" },
                    { icon: "🗑️", key: "Deleted",  val: profile.isDelete, yes: "Yes",      no: "No", warn: true },
                  ].map(({ icon, key, val, yes, no, warn }) => (
                    <div className="meta-row" key={key}>
                      <span className="meta-key">{icon} {key}</span>
                      <span className={`meta-val ${val ? (warn ? "warn" : "yes") : "no"}`}>{val ? yes : no}</span>
                    </div>
                  ))}
                  <div className="meta-row">
                    <span className="meta-key">📅 Joined</span>
                    <span className="meta-val" style={{ color: "#2d3748", fontSize: 11 }}>{formatDate(profile.createdAt)}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-key">🔄 Updated</span>
                    <span className="meta-val" style={{ color: "#2d3748", fontSize: 11 }}>{formatDate(profile.updatedAt)}</span>
                  </div>
                </div>
              </div>

              <div className="right-col">
                <div className={`info-panel ${loaded ? "visible" : ""}`}>
                  <div className="section-header">
                    <span className="section-icon">💻</span>
                    <span className="section-title">System Information</span>
                    <span className="section-subtitle">Device · Browser · Platform</span>
                  </div>
                  <div className="info-grid">
                    {[
                      { label: "Full Name",  icon: "👤", value: profile.name },
                      { label: "User ID",    icon: "🆔", value: profile._id?.slice(-10).toUpperCase() },
                      { label: "IP Address", icon: "🌐", value: profile.ipaddress },
                      { label: "Device",     icon: "📱", value: profile.device },
                      { label: "OS",         icon: "🖥️", value: profile.os },
                      { label: "Browser",    icon: "🔵", value: profile.browsername },
                      { label: "Engine",     icon: "⚙️", value: profile.engine },
                      { label: "Platform",   icon: "🗂️", value: profile.platform },
                    ].map(({ label, icon, value }) => (
                      <div key={label} className="info-card">
                        <div className="info-label">{icon} {label}</div>
                        <div className="info-value">{value ?? "—"}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* FIX 8: ip-section wrapper is always visible so inner Leaflet map gets real dimensions */}
                <div className={`ip-section ${loaded ? "visible" : ""}`}>
                  <IPMapSection ipAddress={profile.ipaddress} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showEdit && (
        <EditModal profile={profile} onClose={() => setShowEdit(false)} onSave={handleSave} />
      )}
    </>
  );
};

export default MyProfile;