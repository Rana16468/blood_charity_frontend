import { memo, useEffect, useState } from "react";
import StopIcon from "./StopIcon";
import LocationIcon from "./LocationIcon";
import BloodDropSvg from "./BloodDropSvg";
import PropTypes from "prop-types";

export const AppHeader = memo(function AppHeader({ isTracking, ageStr, onToggle }) {
  const [clock, setClock] = useState(() =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );

  useEffect(() => {
    const t = setInterval(() =>
      setClock(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })),
      10000
    );
    return () => clearInterval(t);
  }, []);

  return (
    <header style={{ maxWidth: 680, margin: "0 auto", padding: "16px" }}>
      <div style={{
        padding: "12px 20px 14px",
        display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 12,
      }}>

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 14, flexShrink: 0,
            background: "rgba(192,57,43,0.08)",
            border: "1px solid rgba(192,57,43,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <BloodDropSvg />
          </div>
          <div>
            <div style={{
              fontSize: 20, fontWeight: 700, color: "#1a1a1a",
              letterSpacing: "-0.02em", lineHeight: 1.1,
            }}>
              RaktoDaan
            </div>
            <div style={{
              fontSize: 10, color: "#888", letterSpacing: "0.14em",
              textTransform: "uppercase", marginTop: 2,
            }}>
              Blood Charity · Nearest First
            </div>
          </div>
        </div>

        {/* Right controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Clock — only shown when tracking */}
          {isTracking && (
            <span style={{ fontSize: 11, color: "#aaa", fontVariantNumeric: "tabular-nums" }}>
              {clock}
            </span>
          )}

          {isTracking ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 7,
              background: "rgba(192,57,43,0.08)",
              border: "1px solid rgba(192,57,43,0.2)",
              borderRadius: 99, padding: "5px 12px 5px 8px",
              fontSize: 12, color: "#c0392b",
            }}>
              <span style={{ position: "relative", display: "inline-flex", width: 10, height: 10, flexShrink: 0 }}>
                <span style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  background: "#c0392b", animation: "ripple 1.6s ease-out infinite",
                }} />
                <span style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: "#c0392b", position: "relative", zIndex: 1,
                }} />
              </span>
              <span>Live · {ageStr}</span>
            </div>
          ) : (
            <span style={{ fontSize: 12, color: "#aaa" }}>No location</span>
          )}

          <button
            onClick={onToggle}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 99,
              fontSize: 12, fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit", letterSpacing: "0.03em",
              textTransform: "uppercase", transition: "all 0.18s",
              background: "#c0392b",
              color: "#ffffff",
              boxShadow: "0 2px 10px rgba(192,57,43,0.3)",
              border: "none",
            }}
          >
            {isTracking ? <StopIcon /> : <LocationIcon />}
            {isTracking ? "Stop" : "Share Location"}
          </button>
        </div>
      </div>
    </header>
  );
});

AppHeader.propTypes = {
  isTracking: PropTypes.bool.isRequired,
  ageStr:     PropTypes.string.isRequired,
  onToggle:   PropTypes.func.isRequired,
  donorCount: PropTypes.number.isRequired,
};