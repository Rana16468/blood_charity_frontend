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

// FIX: Removed unused useDispatch import
// FIX: All state properly declared

const Login = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  // FIX: Declared missing authLoading and error states
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [ipInfo, setIpInfo] = useState(null);
  const [ipLoading, setIpLoading] = useState(false);

  const navigate=useNavigate();
  const isOnline = useInternetStatus();

  useEffect(() => {
    const deviceDetector = new DeviceDetector();
    const userAgent = navigator.userAgent;
    const device = deviceDetector.parse(userAgent);
    setDeviceInfo({
      device: device.device,
      os: device.os,
      client: device.client,
      bot: device.bot,
    });
    getIPAddress();
  }, []);

  const getIPAddress = async () => {
    setIpLoading(true);
    try {
      const response = await fetch(import.meta.env.VITE_IP_INFO_URL);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      setAuthLoading(false)
      const data = await response.json();
      setIpInfo({ ip: data?.ip });
    } catch (err) {
      console.error("Error getting IP address:", err);
      setIpInfo({ error: err.message });
    } finally {
      setIpLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    try {
      const token = credentialResponse.credential;
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const userInfo = JSON.parse(jsonPayload);
      setUser(userInfo);

      const loginData = {
        name: userInfo?.name || "Unknown",
        email: userInfo?.email || "Unknown",
        picture: userInfo?.picture || "N/A",
        isVerify: userInfo?.email_verified ?? false,
        ipaddress: ipInfo?.ip || ipInfo?.error || "N/A",
        engine: deviceInfo?.client?.engine || "N/A",
        browsername: `${deviceInfo?.client?.name || "Unknown"} ${deviceInfo?.client?.type || ""} ${deviceInfo?.client?.version || ""}`.trim(),
        device: deviceInfo?.device?.type || deviceInfo?.device?.brand || "N/A",
        os: deviceInfo?.os?.name || "Unknown",
        platform: `${deviceInfo?.os?.platform || deviceInfo?.os?.name || ""} ${deviceInfo?.os?.version || ""}`.trim(),
      };

      isOnline ? PostAction(loginData, `${import.meta.env.VITE_SOCKET_URL}/api/v1/user/social_media_auth`).then((data)=>{
         setLocalStorage(import.meta.env.VITE_TOKEN_NAME,data.data.accessToken);

       }).catch((error)=>{
           console.log(error);
       }) :"Internet Not connecteed ,please connect your Internet "
    } catch (err) {
      console.error("Error processing login:", err);
      setError({ message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.log("Login Failed");
    setIsLoading(false);
  };

  const handleLogout = () => {
    setUser(null);
    navigate("/");

  };

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  
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

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      {/* FIX: authLoading check now works since state is declared */}
      {authLoading ? (
        <div style={styles.loadingPage}>
          <div style={styles.spinner} />
          <p style={{ color: "#dc2626", marginTop: 12, fontWeight: 600 }}>Loading...</p>
        </div>
      ) : error ? (
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
      ) : user ? (
        /* ── SUCCESS SCREEN ── */
        <div style={styles.page}>
          <div style={styles.successCard}>
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
              {/* User Profile */}
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

              <div style={styles.infoGrid}>
                {/* User Info */}
                <div style={styles.infoSection}>
                  <h3 style={styles.sectionTitle}>
                    <User size={15} color="#dc2626" /> User Details
                  </h3>
                  <div style={styles.infoItem}>
                    <span style={styles.label}>First Name</span>
                    <span style={styles.value}>{user.given_name || "N/A"}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.label}>Last Name</span>
                    <span style={styles.value}>{user.family_name || "N/A"}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.label}>Email Verified</span>
                    <span style={{ ...styles.value, color: user.email_verified ? "#16a34a" : "#dc2626" }}>
                      {user.email_verified ? "Yes ✓" : "No ✗"}
                    </span>
                  </div>
                </div>

                {/* Session Info */}
                <div style={styles.infoSection}>
                  <h3 style={styles.sectionTitle}>
                    <Monitor size={15} color="#dc2626" /> Session Info
                  </h3>
                  {deviceInfo && (
                    <>
                      <div style={styles.infoItem}>
                        <span style={styles.label}>Device</span>
                        <span style={styles.value}>{deviceInfo.device?.type || "Desktop"}</span>
                      </div>
                      <div style={styles.infoItem}>
                        <span style={styles.label}>OS</span>
                        <span style={styles.value}>{deviceInfo.os?.name} {deviceInfo.os?.version}</span>
                      </div>
                      <div style={styles.infoItem}>
                        <span style={styles.label}>Browser</span>
                        <span style={styles.value}>{deviceInfo.client?.name} {deviceInfo.client?.version}</span>
                      </div>
                    </>
                  )}
                  <div style={styles.infoItem}>
                    <span style={styles.label}>IP Address</span>
                    <span style={styles.value}>
                      {ipLoading ? "Loading..." : ipInfo?.error ? "Unavailable" : ipInfo?.ip || "N/A"}
                    </span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.label}>Login Time</span>
                    <span style={styles.value}>{new Date().toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <button onClick={handleLogout} style={styles.logoutBtn}>
                <LogOut size={16} /> continue
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ── LOGIN SCREEN ── */
        <div style={styles.page}>
          {/* Blood drop decorations */}
          <div style={styles.dropLeft} />
          <div style={styles.dropRight} />

          <div style={styles.loginCard}>
            {/* Brand Header */}
            <div style={styles.brandHeader}>
              <div style={styles.heartIcon}>
                <Heart size={32} color="#fff" fill="#fff" />
              </div>
              <h1 style={styles.brandTitle}>RaktoDaan</h1>
              <p style={styles.brandTagline}>রক্তদান • Blood Charity</p>
              <p style={styles.brandSub}>Every drop counts. Sign in to save lives.</p>
            </div>

            {/* Stats Bar */}
            <div style={styles.statsBar}>
              <div style={styles.stat}>
                <span style={styles.statNum}>12K+</span>
                <span style={styles.statLabel}>Donors</span>
              </div>
              <div style={styles.statDivider} />
              <div style={styles.stat}>
                <span style={styles.statNum}>8K+</span>
                <span style={styles.statLabel}>Lives Saved</span>
              </div>
              <div style={styles.statDivider} />
              <div style={styles.stat}>
                <span style={styles.statNum}>64+</span>
                <span style={styles.statLabel}>Districts</span>
              </div>
            </div>

            {/* Device Info Preview */}
            {deviceInfo && (
              <div style={styles.deviceChip}>
                <Monitor size={13} color="#dc2626" />
                <span>{deviceInfo.os?.name} • {deviceInfo.client?.name}</span>
              </div>
            )}

            {ipInfo && !ipInfo.error && (
              <div style={styles.deviceChip}>
                <Globe size={13} color="#dc2626" />
                <span>IP: {ipInfo.ip}</span>
              </div>
            )}

            {/* Divider */}
            <div style={styles.divider}>
              <div style={styles.dividerLine} />
              <span style={styles.dividerText}>Sign in with Google</span>
              <div style={styles.dividerLine} />
            </div>

            {/* Google Login */}
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
              By signing in, you agree to our Terms & Privacy Policy
            </p>
          </div>

          {/* Fullscreen Loader */}
          {isLoading && (
            <div style={styles.overlay}>
              <div style={styles.overlayCard}>
                <Droplets size={32} color="#dc2626" style={{ marginBottom: 12 }} />
                <div style={styles.spinner} />
                <p style={{ color: "#dc2626", fontWeight: 600, marginTop: 12 }}>Signing you in...</p>
              </div>
            </div>
          )}
        </div>
      )}
    </GoogleOAuthProvider>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(145deg, #fff5f5 0%, #fff 50%, #fef2f2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'Georgia', 'Times New Roman', serif",
  },
  dropLeft: {
    position: "absolute",
    top: -80,
    left: -60,
    width: 260,
    height: 320,
    borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
    background: "radial-gradient(circle at 60% 40%, #fca5a5, #dc2626)",
    opacity: 0.12,
    transform: "rotate(-20deg)",
  },
  dropRight: {
    position: "absolute",
    bottom: -100,
    right: -80,
    width: 300,
    height: 380,
    borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
    background: "radial-gradient(circle at 60% 40%, #fca5a5, #b91c1c)",
    opacity: 0.1,
    transform: "rotate(15deg)",
  },
  loginCard: {
    position: "relative",
    background: "#fff",
    borderRadius: 24,
    boxShadow: "0 20px 60px rgba(220,38,38,0.12), 0 4px 20px rgba(0,0,0,0.06)",
    padding: "0 0 32px 0",
    width: "100%",
    maxWidth: 420,
    overflow: "hidden",
    border: "1px solid #fee2e2",
  },
  brandHeader: {
    background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 60%, #991b1b 100%)",
    padding: "36px 32px 28px",
    textAlign: "center",
    position: "relative",
  },
  heartIcon: {
    width: 60,
    height: 60,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 12px",
    border: "2px solid rgba(255,255,255,0.3)",
  },
  brandTitle: {
    fontSize: 30,
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
  statsBar: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 0,
    background: "#fff7f7",
    borderBottom: "1px solid #fee2e2",
    padding: "14px 32px",
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
  },
  statNum: {
    fontSize: 18,
    fontWeight: 800,
    color: "#dc2626",
    lineHeight: 1,
  },
  statLabel: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 32,
    background: "#fee2e2",
  },
  deviceChip: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    margin: "16px 32px 0",
    padding: "8px 12px",
    background: "#fff5f5",
    borderRadius: 8,
    fontSize: 12,
    color: "#6b7280",
    border: "1px solid #fee2e2",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "24px 32px 0",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: "#fee2e2",
  },
  dividerText: {
    fontSize: 12,
    color: "#9ca3af",
    whiteSpace: "nowrap",
  },
  googleWrapper: {
    display: "flex",
    justifyContent: "center",
    marginTop: 20,
    padding: "0 32px",
  },
  footerText: {
    textAlign: "center",
    fontSize: 13,
    color: "#6b7280",
    marginTop: 20,
    padding: "0 32px",
  },
  footerLink: {
    color: "#dc2626",
    fontWeight: 600,
    textDecoration: "none",
  },
  footerMicro: {
    textAlign: "center",
    fontSize: 11,
    color: "#d1d5db",
    marginTop: 10,
    padding: "0 32px",
  },
  overlay: {
    position: "fixed",
    inset: 0,
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
    width: 36,
    height: 36,
    border: "3px solid #fee2e2",
    borderTop: "3px solid #dc2626",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },

  // SUCCESS SCREEN
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
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  brandName: {
    color: "#fff",
    fontWeight: 800,
    fontSize: 20,
  },
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
  successBody: {
    padding: 28,
  },
  profileRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "16px 20px",
    background: "#fff5f5",
    borderRadius: 14,
    marginBottom: 24,
    border: "1px solid #fee2e2",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    border: "3px solid #dc2626",
  },
  userName: {
    fontSize: 18,
    fontWeight: 700,
    color: "#111",
    margin: "0 0 2px",
  },
  userEmail: {
    fontSize: 13,
    color: "#6b7280",
    margin: "0 0 4px",
  },
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
    gridTemplateColumns: "1fr 1fr",
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
  label: {
    fontSize: 12,
    color: "#9ca3af",
  },
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

  // ERROR & LOADING SCREENS
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
  errorTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "#111",
    margin: "16px 0 8px",
  },
  errorText: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
    lineHeight: 1.6,
  },
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

// Inject spinner keyframes
const styleTag = document.createElement("style");
styleTag.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(styleTag);

export default Login;