import { useState, useEffect, useCallback, useRef } from "react";
import { useSocketContext } from "../../../router/SocketProvider";


// ─── Constants ────────────────────────────────────────────────────────────────

const URGENCY_COLORS = {
  critical: "#c0392b",
  urgent:   "#e67e22",
  normal:   "#27ae60",
};

const URGENCY_ICON = {
  critical: "🔴",
  urgent:   "🟠",
  normal:   "🟢",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAge(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5)    return "just now";
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

let _idCounter = 0;
function localId() {
  return `notif-${Date.now()}-${++_idCounter}`;
}

// ─── Toast Item ───────────────────────────────────────────────────────────────

function ToastItem({ notification: n, onDismiss }) {
  const d       = n.data;
  const urgency = d?.urgency ?? "normal";
  const color   = URGENCY_COLORS[urgency] ?? "#95a5a6";
  const icon    = URGENCY_ICON[urgency]   ?? "🟢";

  return (
    <div
      className="brnf-toast-item brnf-panel"
      style={{
        background:   "#ffffff",
        border:       `1px solid ${urgency === "critical" ? "#c0392b" : "#f5c6c6"}`,
        borderLeft:   `4px solid ${color}`,
        borderRadius: 10,
        padding:      "12px 14px",
        boxShadow:    "0 6px 24px rgba(192,57,43,0.15)",
        pointerEvents:"all",
        position:     "relative",
        minWidth:     280,
      }}
    >
      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(n.id)}
        style={{
          position:   "absolute",
          top:        8,
          right:      8,
          background: "none",
          border:     "none",
          cursor:     "pointer",
          fontSize:   12,
          color:      "#bdc3c7",
          padding:    "2px 5px",
          borderRadius: 4,
          lineHeight: 1,
        }}
      >
        ✕
      </button>

      {/* Header row */}
      <div style={{
        display:      "flex",
        alignItems:   "center",
        gap:          7,
        marginBottom: 5,
        paddingRight: 20,
      }}>
        <span style={{ fontSize: 14 }}>🩸</span>
        <span style={{
          fontSize:   12,
          fontWeight: 700,
          color:      "#2c3e50",
          fontFamily: "'Crimson Pro', Georgia, serif",
        }}>
          Blood Request
        </span>

        {d?.blood && (
          <span style={{
            fontSize:     10,
            fontWeight:   700,
            padding:      "1px 6px",
            borderRadius: 99,
            border:       "1px solid #f5a0a0",
            background:   "rgba(192,57,43,0.08)",
            color:        "#c0392b",
            fontFamily:   "monospace",
          }}>
            {d.blood}
          </span>
        )}

        <span style={{
          marginLeft:    "auto",
          fontSize:      10,
          fontWeight:    700,
          padding:       "1px 6px",
          borderRadius:  99,
          textTransform: "uppercase",
          border:        `1px solid ${color}`,
          background:    `${color}18`,
          color,
        }}>
          {icon} {urgency}
        </span>
      </div>

      {d?.hospital && (
        <div style={{ fontSize: 12, color: "#7f8c8d", marginBottom: 2 }}>
          🏥 {d.hospital}
        </div>
      )}

      {d?.locationData?.address && (
        <div style={{ fontSize: 11, color: "#95a5a6" }}>
          📍{" "}
          {d.locationData.address.length > 55
            ? d.locationData.address.slice(0, 53) + "…"
            : d.locationData.address}
        </div>
      )}

      {!d?.locationData?.address && d?.locationData?.lat && (
        <div style={{ fontSize: 11, color: "#95a5a6", fontFamily: "monospace" }}>
          📍 {d.locationData.lat.toFixed(5)}, {d.locationData.lng?.toFixed(5)}
        </div>
      )}
    </div>
  );
}

// ─── Toast Stack ──────────────────────────────────────────────────────────────

function ToastStack({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div style={{
      position:       "fixed",
      bottom:         24,
      right:          20,
      zIndex:         99999,
      display:        "flex",
      flexDirection:  "column",
      gap:            8,
      maxWidth:       320,
      pointerEvents:  "none",
    }}>
      {toasts.map(n => (
        <ToastItem key={n.id} notification={n} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// ─── Notification Item ────────────────────────────────────────────────────────

function NotificationItem({ notification: n, onRead }) {
  const d       = n.data;
  const urgency = d?.urgency ?? "normal";
  const color   = URGENCY_COLORS[urgency] ?? "#95a5a6";
  const icon    = URGENCY_ICON[urgency]   ?? "🟢";

  return (
    <div
      className="brnf-item"
      onClick={() => onRead(n.id)}
      style={{
        padding:      "11px 14px",
        borderBottom: "1px solid #fdf0f0",
        cursor:       "pointer",
        background:   n.read ? "#ffffff" : "#fff9f9",
        transition:   "background 0.12s",
        display:      "flex",
        gap:          10,
        alignItems:   "flex-start",
      }}
    >
      {/* Unread indicator dot */}
      <div style={{ paddingTop: 5, flexShrink: 0 }}>
        {!n.read ? (
          <span style={{
            display:      "block",
            width:        7,
            height:       7,
            borderRadius: "50%",
            background:   "#c0392b",
          }} />
        ) : (
          <span style={{
            display:      "block",
            width:        7,
            height:       7,
            borderRadius: "50%",
            background:   "transparent",
            border:       "1px solid #f5c6c6",
          }} />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Top badge row */}
        <div style={{
          display:      "flex",
          alignItems:   "center",
          gap:          6,
          marginBottom: 3,
          flexWrap:     "wrap",
        }}>
          {d?.blood && (
            <span style={{
              fontSize:     10,
              fontWeight:   700,
              padding:      "1px 6px",
              borderRadius: 99,
              border:       "1px solid #f5a0a0",
              background:   "rgba(192,57,43,0.08)",
              color:        "#c0392b",
              fontFamily:   "monospace",
              letterSpacing:"0.04em",
            }}>
              {d.blood}
            </span>
          )}

          <span style={{
            fontSize:      10,
            fontWeight:    700,
            padding:       "1px 6px",
            borderRadius:  99,
            textTransform: "uppercase",
            border:        `1px solid ${color}`,
            background:    `${color}18`,
            color,
            animation:     urgency === "critical" ? "brnfPulse 1.5s infinite" : "none",
          }}>
            {icon} {urgency}
          </span>

          <span style={{
            marginLeft: "auto",
            fontSize:   10,
            color:      "#bdc3c7",
            whiteSpace: "nowrap",
          }}>
            {formatAge(n.receivedAt)}
          </span>
        </div>

        {/* Message */}
        <div style={{
          fontSize:   13,
          fontWeight: 600,
          color:      "#2c3e50",
          marginBottom: 2,
        }}>
          {n.message || "New blood request"}
        </div>

        {/* Hospital */}
        {d?.hospital && (
          <div style={{ fontSize: 12, color: "#7f8c8d" }}>
            🏥 {d.hospital}
          </div>
        )}

        {/* Address */}
        {d?.locationData?.address && (
          <div style={{ fontSize: 11, color: "#95a5a6", marginTop: 2 }}>
            📍{" "}
            {d.locationData.address.length > 60
              ? d.locationData.address.slice(0, 58) + "…"
              : d.locationData.address}
          </div>
        )}

        {/* Coords fallback */}
        {!d?.locationData?.address && d?.locationData?.lat && (
          <div style={{
            fontSize:   11,
            color:      "#95a5a6",
            marginTop:  2,
            fontFamily: "monospace",
          }}>
            📍 {d.locationData.lat.toFixed(5)}, {d.locationData.lng?.toFixed(5)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BloodRequestNotifications() {
  const { socket, connected } = useSocketContext();

  const [notifications, setNotifications]       = useState([]);
  const [isOpen, setIsOpen]                     = useState(false);
  const [toasts, setToasts]                     = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  const panelRef = useRef(null);

  // ── Track socket connection ───────────────────────────────────────────────
  useEffect(() => {
    setConnectionStatus(connected ? "connected" : "disconnected");
  }, [connected]);

  // ── Socket listener ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !connected) return;

    const handleNotification = (payload) => {

    console.log('notification  data', payload)
      const entry = {
        ...payload,
        id:         localId(),
        receivedAt: Date.now(),
        read:       false,
      };

      setNotifications(prev => [entry, ...prev].slice(0, 100));

      // Show toast, auto-dismiss after 6 s
      setToasts(prev => [...prev, entry]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== entry.id));
      }, 6000);
    };

    socket.on("blood_request_notification", handleNotification);
    return () => {
      socket.off("blood_request_notification", handleNotification);
    };
  }, [socket, connected]);

  // ── Close panel on outside click ──────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleBellClick = () => {
    const opening = !isOpen;
    setIsOpen(opening);
    if (opening) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const markRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const unreadCount = notifications.filter(n => !n.read).length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Global styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&display=swap');

        .brnf-panel, .brnf-panel * { box-sizing: border-box; }
        .brnf-panel {
          font-family: 'Crimson Pro', Georgia, serif;
        }

        .brnf-item:hover { background: #fff5f5 !important; }

        .brnf-bell-btn:hover {
          background: rgba(192,57,43,0.08) !important;
          border-color: #c0392b !important;
        }

        .brnf-badge-pulse {
          animation: brnfPulse 1.4s infinite;
        }

        .brnf-toast-item {
          animation: brnfSlideIn 0.25s ease;
        }

        .brnf-dropdown {
          animation: brnfFadeIn 0.18s ease;
        }

        .brnf-clear-btn:hover { color: #c0392b !important; }

        @keyframes brnfSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes brnfFadeIn {
          from { opacity: 0; transform: scale(0.96) translateY(-6px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
        @keyframes brnfPulse {
          0%,100% { opacity: 1;    }
          50%      { opacity: 0.45; }
        }

        .brnf-panel::-webkit-scrollbar       { width: 4px; }
        .brnf-panel::-webkit-scrollbar-thumb { background: #f5c6c6; border-radius: 4px; }
      `}</style>

      {/* ── Bell button + dropdown wrapper ── */}
      <div
        className="brnf-panel"
        ref={panelRef}
        style={{ position: "relative", display: "inline-block" }}
      >
        {/* Bell button */}
        <button
          className="brnf-bell-btn"
          onClick={handleBellClick}
          title="Blood request notifications"
          style={{
            position:     "relative",
            background:   isOpen ? "rgba(192,57,43,0.1)" : "transparent",
            border:       `1px solid ${isOpen ? "#c0392b" : "#f5c6c6"}`,
            borderRadius: 10,
            padding:      "7px 12px",
            cursor:       "pointer",
            fontSize:     18,
            lineHeight:   1,
            display:      "flex",
            alignItems:   "center",
            gap:          6,
            transition:   "all 0.15s",
          }}
        >
          🔔

          {/* Unread badge */}
          {unreadCount > 0 && (
            <span
              className="brnf-badge-pulse"
              style={{
                position:     "absolute",
                top:          -5,
                right:        -5,
                minWidth:     18,
                height:       18,
                borderRadius: 99,
                background:   "#c0392b",
                color:        "#fff",
                fontSize:     10,
                fontWeight:   700,
                display:      "flex",
                alignItems:   "center",
                justifyContent:"center",
                padding:      "0 4px",
                fontFamily:   "monospace",
                border:       "2px solid #fdf4f4",
              }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}

          {/* Connection dot */}
          <span
            title={connectionStatus}
            style={{
              width:        7,
              height:       7,
              borderRadius: "50%",
              background:   connectionStatus === "connected" ? "#27ae60" : "#bdc3c7",
              display:      "inline-block",
              flexShrink:   0,
              transition:   "background 0.3s",
            }}
          />
        </button>

        {/* ── Dropdown panel ── */}
        {isOpen && (
          <div
            className="brnf-dropdown brnf-panel"
            style={{
              position:      "absolute",
              top:           "calc(100% + 8px)",
              right:         0,
              width:         340,
              maxHeight:     480,
              background:    "#ffffff",
              border:        "1px solid #f5c6c6",
              borderRadius:  12,
              boxShadow:     "0 8px 32px rgba(192,57,43,0.13)",
              zIndex:        9999,
              display:       "flex",
              flexDirection: "column",
              overflow:      "hidden",
            }}
          >
            {/* Panel header */}
            <div style={{
              padding:        "12px 14px 10px",
              borderBottom:   "1px solid #f5c6c6",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "space-between",
              background:     "#fff9f9",
              flexShrink:     0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15 }}>🩸</span>
                <span style={{ fontWeight: 700, fontSize: 14, color: "#2c3e50" }}>
                  Blood Requests
                </span>
                {notifications.length > 0 && (
                  <span style={{
                    fontSize:     11,
                    padding:      "1px 7px",
                    borderRadius: 99,
                    background:   "rgba(192,57,43,0.1)",
                    color:        "#c0392b",
                    fontWeight:   600,
                  }}>
                    {notifications.length}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {notifications.length > 0 && (
                  <button
                    className="brnf-clear-btn"
                    onClick={clearAll}
                    style={{
                      fontSize:   11,
                      color:      "#95a5a6",
                      background: "none",
                      border:     "none",
                      cursor:     "pointer",
                      padding:    "2px 6px",
                      borderRadius: 6,
                      fontFamily: "inherit",
                      transition: "color 0.12s",
                    }}
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    fontSize:     14,
                    color:        "#95a5a6",
                    background:   "none",
                    border:       "none",
                    cursor:       "pointer",
                    padding:      "2px 6px",
                    borderRadius: 6,
                    lineHeight:   1,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Disconnected warning strip */}
            {connectionStatus === "disconnected" && (
              <div style={{
                background:   "rgba(189,195,199,0.15)",
                borderBottom: "1px solid #f5c6c6",
                padding:      "6px 14px",
                fontSize:     12,
                color:        "#95a5a6",
                display:      "flex",
                alignItems:   "center",
                gap:          6,
                flexShrink:   0,
              }}>
                <span style={{
                  width:        7,
                  height:       7,
                  borderRadius: "50%",
                  background:   "#bdc3c7",
                  display:      "inline-block",
                  flexShrink:   0,
                }} />
                Socket disconnected — notifications paused
              </div>
            )}

            {/* Notification list */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {notifications.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
                  <div style={{ fontSize: 13, color: "#95a5a6" }}>No notifications yet</div>
                  <div style={{ fontSize: 12, color: "#bdc3c7", marginTop: 4 }}>
                    New blood requests will appear here in real time
                  </div>
                </div>
              ) : (
                notifications.map(n => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onRead={markRead}
                  />
                ))
              )}
            </div>

            {/* Panel footer */}
            <div style={{
              padding:      "8px 14px",
              borderTop:    "1px solid #f5c6c6",
              background:   "#fff9f9",
              fontSize:     11,
              color:        "#bdc3c7",
              textAlign:    "center",
              flexShrink:   0,
            }}>
              Live via WebSocket ·{" "}
              {connectionStatus === "connected" ? (
                <span style={{ color: "#27ae60" }}>● Connected</span>
              ) : (
                <span style={{ color: "#bdc3c7" }}>● Disconnected</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Toast stack (bottom-right, outside panel flow) ── */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}