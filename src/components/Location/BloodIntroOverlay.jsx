import { useEffect, useRef } from "react";

const SESSION_KEY = "bc_reloaded";

export function shouldShowIntro() {
  return !sessionStorage.getItem(SESSION_KEY);
}

export default function BloodIntroOverlay({ onDone }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;

    const handleEnd = (e) => {
      if (e.animationName !== "bc-fadeOut") return;

      sessionStorage.setItem(SESSION_KEY, "1");

      onDone?.(); /* শুধু parent কে জানাও — reload নেই */
    };

    el.addEventListener("animationend", handleEnd);
    return () => el.removeEventListener("animationend", handleEnd);
  }, [onDone]);

  return (
    <>
      <style>{`
        @keyframes bc-dropIn {
          from { transform: translateY(-48px) scale(0.45); opacity: 0; }
          to   { transform: translateY(0)     scale(1);    opacity: 1; }
        }
        @keyframes bc-ring {
          from { transform: scale(0.55); opacity: 0.9; }
          to   { transform: scale(1.55); opacity: 0; }
        }
        @keyframes bc-fadeUp {
          from { transform: translateY(12px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes bc-barGrow {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes bc-fadeOut {
          from { opacity: 1;  pointer-events: auto; }
          to   { opacity: 0;  pointer-events: none; }
        }

        .bc-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: #130808;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          animation: bc-fadeOut 0.55s ease 2.9s forwards;
        }

        .bc-drop-wrap {
          position: relative;
          width: 88px;
          height: 88px;
          animation: bc-dropIn 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both;
        }
        .bc-ring {
          position: absolute;
          inset: -18px;
          border-radius: 50%;
          border: 2px solid rgba(192, 57, 43, 0.45);
          animation: bc-ring 1.3s ease-out 0.8s both;
        }

        .bc-title {
          margin-top: 24px;
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: 0.01em;
          font-family: 'Crimson Pro', Georgia, serif;
          animation: bc-fadeUp 0.5s ease 0.75s both;
        }
        .bc-subtitle {
          margin-top: 6px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.38);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-family: 'Crimson Pro', Georgia, serif;
          animation: bc-fadeUp 0.5s ease 0.95s both;
        }

        .bc-bar-track {
          margin-top: 36px;
          width: 150px;
          height: 3px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 99px;
          overflow: hidden;
          animation: bc-fadeUp 0.4s ease 1.05s both;
        }
        .bc-bar-fill {
          height: 100%;
          width: 0;
          background: #c0392b;
          border-radius: 99px;
          animation: bc-barGrow 1.7s cubic-bezier(0.4, 0, 0.2, 1) 1.15s forwards;
        }

        .bc-tagline {
          margin-top: 18px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.28);
          font-family: 'Crimson Pro', Georgia, serif;
          letter-spacing: 0.04em;
          animation: bc-fadeUp 0.5s ease 1.3s both;
        }
      `}</style>

      <div className="bc-overlay" ref={overlayRef}>

        <div className="bc-drop-wrap">
          <div className="bc-ring" />
          <svg
            viewBox="0 0 88 88"
            width="88"
            height="88"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M44 10 C44 10 20 36 20 52 C20 65.25 31 74 44 74 C57 74 68 65.25 68 52 C68 36 44 10 44 10Z"
              fill="#c0392b"
            />
            <path
              d="M33 55 C33 48 38 44 44 44"
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M39 34 L39 26 M35 30 L43 30"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="bc-title">রক্তদান</div>
        <div className="bc-subtitle">Blood Charity · Bangladesh</div>

        <div className="bc-bar-track">
          <div className="bc-bar-fill" />
        </div>

        <div className="bc-tagline">একটি রক্তদান, একটি জীবন বাঁচায়</div>
      </div>
    </>
  );
}