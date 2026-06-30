import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSocketContext } from "../../router/SocketProvider";
import { isLoginDonor, removeFromLocalStorage } from "../../utils/LocalStore/LocalStore";
import { CSS, AVATAR_COLORS, NAV_LINKS, PROFILE_LINKS } from "./CSS";
import { useFindMyAllNotificationQuery } from "../redux/api/Notification/NotificationApi";
import { useFindByTotalOverViewQuery } from "../redux/api/BloodDonorApi/BloodDonorApi";
import useInternetStatus from "../../hooks/useInternetStatus";

// ─── Helpers ────────────────────────────────────────────────────────────────

function hashStr(s = "") {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h);
}

function getInitials(name = "") {
  const p = name.trim().split(/\s+/);
  if (!p[0]) return "?";
  return p.length === 1
    ? p[0][0].toUpperCase()
    : (p[0][0] + p.at(-1)[0]).toUpperCase();
}

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Avatar ─────────────────────────────────────────────────────────────────

function Avatar({ picture, name, bloodGroup, size = 34 }) {
  const [err, setErr] = useState(false);
  const bg = AVATAR_COLORS[hashStr(name || "user") % AVATAR_COLORS.length];

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: 10,
        background: picture && !err ? "transparent" : bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden", fontSize: size * 0.38, fontWeight: 700,
        color: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,.25)",
      }}>
        {picture && !err
          ? <img src={picture} alt={name} onError={() => setErr(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : getInitials(name)
        }
      </div>
      {bloodGroup && (
        <span style={{
          position: "absolute", bottom: -4, right: -4,
          background: "#00897B", color: "#fff",
          fontSize: 8, fontWeight: 700, borderRadius: 3,
          padding: "1px 3px", lineHeight: 1.3,
        }}>
          {bloodGroup}
        </span>
      )}
    </div>
  );
}

// ─── useOutsideClick ────────────────────────────────────────────────────────

function useOutsideClick(refs, cb) {
  useEffect(() => {
    const fn = (e) => {
      if (!refs.some(r => r.current?.contains(e.target))) cb();
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [refs, cb]);
}

// ─── useNavProfile ──────────────────────────────────────────────────────────

function useNavProfile(socket, connected, isLogin) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!isLogin) { setProfile(null); return; }
    if (!socket || !connected) return;

    const onOk  = (res) => setProfile(res.data ?? null);
    const onErr = ()    => {};

    socket.emit("navigation_profile");
    socket.on("navigation_profile_success", onOk);
    socket.on("navigation_profile_error",   onErr);

    return () => {
      socket.off("navigation_profile_success", onOk);
      socket.off("navigation_profile_error",   onErr);
    };
  }, [socket, connected, isLogin]);

  return profile;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const NOTIF_LIMIT = 5;

// ─── Stats config (single source of truth) ──────────────────────────────────

const OVERVIEW_STATS = [
  { label: "Active Donors",          key: "totalDonor" },
  { label: "Blood Request",          key: "totalRequest" },
  { label: "Requested Donor Found",  key: "totalRequestedDonorFind" },
  { label: "Total User",             key: "totalUser" },
];

// ─── StatsBanner sub-component ───────────────────────────────────────────────

function StatsBanner({ overView, overViewLoading, overViewError, overViewSuccess, T }) {
  // Loading skeleton
  if (overViewLoading) {
    return (
      <div style={{ display: "flex", gap: 20 }}>
        {OVERVIEW_STATS.map(({ label }) => (
          <span key={label} style={{ color: T.statMut, display: "flex", alignItems: "center", gap: 4 }}>
            {label}:{" "}
            <span style={{
              display: "inline-block",
              width: 30, height: 10, borderRadius: 4,
              background: "linear-gradient(90deg,rgba(255,255,255,.1) 25%,rgba(255,255,255,.25) 50%,rgba(255,255,255,.1) 75%)",
              backgroundSize: "200% 100%",
              animation: "nb-shimmer 1.2s infinite",
            }} />
          </span>
        ))}
      </div>
    );
  }

  // Error state
  if (overViewError) {
    return (
      <span style={{
        color: "#FF1744", fontSize: ".62rem", fontWeight: 600,
        display: "flex", alignItems: "center", gap: 4,
      }}>
        ⚠ Stats unavailable
        <button
          onClick={() => window.location.reload()}
          style={{
            fontSize: ".58rem", color: "#FF8A80", background: "none",
            border: "1px solid rgba(255,23,68,.35)", borderRadius: 4,
            padding: "1px 6px", cursor: "pointer",
          }}
        >
          Retry
        </button>
      </span>
    );
  }

  // Success
  if (overViewSuccess) {
    return (
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        {OVERVIEW_STATS.map(({ label, key }) => (
          <span key={label} style={{ color: T.statMut }}>
            {label}:{" "}
            <strong style={{ color: T.statVal }}>
              {overView?.data?.[key]?.display ?? "—"}
            </strong>
          </span>
        ))}
      </div>
    );
  }

  return null;
}

// ─── Navbar ─────────────────────────────────────────────────────────────────

export default function Navbar() {
  const { socket, connected } = useSocketContext();
  const navigate  = useNavigate();
  const location  = useLocation();
  const isLogin   = isLoginDonor();

  // UI state
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [dark,        setDark]        = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled,    setScrolled]    = useState(false);
  const [isMobile,    setIsMobile]    = useState(window.innerWidth < 768);

  // Notification pagination & local state
  const [notifPage,   setNotifPage]   = useState(1);
  const [localNotifs, setLocalNotifs] = useState([]);

  // Profile from socket
  const profile    = useNavProfile(socket, connected, isLogin);
  const activeLink = NAV_LINKS.find(l => l.route === location.pathname)?.name ?? "Home";
const isOnline  = useInternetStatus();

  const {
  data,
  isLoading,
  isSuccess,
  isError,
} = useFindMyAllNotificationQuery(undefined, {
  skip:  !isLogin,
});

console.log(isLogin)


  const {
    data:          overView,
    isLoading:     overViewLoading,
    isSuccess:     overViewSuccess,
    error:         overViewError,
  } = useFindByTotalOverViewQuery(undefined ,{
    skip: !isOnline,
  });

  // Track mobile breakpoint
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn, { passive: true });
    return () => window.removeEventListener("resize", fn);
  }, []);

  // Sync API data → local state
  useEffect(() => {
    if (isSuccess && data?.data?.result) {
      setLocalNotifs(data.data.result);
      setNotifPage(1);
    }
  }, [isSuccess, data]);

  // Derived notification values
  const unreadCount  = localNotifs.filter(n => n.status === "unread").length;
  const totalNotifs  = localNotifs.length;
  const totalPages   = Math.max(1, Math.ceil(totalNotifs / NOTIF_LIMIT));
  const pagedNotifs  = localNotifs.slice(
    (notifPage - 1) * NOTIF_LIMIT,
    notifPage * NOTIF_LIMIT,
  );

  // Notification actions
  const markAllRead = useCallback((e) => {
    e?.stopPropagation();
    setLocalNotifs(prev => prev.map(n => ({ ...n, status: "read" })));
  }, []);

  const markOneRead = useCallback((id) => {
    setLocalNotifs(prev =>
      prev.map(n => n._id === id ? { ...n, status: "read" } : n)
    );
  }, []);

  const goPage = useCallback((e, pg) => {
    e.stopPropagation();
    if (pg < 1 || pg > totalPages) return;
    setNotifPage(pg);
  }, [totalPages]);

  // Theme tokens
  const T = dark ? {
    nav:       "linear-gradient(135deg,rgba(107,0,0,.97),rgba(192,22,44,.97),rgba(86,0,0,.97))",
    drop:      "#1A0508",
    dropBord:  "rgba(212,168,83,.25)",
    mob:       "linear-gradient(180deg,#8B0000,#1A0508)",
    text:      "rgba(255,228,232,.85)",
    muted:     "rgba(255,228,232,.55)",
    icon:      "rgba(255,228,232,.75)",
    hover:     "rgba(255,255,255,.09)",
    brand:     "#fff",
    name:      "#fff",
    tog:       { bg: "rgba(255,255,255,.12)", bord: "rgba(255,255,255,.2)", txt: "rgba(255,228,232,.85)" },
    sec:       "rgba(255,255,255,.07)",
    statVal:   "#D4A853",
    statMut:   "rgba(255,228,232,.55)",
    unreadBg:  "rgba(255,255,255,.04)",
    accentTxt: "#FF8A80",
    accentBord:"#C0162C",
  } : {
    nav:       "linear-gradient(135deg,rgba(255,245,245,.98),#fff,rgba(255,240,242,.98))",
    drop:      "#fff",
    dropBord:  "rgba(192,22,44,.15)",
    mob:       "linear-gradient(180deg,#FFF0F2,#fff)",
    text:      "rgba(70,5,15,.85)",
    muted:     "rgba(70,5,15,.5)",
    icon:      "rgba(139,0,0,.75)",
    hover:     "rgba(192,22,44,.07)",
    brand:     "#8B0000",
    name:      "#5A0A14",
    tog:       { bg: "rgba(192,22,44,.07)", bord: "rgba(192,22,44,.18)", txt: "rgba(70,5,15,.8)" },
    sec:       "rgba(192,22,44,.07)",
    statVal:   "#C0162C",
    statMut:   "rgba(70,5,15,.5)",
    unreadBg:  "rgba(192,22,44,.03)",
    accentTxt: "#C0162C",
    accentBord:"#C0162C",
  };

  // Scroll detection
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMenuOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  // Outside click (desktop only — mobile uses backdrop)
  const nRef = useRef(null);
  const pRef = useRef(null);
  const close = useCallback(() => {
    setNotifOpen(false);
    setProfileOpen(false);
  }, []);
  useOutsideClick([nRef, pRef], close);

  // Handlers
  const signOut = useCallback(() => {
    removeFromLocalStorage(import.meta.env.VITE_TOKEN_NAME);
    navigate("/login", { replace: true });
  }, [navigate]);

  const toggleNotif = (e) => {
    e.stopPropagation();
    setNotifOpen(v => !v);
    setProfileOpen(false);
  };

  const toggleProfile = (e) => {
    e.stopPropagation();
    setProfileOpen(v => !v);
    setNotifOpen(false);
  };

  // Derived display values
  const displayName = isLogin ? (profile?.name || "Donor") : "Guest";
  const displayRole = isLogin ? (profile?.role || "Donor") : "Visitor";
  const shortName   = displayName.split(" ")[0];

  // Hamburger icon
  const Ham = ({ open }) => {
    const bar = (t, o = 1) => ({
      display: "block", width: 20, height: 2,
      background: T.icon, borderRadius: 2,
      transition: "all .28s", transform: t, opacity: o,
    });
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
        <span style={bar(open ? "rotate(45deg) translate(0,6px)"   : "none")} />
        <span style={bar("none", open ? 0 : 1)} />
        <span style={bar(open ? "rotate(-45deg) translate(0,-6px)" : "none")} />
      </div>
    );
  };

  // Shared page-button style
  const pgBtn = (active, disabled) => ({
    width: 24, height: 24, borderRadius: 6,
    border: `1px solid ${active ? T.accentBord : T.dropBord}`,
    background: active ? (dark ? "rgba(192,22,44,.35)" : "rgba(192,22,44,.1)") : "none",
    cursor: disabled ? "not-allowed" : "pointer",
    color: active ? T.accentTxt : (disabled ? T.muted : T.text),
    fontWeight: active ? 700 : 400,
    fontSize: 11,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
    transition: "all .15s",
  });

  // ─── Shared notification dropdown content ─────────────────────────────────
  const NotifContent = ({ onClose }) => (
    <>
      {/* Header */}
      <div style={{
        padding: "12px 16px",
        borderBottom: `1px solid ${T.sec}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ color: T.name, fontWeight: 600, fontSize: ".85rem" }}>
            Notifications
          </span>
          {unreadCount > 0 && (
            <span style={{
              minWidth: 18, height: 18, borderRadius: 9,
              background: "#FF1744", color: "#fff",
              fontSize: 10, fontWeight: 700,
              display: "inline-flex", alignItems: "center",
              justifyContent: "center", padding: "0 4px",
            }}>
              {unreadCount}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              style={{
                fontSize: 10, color: "#D4A853", cursor: "pointer",
                border: "none", background: "none", padding: 0,
              }}
            >
              Mark all read
            </button>
          )}
          {isMobile && (
            <button
              onClick={onClose}
              style={{
                fontSize: 16, color: T.muted, cursor: "pointer",
                border: "none", background: "none", padding: "0 2px",
                lineHeight: 1,
              }}
              aria-label="Close notifications"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {isLoading && (
        <div style={{ padding: 24, textAlign: "center", fontSize: ".78rem", color: T.muted }}>
          Loading…
        </div>
      )}

      {isError && (
        <div style={{ padding: 16, textAlign: "center", fontSize: ".78rem", color: "#FF1744" }}>
          Failed to load notifications.
        </div>
      )}

      {isSuccess && pagedNotifs.length === 0 && (
        <div style={{ padding: 28, textAlign: "center", fontSize: ".78rem", color: T.muted }}>
          No notifications
        </div>
      )}

      {isSuccess && pagedNotifs?.map((n) => (
        <div
          key={n._id}
          onClick={() => markOneRead(n._id)}
          style={{
            padding: "11px 16px",
            borderBottom: `1px solid ${T.sec}`,
            display: "flex", gap: 10, cursor: "pointer", alignItems: "flex-start",
            background: n.status === "unread" ? T.unreadBg : "transparent",
            transition: "background .15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = T.hover}
          onMouseLeave={e => {
            e.currentTarget.style.background =
              n.status === "unread" ? T.unreadBg : "transparent";
          }}
        >
          <span style={{
            width: 7, height: 7, borderRadius: "50%",
            flexShrink: 0, marginTop: 5,
            background: n.status === "unread" ? "#FF1744" : "#4ade80",
          }} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: ".78rem",
              fontWeight: n.status === "unread" ? 600 : 400,
              color: T.name, lineHeight: 1.35, marginBottom: 2,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {n.title}
            </p>

            <p style={{
              fontSize: ".72rem", color: T.text,
              lineHeight: 1.4, marginBottom: 4,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}>
              {n.content}
            </p>

            <span style={{ fontSize: ".65rem", color: T.muted, flexShrink: 0 }}>
              {timeAgo(n.createdAt)}
            </span>
          </div>
        </div>
      ))}

      {isSuccess && totalPages > 1 && (
        <div style={{
          padding: "8px 14px",
          borderTop: `1px solid ${T.sec}`,
          display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 8,
        }}>
          <span style={{ fontSize: 10, color: T.muted, flexShrink: 0 }}>
            Page {notifPage} of {totalPages} · {totalNotifs} total
          </span>

          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button
              disabled={notifPage <= 1}
              onClick={(e) => goPage(e, notifPage - 1)}
              style={pgBtn(false, notifPage <= 1)}
              aria-label="Previous page"
            >
              ‹
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
              <button
                key={pg}
                onClick={(e) => goPage(e, pg)}
                style={pgBtn(pg === notifPage, false)}
                aria-label={`Page ${pg}`}
                aria-current={pg === notifPage ? "page" : undefined}
              >
                {pg}
              </button>
            ))}

            <button
              disabled={notifPage >= totalPages}
              onClick={(e) => goPage(e, notifPage + 1)}
              style={pgBtn(false, notifPage >= totalPages)}
              aria-label="Next page"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      <style>{`
        ${CSS}
        @keyframes nb-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        /* Responsive overrides */
        @media (max-width: 480px) {
          .nb-tog { display: none !important; }
        }
        @media (max-width: 360px) {
          .nb-toglabel { display: none !important; }
        }
      `}</style>

      {/* ── Mobile notification modal ── */}
      {notifOpen && isMobile && (
        <div
          onClick={() => setNotifOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 16px",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: "min(360px, 100%)",
              maxHeight: "80vh",
              overflowY: "auto",
              borderRadius: 18,
              background: T.drop,
              border: `1px solid ${T.dropBord}`,
              boxShadow: "0 24px 64px rgba(0,0,0,.45)",
            }}
          >
            <NotifContent onClose={() => setNotifOpen(false)} />
          </div>
        </div>
      )}

      <nav className="nb" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: T.nav, backdropFilter: "blur(18px)",
        borderBottom: `1px solid ${T.dropBord}`,
        boxShadow: scrolled
          ? `0 6px 30px rgba(139,0,0,${dark ? ".5" : ".15"})`
          : `0 2px 16px rgba(139,0,0,${dark ? ".3" : ".08"})`,
        transition: "box-shadow .35s",
      }}>

        {/* ── Stats bar (desktop only) ── */}
        <div className="nb-desktop" style={{
          borderBottom: `1px solid ${T.sec}`, padding: "5px 24px",
          justifyContent: "space-between", alignItems: "center",
          fontSize: ".62rem",
        }}>
          {/* Stats — loading / error / success handled inside StatsBanner */}
          <StatsBanner
            overView={overView}
            overViewLoading={overViewLoading}
            overViewError={overViewError}
            overViewSuccess={overViewSuccess}
            T={T}
          />

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4, color: T.statMut }}>
              <span className="pd" style={{ width: 6, height: 6, background: connected ? "#4ade80" : "#ef4444" }} />
              {connected ? "System Live" : "Reconnecting…"}
            </span>
            <span style={{ color: T.statMut }}>📞 16345</span>
          </div>
        </div>

        {/* ── Main row ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 16px", gap: 8,
        }}>

          {/* Brand */}
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11,
              background: "rgba(192,22,44,.12)", border: "1px solid rgba(192,22,44,.25)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            }}>🩸</div>
            <div>
              <div style={{ fontFamily: "'Playfair Display',serif", color: T.brand, fontWeight: 900, fontSize: "1.2rem", lineHeight: 1 }}>
                RaktoDaan
              </div>
              <div style={{ fontSize: 9, color: T.muted, letterSpacing: ".1em", textTransform: "uppercase", marginTop: 2 }}>
                <span style={{ animation: "hb 1.5s ease-in-out infinite", display: "inline-block" }}>❤️</span>
                {" "}Blood Charity
              </div>
            </div>
          </Link>

          {/* Desktop nav links */}
          <nav className="nb-desktop" style={{ alignItems: "center", gap: 2 }}>
            {NAV_LINKS.map(l => (
              <button key={l.name}
                className={`nb-link${activeLink === l.name ? " active" : ""}`}
                onClick={() => navigate(l.route)}
                style={{ color: activeLink === l.name ? T.brand : T.text }}
              >
                <span style={{ fontSize: 11 }}>{l.icon}</span>{l.name}
              </button>
            ))}
          </nav>

          {/* Right controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>

            {/* Theme toggle */}
            <button className="nb-tog" onClick={() => setDark(v => !v)} style={{
              background: T.tog.bg, border: `1px solid ${T.tog.bord}`, color: T.tog.txt,
            }}>
              <div style={{
                width: 30, height: 16, borderRadius: 8, position: "relative",
                background: dark ? "rgba(212,168,83,.45)" : "rgba(192,22,44,.25)", flexShrink: 0,
              }}>
                <div style={{
                  position: "absolute", top: 2, left: dark ? 14 : 2,
                  width: 12, height: 12, borderRadius: "50%", background: "#fff",
                  transition: "left .28s", boxShadow: "0 1px 3px rgba(0,0,0,.3)",
                }} />
              </div>
              <span className="nb-toglabel" style={{ fontSize: ".68rem" }}>
                {dark ? "🌙 Dark" : "☀️ Light"}
              </span>
            </button>

            {/* ── Notification bell ── */}
            <div ref={nRef} style={{ position: "relative" }}>
              <button className="nb-icon" onClick={toggleNotif}
                style={{ color: T.icon, position: "relative" }}
                aria-label="Notifications"
              >
                <svg width={18} height={18} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>

                {isLogin && unreadCount > 0 && (
                  <span style={{
                    position: "absolute", top: 1, right: 1,
                    minWidth: 14, height: 14, borderRadius: 7,
                    background: "#FF1744", color: "#fff", fontSize: 8,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, padding: "0 3px", lineHeight: 1,
                  }}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Desktop notification dropdown */}
              {notifOpen && !isMobile && (
                <div className="nb-drop" style={{
                  width: "min(320px,92vw)", padding: 0,
                  background: T.drop, border: `1px solid ${T.dropBord}`,
                }}>
                  <NotifContent onClose={() => setNotifOpen(false)} />
                </div>
              )}
            </div>

            {/* ── Profile ── */}
            <div ref={pRef} style={{ position: "relative" }}>
              <button onClick={toggleProfile} style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "none", border: "none", cursor: "pointer",
                borderRadius: 12, padding: "5px 7px",
              }}>
                <Avatar
                  picture={profile?.picture}
                  name={displayName}
                  bloodGroup={profile?.blood_group}
                  size={32}
                />

                {/* Single label — no duplicate */}
                <div style={{ textAlign: "left", display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: ".75rem", fontWeight: 700, color: T.name, lineHeight: 1.2 }}>
                    {shortName}
                  </span>
                  <span style={{ fontSize: ".65rem", color: T.muted, marginTop: 1, lineHeight: 1.2 }}>
                    {displayRole}
                  </span>
                </div>

                <svg className="nb-desktop" width={11} height={11} fill="none" stroke={T.muted} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Profile dropdown */}
              {profileOpen && (
                <div className="nb-drop" style={{
                  width: 210, background: T.drop, border: `1px solid ${T.dropBord}`,
                }}>
                  <div style={{
                    padding: "12px 16px 10px",
                    borderBottom: `1px solid ${T.sec}`,
                    display: "flex", gap: 10, alignItems: "center",
                  }}>
                    <Avatar
                      picture={profile?.picture}
                      name={displayName}
                      bloodGroup={profile?.blood_group}
                      size={38}
                    />
                    <div>
                      <div style={{ color: T.name, fontWeight: 700, fontSize: ".82rem" }}>{displayName}</div>
                      <div style={{ color: T.muted, fontSize: ".68rem", marginTop: 1 }}>{displayRole}</div>
                    </div>
                  </div>

                  {isLogin && PROFILE_LINKS.map(({ icon, label, route }) => (
                    <Link key={label} to={route} className="nb-drop-item"
                      style={{ color: T.text, background: T.drop }}
                      onMouseEnter={e => e.currentTarget.style.background = T.hover}
                      onMouseLeave={e => e.currentTarget.style.background = T.drop}
                    >
                      {icon} {label}
                    </Link>
                  ))}

                  {isLogin ? (
                    <button className="nb-drop-item" onClick={signOut}
                      style={{ color: "#fff", background: "linear-gradient(135deg,#C0162C,#8B0000)", justifyContent: "center" }}>
                      🚪 Sign Out
                    </button>
                  ) : (
                    <Link to="/login" className="nb-drop-item"
                      style={{ color: "#fff", background: "linear-gradient(135deg,#22c55e,#059669)", justifyContent: "center", textDecoration: "none" }}>
                      🔑 Sign In
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Hamburger */}
            <button
              className="nb-ham nb-icon"
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Toggle menu"
              style={{ color: T.icon }}
            >
              <Ham open={menuOpen} />
            </button>
          </div>
        </div>

        {/* ── Mobile drawer ── */}
        {menuOpen && (
          <div className="nb-mobile" style={{
            background: T.mob, borderTop: `1px solid ${T.sec}`,
            maxHeight: "calc(100vh - 68px)", overflowY: "auto",
          }}>

            {/* Profile summary */}
            <div style={{
              padding: "14px 16px 12px",
              display: "flex", alignItems: "center", gap: 12,
              borderBottom: `1px solid ${T.sec}`,
            }}>
              <Avatar
                picture={profile?.picture}
                name={displayName}
                bloodGroup={profile?.blood_group}
                size={44}
              />
              <div>
                <div style={{ color: T.name, fontWeight: 700, fontSize: ".9rem" }}>{displayName}</div>
                <div style={{ color: T.muted, fontSize: ".72rem", marginTop: 2 }}>
                  {displayRole}{profile?.blood_group ? ` · ${profile.blood_group}` : ""}
                </div>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
                <span className="pd" style={{ width: 7, height: 7, background: connected ? "#4ade80" : "#ef4444" }} />
                <span style={{ fontSize: 10, color: T.muted }}>{connected ? "Live" : "Offline"}</span>
              </div>
            </div>

            {/* Mobile stats summary (loading / error / success) */}
            <div style={{
              padding: "10px 16px",
              borderBottom: `1px solid ${T.sec}`,
              fontSize: ".68rem",
            }}>
              {overViewLoading && (
                <span style={{ color: T.statMut, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    display: "inline-block", width: 60, height: 8, borderRadius: 4,
                    background: "linear-gradient(90deg,rgba(192,22,44,.1) 25%,rgba(192,22,44,.25) 50%,rgba(192,22,44,.1) 75%)",
                    backgroundSize: "200% 100%",
                    animation: "nb-shimmer 1.2s infinite",
                  }} />
                  Loading stats…
                </span>
              )}
              {overViewError && (
                <span style={{ color: "#FF1744", fontWeight: 600 }}>⚠ Stats unavailable</span>
              )}
              {overViewSuccess && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px" }}>
                  {OVERVIEW_STATS.map(({ label, key }) => (
                    <span key={key} style={{ color: T.statMut }}>
                      {label}: <strong style={{ color: T.statVal }}>{overView?.data?.[key]?.display ?? "—"}</strong>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Nav links */}
            <div style={{ padding: "10px 12px", borderBottom: `1px solid ${T.sec}` }}>
              {NAV_LINKS.map(l => (
                <button key={l.name} className="nb-mob-btn"
                  onClick={() => { navigate(l.route); setMenuOpen(false); }}
                  style={{
                    color: activeLink === l.name ? T.brand : T.text,
                    background: activeLink === l.name ? T.hover : "none",
                  }}
                >
                  <span>{l.icon}</span>{l.name}
                </button>
              ))}
            </div>

            {/* Account section */}
            <div style={{ padding: "8px 12px", borderBottom: `1px solid ${T.sec}` }}>
              <p style={{
                fontSize: 9, color: T.muted,
                textTransform: "uppercase", letterSpacing: ".12em",
                padding: "6px 4px",
              }}>
                Account
              </p>
              {isLogin
                ? PROFILE_LINKS.map(({ icon, label, route }) => (
                    <Link key={label} to={route} className="nb-mob-btn"
                      onClick={() => setMenuOpen(false)}
                      style={{ color: T.text, textDecoration: "none", display: "flex" }}
                      onMouseEnter={e => e.currentTarget.style.background = T.hover}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                      {icon} {label}
                    </Link>
                  ))
                : (
                  <Link to="/login" onClick={() => setMenuOpen(false)} style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "9px 18px", borderRadius: 10, textDecoration: "none",
                    background: "linear-gradient(135deg,#22c55e,#059669)",
                    color: "#fff", fontSize: ".85rem", fontWeight: 600,
                    margin: "4px 0",
                  }}>
                    🔑 Sign In
                  </Link>
                )
              }
            </div>

            {/* CTA + sign out */}
            <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="nb-donate" style={{ flex: 1, justifyContent: "center" }}>
                  <span style={{ animation: "hb 1.5s ease-in-out infinite", display: "inline-block" }}>❤️</span>
                  Donate Blood
                </button>
                <button className="nb-sos" style={{ flex: 1, justifyContent: "center" }}>
                  <span className="pd" style={{ width: 7, height: 7, background: "#fff" }} />
                  Emergency SOS
                </button>
              </div>
              {isLogin && (
                <button onClick={signOut} style={{
                  width: "100%", padding: 10, borderRadius: 10,
                  border: "none", cursor: "pointer",
                  background: "linear-gradient(135deg,#C0162C,#8B0000)",
                  color: "#fff", fontSize: ".85rem", fontWeight: 600,
                  fontFamily: "'DM Sans',sans-serif",
                }}>
                  🚪 Sign Out
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      <br /><br /><br />
    </>
  );
}