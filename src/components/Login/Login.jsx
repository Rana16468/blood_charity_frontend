import { useState, useEffect } from "react";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import {
  User,
  Shield,
  CheckCircle,
  Monitor,
  Globe,
  LogOut,
  Heart,
  Droplets,
} from "lucide-react";
import DeviceDetector from "device-detector-js";
import { useNavigate } from "react-router-dom";
import PostAction from "../CommonAction/PostAction";
import { setLocalStorage } from "../../utils/LocalStore/LocalStore";
import useInternetStatus from "../../hooks/useInternetStatus";
import { useFindByTotalOverViewQuery } from "../redux/api/BloodDonorApi/BloodDonorApi";

// Inject keyframes once
const styleTag = document.createElement("style");
styleTag.innerHTML = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.6; }
  }
`;
document.head.appendChild(styleTag);

/* ─────────────────────────────────────────
   STAT CONFIG  (single source of truth)
───────────────────────────────────────── */
const STATS = [
  { key: "totalDonor",              label: "Donors" },
  { key: "totalRequest",            label: "Blood Request" },
  { key: "totalRequestedDonorFind", label: "Donor Find" },
  { key: "totalUser",               label: "Total Users" },
];

/* ─────────────────────────────────────────
   STATS BAR SUB-COMPONENT
───────────────────────────────────────── */
const StatsBar = ({ data, isLoading, isError }) => {
  if (isLoading) {
    return (
      <div style={styles.statsBar}>
        {STATS.map(({ label }, i) => (
          <div key={label} style={{ display: "contents" }}>
            <div style={styles.stat}>
              <span style={styles.statNumSkeleton} />
              <span style={styles.statLabel}>{label}</span>
            </div>
            {i < STATS.length - 1 && <div style={styles.statDivider} />}
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div style={styles.statsBarError}>
        <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600 }}>
          ⚠ Stats temporarily unavailable
        </span>
      </div>
    );
  }

  return (
    <div style={styles.statsBar}>
      {STATS.map(({ key, label }, i) => (
        <div key={label} style={{ display: "contents" }}>
          <div style={styles.stat}>
            <span style={styles.statNum}>{data?.data?.[key]?.display ?? "—"}</span>
            <span style={styles.statLabel}>{label}</span>
          </div>
          {i < STATS.length - 1 && <div style={styles.statDivider} />}
        </div>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────
   MAIN LOGIN COMPONENT
───────────────────────────────────────── */
const Login = () => {
  const [user,       setUser]       = useState(null);
  const [isLoading,  setIsLoading]  = useState(false);
  const [authLoading,setAuthLoading]= useState(false);
  const [error,      setError]      = useState(null);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [ipInfo,     setIpInfo]     = useState(null);
  const [ipLoading,  setIpLoading]  = useState(false);

  const navigate  = useNavigate();
  const isOnline  = useInternetStatus();

  const {
    data,
    isLoading: overviewLoading,
    error:     overViewError,
  } = useFindByTotalOverViewQuery();

  /* ── Device detection + IP fetch on mount ── */
  useEffect(() => {
    const detector = new DeviceDetector();
    const device   = detector.parse(navigator.userAgent);
    setDeviceInfo({
      device: device.device,
      os:     device.os,
      client: device.client,
      bot:    device.bot,
    });
    fetchIP();
  }, []);

  const fetchIP = async () => {
    setIpLoading(true);
    try {
      const res = await fetch(import.meta.env.VITE_IP_INFO_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setIpInfo({ ip: json?.ip });
    } catch (err) {
      console.error("IP fetch error:", err);
      setIpInfo({ error: err.message });
    } finally {
      setIpLoading(false);
      setAuthLoading(false);
    }
  };

  /* ── Google OAuth success ── */
  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    try {
      const token      = credentialResponse.credential;
      const base64Url  = token.split(".")[1];
      const base64     = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const userInfo = JSON.parse(jsonPayload);
      setUser(userInfo);

      const loginData = {
        name:        userInfo?.name        || "Unknown",
        email:       userInfo?.email       || "Unknown",
        picture:     userInfo?.picture     || "N/A",
        isVerify:    userInfo?.email_verified ?? false,
        ipaddress:   ipInfo?.ip || ipInfo?.error || "N/A",
        engine:      deviceInfo?.client?.engine || "N/A",
        browsername: `${deviceInfo?.client?.name || "Unknown"} ${deviceInfo?.client?.type || ""} ${deviceInfo?.client?.version || ""}`.trim(),
        device:      deviceInfo?.device?.type || deviceInfo?.device?.brand || "N/A",
        os:          deviceInfo?.os?.name  || "Unknown",
        platform:    `${deviceInfo?.os?.platform || deviceInfo?.os?.name || ""} ${deviceInfo?.os?.version || ""}`.trim(),
      };

      if (isOnline) {
        PostAction(loginData, `${import.meta.env.VITE_SOCKET_URL}/api/v1/user/social_media_auth`)
          .then((res) => setLocalStorage(import.meta.env.VITE_TOKEN_NAME, res.data.accessToken))
          .catch(console.error);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError({ message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setIsLoading(false);
  };

  const handleLogout = () => {
    setUser(null);
    navigate("/");
  };

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  /* ── Guard: missing client ID ── */
  if (!googleClientId) {
    return (
      <div style={styles.errorPage}>
        <div style={styles.errorCard}>
          <Shield size={48} color="#dc2626" />
          <h1 style={styles.errorTitle}>Configuration Error</h1>
          <p style={styles.errorText}>
            Google Client ID is not configured. Please check your environment variables.
          </p>
        </div>
      </div>
    );
  }

  /* ── Auth loading state ── */
  if (authLoading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.spinner} />
        <p style={{ color: "#dc2626", marginTop: 12, fontWeight: 600 }}>Loading…</p>
      </div>
    );
  }

  /* ── Auth error state ── */
  if (error) {
    return (
      <div style={styles.errorPage}>
        <div style={styles.errorCard}>
          <Shield size={48} color="#dc2626" />
          <h1 style={styles.errorTitle}>Authentication Error</h1>
          <p style={styles.errorText}>
            {error?.data?.message || error?.message || "An error occurred during authentication"}
          </p>
          <button onClick={() => window.location.reload()} style={styles.retryBtn}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>

      {/* ══════════════════════════════════
          SUCCESS SCREEN
      ══════════════════════════════════ */}
      {user ? (
        <div style={styles.page}>
          <div style={{ ...styles.successCard, animation: "fadeIn 0.4s ease" }}>

            {/* Header */}
            <div style={styles.successHeader}>
              <div style={styles.logoRow}>
                <Droplets size={28} color="#fff" />
                <span style={styles.brandName}>RaktoDaan</span>
              </div>
              <div style={styles.successBadge}>
                <CheckCircle size={16} color="#fff" />
                <span>Logged In</span>
              </div>
            </div>

            <div style={styles.successBody}>
              {/* Profile Row */}
              <div style={styles.profileRow}>
                <img src={user.picture} alt="Profile" style={styles.avatar} />
                <div>
                  <h2 style={styles.userName}>{user.name}</h2>
                  <p style={styles.userEmail}>{user.email}</p>
                  {user.email_verified && (
                    <span style={styles.verifiedBadge}>
                      <CheckCircle size={11} color="#16a34a" /> Verified
                    </span>
                  )}
                </div>
              </div>

              {/* Info Grid */}
              <div style={styles.infoGrid}>
                <div style={styles.infoSection}>
                  <h3 style={styles.sectionTitle}>
                    <User size={15} color="#dc2626" /> User Details
                  </h3>
                  {[
                    ["First Name",     user.given_name  || "N/A"],
                    ["Last Name",      user.family_name || "N/A"],
                    ["Email Verified", user.email_verified ? "Yes ✓" : "No ✗"],
                  ].map(([label, value]) => (
                    <div key={label} style={styles.infoItem}>
                      <span style={styles.label}>{label}</span>
                      <span style={{
                        ...styles.value,
                        color: label === "Email Verified"
                          ? (user.email_verified ? "#16a34a" : "#dc2626")
                          : "#374151",
                      }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={styles.infoSection}>
                  <h3 style={styles.sectionTitle}>
                    <Monitor size={15} color="#dc2626" /> Session Info
                  </h3>
                  {deviceInfo && [
                    ["Device",  deviceInfo.device?.type  || "Desktop"],
                    ["OS",     `${deviceInfo.os?.name || ""} ${deviceInfo.os?.version || ""}`.trim()],
                    ["Browser",`${deviceInfo.client?.name || ""} ${deviceInfo.client?.version || ""}`.trim()],
                  ].map(([label, value]) => (
                    <div key={label} style={styles.infoItem}>
                      <span style={styles.label}>{label}</span>
                      <span style={styles.value}>{value}</span>
                    </div>
                  ))}
                  <div style={styles.infoItem}>
                    <span style={styles.label}>IP Address</span>
                    <span style={styles.value}>
                      {ipLoading ? "Loading…" : ipInfo?.error ? "Unavailable" : ipInfo?.ip || "N/A"}
                    </span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.label}>Login Time</span>
                    <span style={styles.value}>{new Date().toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <button onClick={handleLogout} style={styles.logoutBtn}>
                <LogOut size={16} /> Continue
              </button>
            </div>
          </div>
        </div>

      ) : (
      /* ══════════════════════════════════
          LOGIN SCREEN
      ══════════════════════════════════ */
        <div style={styles.page}>
          <div style={styles.dropLeft} />
          <div style={styles.dropRight} />

          <div style={{ ...styles.loginCard, animation: "fadeIn 0.45s ease" }}>

            {/* Brand Header */}
            <div style={styles.brandHeader}>
              <div style={styles.heartIcon}>
                <Heart size={32} color="#fff" fill="#fff" />
              </div>
              <h1 style={styles.brandTitle}>RaktoDaan</h1>
              <p style={styles.brandTagline}>রক্তদান • Blood Charity</p>
              <p style={styles.brandSub}>Every drop counts. Sign in to save lives.</p>
            </div>

            {/* ── Stats Bar (handles loading / error / success) ── */}
            <StatsBar
              data={data}
              isLoading={overviewLoading}
              isError={!!overViewError}
            />

            {/* Device Chips */}
            {deviceInfo && (
              <div style={styles.chipsRow}>
                <div style={styles.deviceChip}>
                  <Monitor size={13} color="#dc2626" />
                  <span>{deviceInfo.os?.name} • {deviceInfo.client?.name}</span>
                </div>
                {ipInfo && !ipInfo.error && (
                  <div style={styles.deviceChip}>
                    <Globe size={13} color="#dc2626" />
                    <span>IP: {ipInfo.ip}</span>
                  </div>
                )}
              </div>
            )}

            {/* Divider */}
            <div style={styles.divider}>
              <div style={styles.dividerLine} />
              <span style={styles.dividerText}>Sign in with Google</span>
              <div style={styles.dividerLine} />
            </div>

            {/* Google Login Button */}
            <div style={styles.googleWrapper}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                size="large"
                text="signin_with"
                shape="pill"
                theme="outline"
                width="300"
              />
            </div>

            <p style={styles.footerText}>
              New donor?{" "}
              <a href="#" style={styles.footerLink}>Register to donate blood →</a>
            </p>
            <p style={styles.footerMicro}>
              By signing in, you agree to our Terms &amp; Privacy Policy
            </p>
          </div>

          {/* Full-screen loading overlay */}
          {isLoading && (
            <div style={styles.overlay}>
              <div style={styles.overlayCard}>
                <Droplets size={32} color="#dc2626" style={{ marginBottom: 12 }} />
                <div style={styles.spinner} />
                <p style={{ color: "#dc2626", fontWeight: 600, marginTop: 12 }}>
                  Signing you in…
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </GoogleOAuthProvider>
  );
};

/* ─────────────────────────────────────────
   STYLES
───────────────────────────────────────── */
const styles = {
  /* Layout */
  page: {
    minHeight: "100vh",
    background: "linear-gradient(145deg, #fff5f5 0%, #fff 50%, #fef2f2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    boxSizing: "border-box",
  },

  /* Blood-drop decorations */
  dropLeft: {
    position: "absolute",
    top: -80, left: -60,
    width: "min(260px, 40vw)",
    height: "min(320px, 50vw)",
    borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
    background: "radial-gradient(circle at 60% 40%, #fca5a5, #dc2626)",
    opacity: 0.12,
    transform: "rotate(-20deg)",
    pointerEvents: "none",
  },
  dropRight: {
    position: "absolute",
    bottom: -100, right: -80,
    width: "min(300px, 45vw)",
    height: "min(380px, 58vw)",
    borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
    background: "radial-gradient(circle at 60% 40%, #fca5a5, #b91c1c)",
    opacity: 0.10,
    transform: "rotate(15deg)",
    pointerEvents: "none",
  },

  /* Login Card */
  loginCard: {
    position: "relative",
    background: "#fff",
    borderRadius: 24,
    boxShadow: "0 20px 60px rgba(220,38,38,0.12), 0 4px 20px rgba(0,0,0,0.06)",
    width: "100%",
    maxWidth: 420,
    overflow: "hidden",
    border: "1px solid #fee2e2",
  },

  /* Brand Header */
  brandHeader: {
    background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 60%, #991b1b 100%)",
    padding: "clamp(24px, 5vw, 36px) clamp(20px, 6vw, 32px) clamp(20px, 4vw, 28px)",
    textAlign: "center",
  },
  heartIcon: {
    width: 60, height: 60,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 12px",
    border: "2px solid rgba(255,255,255,0.3)",
  },
  brandTitle: {
    fontSize: "clamp(22px, 6vw, 30px)",
    fontWeight: 800,
    color: "#fff",
    margin: "0 0 4px",
    letterSpacing: "-0.5px",
  },
  brandTagline: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    margin: "0 0 8px",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  brandSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    margin: 0,
  },

  /* Stats Bar */
  statsBar: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#fff7f7",
    borderBottom: "1px solid #fee2e2",
    padding: "12px clamp(12px, 4vw, 32px)",
    flexWrap: "nowrap",
    gap: 0,
  },
  statsBarError: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#fff7f7",
    borderBottom: "1px solid #fee2e2",
    padding: "14px 32px",
    minHeight: 60,
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  statNum: {
    fontSize: "clamp(14px, 4vw, 18px)",
    fontWeight: 800,
    color: "#dc2626",
    lineHeight: 1,
  },
  statNumSkeleton: {
    display: "inline-block",
    width: 36, height: 18,
    borderRadius: 6,
    background: "linear-gradient(90deg, #fee2e2 25%, #fecaca 50%, #fee2e2 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.2s infinite",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: "clamp(9px, 2.5vw, 11px)",
    color: "#9ca3af",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "100%",
    padding: "0 2px",
  },
  statDivider: {
    width: 1, height: 32,
    background: "#fee2e2",
    flexShrink: 0,
  },

  /* Chips */
  chipsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    margin: "16px 16px 0",
  },
  deviceChip: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flex: "1 1 auto",
    padding: "8px 12px",
    background: "#fff5f5",
    borderRadius: 8,
    fontSize: 12,
    color: "#6b7280",
    border: "1px solid #fee2e2",
  },

  /* Divider */
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "24px 16px 0",
  },
  dividerLine:  { flex: 1, height: 1, background: "#fee2e2" },
  dividerText:  { fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" },

  /* Google Button */
  googleWrapper: {
    display: "flex",
    justifyContent: "center",
    marginTop: 20,
    padding: "0 16px",
  },

  /* Footer */
  footerText: {
    textAlign: "center",
    fontSize: 13,
    color: "#6b7280",
    marginTop: 20,
    padding: "0 16px",
  },
  footerLink:  { color: "#dc2626", fontWeight: 600, textDecoration: "none" },
  footerMicro: {
    textAlign: "center",
    fontSize: 11,
    color: "#d1d5db",
    marginTop: 10,
    padding: "0 16px 0",
  },

  /* Overlay */
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(4px)",
    zIndex: 50,
  },
  overlayCard: {
    background: "#fff",
    borderRadius: 20,
    padding: "32px 40px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  },
  spinner: {
    width: 36, height: 36,
    border: "3px solid #fee2e2",
    borderTop: "3px solid #dc2626",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },

  /* ── SUCCESS SCREEN ── */
  successCard: {
    background: "#fff",
    borderRadius: 24,
    boxShadow: "0 20px 60px rgba(220,38,38,0.12), 0 4px 20px rgba(0,0,0,0.06)",
    width: "100%",
    maxWidth: 600,
    overflow: "hidden",
    border: "1px solid #fee2e2",
  },
  successHeader: {
    background: "linear-gradient(135deg, #dc2626, #991b1b)",
    padding: "20px 28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  logoRow: { display: "flex", alignItems: "center", gap: 8 },
  brandName: { color: "#fff", fontWeight: 800, fontSize: 20 },
  successBadge: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    padding: "4px 12px",
    fontSize: 13,
    color: "#fff",
    fontWeight: 600,
  },
  successBody: { padding: "clamp(16px, 4vw, 28px)" },
  profileRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "16px 20px",
    background: "#fff5f5",
    borderRadius: 14,
    marginBottom: 24,
    border: "1px solid #fee2e2",
    flexWrap: "wrap",
  },
  avatar: {
    width: 56, height: 56,
    borderRadius: "50%",
    border: "3px solid #dc2626",
    flexShrink: 0,
  },
  userName:  { fontSize: 18, fontWeight: 700, color: "#111", margin: "0 0 2px" },
  userEmail: { fontSize: 13, color: "#6b7280", margin: "0 0 4px" },
  verifiedBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 11,
    color: "#16a34a",
    background: "#f0fdf4",
    borderRadius: 20,
    padding: "2px 8px",
    fontWeight: 600,
    border: "1px solid #bbf7d0",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
    marginBottom: 24,
  },
  infoSection: {
    background: "#fafafa",
    borderRadius: 12,
    padding: 16,
    border: "1px solid #f3f4f6",
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    fontWeight: 700,
    color: "#dc2626",
    margin: "0 0 12px",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "5px 0",
    borderBottom: "1px solid #f3f4f6",
  },
  label: { fontSize: 12, color: "#9ca3af" },
  value: {
    fontSize: 12,
    fontWeight: 600,
    color: "#374151",
    maxWidth: "55%",
    textAlign: "right",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  logoutBtn: {
    width: "100%",
    padding: "12px",
    background: "linear-gradient(135deg, #dc2626, #b91c1c)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    letterSpacing: 0.3,
  },

  /* Error & Loading pages */
  loadingPage: {
    minHeight: "100vh",
    background: "#fff5f5",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  errorPage: {
    minHeight: "100vh",
    background: "#fff5f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorCard: {
    background: "#fff",
    borderRadius: 20,
    padding: "40px 32px",
    maxWidth: 400,
    textAlign: "center",
    boxShadow: "0 8px 30px rgba(220,38,38,0.1)",
    border: "1px solid #fee2e2",
  },
  errorTitle: { fontSize: 20, fontWeight: 700, color: "#111", margin: "16px 0 8px" },
  errorText:  { fontSize: 14, color: "#6b7280", marginBottom: 20, lineHeight: 1.6 },
  retryBtn: {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 24px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
};

export default Login;