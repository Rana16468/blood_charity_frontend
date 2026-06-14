import { useState, useEffect, useCallback, useRef } from "react";

import { getFromLocalStorage } from "../../utils/LocalStore/LocalStore";
import { decodedToken } from "../../utils/jwt";
import { encrypt } from "../../utils/CeyptoSecurity";
import { useSocketContext } from "../../router/SocketProvider";
import { AppHeader } from "./AppHeader";
import { BLOOD_STATS, BLOOD_TYPES, COMPATIBILITY, cs, formatAge, generateId, haversineKm, MOCK_DONORS, PermissionDenied, URGENCY_COLORS } from "./BloodCharityCommon";



export default function BloodCharity() {
  const [coords, setCoords]                 = useState(null);
  const [isTracking, setIsTracking]         = useState(false);
  const [permState, setPermState]           = useState("idle");
  const [activeTab, setActiveTab]           = useState("find");
  const [selectedBlood, setSelectedBlood]   = useState("");
  const [donors, setDonors]                 = useState(MOCK_DONORS);
  const [address, setAddress]               = useState(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [ageStr, setAgeStr]                 = useState("Just now");
  const [searchRadius, setSearchRadius]     = useState(10);
  const [registerForm, setRegisterForm]     = useState({ name: "", blood: "O+", phone: "", available: true });
  const [registered, setRegistered]         = useState(false);
  const [requests, setRequests]             = useState([
    { id: "R1", name: "Sagor Mia",     blood: "O+", hospital: "Thakurgaon General Hospital", urgency: "critical", lat: 26.028, lng: 88.462, contact: "+880-1711-111111", createdAt: Date.now() - 3600000 },
    { id: "R2", name: "Roksana Begum", blood: "A+", hospital: "Sadar Hospital",               urgency: "urgent",   lat: 26.033, lng: 88.469, contact: "+880-1812-222222", createdAt: Date.now() - 7200000 },
  ]);
  const [reqForm, setReqForm]               = useState({ name: "", blood: "O+", hospital: "", urgency: "normal", contact: "" });
  const [copiedPhone, setCopiedPhone]       = useState(null);
  const [debugLogs, setDebugLogs]           = useState([]);
  const [formLogs, setFormLogs]             = useState([]);

  const watchIdRef = useRef(null);
  const ageRef     = useRef(null);

    const { socket, connected } = useSocketContext();
   
    useEffect(()=>{

       if (!socket || !connected) return;

           


    },[socket, connected])

  




  const log = useCallback((msg, data) => {
    const entry = { ts: new Date().toISOString(), msg, data: data ? JSON.stringify(data) : undefined };
   
    setDebugLogs(prev => [entry, ...prev].slice(0, 50));
  }, []);

  const logForm = useCallback((type, formData, locationData) => {
    const entry = { ts: new Date().toISOString(), type, formData, locationData };
    console.log("[RaktoDaan][FORM SUBMIT]", type, { form: formData, location: locationData });
    setFormLogs(prev => [entry, ...prev].slice(0, 20));
  }, []);


  const reverseGeocode = useCallback((lat, lng) => {
    setAddressLoading(true);
    log("Reverse geocoding", { lat, lng });
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { "Accept-Language": "en" } }
    )
      .then(r => r.json())
      .then(d => {
        setAddress(d.display_name || "Address not found");
        log("Address resolved", { address: d.display_name });
      })
      .catch(() => setAddress("Address unavailable"))
      .finally(() => setAddressLoading(false));
  }, [log]);

  // ── Geolocation ───────────────────────────────────────────────────────────
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) { setPermState("denied"); log("Geolocation not supported"); return; }
    setPermState("requesting");
    log("Starting geolocation watch");
    watchIdRef.current = navigator.geolocation.watchPosition(
      pos => {
        const c = {
          lat: pos.coords.latitude, lng: pos.coords.longitude,
          acc: Math.round(pos.coords.accuracy), ts: Date.now(),
        };
        setCoords(c);
        setPermState("granted");
        setIsTracking(true);
        setAgeStr("Just now");
        clearInterval(ageRef.current);
        ageRef.current = setInterval(() => setAgeStr(formatAge(c.ts)), 1000);
        reverseGeocode(c.lat, c.lng);
        log("Position updated", { lat: c.lat.toFixed(5), lng: c.lng.toFixed(5), acc: c.acc });
      },
      err => {
        log("Geolocation error", { code: err.code, message: err.message });
        if (err.code === 1) { setPermState("denied"); setIsTracking(false); }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, [reverseGeocode, log]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    clearInterval(ageRef.current);
    log("Tracking stopped");
  }, [log]);

  useEffect(() => () => {
    clearInterval(ageRef.current);
    if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
  }, []);

  // ── Derived data ──────────────────────────────────────────────────────────
  const donorsWithDist = donors
    .map(d => ({ ...d, dist: coords ? haversineKm(coords.lat, coords.lng, d.lat, d.lng) : null }))
    .sort((a, b) => (a.dist ?? 999) - (b.dist ?? 999));

  const filteredDonors = donorsWithDist.filter(d => {
    if (selectedBlood && d.blood !== selectedBlood) return false;
    if (coords && d.dist > searchRadius) return false;
    return true;
  });

  const requestsWithDist = requests
    .map(r => ({ ...r, dist: coords ? haversineKm(coords.lat, coords.lng, r.lat, r.lng) : null }))
    .sort((a, b) => (a.dist ?? 999) - (b.dist ?? 999));

  // ── Handlers ──────────────────────────────────────────────────────────────
  const copyPhone = phone => {
    navigator.clipboard.writeText(phone).then(() => {
      setCopiedPhone(phone);
      setTimeout(() => setCopiedPhone(null), 2000);
    });
  };

    const token= getFromLocalStorage(import.meta.env.VITE_TOKEN_NAME);
  if(!token){
    return 
  }

  const user=decodedToken(token);

  

  const handleRegister = async() => {
    if (!registerForm.name || !registerForm.phone) return;
    const formData    = { name: registerForm.name, blood: registerForm.blood, phone: registerForm.phone, available: registerForm.available };
    const locationData = coords ? { lat: coords.lat, lng: coords.lng, accuracy: coords.acc, address: address || "Unknown" } : null;
    logForm("DONOR_REGISTER", formData, locationData);
    setDonors(prev => [{ id: generateId(), ...registerForm, lat: coords?.lat ?? 26.034, lng: coords?.lng ?? 88.469, lastDonated: "—" }, ...prev]);
    setRegistered(true);
    log("New donor registered", { name: registerForm.name, blood: registerForm.blood });
 
   console.log("New donor registered",{ userId: user.id,  name: registerForm.name,phone: registerForm.phone,  blood: registerForm.blood, ...locationData })

     const encrypted= await encrypt({userId: user.id,  name: registerForm.name,phone: registerForm.phone,  blood: registerForm.blood, ...locationData }, user.generate_secret_key);
  if (socket && connected) {
      socket.emit("donor_register", encrypted, (res) => {

         if (!res.success) {
      
         console.log("error blood request")
        }
        
        console.log("successfully donor_register", res);     
       });  
      }
    };






  const handleRequest = async() => {
    if (!reqForm.name || !reqForm.hospital || !reqForm.contact) return;
    const formData    = { name: reqForm.name, blood: reqForm.blood, hospital: reqForm.hospital, urgency: reqForm.urgency, contact: reqForm.contact };
    const locationData = coords ? { lat: coords.lat, lng: coords.lng, accuracy: coords.acc, address: address || "Unknown" } : null;
    logForm("BLOOD_REQUEST", formData, locationData);
    setRequests(prev => [{ id: generateId(), ...reqForm, lat: coords?.lat ?? 26.034, lng: coords?.lng ?? 88.469, createdAt: Date.now() }, ...prev]);
    setReqForm({ name: "", blood: "O+", hospital: "", urgency: "normal", contact: "" });
    log("Blood request created", { blood: reqForm.blood, hospital: reqForm.hospital, urgency: reqForm.urgency, locationData });

    console.log("Handel Requst New",{userId: user.id, blood: reqForm.blood, phone: reqForm.contact, hospital: reqForm.hospital, urgency: reqForm.urgency, locationData })
    const encrypted= await encrypt({userId: user.id, blood: reqForm.blood, phone: reqForm.contact, hospital: reqForm.hospital, urgency: reqForm.urgency, locationData }, user.generate_secret_key) 
     

    
   
    if (socket && connected) {
      socket.emit("blood_request", encrypted, (res) => {
        if (!res.success) {
      
         console.log("error blood request")
        }
        console.log("successfully blood request recorded", res);      });  

        
      
      }

  };

  const nearbyAvailable = donorsWithDist.filter(d => d.dist !== null && d.dist <= searchRadius && d.available).length;

  const TABS = [
    { id: "find",     icon: "🩸", label: "Find Donors" },
    { id: "requests", icon: "🚨", label: "Requests"    },
    { id: "register", icon: "✚",  label: "Be a Donor"  },
    { id: "map",      icon: "📍", label: "My Location" },
    { id: "debug",    icon: "🖥",  label: "Console"     },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#fdf4f4", color: "#2c3e50", fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 15 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: #c9a0a0; }
        input:focus, select:focus { border-color: #c0392b !important; box-shadow: 0 0 0 2px rgba(192,57,43,0.12); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #f5c6c6; border-radius: 4px; }
        .donor-card:hover { background: #fff5f5 !important; border-color: #f5a0a0 !important; }
        .tab-pill:hover { background: rgba(192,57,43,0.08) !important; }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes ripple { 0%{transform:scale(1);opacity:0.55} 100%{transform:scale(2.8);opacity:0} }
      `}</style>

      {/* ── HEADER ── */}
      <AppHeader
        isTracking={isTracking}
        ageStr={ageStr}
        onToggle={() => (isTracking ? stopTracking() : startTracking())}
        donorCount={donors.length}
      />

      <main style={{ maxWidth: 680, margin: "0 auto", padding: "16px" }}>

        {/* ── PERMISSION DENIED ── */}
        {permState === "denied" && <PermissionDenied onRetry={startTracking} />}

        {/* ── LOCATION CARD ── */}
        {coords && (
          <div style={{ ...cs.card, background: "#fff5f5", marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>📍</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: "#5d6d7e" }}>
                {addressLoading ? "Locating…" : (address || `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`)}
              </div>
              <div style={{ fontSize: 11, color: "#c0392b", marginTop: 2, fontFamily: "monospace" }}>
                {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)} · ±{coords.acc}m
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: 11, color: "#95a5a6" }}>Donors nearby</span>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#c0392b" }}>{nearbyAvailable}</div>
            </div>
          </div>
        )}

        {/* ── TABS ── */}
        <div style={{ display: "flex", gap: 4, marginBottom: 14, background: "#ffffff", border: "1px solid #f5c6c6", borderRadius: 10, padding: 4, boxShadow: "0 1px 4px rgba(192,57,43,0.07)" }}>
          {TABS.map(t => (
            <button
              key={t.id}
              className="tab-pill"
              onClick={() => setActiveTab(t.id)}
              style={{
                flex: 1, padding: "7px 4px", borderRadius: 7, fontSize: 11, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                border: activeTab === t.id ? "1px solid #c0392b" : "1px solid transparent",
                background: activeTab === t.id ? "rgba(192,57,43,0.1)" : "transparent",
                color: activeTab === t.id ? "#c0392b" : "#95a5a6",
              }}
            >
              <div>{t.icon}</div>
              <div style={{ fontSize: 10, marginTop: 2 }}>{t.label}</div>
            </button>
          ))}
        </div>

        {/* ══════════════════ FIND DONORS ══════════════════ */}
        {activeTab === "find" && (
          <div>
            <div style={{ ...cs.card, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label style={cs.label}>Blood Type Filter</label>
                <select style={cs.select} value={selectedBlood} onChange={e => setSelectedBlood(e.target.value)}>
                  <option value="">All types</option>
                  {BLOOD_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label style={cs.label}>Radius: {searchRadius} km</label>
                <input type="range" min={1} max={50} value={searchRadius}
                  onChange={e => setSearchRadius(+e.target.value)}
                  style={{ width: "100%", accentColor: "#c0392b" }} />
              </div>
              {selectedBlood && COMPATIBILITY[selectedBlood] && (
                <div style={{ width: "100%", background: "#fff9f9", borderRadius: 8, padding: "10px 12px", border: "1px solid #f5c6c6" }}>
                  <div style={{ fontSize: 12, color: "#7f8c8d", marginBottom: 6 }}>
                    Compatibility for <strong style={{ color: "#c0392b" }}>{selectedBlood}</strong>
                  </div>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#95a5a6", marginBottom: 4 }}>Can donate to</div>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {COMPATIBILITY[selectedBlood].canDonateTo.map(b => <span key={b} style={cs.badge(b)}>{b}</span>)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#95a5a6", marginBottom: 4 }}>Can receive from</div>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {COMPATIBILITY[selectedBlood].canReceiveFrom.map(b => <span key={b} style={cs.badge(b)}>{b}</span>)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ fontSize: 12, color: "#95a5a6", marginBottom: 8, paddingLeft: 2 }}>
              {filteredDonors.length} donor{filteredDonors.length !== 1 ? "s" : ""} found
              {!coords ? " · enable location to sort by distance" : ""}
            </div>

            {filteredDonors.length === 0 && (
              <div style={{ ...cs.card, textAlign: "center", padding: "48px 20px" }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🩸</div>
                <div style={{ color: "#7f8c8d", fontSize: 14 }}>No donors match your criteria</div>
                <div style={{ color: "#c0392b", fontSize: 13, marginTop: 4 }}>Try increasing radius or changing blood type</div>
              </div>
            )}

            {filteredDonors.map((d, i) => (
              <div
                key={d.id}
                className="donor-card"
                style={{
                  ...cs.card, transition: "all 0.15s",
                  borderColor: i === 0 && d.available ? "#f5a0a0" : "#f5c6c6",
                  background:  i === 0 && d.available ? "#fff5f5" : "#ffffff",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                      background: d.available ? "#c0392b" : "#bdc3c7",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, color: "#ffffff", fontFamily: "monospace", letterSpacing: "0.05em",
                    }}>
                      {d.blood}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: "#2c3e50" }}>{d.name}</div>
                      <div style={{ fontSize: 12, color: "#7f8c8d", marginTop: 2, fontFamily: "monospace" }}>{d.phone}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    {d.dist !== null ? (
                      <div style={{ fontSize: 14, fontWeight: 600, color: d.dist < 2 ? "#c0392b" : d.dist < 5 ? "#e67e22" : "#95a5a6" }}>
                        {d.dist < 1 ? `${(d.dist * 1000).toFixed(0)}m` : `${d.dist.toFixed(1)}km`}
                      </div>
                    ) : <span style={{ fontSize: 12, color: "#bdc3c7" }}>dist?</span>}
                    <div style={{ marginTop: 4 }}>
                      <span style={{
                        fontSize: 11, padding: "2px 8px", borderRadius: 99, fontWeight: 600,
                        background: d.available ? "rgba(39,174,96,0.12)" : "rgba(189,195,199,0.3)",
                        color: d.available ? "#27ae60" : "#95a5a6",
                        border: `1px solid ${d.available ? "rgba(39,174,96,0.3)" : "rgba(189,195,199,0.5)"}`,
                      }}>
                        {d.available ? "Available" : "Unavailable"}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={() => copyPhone(d.phone)} style={{ ...cs.btn("ghost"), flex: 1, fontSize: 12 }}>
                    {copiedPhone === d.phone ? "✓ Copied!" : "📋 Copy Phone"}
                  </button>
                  <a href={`tel:${d.phone}`} style={{ ...cs.btn("red"), flex: 1, fontSize: 12, textDecoration: "none", textAlign: "center" }}>
                    📞 Call Now
                  </a>
                  {coords && (
                    <a href={`https://www.google.com/maps/dir/${coords.lat},${coords.lng}/${d.lat},${d.lng}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ ...cs.btn("ghost"), flex: 1, fontSize: 12, textDecoration: "none", textAlign: "center" }}>
                      🗺 Directions
                    </a>
                  )}
                </div>
                <div style={{ marginTop: 8, display: "flex", gap: 6, fontSize: 12, color: "#95a5a6" }}>
                  <span>Last donated: {d.lastDonated}</span>
                  <span style={{ opacity: 0.5 }}>·</span>
                  <span style={{ fontFamily: "monospace", fontSize: 11 }}>{d.lat.toFixed(4)}, {d.lng.toFixed(4)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════ REQUESTS ══════════════════ */}
        {activeTab === "requests" && (
          <div>
            <div style={cs.card}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#2c3e50", marginBottom: 12 }}>🚨 Post a Blood Request</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={cs.label}>Patient Name</label>
                  <input style={cs.input} placeholder="Full name"
                    value={reqForm.name} onChange={e => setReqForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label style={cs.label}>Blood Type Needed</label>
                  <select style={cs.select} value={reqForm.blood} onChange={e => setReqForm(p => ({ ...p, blood: e.target.value }))}>
                    {BLOOD_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={cs.label}>Hospital / Location</label>
                <input style={cs.input} placeholder="Hospital name and city"
                  value={reqForm.hospital} onChange={e => setReqForm(p => ({ ...p, hospital: e.target.value }))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={cs.label}>Contact Number</label>
                  <input style={cs.input} placeholder="+880-..."
                    value={reqForm.contact} onChange={e => setReqForm(p => ({ ...p, contact: e.target.value }))} />
                </div>
                <div>
                  <label style={cs.label}>Urgency</label>
                  <select style={cs.select} value={reqForm.urgency} onChange={e => setReqForm(p => ({ ...p, urgency: e.target.value }))}>
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              {/* Location preview */}
              {coords ? (
                <div style={{ background: "#f0fff4", border: "1px solid #a9dfbf", borderRadius: 8, padding: "10px 12px", marginBottom: 10, fontSize: 13, color: "#27ae60" }}>
                  📍 Request will be tagged at your live location: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </div>
              ) : (
                <div style={{ background: "#fff9f9", border: "1px solid #f5c6c6", borderRadius: 8, padding: "10px 12px", marginBottom: 10, fontSize: 13, color: "#c0392b" }}>
                  ⚠️ Enable location tracking so donors can find you on the map
                </div>
              )}
              <button onClick={handleRequest} style={{ ...cs.btn("red"), width: "100%" }}>🩸 Post Request</button>
            </div>

            <div style={{ fontSize: 12, color: "#95a5a6", marginBottom: 8, paddingLeft: 2 }}>
              {requestsWithDist.length} active request{requestsWithDist.length !== 1 ? "s" : ""}
            </div>

            {requestsWithDist.map(r => (
              <div key={r.id} style={{ ...cs.card, borderLeft: `3px solid ${URGENCY_COLORS[r.urgency]}`, borderRadius: "0 10px 10px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={cs.badge(r.blood)}>{r.blood}</span>
                      <span style={{
                        fontSize: 11, padding: "2px 8px", borderRadius: 99, fontWeight: 700, textTransform: "uppercase",
                        background: r.urgency === "critical" ? "rgba(192,57,43,0.12)" : r.urgency === "urgent" ? "rgba(230,126,34,0.12)" : "rgba(39,174,96,0.12)",
                        color: URGENCY_COLORS[r.urgency],
                        border: `1px solid ${URGENCY_COLORS[r.urgency]}`,
                        animation: r.urgency === "critical" ? "pulse 1.5s infinite" : "none",
                      }}>
                        {r.urgency === "critical" ? "🔴 " : r.urgency === "urgent" ? "🟠 " : "🟢 "}{r.urgency}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, color: "#2c3e50", fontSize: 15 }}>{r.name}</div>
                    <div style={{ fontSize: 13, color: "#7f8c8d", marginTop: 2 }}>🏥 {r.hospital}</div>
                    <div style={{ fontSize: 12, color: "#c0392b", marginTop: 2, fontFamily: "monospace" }}>{r.contact}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {r.dist !== null && (
                      <div style={{ fontSize: 14, fontWeight: 600, color: r.dist < 2 ? "#c0392b" : "#e67e22" }}>
                        {r.dist < 1 ? `${(r.dist * 1000).toFixed(0)}m` : `${r.dist.toFixed(1)}km`}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: "#95a5a6", marginTop: 2 }}>{formatAge(r.createdAt)}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <a href={`tel:${r.contact}`} style={{ ...cs.btn("red"), flex: 1, fontSize: 12, textDecoration: "none", textAlign: "center" }}>
                    📞 Call
                  </a>
                  <button onClick={() => copyPhone(r.contact)} style={{ ...cs.btn("ghost"), flex: 1, fontSize: 12 }}>
                    {copiedPhone === r.contact ? "✓ Copied!" : "📋 Copy"}
                  </button>
                  {coords && (
                    <a href={`https://www.google.com/maps/dir/${coords.lat},${coords.lng}/${r.lat},${r.lng}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ ...cs.btn("ghost"), flex: 1, fontSize: 12, textDecoration: "none", textAlign: "center" }}>
                      🗺 Go
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════ REGISTER ══════════════════ */}
        {activeTab === "register" && (
          <div>
            {registered ? (
              <div style={{ ...cs.card, textAlign: "center", padding: "52px 20px", borderColor: "#a9dfbf" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🩸</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#27ae60", marginBottom: 6 }}>Thank you for registering!</div>
                <div style={{ fontSize: 14, color: "#7f8c8d", marginBottom: 16 }}>
                  You are now listed as a donor. Patients near you can find and contact you.
                </div>
                <button
                  onClick={() => { setRegistered(false); setRegisterForm({ name: "", blood: "O+", phone: "", available: true }); }}
                  style={cs.btn("ghost")}
                >
                  Register Another
                </button>
              </div>
            ) : (
              <div style={cs.card}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#2c3e50", marginBottom: 4 }}>✚ Become a Blood Donor</div>
                <div style={{ fontSize: 13, color: "#95a5a6", marginBottom: 16 }}>
                  Your location will help patients find the nearest available donor.
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={cs.label}>Full Name</label>
                    <input style={cs.input} placeholder="Your name"
                      value={registerForm.name} onChange={e => setRegisterForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <label style={cs.label}>Blood Group</label>
                    <select style={cs.select} value={registerForm.blood}
                      onChange={e => setRegisterForm(p => ({ ...p, blood: e.target.value }))}>
                      {BLOOD_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={cs.label}>Phone Number</label>
                    <input style={cs.input} placeholder="+880-..." type="tel"
                      value={registerForm.phone} onChange={e => setRegisterForm(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input type="checkbox" id="avail" checked={registerForm.available}
                      onChange={e => setRegisterForm(p => ({ ...p, available: e.target.checked }))}
                      style={{ accentColor: "#c0392b", width: 16, height: 16 }} />
                    <label htmlFor="avail" style={{ fontSize: 14, color: "#2c3e50", cursor: "pointer" }}>
                      I am currently available to donate
                    </label>
                  </div>
                  {coords ? (
                    <div style={{ background: "#f0fff4", border: "1px solid #a9dfbf", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#27ae60" }}>
                      📍 Your location will be saved: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                    </div>
                  ) : (
                    <div style={{ background: "#fff9f9", border: "1px solid #f5c6c6", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#c0392b" }}>
                      ⚠️ Enable location tracking for nearest-first matching
                    </div>
                  )}
                  <button onClick={handleRegister} style={{ ...cs.btn("red"), width: "100%", padding: "12px" }}>
                    🩸 Register as Donor
                  </button>
                </div>
              </div>
            )}

            {/* Blood type stats */}
            <div style={{ ...cs.card, marginTop: 10 }}>
              <div style={{ fontSize: 11, color: "#95a5a6", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                Blood Type Stats (Bangladesh)
              </div>
              {BLOOD_STATS.map(([b, pct, note]) => (
                <div key={b} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ ...cs.badge(b), minWidth: 36, textAlign: "center" }}>{b}</span>
                  <div style={{ flex: 1, background: "#f5f5f5", borderRadius: 4, height: 6, overflow: "hidden" }}>
                    <div style={{ width: pct, height: "100%", background: "#c0392b", borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 13, color: "#7f8c8d", minWidth: 36 }}>{pct}</span>
                  <span style={{ fontSize: 12, color: "#95a5a6" }}>{note}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════ MY LOCATION ══════════════════ */}
        {activeTab === "map" && (
          <div>
            {!coords ? (
              <div style={{ ...cs.card, textAlign: "center", padding: "52px 20px" }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📍</div>
                <div style={{ color: "#7f8c8d", fontSize: 14, marginBottom: 12 }}>
                  {permState === "requesting" ? "Requesting location…" : "Location not active"}
                </div>
                <button onClick={startTracking} style={{ ...cs.btn("red"), padding: "10px 24px" }}>Enable Location</button>
              </div>
            ) : (
              <>
                <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #f5c6c6", marginBottom: 10, height: 260 }}>
                  <iframe
                    src={`https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=15&output=embed`}
                    width="100%" height="100%" style={{ border: "none", display: "block" }}
                    allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                    title="Your location"
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                  {[
                    ["Latitude",  coords.lat.toFixed(6)],
                    ["Longitude", coords.lng.toFixed(6)],
                    ["Accuracy",  `±${coords.acc}m`],
                    ["Updated",   ageStr],
                  ].map(([l, v]) => (
                    <div key={l} style={cs.card}>
                      <div style={cs.label}>{l}</div>
                      <div style={{ fontFamily: "monospace", fontSize: 14, color: "#c0392b" }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={cs.card}>
                  <div style={cs.label}>Address</div>
                  <div style={{ fontSize: 14, color: "#2c3e50", lineHeight: 1.6 }}>{addressLoading ? "Loading…" : address}</div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <a href={`https://www.google.com/maps?q=${coords.lat},${coords.lng}`} target="_blank" rel="noopener noreferrer"
                    style={{ ...cs.btn("ghost"), flex: 1, fontSize: 12, textDecoration: "none", textAlign: "center" }}>
                    Google Maps ↗
                  </a>
                  <a href={`https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}&zoom=15`} target="_blank" rel="noopener noreferrer"
                    style={{ ...cs.btn("ghost"), flex: 1, fontSize: 12, textDecoration: "none", textAlign: "center" }}>
                    OpenStreetMap ↗
                  </a>
                </div>
              </>
            )}

            {/* Network stats */}
            <div style={{ ...cs.card, marginTop: 10 }}>
              <div style={{ fontSize: 11, color: "#95a5a6", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Network Stats</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                {[
                  ["Total Donors",  donors.length],
                  ["Available",     donors.filter(d => d.available).length],
                  ["Requests",      requests.length],
                  ["Critical",      requests.filter(r => r.urgency === "critical").length],
                  ["Nearby (10km)", coords ? donorsWithDist.filter(d => d.dist <= 10).length : "—"],
                  ["Blood Types",   [...new Set(donors.map(d => d.blood))].length],
                ].map(([l, v]) => (
                  <div key={l} style={{ background: "#fff9f9", borderRadius: 8, padding: "10px 12px", border: "1px solid #f5c6c6" }}>
                    <div style={{ fontSize: 10, color: "#c0392b", marginBottom: 4 }}>{l}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#2c3e50", fontFamily: "monospace" }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════ DEBUG CONSOLE ══════════════════ */}
        {activeTab === "debug" && (
          <div>
            <div style={{ ...cs.card, background: "#fafafa" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: "#95a5a6", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Console · {debugLogs.length} events
                </span>
                <button onClick={() => { setDebugLogs([]); setFormLogs([]); }} style={{ ...cs.btn("ghost"), fontSize: 11, padding: "4px 10px" }}>Clear</button>
              </div>

              {/* State dump */}
              <div style={{ background: "#1e2a35", border: "1px solid #2c3e50", borderRadius: 8, padding: "10px 12px", marginBottom: 10, fontFamily: "monospace", fontSize: 12, lineHeight: 1.7 }}>
                <div style={{ color: "#5d6d7e", marginBottom: 4 }}>▸ Current State</div>
                <div style={{ color: "#f39c12" }}>coords: <span style={{ color: "#2ecc71" }}>{coords ? `{lat: ${coords.lat.toFixed(6)}, lng: ${coords.lng.toFixed(6)}, acc: ${coords.acc}m}` : "null"}</span></div>
                <div style={{ color: "#f39c12" }}>isTracking: <span style={{ color: "#2ecc71" }}>{String(isTracking)}</span></div>
                <div style={{ color: "#f39c12" }}>permState: <span style={{ color: "#2ecc71" }}>{permState}</span></div>
                <div style={{ color: "#f39c12" }}>address: <span style={{ color: "#2ecc71" }}>{address || "null"}</span></div>
                <div style={{ color: "#f39c12" }}>donors.length: <span style={{ color: "#2ecc71" }}>{donors.length}</span></div>
                <div style={{ color: "#f39c12" }}>requests.length: <span style={{ color: "#2ecc71" }}>{requests.length}</span></div>
                <div style={{ color: "#f39c12" }}>filteredDonors: <span style={{ color: "#2ecc71" }}>{filteredDonors.length} (radius: {searchRadius}km, filter: {selectedBlood || "all"})</span></div>
                {coords && (
                  <div style={{ color: "#f39c12" }}>nearestDonor: <span style={{ color: "#2ecc71" }}>{donorsWithDist[0] ? `${donorsWithDist[0].name} (${donorsWithDist[0].dist?.toFixed(2)}km, ${donorsWithDist[0].blood})` : "none"}</span></div>
                )}
              </div>

              {/* Form submissions with location */}
              <div style={{ background: "#1e2a35", border: "1px solid #2c3e50", borderRadius: 8, padding: "10px 12px", marginBottom: 10, fontFamily: "monospace", fontSize: 12, lineHeight: 1.7 }}>
                <div style={{ color: "#5d6d7e", marginBottom: 4 }}>▸ Form submissions with location data</div>
                {formLogs.length === 0 && <div style={{ color: "#5d6d7e" }}>No form submissions yet.</div>}
                {formLogs.map((l, i) => (
                  <div key={i} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid #2c3e50" }}>
                    <div>
                      <span style={{ color: "#5d6d7e" }}>{l.ts.slice(11, 19)}</span>{" "}
                      <span style={{ color: "#e74c3c", fontWeight: 700 }}>[{l.type}]</span>
                    </div>
                    <div style={{ marginLeft: 8 }}>
                      <span style={{ color: "#f39c12" }}>form: </span>
                      <span style={{ color: "#2ecc71" }}>{JSON.stringify(l.formData)}</span>
                    </div>
                    <div style={{ marginLeft: 8 }}>
                      <span style={{ color: "#f39c12" }}>location: </span>
                      <span style={{ color: l.locationData ? "#2ecc71" : "#e74c3c" }}>
                        {l.locationData ? JSON.stringify(l.locationData) : "null (no location active)"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sorted donors */}
              {coords && (
                <div style={{ background: "#1e2a35", border: "1px solid #2c3e50", borderRadius: 8, padding: "10px 12px", marginBottom: 10, fontFamily: "monospace", fontSize: 12, lineHeight: 1.6 }}>
                  <div style={{ color: "#5d6d7e", marginBottom: 4 }}>▸ Donors sorted by distance</div>
                  {donorsWithDist.map(d => (
                    <div key={d.id} style={{ color: d.available ? "#2ecc71" : "#95a5a6" }}>
                      [{d.blood}] {d.name} — {d.dist?.toFixed(2)}km {d.available ? "✓" : "✗"}
                    </div>
                  ))}
                </div>
              )}

              {/* Event log */}
              <div style={{ background: "#1e2a35", border: "1px solid #2c3e50", borderRadius: 8, padding: "10px 12px", fontFamily: "monospace", fontSize: 12, lineHeight: 1.7, maxHeight: 300, overflowY: "auto" }}>
                <div style={{ color: "#5d6d7e", marginBottom: 4 }}>▸ Event log</div>
                {debugLogs.length === 0 && <div style={{ color: "#5d6d7e" }}>No events yet. Start tracking to see logs.</div>}
                {debugLogs.map((l, i) => (
                  <div key={i} style={{ marginBottom: 2 }}>
                    <span style={{ color: "#5d6d7e" }}>{l.ts.slice(11, 19)}</span>{" "}
                    <span style={{ color: "#f39c12" }}>{l.msg}</span>
                    {l.data && <span style={{ color: "#2ecc71" }}> {l.data}</span>}
                  </div>
                ))}
              </div>

              {/* Browser info */}
              <div style={{ background: "#1e2a35", border: "1px solid #2c3e50", borderRadius: 8, padding: "10px 12px", marginTop: 10, fontFamily: "monospace", fontSize: 12, lineHeight: 1.7 }}>
                <div style={{ color: "#5d6d7e", marginBottom: 4 }}>▸ Browser geolocation support</div>
                <div style={{ color: "#f39c12" }}>navigator.geolocation: <span style={{ color: "#2ecc71" }}>{typeof navigator !== "undefined" && navigator.geolocation ? "supported ✓" : "not supported ✗"}</span></div>
                <div style={{ color: "#f39c12" }}>navigator.permissions: <span style={{ color: "#2ecc71" }}>{typeof navigator !== "undefined" && navigator.permissions ? "supported ✓" : "not supported"}</span></div>
                <div style={{ color: "#f39c12" }}>userAgent: <span style={{ color: "#2ecc71" }}>{typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 60) + "…" : "—"}</span></div>
                <div style={{ color: "#f39c12" }}>timestamp: <span style={{ color: "#2ecc71" }}>{new Date().toISOString()}</span></div>
              </div>
            </div>
          </div>
        )}
      </main>




      <footer style={{ textAlign: "center", padding: "20px 16px 32px", fontSize: 12, color: "#bdc3c7", lineHeight: 2 }}>
        <div>🩸 Location data stays in your browser · Nothing sent to any server</div>
        <div>Maps: Google embed · Geocoding: Nominatim · All free, no API keys needed</div>
      </footer>
    </div>
  );
}