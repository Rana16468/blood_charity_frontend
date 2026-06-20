import { memo } from "react";

const BloodFilterPanel = memo(function BloodFilterPanel({
  selectedBlood,
  setSelectedBlood,
  searchRadius,
  setSearchRadius,
  setCurrentPage,
  BLOOD_TYPES,
  COMPATIBILITY,
  cs,
  coords,
}) {
  if (!coords?.lat || !coords?.lng  ) return null;

  console.log({selectedBlood, lat:coords?.lat,lng:coords?.lng,searchRadius})

  return (
    <div style={{ ...cs.card, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>

      <div style={{ flex: 1, minWidth: 120 }}>
        <label style={cs.label}>Blood Type Filter</label>
        <select
          style={cs.select}
          value={selectedBlood}
          onChange={(e) => {
            setSelectedBlood(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">All types</option>
          {BLOOD_TYPES.map((blood) => (
            <option key={blood} value={blood}>{blood}</option>
          ))}
        </select>
      </div>

      <div style={{ flex: 1, minWidth: 120 }}>
        <label style={cs.label}>Radius: {searchRadius} km</label>
        <input
          type="range"
          min={1}
          max={50}
          value={searchRadius}
          onChange={(e) => {
            setSearchRadius(Number(e.target.value));
            setCurrentPage(1);
          }}
          style={{ width: "100%", accentColor: "#c0392b" }}
        />
      </div>

      {selectedBlood && COMPATIBILITY[selectedBlood] && (
        <div style={{
          width: "100%",
          background: "#fff9f9",
          borderRadius: 8,
          padding: "10px 12px",
          border: "1px solid #f5c6c6",
        }}>
          <div style={{ fontSize: 12, color: "#7f8c8d", marginBottom: 6 }}>
            Compatibility for{" "}
            <strong style={{ color: "#c0392b" }}>{selectedBlood}</strong>
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, color: "#95a5a6", marginBottom: 4 }}>Can donate to</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {COMPATIBILITY[selectedBlood].canDonateTo.map((blood) => (
                  <span key={blood} style={cs.badge(blood)}>{blood}</span>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: "#95a5a6", marginBottom: 4 }}>Can receive from</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {COMPATIBILITY[selectedBlood].canReceiveFrom.map((blood) => (
                  <span key={blood} style={cs.badge(blood)}>{blood}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default BloodFilterPanel;