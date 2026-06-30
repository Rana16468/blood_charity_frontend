import { useState, useEffect, useRef, useCallback } from "react";
import {
  useChange_locationMutation,
  useFind_my_current_locationQuery,
  useIs_blood_donatedMutation,
} from "../../redux/api/BloodDonorApi/BloodDonorApi";
import toast from "react-hot-toast";
import { getFromLocalStorage } from "../../../utils/LocalStore/LocalStore";
import { jwtDecode } from "jwt-decode";

// ── Design Tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:        "#fdf4f4",
  surface:   "#ffffff",
  border:    "rgba(139,0,0,0.12)",
  borderMd:  "rgba(139,0,0,0.22)",
  accent:    "#8B0000",
  accentLt:  "#f8eded",
  text:      "#2c3e50",
  textMuted: "#7f8c8d",
  textHint:  "#aab0b7",
  green:     "#166534",
  greenBg:   "#dcfce7",
  font:      "'Crimson Pro', Georgia, serif",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtTime = (ts) =>
  new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const fmtDate = (ts) =>
  new Date(ts).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });

function accInfo(acc) {
  if (acc <= 20) return { label: "High",   bg: "#dcfce7", col: "#166534" };
  if (acc <= 80) return { label: "Medium", bg: "#fef9c3", col: "#854d0e" };
  return               { label: "Low",    bg: "#fee2e2", col: "#991b1b" };
}

async function reverseGeocode(lat, lng) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const d = await r.json();
    return d.display_name || null;
  } catch {
    return null;
  }
}

// ── Responsive hook ───────────────────────────────────────────────────────────
function useBreakpoint() {
  const get = () => {
    if (typeof window === "undefined") return "desktop";
    return window.innerWidth < 640 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop";
  };
  const [bp, setBp] = useState(get);
  useEffect(() => {
    const fn = () => setBp(get());
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return bp;
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const IcoPin      = ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8 2 5 5.5 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.5-3-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>;
const IcoRadar    = ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"/><circle cx="12" cy="12" r="2"/><path d="m13.41 10.59 5.66-5.66"/></svg>;
const IcoStop     = ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>;
const IcoCamera   = ({ size = 14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>;
const IcoCopy     = ({ size = 14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const IcoTrash    = ({ size = 14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const IcoCheck    = ({ size = 14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoHistory  = ({ size = 14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>;
const IcoBuilding = ({ size = 13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 22V12h6v10M8 7h.01M16 7h.01M8 11h.01M16 11h.01"/></svg>;
const IcoTarget   = ({ size = 13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
const IcoMap      = ({ size = 14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>;
const IcoRefresh  = ({ size = 13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
const IcoPhone    = ({ size = 13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.05 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.1a16 16 0 0 0 5.5 5.5l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const IcoDrop     = ({ size = 13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>;
const IcoHeart    = ({ size = 13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
const IcoClock    = ({ size = 13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IcoDrop2    = ({ size = 14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>;
const IcoAlert    = ({ size = 22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IcoX        = ({ size = 14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

// ── Pulse Dot ─────────────────────────────────────────────────────────────────
function PulseDot({ state }) {
  const colors = {
    idle:      "#d1d5db",
    requesting:"#f59e0b",
    active:    "#8B0000",
    denied:    "#e74c3c",
    stopped:   "#d1d5db",
  };
  const animate = state === "active" || state === "requesting";
  return (
    <span style={{
      display: "inline-block", width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
      background: colors[state] || colors.idle,
      animation: animate ? "rd-pulse 1.2s infinite" : "none",
    }} />
  );
}

// ── Accuracy Badge ────────────────────────────────────────────────────────────
function AccBadge({ accuracy }) {
  const ai = accInfo(accuracy);
  return (
    <span style={{
      fontSize: 11, padding: "2px 9px", borderRadius: 999,
      fontWeight: 600, fontFamily: T.font,
      background: ai.bg, color: ai.col, whiteSpace: "nowrap",
    }}>
      ±{accuracy}m · {ai.label}
    </span>
  );
}

// ── Leaflet Live Map ──────────────────────────────────────────────────────────
function LiveMap({ coords }) {
  const mapRef     = useRef(null);
  const leafletMap = useRef(null);
  const markerRef  = useRef(null);

  useEffect(() => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css"; link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    const initMap = () => {
      if (!mapRef.current || leafletMap.current) return;
      const L = window.L; if (!L) return;
      leafletMap.current = L.map(mapRef.current, { zoomControl: true, attributionControl: false })
        .setView([23.5, 90.3], 6);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(leafletMap.current);
    };
    if (window.L) { initMap(); }
    else {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initMap;
      document.body.appendChild(script);
    }
    return () => {
      if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; }
    };
  }, []);

  useEffect(() => {
    if (!coords || !leafletMap.current || !window.L) return;
    const L = window.L;
    const { lat, lng } = coords;
    leafletMap.current.setView([lat, lng], 16);
    const icon = L.divIcon({
      className: "",
      html: `<div style="width:16px;height:16px;background:#fdf4f4;border:3px solid #8B0000;border-radius:50%;box-shadow:0 0 0 6px rgba(139,0,0,0.16)"></div>`,
      iconSize: [16, 16], iconAnchor: [8, 8],
    });
    if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
    else markerRef.current = L.marker([lat, lng], { icon }).addTo(leafletMap.current);
  }, [coords]);

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
}

// ── Info Pill ─────────────────────────────────────────────────────────────────
function InfoPill({ icon, label, light, dot }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 4,
      background: light ? "rgba(255,255,255,0.14)" : T.accentLt,
      border: light ? "1px solid rgba(255,255,255,0.18)" : `1px solid ${T.border}`,
      borderRadius: 999, padding: "3px 9px",
    }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: "50%", background: dot, flexShrink: 0 }} />}
      <span style={{ color: light ? "rgba(255,255,255,0.65)" : T.accent, display: "flex", alignItems: "center" }}>
        {icon}
      </span>
      <span style={{ fontSize: 11, color: light ? "rgba(255,255,255,0.85)" : T.text, fontFamily: T.font, fontWeight: 500, whiteSpace: "nowrap" }}>
        {label}
      </span>
    </div>
  );
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmDonateModal({ onConfirm, onCancel, isLoading }) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed", inset: 0, background: "rgba(20,5,5,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 2000, padding: 16, backdropFilter: "blur(2px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.surface, borderRadius: 16, padding: "22px 22px 18px",
          maxWidth: 380, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          border: `1px solid ${T.border}`, fontFamily: T.font, position: "relative",
        }}
      >
        <button
          onClick={onCancel}
          style={{
            position: "absolute", top: 12, right: 12, background: T.accentLt,
            border: "none", borderRadius: "50%", width: 26, height: 26,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: T.accent, cursor: "pointer",
          }}
        >
          <IcoX />
        </button>

        <div style={{
          width: 44, height: 44, borderRadius: "50%", background: T.accentLt,
          color: T.accent, display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 12,
        }}>
          <IcoAlert size={22} />
        </div>

        <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 8 }}>
          আপনি কি নিশ্চিত?
        </div>

        <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.65, margin: 0 }}>
          আজকের পর থেকে <b style={{ color: T.accent }}>৩ মাসের</b> জন্য আপনার তথ্য আমাদের সিস্টেমে
          <b> প্রাইভেট</b> হয়ে যাবে — অর্থাৎ এই সময়ের মধ্যে আপনাকে আর কোনো রক্তদাতা হিসেবে খুঁজে পাওয়া যাবে না।
          ৩ মাস পর আপনার তথ্য আবার স্বয়ংক্রিয়ভাবে সক্রিয় (ডিটেক্ট) হয়ে যাবে।
        </p>

        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: "10px 12px", borderRadius: 9,
              border: `1px solid ${T.border}`, background: T.accentLt,
              color: T.text, fontWeight: 600, fontSize: 13, fontFamily: T.font,
              cursor: "pointer",
            }}
          >
            বাতিল করুন
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              flex: 1.3, padding: "10px 12px", borderRadius: 9, border: "none",
              background: `linear-gradient(135deg, ${T.accent} 0%, #6b0000 100%)`,
              color: "#fff", fontWeight: 700, fontSize: 13, fontFamily: T.font,
              cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.6 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            {isLoading ? (
              <>
                <span style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "rd-spin 0.7s linear infinite", display: "inline-block" }} />
                সংরক্ষণ হচ্ছে…
              </>
            ) : (
              <>হ্যাঁ, নিশ্চিত করুন</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Blood Donation Button ─────────────────────────────────────────────────────
// isBloodDonated = true  → donated recently, button DISABLED (greyed + lock icon)
// isBloodDonated = false → not donated, button ENABLED (active red)
function BloodDonationButton({ donorId, isBloodDonated, onDonate, isLoading }) {
  const donated = Boolean(isBloodDonated);
  const [showConfirm, setShowConfirm] = useState(false);

  const btnStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
    width: "100%",
    padding: "9px 14px",
    borderRadius: 9,
    border: donated ? "1px solid rgba(139,0,0,0.18)" : `1px solid ${T.accent}`,
    fontFamily: T.font,
    fontSize: 13,
    fontWeight: 700,
    cursor: donated ? "not-allowed" : "pointer",
    transition: "opacity 0.15s, transform 0.1s, box-shadow 0.15s",
    // Donated → muted, disabled look; not donated → bold active look
    background: donated
      ? "rgba(139,0,0,0.06)"
      : `linear-gradient(135deg, ${T.accent} 0%, #6b0000 100%)`,
    color: donated ? "rgba(139,0,0,0.35)" : "#fff",
    boxShadow: donated ? "none" : "0 2px 10px rgba(139,0,0,0.22)",
    opacity: donated ? 0.55 : 1,
    position: "relative",
    overflow: "hidden",
  };

  const handleConfirm = () => {
    onDonate(donorId);
    setShowConfirm(false);
  };

  return (
    <div>
      <button
        disabled={donated || isLoading}
        onClick={() => !donated && setShowConfirm(true)}
        style={btnStyle}
        title={donated ? "You have already donated blood. You can donate again after 3 months." : "Mark as blood donated"}
        onMouseDown={e => { if (!donated) e.currentTarget.style.transform = "scale(0.97)"; }}
        onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        {isLoading ? (
          <>
            <span style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "rd-spin 0.7s linear infinite", display: "inline-block" }} />
            Saving…
          </>
        ) : donated ? (
          <>
            <span style={{ fontSize: 13 }}>🔒</span>
            Already Donated
          </>
        ) : (
          <>
            <IcoDrop2 size={14} />
            Mark as Blood Donated
          </>
        )}
      </button>

      {/* Helper text below the button */}
      <p style={{
        margin: "5px 0 0",
        fontSize: 10,
        fontFamily: T.font,
        textAlign: "center",
        color: donated ? "rgba(139,0,0,0.4)" : T.textMuted,
      }}>
        {donated
          ? "Donation recorded · available again after 3 months"
          : "Press after you have donated blood"}
      </p>

      {showConfirm && (
        <ConfirmDonateModal
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

// ── Donor Profile Card ────────────────────────────────────────────────────────
// FIX: Hook moved here (parent level), not inside a conditional branch.
function DonorProfileCard({ data, loading, onDonate, donateLoading }) {
  if (loading) return (
    <div style={{
      background: `linear-gradient(135deg, ${T.accent} 0%, #6b0000 100%)`,
      borderRadius: 14, padding: "16px 18px",
      display: "flex", alignItems: "center", gap: 10,
      boxShadow: "0 4px 20px rgba(139,0,0,0.16)",
    }}>
      <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "rd-spin 0.7s linear infinite", display: "inline-block", flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", fontFamily: T.font }}>Loading donor profile…</span>
    </div>
  );

  if (!data) return null;

  const { name, phone, blood, bloodRequestType, locationData, isBloodDonated, updatedAt, _id } = data;
  const loc = locationData || {};

  return (
    <div style={{
      background: `linear-gradient(135deg, ${T.accent} 0%, #6b0000 100%)`,
      borderRadius: 14, padding: "16px 18px",
      boxShadow: "0 4px 20px rgba(139,0,0,0.18)",
      position: "relative", overflow: "hidden",
    }}>
      {/* decorative circles */}
      <div style={{ position: "absolute", top: -28, right: -28, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -18, right: 36, width: 54, height: 54, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: "0.07em", textTransform: "uppercase", fontFamily: T.font, marginBottom: 2 }}>Registered Donor</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", fontFamily: T.font, lineHeight: 1.2 }}>{name}</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.28)", borderRadius: 10, padding: "5px 12px", textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", fontFamily: T.font, lineHeight: 1 }}>{blood}</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", fontFamily: T.font, marginTop: 1 }}>Blood</div>
        </div>
      </div>

      {/* Pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        <InfoPill icon={<IcoPhone />} label={phone} light />
        <InfoPill icon={<IcoHeart />} label={bloodRequestType === "volunteer" ? "Volunteer" : bloodRequestType} light />
        <InfoPill icon={<IcoDrop />} label={isBloodDonated ? "Donated" : "Not yet"} light dot={isBloodDonated ? "#86efac" : "#fca5a5"} />
      </div>

      {/* Last saved location */}
      {loc.address && (
        <div style={{ background: "rgba(0,0,0,0.16)", borderRadius: 9, padding: "9px 11px", marginBottom: 8 }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: T.font, marginBottom: 3, display: "flex", alignItems: "center", gap: 3 }}>
            <IcoPin size={9} /> Last Saved Location
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.82)", fontFamily: T.font, lineHeight: 1.5 }}>{loc.address}</div>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", fontFamily: "monospace" }}>{loc.lat?.toFixed(5)}°, {loc.lng?.toFixed(5)}°</span>
            {loc.accuracy && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontFamily: T.font }}>±{loc.accuracy}m</span>}
          </div>
        </div>
      )}

      {/* Updated timestamp */}
      {updatedAt && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: T.font, marginBottom: 2 }}>
          <IcoClock size={10} /> Updated {fmtDate(new Date(updatedAt).getTime())} at {fmtTime(new Date(updatedAt).getTime())}
        </div>
      )}

      {/* ── Blood Donation Button ── */}
      <BloodDonationButton
        donorId={_id}
        isBloodDonated={isBloodDonated}
        onDonate={onDonate}
        isLoading={donateLoading}
      />
    </div>
  );
}

// ── Metric Card ───────────────────────────────────────────────────────────────
function MetricCard({ icon, label, value, unit }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 9, color: T.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: T.font }}>
        <span style={{ color: T.accent }}>{icon}</span>{label}
      </div>
      {value !== null && value !== undefined ? (
        <div style={{ fontSize: 16, fontWeight: 600, color: T.text, lineHeight: 1.2, fontFamily: T.font }}>
          {value}{unit && <span style={{ fontSize: 10, fontWeight: 400, color: T.textHint, marginLeft: 2 }}>{unit}</span>}
        </div>
      ) : (
        <div style={{ fontSize: 16, color: T.textHint, fontFamily: T.font }}>—</div>
      )}
    </div>
  );
}

// ── Action Button ─────────────────────────────────────────────────────────────
function ActionButton({ onClick, disabled, variant = "secondary", children }) {
  const base = {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    borderRadius: 9, cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.35 : 1, transition: "opacity 0.15s, transform 0.1s",
    fontFamily: T.font, width: "100%", border: "none",
  };
  const variants = {
    primary:   { background: T.accent,   color: "#fff",   fontWeight: 700, fontSize: 14, padding: "11px 12px" },
    stop:      { background: T.accentLt, color: T.accent, border: `1px solid ${T.borderMd}`, fontWeight: 700, fontSize: 14, padding: "11px 12px" },
    secondary: { background: T.accentLt, color: T.text,   border: `1px solid ${T.border}`, fontWeight: 500, fontSize: 12, padding: "8px 10px" },
  };
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={{ ...base, ...variants[variant] }}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = "scale(0.97)"; }}
      onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      {children}
    </button>
  );
}

// ── History Item ──────────────────────────────────────────────────────────────
function HistoryItem({ item }) {
  const ai = accInfo(item.accuracy);
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "8px 10px", borderRadius: 9, background: T.bg, border: `1px solid rgba(139,0,0,0.09)` }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent, marginTop: 4, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: T.text, fontFamily: "monospace" }}>{item.lat.toFixed(5)}, {item.lng.toFixed(5)}</span>
          <span style={{ fontSize: 10, color: T.textHint, flexShrink: 0, fontFamily: T.font }}>{fmtTime(item.timestamp)}</span>
        </div>
        <span style={{ display: "inline-block", marginTop: 2, fontSize: 10, padding: "1px 7px", borderRadius: 999, background: ai.bg, color: ai.col, fontWeight: 600, fontFamily: T.font }}>
          ±{item.accuracy}m · {ai.label}
        </span>
        {item.address && (
          <div style={{ fontSize: 10, color: T.textHint, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: T.font }}>
            {item.address}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Status Bar ────────────────────────────────────────────────────────────────
function StatusBar({ permState, lastUpdated, coords, isSaving }) {
  const text = {
    idle:      "Press Start tracking to begin",
    requesting:"Requesting permission…",
    active:    lastUpdated ? `Last updated ${fmtTime(lastUpdated)}` : "Tracking…",
    denied:    "Location access denied",
    stopped:   "Tracking stopped",
  }[permState] || "";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 10, background: T.surface, border: `1px solid ${T.border}` }}>
      <PulseDot state={permState} />
      <span style={{ fontSize: 12, color: T.text, flex: 1, fontFamily: T.font }}>{text}</span>
      {isSaving && (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: T.textMuted, fontFamily: T.font, flexShrink: 0 }}>
          <span style={{ width: 9, height: 9, border: `1.5px solid ${T.border}`, borderTopColor: T.accent, borderRadius: "50%", animation: "rd-spin 0.7s linear infinite", display: "inline-block" }} />
          Saving…
        </span>
      )}
      {coords && !isSaving && <AccBadge accuracy={coords.accuracy} />}
    </div>
  );
}

// ── Map Box ───────────────────────────────────────────────────────────────────
function MapBox({ displayCoords, coords, mapHeight }) {
  return (
    <div style={{
      borderRadius: 12, overflow: "hidden",
      border: `1px solid ${T.border}`,
      height: mapHeight, background: "#f5eded", flexShrink: 0,
      boxShadow: "0 2px 12px rgba(139,0,0,0.07)",
      position: "relative",
    }}>
      {displayCoords ? (
        <>
          <LiveMap coords={displayCoords} />
          {!coords && (
            <div style={{
              position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)",
              zIndex: 999, background: "rgba(139,0,0,0.80)", color: "#fff",
              fontSize: 11, borderRadius: 999, padding: "3px 12px",
              fontFamily: T.font, whiteSpace: "nowrap", pointerEvents: "none",
              boxShadow: "0 2px 6px rgba(0,0,0,0.16)",
            }}>
              📍 Last saved location
            </div>
          )}
        </>
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#b5848a", fontSize: 13, gap: 7, fontFamily: T.font }}>
          <IcoMap size={32} />
          Start tracking to see your location
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function RaktoDaan() {
  const bp       = useBreakpoint();
  const isMobile = bp === "mobile";
  const isTablet = bp === "tablet";

  const [permState,      setPermState]      = useState("idle");
  const [coords,         setCoords]         = useState(null);
  const [address,        setAddress]        = useState(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [history,        setHistory]        = useState([]);
  const [updateCount,    setUpdateCount]    = useState(0);
  const [lastUpdated,    setLastUpdated]    = useState(null);
  const [copied,         setCopied]         = useState(false);
  const [snapped,        setSnapped]        = useState(false);

  const watchIdRef = useRef(null);
  const isTracking = permState === "active" || permState === "requesting";

  // ── RTK Query hooks (all at top level — no hooks inside conditionals) ───────
  const [changeLocation, { isLoading: isSaving, data: saveData, isSuccess: saveSuccess, isError, error }] =
    useChange_locationMutation();

  // FIX: hook hoisted to component level (was inside DonorProfileCard, causing Rules of Hooks violation)
  const [markBloodDonated, { isLoading: donateLoading, isSuccess: donateSuccess, data: donateResult, error: donateError }] =
    useIs_blood_donatedMutation();

  const token   = getFromLocalStorage(import.meta.env.VITE_TOKEN_NAME);
  const decoded = jwtDecode(token);

  const { data: myCurrentLocation, isLoading: currentLocationLoading } =
    useFind_my_current_locationQuery();
  const donorData = myCurrentLocation?.data;

  const savedCoords = donorData?.locationData?.lat
    ? { lat: donorData.locationData.lat, lng: donorData.locationData.lng, accuracy: donorData.locationData.accuracy }
    : null;
  const displayCoords = coords || savedCoords;

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSaving && saveSuccess && saveData?.success) toast.success(saveData.message);
  }, [isSaving, saveSuccess, saveData]);

  // FIX: added proper dependencies; toast only fires when donateSuccess actually flips
  useEffect(() => {
    if (donateSuccess && donateResult?.message) toast.success(donateResult.message);
  }, [donateSuccess, donateResult]);

  useEffect(() => {
    if (donateError) toast.error(donateError?.data?.message || "Failed to update donation status.");
  }, [donateError]);

  // ── Geolocation handlers ───────────────────────────────────────────────────
  const handlePosition = useCallback(async (pos) => {
    const lat      = pos.coords.latitude;
    const lng      = pos.coords.longitude;
    const accuracy = Math.round(pos.coords.accuracy);
    setCoords({ lat, lng, accuracy });
    setPermState("active");
    setUpdateCount(c => c + 1);
    setLastUpdated(Date.now());
    setAddressLoading(true);
    const addr = await reverseGeocode(lat, lng);
    setAddress(addr);
    setAddressLoading(false);
    if (!decoded.isDonorRegister) {
      toast.error("Please register as a donor before updating location.");
      return;
    }
    if (navigator.onLine) await changeLocation({ lat, lng, accuracy, address: addr });
  }, [changeLocation, decoded.isDonorRegister]);

  const handleError = useCallback((err) => {
    const msgs = { 1: "Permission denied by user", 2: "Position unavailable", 3: "Request timed out" };
    console.warn("[RaktoDaan]", msgs[err.code]);
    setPermState("denied");
  }, []);

  const startTracking = () => {
    if (!navigator.geolocation) { setPermState("denied"); return; }
    setPermState("requesting");
    watchIdRef.current = navigator.geolocation.watchPosition(handlePosition, handleError, {
      enableHighAccuracy: true, maximumAge: 5000, timeout: 10000,
    });
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setPermState("stopped");
  };

  const snapLocation = () => {
    if (!coords) return;
    setHistory(h => [{ ...coords, address: address || "", timestamp: Date.now(), id: Date.now() }, ...h]);
    setSnapped(true);
    setTimeout(() => setSnapped(false), 1500);
  };

  const copyCoords = () => {
    const c = coords || savedCoords;
    if (!c) return;
    navigator.clipboard.writeText(`${c.lat.toFixed(6)}, ${c.lng.toFixed(6)}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const openInMaps = () => {
    const c = coords || savedCoords;
    if (!c) return;
    window.open(`https://www.openstreetmap.org/?mlat=${c.lat}&mlon=${c.lng}#map=16/${c.lat}/${c.lng}`, "_blank");
  };

  // FIX: handler defined in parent where the hook lives, passed as prop
  const handleDonate = (id) => {
    markBloodDonated({ id, isBloodDonated: donorData?.isBloodDonated });
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const displayAddress     = address || donorData?.locationData?.address || null;
  const displayAddressLoad = addressLoading;
  const mapHeight          = isMobile ? 220 : isTablet ? 260 : 290;

  const apiHistoryItem = !history.length && donorData?.locationData
    ? [{ lat: donorData.locationData.lat, lng: donorData.locationData.lng, accuracy: donorData.locationData.accuracy, address: donorData.locationData.address || "", timestamp: new Date(donorData.updatedAt).getTime(), id: "saved-api" }]
    : [];
  const historyToShow = history.length > 0 ? history : apiHistoryItem;

  if (isError && error) return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", fontFamily: T.font }}>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "22px 24px", maxWidth: 400, width: "100%" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.accent, marginBottom: 6 }}>Error</div>
        <div style={{ fontSize: 12, color: T.text, wordBreak: "break-all" }}>{JSON.stringify(error)}</div>
      </div>
    </div>
  );

  // ── Panels ────────────────────────────────────────────────────────────────
  const HistoryPanel = (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: T.text, fontFamily: T.font }}>
          <IcoHistory /> Location history
        </div>
        {historyToShow.length > 0 && (
          <span style={{ fontSize: 10, padding: "2px 9px", borderRadius: 999, background: T.accentLt, color: T.accent, fontWeight: 600, border: `1px solid ${T.borderMd}`, fontFamily: T.font }}>
            {historyToShow.length} saved
          </span>
        )}
      </div>
      {historyToShow.length === 0 ? (
        <div style={{ textAlign: "center", padding: "16px 0", color: "#b5848a", fontSize: 12, fontFamily: T.font }}>
          <IcoPin size={24} />
          <p style={{ margin: "6px 0 0" }}>No snapshots — press Snap location to save a reading</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {history.length === 0 && apiHistoryItem.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: T.textMuted, fontFamily: T.font, marginBottom: 2 }}>
              <IcoClock size={10} /> Showing last record from database
            </div>
          )}
          {historyToShow.map(item => <HistoryItem key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );

  const ControlsPanel = (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* DonorProfileCard now receives onDonate + donateLoading as props */}
      <DonorProfileCard
        data={donorData}
        loading={currentLocationLoading}
        onDonate={handleDonate}
        donateLoading={donateLoading}
      />
      <StatusBar permState={permState} lastUpdated={lastUpdated} coords={coords} isSaving={isSaving} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
        <MetricCard icon={<IcoTarget />} label="Latitude"  value={displayCoords ? displayCoords.lat.toFixed(5) : null} unit="°" />
        <MetricCard icon={<IcoTarget />} label="Longitude" value={displayCoords ? displayCoords.lng.toFixed(5) : null} unit="°" />
        <MetricCard icon={<IcoRadar size={13} />} label="Accuracy" value={displayCoords ? displayCoords.accuracy : null} unit="m" />
        <MetricCard icon={<IcoRefresh />} label="Updates"  value={updateCount} unit={updateCount === 1 ? "update" : "updates"} />
      </div>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 5, fontSize: 9, color: T.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: T.font }}>
          <IcoBuilding /> Current Address
        </div>
        {displayAddressLoad ? (
          <div style={{ display: "flex", alignItems: "center", gap: 7, color: T.textMuted, fontSize: 12, fontFamily: T.font }}>
            <span style={{ display: "inline-block", width: 10, height: 10, border: `2px solid ${T.border}`, borderTopColor: T.accent, borderRadius: "50%", animation: "rd-spin 0.7s linear infinite" }} />
            Fetching address…
          </div>
        ) : displayAddress ? (
          <p style={{ fontSize: 12, color: T.text, margin: 0, lineHeight: 1.6, fontFamily: T.font }}>{displayAddress}</p>
        ) : (
          <p style={{ fontSize: 12, color: T.textHint, margin: 0, fontFamily: T.font }}>
            {displayCoords ? "Address unavailable" : "Location not yet captured"}
          </p>
        )}
      </div>
      {!isTracking ? (
        <ActionButton onClick={startTracking} variant="primary">
          <IcoRadar size={16} />{permState === "stopped" ? "Change location" : "Start tracking"}
        </ActionButton>
      ) : (
        <ActionButton onClick={stopTracking} variant="stop">
          <IcoStop size={16} /> Stop tracking
        </ActionButton>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
        <ActionButton onClick={snapLocation} disabled={!coords} variant="secondary">
          {snapped ? <><IcoCheck /> Saved!</> : <><IcoCamera /> Snap location</>}
        </ActionButton>
        <ActionButton onClick={copyCoords} disabled={!displayCoords} variant="secondary">
          {copied ? <><IcoCheck /> Copied!</> : <><IcoCopy /> Copy coords</>}
        </ActionButton>
        <ActionButton onClick={openInMaps} disabled={!displayCoords} variant="secondary">
          <IcoMap /> Open in Maps
        </ActionButton>
        <ActionButton onClick={() => setHistory([])} disabled={history.length === 0} variant="secondary">
          <IcoTrash /> Clear history
        </ActionButton>
      </div>
    </div>
  );

  // ── Layout ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;500;600;700&display=swap');
        @keyframes rd-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(.8)} }
        @keyframes rd-spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .rd-root * { box-sizing: border-box; }
        .rd-root   { font-family: 'Crimson Pro', Georgia, serif; }
        .rd-scroll::-webkit-scrollbar       { width: 3px; }
        .rd-scroll::-webkit-scrollbar-track { background: #fdf4f4; border-radius: 4px; }
        .rd-scroll::-webkit-scrollbar-thumb { background: rgba(139,0,0,0.2); border-radius: 4px; }
      `}</style>

      <div className="rd-root" style={{ minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column" }}>

        {isMobile ? (
          /* MOBILE: Controls → Map → History */
          <div className="rd-scroll" style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {ControlsPanel}
            <MapBox displayCoords={displayCoords} coords={coords} mapHeight={mapHeight} />
            {HistoryPanel}
            <div style={{ height: 16 }} />
          </div>

        ) : isTablet ? (
          /* TABLET: Map full-width top → Controls left / History right */
          <div className="rd-scroll" style={{ flex: 1, overflowY: "auto", padding: "14px 40px", display: "flex", flexDirection: "column", gap: 12 }}>
            <MapBox displayCoords={displayCoords} coords={coords} mapHeight={mapHeight} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
              {ControlsPanel}
              {HistoryPanel}
            </div>
            <div style={{ height: 12 }} />
          </div>

        ) : (
          /* DESKTOP: Map+History LEFT | Controls RIGHT */
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{
              flex: 1, overflow: "hidden", display: "grid",
              gridTemplateColumns: "1fr minmax(300px, 420px)",
              gap: 0, marginLeft: 40, marginRight: 40,
            }}>
              {/* LEFT: Map + History */}
              <div className="rd-scroll" style={{ overflowY: "auto", padding: "16px 6px 16px 0", display: "flex", flexDirection: "column", gap: 10 }}>
                <MapBox displayCoords={displayCoords} coords={coords} mapHeight={mapHeight} />
                {HistoryPanel}
                <div style={{ height: 16 }} />
              </div>
              {/* RIGHT: Controls */}
              <div className="rd-scroll" style={{ overflowY: "auto", padding: "16px 0 16px 6px", display: "flex", flexDirection: "column", gap: 10 }}>
                {ControlsPanel}
                <div style={{ height: 16 }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}