function StopIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

export default StopIcon

export const TABS = [
    { id: "find",     icon: "🩸", label: "Donate Blood" },
    { id: "requests", icon: "🚨", label: "Requests"    },
    { id: "register", icon: "✚",  label: "Be a Donor"  },
    { id: "map",      icon: "📍", label: "Find Donar " },
    { id: "debug",    icon: "🖥",  label: "Console"     },
  ];

  export const style=<style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: #c9a0a0; }
        input:focus, select:focus { border-color: #c0392b !important; box-shadow: 0 0 0 2px rgba(192,57,43,0.12); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #f5c6c6; border-radius: 4px; }
        .donor-card:hover { background: #fff5f5 !important; border-color: #f5a0a0 !important; }
        .tab-pill:hover { background: rgba(192,57,43,0.08) !important; }
        .request-card:hover { box-shadow: 0 2px 12px rgba(192,57,43,0.10); transform: translateY(-1px); }
        .action-btn:hover { opacity: 0.85; }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes ripple { 0%{transform:scale(1);opacity:0.55} 100%{transform:scale(2.8);opacity:0} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>