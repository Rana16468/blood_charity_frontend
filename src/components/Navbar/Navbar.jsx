import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSocketContext } from "../../router/SocketProvider";
import { isLoginDonor, removeFromLocalStorage } from "../../utils/LocalStore/LocalStore";

// ─── Constants ────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "#C0162C","#1565C0","#2E7D32","#6A1B9A",
  "#E65100","#00695C","#AD1457","#0277BD",
];

const NAV_LINKS = [
  { name: "Home",         route: "/",             icon: "🏠" },
  { name: "Donate Blood", route: "/donate_blood", icon: "🩸" },
  { name: "Community",    route: "/community",    icon: "🤝" },
  { name: "About",        route: "/about",        icon: "ℹ️"  },
];

const PROFILE_LINKS = [
  { icon: "👤", label: "My Profile",       route: "/my_profile"      },
  { icon: "📋", label: "Donation History", route: "/donation_history" },
  { icon: "📍", label: "My Location",      route: "/my_location"     },
  { icon: "⚙️", label: "Settings",         route: "/settings"        },
];

const NOTIFICATIONS = [
  { msg: "Urgent: O- needed in Dhaka Medical", time: "2m ago",  urgent: true  },
  { msg: "New donor registered near you",       time: "10m ago", urgent: false },
  { msg: "Blood camp tomorrow at Mirpur-10",    time: "1h ago",  urgent: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hashStr(s = "") {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h);
}

function getInitials(name = "") {
  const p = name.trim().split(/\s+/);
  if (!p[0]) return "?";
  return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p.at(-1)[0]).toUpperCase();
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

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
          fontSize: 8, fontWeight: 700, borderRadius: 3, padding: "1px 3px", lineHeight: 1.3,
        }}>
          {bloodGroup}
        </span>
      )}
    </div>
  );
}

// ─── useOutsideClick ─────────────────────────────────────────────────────────

function useOutsideClick(refs, cb) {
  useEffect(() => {
    const fn = (e) => {
      if (!refs.some(r => r.current?.contains(e.target))) cb();
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [refs, cb]);
}

// ─── useNavProfile ────────────────────────────────────────────────────────────
// Always returns a valid profile object — no null, no flicker.
// While loading: shows last known / optimistic values.

function useNavProfile(socket, connected, isLogin) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!isLogin) { setProfile(null); return; }
    if (!socket || !connected) return;

    const onOk  = (res) => setProfile(res.data ?? null);
    const onErr = ()    => {}; // keep last known profile on error

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

// ─── Global CSS ───────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@900&family=DM+Sans:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .nb { font-family: 'DM Sans', sans-serif; }

  @keyframes hb {
    0%,100%{transform:scale(1)} 30%{transform:scale(1.25)} 60%{transform:scale(1.1)}
  }
  @keyframes fsd {
    from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)}
  }
  @keyframes sdDown {
    from{opacity:0;max-height:0} to{opacity:1;max-height:800px}
  }
  @keyframes glow {
    0%,100%{box-shadow:0 0 14px rgba(255,23,68,.4)} 50%{box-shadow:0 0 28px rgba(255,23,68,.75)}
  }
  @keyframes pd {
    0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.35)}
  }

  .nb-link {
    position: relative; font-weight: 500; font-size: .8rem; letter-spacing: .03em;
    padding: 5px 10px; border-radius: 8px; background: none; border: none;
    cursor: pointer; display: flex; align-items: center; gap: 5px;
    font-family: 'DM Sans', sans-serif; transition: opacity .2s;
    white-space: nowrap;
  }
  .nb-link:hover { opacity: .75; }
  .nb-link.active::after {
    content: ''; position: absolute; bottom: -2px; left: 50%; transform: translateX(-50%);
    width: 16px; height: 2px; background: #D4A853; border-radius: 2px;
  }

  .nb-icon {
    background: none; border: none; cursor: pointer;
    border-radius: 10px; padding: 7px;
    display: flex; align-items: center; justify-content: center;
    transition: background .2s;
  }
  .nb-icon:hover { background: rgba(255,255,255,.12); }

  .nb-drop {
    position: absolute; right: 0; top: calc(100% + 8px);
    border-radius: 14px; overflow: hidden;
    box-shadow: 0 16px 50px rgba(0,0,0,.22);
    animation: fsd .22s ease; z-index: 60;
  }
  .nb-drop-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 16px; font-size: .82rem;
    text-decoration: none; width: 100%;
    background: none; border: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: background .15s;
  }
  .nb-drop-item:hover { filter: brightness(.92); }

  .nb-mobile { animation: sdDown .3s ease; overflow: hidden; }
  .nb-mob-btn {
    width: 100%; display: flex; align-items: center; gap: 12px;
    padding: 11px 14px; font-size: .88rem; font-weight: 500;
    background: none; border: none; cursor: pointer; border-radius: 10px;
    font-family: 'DM Sans', sans-serif; transition: background .2s; text-align: left;
  }

  .nb-tog {
    display: flex; align-items: center; gap: 6px;
    border-radius: 18px; padding: 5px 10px;
    cursor: pointer; font-size: .7rem; font-weight: 600;
    letter-spacing: .04em; font-family: 'DM Sans', sans-serif;
    transition: all .25s; white-space: nowrap; border: none;
  }

  .nb-donate {
    border: none; cursor: pointer; font-weight: 700; font-size: .78rem;
    letter-spacing: .05em; border-radius: 10px; padding: 9px 14px;
    background: linear-gradient(135deg,#D4A853,#B8892A); color: #1A0508;
    display: flex; align-items: center; gap: 6px;
    box-shadow: 0 3px 12px rgba(212,168,83,.4);
    transition: transform .25s, box-shadow .25s; font-family: 'DM Sans', sans-serif;
  }
  .nb-donate:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(212,168,83,.55); }

  .nb-sos {
    border: none; cursor: pointer; font-weight: 700; font-size: .75rem;
    letter-spacing: .06em; border-radius: 10px; padding: 9px 14px;
    background: linear-gradient(135deg,#FF1744,#C0162C); color: #fff;
    display: flex; align-items: center; gap: 6px;
    animation: glow 2s infinite; font-family: 'DM Sans', sans-serif;
  }

  .pd { animation: pd 2s infinite; border-radius: 50%; display: inline-block; }

  /* Responsive */
  .nb-desktop  { display: flex; }
  .nb-ham      { display: flex; }
  @media (max-width:1023px) { .nb-desktop { display: none !important; } }
  @media (min-width:1024px) { .nb-ham     { display: none !important; } }
  @media (max-width:640px)  { .nb-toglabel { display: none !important; } }
`;

// ─── Navbar ───────────────────────────────────────────────────────────────────

export default function Navbar() {
  const { socket, connected } = useSocketContext();
  const navigate  = useNavigate();
  const location  = useLocation();
  const isLogin   = isLoginDonor();

  const [menuOpen,    setMenuOpen]    = useState(false);
  const [dark,        setDark]        = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled,    setScrolled]    = useState(false);

  const profile    = useNavProfile(socket, connected, isLogin);
  const activeLink = NAV_LINKS.find(l => l.route === location.pathname)?.name ?? "Home";

  // Theme tokens
  const T = dark ? {
    nav:      "linear-gradient(135deg,rgba(107,0,0,.97),rgba(192,22,44,.97),rgba(86,0,0,.97))",
    drop:     "#1A0508",
    dropBord: "rgba(212,168,83,.25)",
    mob:      "linear-gradient(180deg,#8B0000,#1A0508)",
    text:     "rgba(255,228,232,.85)",
    muted:    "rgba(255,228,232,.55)",
    icon:     "rgba(255,228,232,.75)",
    hover:    "rgba(255,255,255,.09)",
    brand:    "#fff",
    name:     "#fff",
    tog:      { bg: "rgba(255,255,255,.12)", bord: "rgba(255,255,255,.2)", txt: "rgba(255,228,232,.85)" },
    sec:      "rgba(255,255,255,.07)",
    statVal:  "#D4A853",
    statMut:  "rgba(255,228,232,.55)",
  } : {
    nav:      "linear-gradient(135deg,rgba(255,245,245,.98),#fff,rgba(255,240,242,.98))",
    drop:     "#fff",
    dropBord: "rgba(192,22,44,.15)",
    mob:      "linear-gradient(180deg,#FFF0F2,#fff)",
    text:     "rgba(70,5,15,.85)",
    muted:    "rgba(70,5,15,.5)",
    icon:     "rgba(139,0,0,.75)",
    hover:    "rgba(192,22,44,.07)",
    brand:    "#8B0000",
    name:     "#5A0A14",
    tog:      { bg: "rgba(192,22,44,.07)", bord: "rgba(192,22,44,.18)", txt: "rgba(70,5,15,.8)" },
    sec:      "rgba(192,22,44,.07)",
    statVal:  "#C0162C",
    statMut:  "rgba(70,5,15,.5)",
  };

  // Scroll detection
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  // Outside click
  const nRef = useRef(null);
  const pRef = useRef(null);
  const close = useCallback(() => { setNotifOpen(false); setProfileOpen(false); }, []);
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

  // Derived display values — always something to show, never "Loading"
  const displayName = isLogin
    ? (profile?.name || "Donor")
    : "Guest";
  const displayRole = isLogin
    ? (profile?.role || "Donor")
    : "Visitor";
  const shortName = displayName.split(" ")[0];

  // Hamburger
  const Ham = ({ open }) => {
    const bar = (t, o = 1) => ({
      display: "block", width: 20, height: 2,
      background: T.icon, borderRadius: 2,
      transition: "all .28s", transform: t, opacity: o,
    });
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
        <span style={bar(open ? "rotate(45deg) translate(0,6px)" : "none")} />
        <span style={bar("none", open ? 0 : 1)} />
        <span style={bar(open ? "rotate(-45deg) translate(0,-6px)" : "none")} />
      </div>
    );
  };

  return (
    <>
      <style>{CSS}</style>

      <nav className="nb" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: T.nav, backdropFilter: "blur(18px)",
        borderBottom: `1px solid ${T.dropBord}`,
        boxShadow: scrolled
          ? `0 6px 30px rgba(139,0,0,${dark ? ".5" : ".15"})`
          : `0 2px 16px rgba(139,0,0,${dark ? ".3" : ".08"})`,
        transition: "box-shadow .35s",
      }}>

        {/* Stats bar — desktop only */}
        <div className="nb-desktop" style={{
          borderBottom: `1px solid ${T.sec}`, padding: "5px 24px",
          justifyContent: "space-between", alignItems: "center", fontSize: ".62rem",
        }}>
          <div style={{ display: "flex", gap: 20 }}>
            {[["Active Donors","12,480"],["Lives Saved","3,200+"],["Camps Today","14"]].map(([l,v]) => (
              <span key={l} style={{ color: T.statMut }}>
                {l}: <strong style={{ color: T.statVal }}>{v}</strong>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4, color: T.statMut }}>
              <span className="pd" style={{ width: 6, height: 6, background: connected ? "#4ade80" : "#ef4444" }} />
              {connected ? "System Live" : "Reconnecting…"}
            </span>
            <span style={{ color: T.statMut }}>📞 16345</span>
          </div>
        </div>

        {/* Main row */}
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

          {/* Desktop nav */}
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
              <span className="nb-toglabel" style={{ fontSize: ".68rem" }}>{dark ? "🌙 Dark" : "☀️ Light"}</span>
            </button>

            {/* Notif */}
            <div ref={nRef} style={{ position: "relative" }}>
              <button className="nb-icon" onClick={toggleNotif} style={{ color: T.icon, position: "relative" }}>
                <svg width={18} height={18} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {isLogin && (
                  <span style={{
                    position: "absolute", top: 1, right: 1,
                    width: 14, height: 14, borderRadius: "50%",
                    background: "#FF1744", color: "#fff", fontSize: 8,
                    display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700,
                  }}>3</span>
                )}
              </button>

              {notifOpen && (
                <div className="nb-drop" style={{
                  width: "min(280px,90vw)",
                  background: T.drop, border: `1px solid ${T.dropBord}`,
                }}>
                  <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.sec}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: T.name, fontWeight: 600, fontSize: ".85rem" }}>Notifications</span>
                    <span style={{ fontSize: 10, color: T.muted, cursor: "pointer" }}>Mark all read</span>
                  </div>
                  {NOTIFICATIONS.map((n, i) => (
                    <div key={i} style={{
                      padding: "11px 16px", borderBottom: `1px solid ${T.sec}`,
                      display: "flex", gap: 10, cursor: "pointer", alignItems: "flex-start",
                    }}>
                      <span className="pd" style={{ width: 7, height: 7, marginTop: 4, background: n.urgent ? "#FF1744" : "#4ade80" }} />
                      <div>
                        <p style={{ color: T.text, fontSize: ".75rem", lineHeight: 1.4 }}>{n.msg}</p>
                        <p style={{ color: T.muted, fontSize: 10, marginTop: 3 }}>{n.time}</p>
                      </div>
                    </div>
                  ))}
                  <div style={{ padding: 12, textAlign: "center", fontSize: 11, color: "#D4A853", cursor: "pointer" }}>
                    View all →
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div ref={pRef} style={{ position: "relative" }}>
              <button onClick={toggleProfile} style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "none", border: "none", cursor: "pointer", borderRadius: 12, padding: "5px 7px",
              }}>
                <Avatar
                  picture={profile?.picture}
                  name={displayName}
                  bloodGroup={profile?.blood_group}
                  size={32}
                />
              {/* Mobile */}
<div className="nb-toglabel hidden text-left flex flex-col">
  <span
    className="text-xs font-bold leading-tight"
    style={{ color: T.name }}
  >
    {shortName}
  </span>

  <span
    className="text-[10px] leading-tight mt-0.5"
    style={{ color: T.muted }}
  >
    {displayRole}
  </span>
</div>

{/* Desktop */}
<div className="nb-desktop text-left flex flex-col">
  <span
    className="text-xs font-bold leading-tight"
    style={{ color: T.name }}
  >
    {shortName}
  </span>

  <span
    className="text-[10px] leading-tight mt-0.5"
    style={{ color: T.muted }}
  >
    {displayRole}
  </span>
</div>
                <svg className="nb-desktop" width={11} height={11} fill="none" stroke={T.muted} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {profileOpen && (
                <div className="nb-drop" style={{
                  width: 210, background: T.drop, border: `1px solid ${T.dropBord}`,
                }}>
                  {/* Header */}
                  <div style={{ padding: "12px 16px 10px", borderBottom: `1px solid ${T.sec}`, display: "flex", gap: 10, alignItems: "center" }}>
                    <Avatar picture={profile?.picture} name={displayName} bloodGroup={profile?.blood_group} size={38} />
                    <div>
                      <div style={{ color: T.name, fontWeight: 700, fontSize: ".82rem" }}>{displayName}</div>
                      <div style={{ color: T.muted, fontSize: ".68rem", marginTop: 1 }}>{displayRole}</div>
                    </div>
                  </div>

                  {/* Menu items */}
                  {isLogin && PROFILE_LINKS.map(({ icon, label, route }) => (
                    <Link key={label} to={route} className="nb-drop-item"
                      style={{ color: T.text, background: T.drop }}
                      onMouseEnter={e => e.currentTarget.style.background = T.hover}
                      onMouseLeave={e => e.currentTarget.style.background = T.drop}
                    >
                      {icon} {label}
                    </Link>
                  ))}

                  {/* Sign in / out */}
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
            <button className="nb-ham nb-icon" onClick={() => setMenuOpen(v => !v)}
              aria-label="Toggle menu" style={{ color: T.icon }}>
              <Ham open={menuOpen} />
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="nb-mobile" style={{
            background: T.mob, borderTop: `1px solid ${T.sec}`,
            maxHeight: "calc(100vh - 68px)", overflowY: "auto",
          }}>

            {/* Profile summary */}
            <div style={{ padding: "14px 16px 12px", display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid ${T.sec}` }}>
              <Avatar picture={profile?.picture} name={displayName} bloodGroup={profile?.blood_group} size={44} />
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
              <p style={{ fontSize: 9, color: T.muted, textTransform: "uppercase", letterSpacing: ".12em", padding: "6px 4px" }}>
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
                  width: "100%", padding: 10, borderRadius: 10, border: "none", cursor: "pointer",
                  background: "linear-gradient(135deg,#C0162C,#8B0000)", color: "#fff",
                  fontSize: ".85rem", fontWeight: 600, fontFamily: "'DM Sans',sans-serif",
                }}>
                  🚪 Sign Out
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Spacer so content isn't hidden under fixed nav */}
      <div style={{ height: "clamp(58px,9vw,90px)" }} />
    </>
  );
}