import PropTypes from "prop-types";

export function generateId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}
export function formatAge(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
export const COMPATIBILITY = {
  "A+":  { canDonateTo: ["A+", "AB+"],                                canReceiveFrom: ["A+", "A-", "O+", "O-"] },
  "A-":  { canDonateTo: ["A+", "A-", "AB+", "AB-"],                  canReceiveFrom: ["A-", "O-"] },
  "B+":  { canDonateTo: ["B+", "AB+"],                                canReceiveFrom: ["B+", "B-", "O+", "O-"] },
  "B-":  { canDonateTo: ["B+", "B-", "AB+", "AB-"],                  canReceiveFrom: ["B-", "O-"] },
  "AB+": { canDonateTo: ["AB+"],                                      canReceiveFrom: ["A+","A-","B+","B-","AB+","AB-","O+","O-"] },
  "AB-": { canDonateTo: ["AB+", "AB-"],                               canReceiveFrom: ["A-", "B-", "AB-", "O-"] },
  "O+":  { canDonateTo: ["A+", "B+", "AB+", "O+"],                   canReceiveFrom: ["O+", "O-"] },
  "O-":  { canDonateTo: ["A+","A-","B+","B-","AB+","AB-","O+","O-"], canReceiveFrom: ["O-"] },
};

export const BADGE_COLORS = {
  "O-": "#922b21", "O+": "#c0392b", "A+": "#d35400", "A-": "#a04000",
  "B+": "#1a5276", "B-": "#1f618d", "AB+": "#6c3483", "AB-": "#512e5f",
};

export const URGENCY_COLORS = { critical: "#c0392b", urgent: "#e67e22", normal: "#27ae60" };
export const MOCK_DONORS = [
  { id: "D1",  name: "Rahim Uddin",    blood: "O+",  lat: 26.025, lng: 88.463, phone: "+880-1711-000001", available: true,  lastDonated: "2025-01-15" },
  { id: "D2",  name: "Fatema Begum",   blood: "A+",  lat: 26.031, lng: 88.471, phone: "+880-1812-000002", available: true,  lastDonated: "2025-02-10" },
  { id: "D3",  name: "Karim Hossain",  blood: "B+",  lat: 26.018, lng: 88.458, phone: "+880-1913-000003", available: false, lastDonated: "2025-03-01" },
  { id: "D4",  name: "Nasrin Akter",   blood: "AB-", lat: 26.040, lng: 88.480, phone: "+880-1614-000004", available: true,  lastDonated: "2024-12-20" },
  { id: "D5",  name: "Jalal Ahmed",    blood: "O-",  lat: 26.012, lng: 88.450, phone: "+880-1515-000005", available: true,  lastDonated: "2025-01-05" },
  { id: "D6",  name: "Mina Khatun",    blood: "A-",  lat: 26.050, lng: 88.490, phone: "+880-1716-000006", available: true,  lastDonated: "2025-02-28" },
  { id: "D7",  name: "Selim Reza",     blood: "B-",  lat: 26.008, lng: 88.445, phone: "+880-1817-000007", available: false, lastDonated: "2025-03-15" },
  { id: "D8",  name: "Runa Islam",     blood: "O+",  lat: 26.060, lng: 88.500, phone: "+880-1918-000008", available: true,  lastDonated: "2025-01-25" },
  { id: "D9",  name: "Tofael Haque",   blood: "AB+", lat: 26.035, lng: 88.455, phone: "+880-1619-000009", available: true,  lastDonated: "2024-11-30" },
  { id: "D10", name: "Shahnaz Parvin", blood: "O+",  lat: 26.022, lng: 88.475, phone: "+880-1520-000010", available: true,  lastDonated: "2025-02-14" },
];
export const BLOOD_STATS = [
  ["O+", "36%", "Most common"], ["A+", "28%", "Common"],    ["B+", "22%", "Common"],
  ["AB+", "7%", "Rare"],        ["O-", "3%", "Universal donor"], ["A-", "2%", "Rare"],
  ["B-", "1.5%", "Very rare"],  ["AB-", "0.5%", "Rarest"],
];

// ─── Shared style helpers ─────────────────────────────────────────────────────
export const cs = {
  btn: (v = "red") => ({
    padding: "9px 18px", borderRadius: 8, fontSize: 14, fontWeight: 600,
    cursor: "pointer", border: "none", fontFamily: "inherit", transition: "all 0.15s",
    background:
      v === "red"   ? "#c0392b" :
      v === "green" ? "#27ae60" :
      v === "blue"  ? "#2980b9" :
      v === "ghost" ? "transparent" : "#2980b9",
    color: v === "ghost" ? "#c0392b" : "#ffffff",
    ...(v === "ghost" ? { border: "1px solid #e8c5c5" } : {}),
  }),
  badge: (b) => ({
    background: BADGE_COLORS[b] || "#7f8c8d", color: "#fff",
    padding: "2px 9px", borderRadius: 99, fontSize: 12, fontWeight: 700,
    letterSpacing: "0.04em", fontFamily: "monospace", display: "inline-block",
  }),
  card:   { background: "#ffffff", border: "1px solid #f5c6c6", borderRadius: 10, padding: "14px 16px", marginBottom: 10, boxShadow: "0 1px 4px rgba(192,57,43,0.07)" },
  input:  { width: "100%", background: "#fff9f9", border: "1px solid #f5c6c6", borderRadius: 8, padding: "9px 12px", fontSize: 14, fontFamily: "inherit", color: "#2c3e50", outline: "none", boxSizing: "border-box" },
  select: { width: "100%", background: "#fff9f9", border: "1px solid #f5c6c6", borderRadius: 8, padding: "9px 12px", fontSize: 14, fontFamily: "inherit", color: "#2c3e50", outline: "none", boxSizing: "border-box" },
  label:  { fontSize: 11, color: "#95a5a6", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5, display: "block" },
};

export function PermissionDenied({ onRetry }) {
  return (
    <div style={{ background: "rgba(192,57,43,0.06)", border: "1px solid rgba(192,57,43,0.25)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#c0392b", marginBottom: 8 }}>
        🚫 Location access blocked
      </div>
      <div style={{ fontSize: 13, color: "#7f8c8d", lineHeight: 1.8 }}>
        1. Click the lock / info icon in your browser address bar<br />
        2. Set <strong style={{ color: "#2c3e50" }}>Location</strong> → <strong style={{ color: "#2c3e50" }}>Allow</strong><br />
        3. Click Re-request below
      </div>
      <button onClick={onRetry} style={{ ...cs.btn("red"), marginTop: 12, width: "100%" }}>
        ↺ Re-request Permission
      </button>
    </div>
  );
}
PermissionDenied.propTypes = {
  onRetry: PropTypes.func.isRequired,
};
