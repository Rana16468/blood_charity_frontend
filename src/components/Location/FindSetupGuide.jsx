

export function FindSetupGuide({ coords, selectedBlood, searchRadius, onStartTracking }) {
  const steps = [
    {
      id: "location",
      done: !!coords,
      icon: "📍",
      title: "Enable your location",
      desc: coords
        ? `Connected · ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
        : "Required to find donors and requests near you",
      action: !coords ? (
        <button
          onClick={onStartTracking}
          style={{
            marginTop: 8,
            padding: "7px 16px",
            background: "#c0392b",
            color: "#fff",
            border: "none",
            borderRadius: 7,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          📍 Enable Location
        </button>
      ) : null,
    },
    {
      id: "blood",
      done: !!selectedBlood,
      icon: "🩸",
      title: "Select a blood type",
      desc: selectedBlood
        ? `Filtering for ${selectedBlood}`
        : "Optional — leave blank to see all types",
      optional: true,
    },
    {
      id: "radius",
      done: searchRadius > 0,
      icon: "🔭",
      title: "Set search radius",
      desc: searchRadius > 0
        ? `Searching within ${searchRadius} km`
        : "Use the radius slider to define your search area",
      optional: true,
    },
  ];

  const requiredDone = steps.filter(s => !s.optional).every(s => s.done);

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #f5c6c6",
        borderRadius: 12,
        padding: "20px 18px",
        marginBottom: 14,
        boxShadow: "0 2px 12px rgba(192,57,43,0.07)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "rgba(192,57,43,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          🔍
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#2c3e50" }}>
            Set up to find donors
          </div>
          <div style={{ fontSize: 12, color: "#95a5a6", marginTop: 2 }}>
            {requiredDone
              ? "Optional steps below improve your results"
              : "Complete the required step to start searching"}
          </div>
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {steps.map((step, idx) => (
          <div
            key={step.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              padding: "12px 14px",
              borderRadius: 9,
              border: step.done
                ? "1px solid #a9dfbf"
                : step.optional
                ? "1px dashed #f5c6c6"
                : "1px solid #f5a0a0",
              background: step.done
                ? "#f0fff4"
                : step.optional
                ? "#fffafA"
                : "#fff9f9",
              transition: "all 0.2s",
            }}
          >
            {/* Step number / checkmark */}
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                background: step.done
                  ? "#27ae60"
                  : step.optional
                  ? "#f5c6c6"
                  : "#c0392b",
                color: "#fff",
                marginTop: 1,
              }}
            >
              {step.done ? "✓" : idx + 1}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14 }}>{step.icon}</span>
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: step.done ? "#27ae60" : "#2c3e50",
                  }}
                >
                  {step.title}
                </span>
                {step.optional && (
                  <span
                    style={{
                      fontSize: 10,
                      background: "rgba(149,165,166,0.15)",
                      color: "#95a5a6",
                      borderRadius: 99,
                      padding: "1px 7px",
                      fontWeight: 600,
                    }}
                  >
                    Optional
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: step.done ? "#27ae60" : "#7f8c8d",
                  marginTop: 3,
                  lineHeight: 1.5,
                }}
              >
                {step.desc}
              </div>
              {step.action}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom hint */}
      {!requiredDone && (
        <div
          style={{
            marginTop: 14,
            padding: "10px 14px",
            background: "rgba(192,57,43,0.06)",
            borderRadius: 8,
            fontSize: 12,
            color: "#c0392b",
            lineHeight: 1.6,
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
          }}
        >
          <span style={{ flexShrink: 0 }}>⚠️</span>
          <span>
            Location access is required to calculate distances and show nearby
            blood requests. Tap <strong>Enable Location</strong> above to
            continue.
          </span>
        </div>
      )}
    </div>
  );
}