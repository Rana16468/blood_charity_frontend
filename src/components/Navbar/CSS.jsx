

export const CSS = `
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

export const AVATAR_COLORS = [
  "#C0162C","#1565C0","#2E7D32","#6A1B9A",
  "#E65100","#00695C","#AD1457","#0277BD",
];

export const NAV_LINKS = [
  { name: "Home",         route: "/",             icon: "🏠" },
  { name: "Donate Blood", route: "/donate_blood", icon: "🩸" },
//   { name: "Community",    route: "/community",    icon: "🤝" },
  { name: "About",        route: "/about",        icon: "ℹ️"  },
];

export const PROFILE_LINKS = [
  { icon: "👤", label: "My Profile",       route: "/my_profile"      },
  { icon: "📋", label: "Donation History", route: "/donation_history" },
  { icon: "📍", label: "My Location",      route: "/my_location"     },
//   { icon: "⚙️", label: "Settings",         route: "/settings"        },
];

export const NOTIFICATIONS = [
  { msg: "Urgent: O- needed in Dhaka Medical", time: "2m ago",  urgent: true  },
  { msg: "New donor registered near you",       time: "10m ago", urgent: false },
  { msg: "Blood camp tomorrow at Mirpur-10",    time: "1h ago",  urgent: false },
];

