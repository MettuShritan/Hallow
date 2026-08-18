import { useState, useEffect, useRef, useCallback } from "react";

/* ══════════════════════════════════════
   THEME SYSTEM
══════════════════════════════════════ */
const THEMES = {
  neural:  { name: "Neural Void",   a: "#22d3ee", b: "#a78bfa", glow: "rgba(34,211,238,0.13)",  glowB: "rgba(167,139,250,0.10)" },
  red:     { name: "Red Protocol",  a: "#f87171", b: "#dc2626", glow: "rgba(248,113,113,0.15)", glowB: "rgba(220,38,38,0.10)"   },
  ghost:   { name: "Ghost Mode",    a: "#e2e8f0", b: "#94a3b8", glow: "rgba(226,232,240,0.08)", glowB: "rgba(148,163,184,0.06)" },
  quantum: { name: "Quantum",       a: "#8b5cf6", b: "#3b82f6", glow: "rgba(139,92,246,0.14)",  glowB: "rgba(59,130,246,0.10)"  },
  eclipse: { name: "Eclipse",       a: "#4ade80", b: "#ca8a04", glow: "rgba(74,222,128,0.12)",  glowB: "rgba(202,138,4,0.10)"   },
};

const BASE = {
  bg: "#000000",
  card: "rgba(255,255,255,0.035)",
  cardB: "rgba(255,255,255,0.055)",
  border: "rgba(255,255,255,0.07)",
  borderB: "rgba(255,255,255,0.13)",
  text: "#f1f5f9",
  sub: "#94a3b8",
  muted: "#475569",
  dim: "#1e293b",
  red: "#f87171",
  green: "#4ade80",
  amber: "#fbbf24",
};

/* ══════════════════════════════════════
   GLOBAL STYLES
══════════════════════════════════════ */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; width: 100%; }

  @keyframes fadeIn    { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:none } }
  @keyframes fadeOut   { from { opacity:1; transform:translateY(0) }    to { opacity:0; transform:translateY(-12px) } }
  @keyframes slideUp   { from { opacity:0; transform:translateY(26px) } to { opacity:1; transform:none } }
  @keyframes slideDown { from { opacity:0; transform:translateY(-12px) } to { opacity:1; transform:none } }
  @keyframes blink     { 0%,100% { opacity:1 } 50% { opacity:0.18 } }
  @keyframes float     { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-7px) } }
  @keyframes shimmer   { 0% { background-position:200% center } 100% { background-position:-200% center } }
  @keyframes ping      { 0% { transform:scale(1); opacity:0.7 } 100% { transform:scale(2.6); opacity:0 } }
  @keyframes shake     { 0%,100% { transform:translateX(0) } 20%,60% { transform:translateX(-7px) } 40%,80% { transform:translateX(7px) } }
  @keyframes logoReveal { 0% { opacity:0; letter-spacing:18px; filter:blur(8px) } 100% { opacity:1; letter-spacing:-2.5px; filter:blur(0) } }
  @keyframes glitch1   { 0%,100%{clip-path:inset(0 0 98% 0);transform:translate(-2px)} 25%{clip-path:inset(30% 0 50% 0);transform:translate(2px)} 50%{clip-path:inset(60% 0 20% 0);transform:translate(-1px)} 75%{clip-path:inset(80% 0 5% 0);transform:translate(1px)} }
  @keyframes glitch2   { 0%,100%{clip-path:inset(95% 0 0 0);transform:translate(2px)} 25%{clip-path:inset(50% 0 30% 0);transform:translate(-2px)} 50%{clip-path:inset(20% 0 60% 0);transform:translate(1px)} 75%{clip-path:inset(5% 0 80% 0);transform:translate(-1px)} }
  @keyframes scanlineAnim { 0% { transform:translateY(-100%) } 100% { transform:translateY(100vh) } }
  @keyframes bootLine  { from { opacity:0; transform:translateX(-8px) } to { opacity:1; transform:none } }
  @keyframes bootFade  { from { opacity:1 } to { opacity:0; pointer-events:none } }
  @keyframes shieldPop { 0% { transform:scale(0.5); opacity:0 } 60% { transform:scale(1.1) } 100% { transform:scale(1); opacity:1 } }
  @keyframes statusIn  { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:none } }
  @keyframes chatSlide { from { opacity:0; transform:translateY(28px) } to { opacity:1; transform:none } }
  @keyframes waveform  { 0%,100% { transform:scaleY(1) } 50% { transform:scaleY(1.7) } }
  @keyframes sidebarIn { from { opacity:0; transform:translateX(-18px) } to { opacity:1; transform:none } }
  @keyframes contentIn { from { opacity:0; transform:translateX(14px) } to { opacity:1; transform:none } }
  @keyframes ringPulse { 0%,100% { opacity:0.6 } 50% { opacity:0.15 } }
  @keyframes neuralPulse { 0%,100% { opacity:0.14 } 50% { opacity:0.42 } }

  .page-in  { animation: fadeIn  0.42s cubic-bezier(0.22,1,0.36,1) both }
  .page-out { animation: fadeOut 0.28s cubic-bezier(0.4,0,1,1)    both }
  .slide-up   { animation: slideUp   0.5s  cubic-bezier(0.22,1,0.36,1) both }
  .slide-down { animation: slideDown 0.35s cubic-bezier(0.22,1,0.36,1) both }
  .blink      { animation: blink 2.2s ease-in-out infinite }
  .float      { animation: float 3.6s ease-in-out infinite }
  .shake      { animation: shake 0.42s ease both }
  .sidebar-in { animation: sidebarIn 0.45s cubic-bezier(0.22,1,0.36,1) both }
  .content-in { animation: contentIn 0.45s cubic-bezier(0.22,1,0.36,1) both }
  .glitch-el::before { content:attr(data-text); position:absolute; top:0; left:0; width:100%; height:100%; color:#22d3ee; animation:glitch1 4s infinite linear; opacity:0.65; pointer-events:none }
  .glitch-el::after  { content:attr(data-text); position:absolute; top:0; left:0; width:100%; height:100%; color:#a78bfa; animation:glitch2 4s infinite linear; opacity:0.65; pointer-events:none }

  input, textarea {
    font-family: 'Inter', sans-serif;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px; padding: 12px 15px;
    color: #f1f5f9; font-size: 13.5px; width: 100%;
    transition: border-color 0.2s, box-shadow 0.2s;
    outline: none; resize: none;
  }
  input:focus, textarea:focus {
    border-color: rgba(34,211,238,0.55);
    box-shadow: 0 0 0 3px rgba(34,211,238,0.09);
  }
  input::placeholder, textarea::placeholder { color: #1e293b }
  button { font-family: 'Inter', sans-serif; cursor: pointer; border: none; transition: all 0.18s; outline: none; }
  button:hover  { opacity: 0.82; transform: translateY(-1px) }
  button:active { transform: scale(0.97) !important; opacity: 1 !important }
  ::-webkit-scrollbar { width: 3px }
  ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px }

  .app-shell    { display:flex; min-height:100vh; width:100% }
  .sidebar      { width:228px; flex-shrink:0; border-right:1px solid rgba(255,255,255,0.06); display:flex; flex-direction:column; padding:22px 15px; position:sticky; top:0; height:100vh; overflow:hidden; background:rgba(0,0,0,0.65); backdrop-filter:blur(44px); }
  .main-content { flex:1; overflow-y:auto; min-height:100vh }

  @media (max-width:768px) {
    .sidebar      { display:none }
    .main-content { width:100% }
    .desktop-only { display:none !important }
    .dash-grid    { grid-template-columns:1fr !important }
  }
  @media (min-width:769px) {
    .mobile-only  { display:none !important }
    .dash-grid    { display:grid; grid-template-columns:1fr 1fr; gap:18px }
    .dash-grid .full-w { grid-column:1/-1 }
  }
  .mobile-nav-bar {
    display:none;
  }
  @media (max-width:768px) {
    .mobile-nav-bar { display:flex; position:fixed; bottom:0; left:0; right:0; z-index:40; background:rgba(0,0,0,0.9); backdrop-filter:blur(30px); border-top:1px solid rgba(255,255,255,0.07); padding:10px 0 14px; }
  }
`;

/* ══════════════════════════════════════
   GLASS HELPER
══════════════════════════════════════ */
const glass = (extra = {}) => ({
  background: "rgba(255,255,255,0.035)",
  backdropFilter: "blur(28px)",
  WebkitBackdropFilter: "blur(28px)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 18,
  ...extra,
});

/* ══════════════════════════════════════
   BOOT SCREEN
══════════════════════════════════════ */
function BootScreen({ onDone, T }) {
  const [lines, setLines]   = useState([]);
  const [phase, setPhase]   = useState("terminal"); // "terminal" | "logo"
  const [progress, setProgress] = useState(0);

  const bootLines = [
    { text: "> Initializing Hallow Security Core...", delay: 0 },
    { text: "> Loading behavioral AI model...",        delay: 380 },
    { text: "> Calibrating biometric sensors...",      delay: 760 },
    { text: "> Establishing secure tunnel...",         delay: 1140 },
    { text: "> Verifying identity matrix...",          delay: 1520 },
    { text: "> All systems nominal.",                  delay: 1900, color: BASE.green },
    { text: "> HALLOW ONLINE ██████████ 100%",         delay: 2280, color: T.a },
  ];

  useEffect(() => {
    bootLines.forEach(({ text, delay, color }) => {
      setTimeout(() => setLines(l => [...l, { text, color }]), delay);
    });
    setTimeout(() => setPhase("logo"),    2700);
    setTimeout(() => setProgress(100),   2750);
    setTimeout(() => onDone(),            4400);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // onDone is stable (passed from root, wrapped in useCallback there)

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.012) 2px,rgba(255,255,255,0.012) 4px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg,transparent,${T.a},transparent)`, animation: "scanlineAnim 4s linear infinite", opacity: 0.35 }} />

      {phase === "terminal" ? (
        <div style={{ fontFamily: "'JetBrains Mono', monospace", padding: "40px", maxWidth: 500, width: "100%" }}>
          {lines.map((l, i) => (
            <div key={i} style={{ color: l.color || BASE.muted, fontSize: 12.5, marginBottom: 8, animation: "bootLine 0.3s ease both" }}>
              {l.text}
            </div>
          ))}
          <span style={{ color: T.a, fontSize: 12.5, fontFamily: "monospace", animation: "blink 1s infinite" }}>|</span>
        </div>
      ) : (
        <div style={{ textAlign: "center", animation: "statusIn 0.55s ease both" }}>
          <div className="float" style={{ width: 88, height: 88, borderRadius: 28, background: `rgba(34,211,238,0.08)`, border: `1px solid ${T.a}55`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px", boxShadow: `0 0 70px ${T.glow}`, animation: "shieldPop 0.5s cubic-bezier(0.22,1,0.36,1) both" }}>
            <HallowIcon T={T} size={46} />
          </div>
          <h1 data-text="hallow" className="glitch-el" style={{ fontSize: 52, fontWeight: 900, color: BASE.text, letterSpacing: "-2.5px", marginBottom: 10, position: "relative", display: "inline-block", animation: "logoReveal 0.8s cubic-bezier(0.22,1,0.36,1) both" }}>hallow</h1>
          <p style={{ color: BASE.green, fontSize: 11, fontWeight: 700, letterSpacing: "3px", marginTop: 8 }}>● SYSTEM ONLINE</p>
          <div style={{ width: 200, height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 2, margin: "28px auto 0", overflow: "hidden" }}>
            <div style={{ height: "100%", background: `linear-gradient(90deg,${T.a},${T.b})`, width: `${progress}%`, transition: "width 1.3s ease", borderRadius: 2 }} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   PARTICLE BACKGROUND
══════════════════════════════════════ */
function ParticleBackground({ themeColor }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const colorRef  = useRef(themeColor);

  useEffect(() => { colorRef.current = themeColor; }, [themeColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    let W = canvas.width  = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize);

    const COUNT = Math.min(Math.floor((W * H) / 17000), 80);
    const pts = Array.from({ length: COUNT }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.38, vy: (Math.random() - 0.5) * 0.38,
      r: Math.random() * 1.7 + 0.55, o: Math.random() * 0.45 + 0.18,
    }));

    let mouse = { x: -999, y: -999 };
    const onMove = e => { mouse.x = e.clientX; mouse.y = e.clientY; };
    window.addEventListener("mousemove", onMove);

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const hex = colorRef.current || "#22d3ee";
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);

      pts.forEach(p => {
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 95) { p.vx += (dx / dist) * 0.27; p.vy += (dy / dist) * 0.27; }
        const sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (sp > 1.4) { p.vx = (p.vx / sp) * 1.4; p.vy = (p.vy / sp) * 1.4; }
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      });

      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 135) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${r},${g},${b},${(1 - d / 135) * 0.16})`;
            ctx.lineWidth = 0.75;
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y, pts[i].r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${pts[i].o})`;
        ctx.fill();
      }
      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.7 }} />;
}

/* ══════════════════════════════════════
   BEHAVIORAL SIGNATURE CANVAS
══════════════════════════════════════ */
function SigCanvas({ T }) {
  const ref = useRef(null);
  const animRef = useRef(null);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const render = () => {
      const W = canvas.offsetWidth * 2;
      const H = 128;
      canvas.width = W; canvas.height = H;
      ctx.clearRect(0, 0, W, H);
      const t = tRef.current;
      ctx.strokeStyle = T.a;
      ctx.lineWidth = 1.8;
      ctx.shadowBlur = 9;
      ctx.shadowColor = T.a;
      ctx.beginPath();
      for (let x = 0; x < W; x++) {
        const n = x / W;
        const y = H / 2
          + Math.sin(n * 22 + t) * H * 0.17
          + Math.sin(n * 7  + t * 0.7) * H * 0.11
          + Math.sin(n * 43 + t * 1.4) * H * 0.04
          + Math.sin(n * 3  + t * 0.38) * H * 0.09;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      tRef.current += 0.018;
      animRef.current = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animRef.current);
  }, [T]);

  return <canvas ref={ref} style={{ width: "100%", height: 64, borderRadius: 8 }} />;
}

/* ══════════════════════════════════════
   TRUST RING SVG
══════════════════════════════════════ */
function TrustRing({ T, score }) {
  const r = 36, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="trg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={T.a} />
          <stop offset="100%" stopColor={T.b} />
        </linearGradient>
      </defs>
      <circle cx="45" cy="45" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
      <circle cx="45" cy="45" r={r} fill="none" stroke="url(#trg)" strokeWidth="6"
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        transform="rotate(-90 45 45)"
        style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)", filter: `drop-shadow(0 0 8px ${T.a})` }}
      />
    </svg>
  );
}

/* ══════════════════════════════════════
   SIDEBAR
══════════════════════════════════════ */
function Sidebar({ T, page, navigate, unreadAlerts, onChatOpen, theme, setTheme }) {
  const navItems = [
    { id: "dashboard", icon: "⬡", label: "Dashboard" },
    { id: "settings",  icon: "⚙", label: "Settings"  },
  ];

  return (
    <div className="sidebar sidebar-in">
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 38, paddingLeft: 6 }}>
        <div style={{ width: 34, height: 34, borderRadius: 12, background: `${T.glow}`, border: `1px solid ${T.a}44`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 22px ${T.glow}`, transition: "all 0.5s" }}>
          <HallowIcon T={T} size={20} />
        </div>
        <span style={{ color: BASE.text, fontWeight: 900, fontSize: 19, letterSpacing: "-1px" }}>hallow</span>
      </div>

      <p style={{ color: BASE.muted, fontSize: 9, fontWeight: 700, letterSpacing: "2px", marginBottom: 9, paddingLeft: 11 }}>NAVIGATION</p>
      {navItems.map(item => (
        <button key={item.id} onClick={() => navigate(item.id)}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 11px", borderRadius: 11, background: page === item.id ? `${T.a}14` : "transparent", border: `1px solid ${page === item.id ? T.a + "38" : "transparent"}`, color: page === item.id ? T.a : BASE.muted, fontSize: 12.5, fontWeight: 600, marginBottom: 3, textAlign: "left", transition: "all 0.2s", boxShadow: page === item.id ? `0 0 18px ${T.glow}` : "none" }}>
          <span style={{ fontSize: 15 }}>{item.icon}</span>
          {item.label}
          {item.id === "dashboard" && unreadAlerts > 0 && (
            <span style={{ marginLeft: "auto", width: 17, height: 17, borderRadius: "50%", background: BASE.red, color: "#fff", fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              {unreadAlerts}
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: BASE.red, animation: "ping 1.6s ease-out infinite", opacity: 0.4 }} />
            </span>
          )}
        </button>
      ))}

      {/* AI Assistant */}
      <p style={{ color: BASE.muted, fontSize: 9, fontWeight: 700, letterSpacing: "2px", marginTop: 16, marginBottom: 9, paddingLeft: 11 }}>ASSISTANT</p>
      <button onClick={onChatOpen}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 11px", borderRadius: 11, background: "transparent", border: "1px solid transparent", color: BASE.muted, fontSize: 12.5, fontWeight: 600, textAlign: "left" }}>
        <span style={{ fontSize: 15 }}>🤖</span>
        Hallow AI
        <div className="blink" style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: BASE.green, boxShadow: `0 0 8px ${BASE.green}` }} />
      </button>

      {/* Theme pills */}
      <p style={{ color: BASE.muted, fontSize: 9, fontWeight: 700, letterSpacing: "2px", marginTop: 16, marginBottom: 9, paddingLeft: 11 }}>THEME</p>
      <div style={{ display: "flex", gap: 7, padding: "0 4px", marginBottom: 12 }}>
        {Object.entries(THEMES).map(([key, th]) => (
          <div key={key} onClick={() => setTheme(key)} title={th.name}
            style={{ flex: 1, height: 6, borderRadius: 3, cursor: "pointer", background: `linear-gradient(135deg,${th.a},${th.b})`, opacity: theme === key ? 1 : 0.3, transition: "all 0.2s", boxShadow: theme === key ? `0 0 10px ${th.glow}` : "none" }} />
        ))}
      </div>

      <div style={{ marginTop: "auto" }}>
        <div style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.18)", borderRadius: 11, padding: "9px 11px", marginBottom: 9 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="blink" style={{ width: 6, height: 6, borderRadius: "50%", background: BASE.green, boxShadow: `0 0 8px ${BASE.green}`, flexShrink: 0 }} />
            <div>
              <p style={{ color: BASE.green, fontSize: 11, fontWeight: 700 }}>Protected</p>
              <p style={{ color: BASE.muted, fontSize: 10, marginTop: 1 }}>AI monitoring active</p>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 11px", borderRadius: 11, background: "rgba(255,255,255,0.03)", border: `1px solid ${BASE.border}`, marginBottom: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${T.a}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0, color: T.a, fontWeight: 700 }}>A</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: BASE.text, fontSize: 12, fontWeight: 600 }}>Alex</p>
            <p style={{ color: BASE.muted, fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>you@example.com</p>
          </div>
        </div>
        <button onClick={() => navigate("login")}
          style={{ width: "100%", padding: "9px 11px", borderRadius: 10, background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.18)", color: BASE.red, fontSize: 12, fontWeight: 700 }}>
          Log out
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MOBILE NAV BAR  (Settings accessible on mobile)
══════════════════════════════════════ */
function MobileNavBar({ T, page, navigate, unreadAlerts, onChatOpen }) {
  const items = [
    { id: "dashboard", label: "Dashboard", icon: "⬡" },
    { id: "settings",  label: "Settings",  icon: "⚙" },
    { id: "__chat__",  label: "AI",        icon: "🤖" },
  ];
  return (
    <div className="mobile-nav-bar" style={{ justifyContent: "space-around" }}>
      {items.map(item => {
        const active = item.id !== "__chat__" && page === item.id;
        return (
          <button key={item.id}
            onClick={() => item.id === "__chat__" ? onChatOpen() : navigate(item.id)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "4px 20px", background: "transparent", position: "relative" }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: active ? T.a : BASE.muted }}>{item.label}</span>
            {item.id === "dashboard" && unreadAlerts > 0 && (
              <span style={{ position: "absolute", top: 2, right: 14, width: 14, height: 14, borderRadius: "50%", background: BASE.red, color: "#fff", fontSize: 8, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{unreadAlerts}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN APP
══════════════════════════════════════ */
export default function Hallow() {
  const [booting, setBooting]       = useState(true);
  const [page, setPage]             = useState("login");
  const [lostStep, setLostStep]     = useState(0);
  const [transitioning, setTrans]   = useState(false);
  const [showBio, setShowBio]       = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showChat, setShowChat]     = useState(false);
  const [theme, setTheme]           = useState("neural");
  const [unreadAlerts, setUnread]   = useState(2);
  const T = { ...BASE, ...THEMES[theme] };

  // Stable callback for BootScreen — avoids useEffect dep-array lint warning
  const handleBootDone = useCallback(() => setBooting(false), []);

  const navigate = (to) => {
    if (to === "login" && (page === "dashboard" || page === "settings")) {
      setShowBio(true);
      return;
    }
    setTrans(true);
    setTimeout(() => { setPage(to); setLostStep(0); setTrans(false); }, 260);
  };

  const confirmLogout = () => {
    setShowBio(false);
    setTrans(true);
    setTimeout(() => { setPage("login"); setTrans(false); }, 260);
  };

  const isAuthed = page !== "login" && page !== "signup";

  if (booting) return <BootScreen onDone={handleBootDone} T={T} />;

  return (
    <div style={{ background: BASE.bg, minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", position: "relative" }}>
      <style>{STYLES}</style>
      <ParticleBackground themeColor={T.a} />

      {/* Ambient orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-12%", left: "-6%", width: "44%", paddingBottom: "44%", borderRadius: "50%", background: `radial-gradient(circle,${T.glow} 0%,transparent 65%)`, transition: "background 0.8s" }} />
        <div style={{ position: "absolute", bottom: "-12%", right: "-6%", width: "40%", paddingBottom: "40%", borderRadius: "50%", background: `radial-gradient(circle,${T.glowB} 0%,transparent 65%)`, transition: "background 0.8s" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,0.007) 3px,rgba(255,255,255,0.007) 4px),repeating-linear-gradient(90deg,transparent,transparent 60px,rgba(255,255,255,0.004) 60px,rgba(255,255,255,0.004) 61px)" }} />
      </div>

      <div className={`app-shell ${transitioning ? "page-out" : "page-in"}`} style={{ position: "relative", zIndex: 1 }}>
        {isAuthed && (
          <Sidebar T={T} page={page} navigate={navigate} unreadAlerts={unreadAlerts}
            onChatOpen={() => setShowChat(true)} theme={theme} setTheme={setTheme} />
        )}
        <div className="main-content" style={{ paddingBottom: isAuthed ? "72px" : 0 }}>
          {page === "login"     && <LoginPage     T={T} onLogin={() => navigate("dashboard")} onSignup={() => navigate("signup")} />}
          {page === "signup"    && <SignupPage     T={T} onDone={() => navigate("dashboard")}  onBack={() => navigate("login")} />}
          {page === "dashboard" && <DashboardPage  T={T} onLost={() => { setPage("lost"); setLostStep(0); }} unreadAlerts={unreadAlerts} onClearAlerts={() => setUnread(0)} />}
          {page === "settings"  && <SettingsPage   T={T} onDeleteAccount={() => setShowDelete(true)} theme={theme} setTheme={setTheme} themes={THEMES} />}
          {page === "lost"      && <LostPage       T={T} step={lostStep} setStep={setLostStep} onBack={() => navigate("dashboard")} />}
        </div>
      </div>

      {/* Mobile nav — bottom bar gives access to Settings on small screens */}
      {isAuthed && (
        <MobileNavBar T={T} page={page} navigate={navigate} unreadAlerts={unreadAlerts} onChatOpen={() => setShowChat(true)} />
      )}

      {showChat   && <ChatPanel     T={T} onClose={() => setShowChat(false)} />}
      {showBio    && <BiometricGate T={T} onConfirm={confirmLogout} onCancel={() => setShowBio(false)} />}
      {showDelete && <DeleteConfirm T={T} onConfirm={() => { setShowDelete(false); navigate("login"); }} onCancel={() => setShowDelete(false)} />}
    </div>
  );
}

/* ══════════════════════════════════════
   LOGIN
══════════════════════════════════════ */
function LoginPage({ T, onLogin, onSignup }) {
  const [email, setEmail]   = useState("");
  const [pass, setPass]     = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent]   = useState(false);
  const [typeText, setTypeText] = useState("");
  const fullText = "Your AI guardian is watching...";

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      setTypeText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) clearInterval(id);
    }, 42);
    return () => clearInterval(id);
  }, []);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 1400);
  };
  const handleForgot = () => {
    setForgotSent(true);
    setTimeout(() => { setShowForgot(false); setForgotSent(false); setForgotEmail(""); }, 2600);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ width: "100%", maxWidth: 460 }}>
        <div style={{ textAlign: "center", marginBottom: 42 }} className="slide-up">
          <div className="float" style={{ width: 78, height: 78, borderRadius: 26, background: T.glow, border: `1px solid ${T.a}44`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: `0 0 65px ${T.glow}` }}>
            <HallowIcon T={T} size={40} />
          </div>
          <h1 data-text="hallow" className="glitch-el" style={{ fontSize: 48, fontWeight: 900, color: BASE.text, letterSpacing: "-2.5px", position: "relative", display: "inline-block", animation: "logoReveal 0.9s cubic-bezier(0.22,1,0.36,1) both" }}>hallow</h1>
          <br />
          <span style={{ color: BASE.muted, fontSize: 10, letterSpacing: "3.5px", fontWeight: 700 }}>BEHAVIORAL IDENTITY</span>
          <p style={{ color: T.a, fontSize: 12.5, marginTop: 13, fontFamily: "'JetBrains Mono', monospace", minHeight: 20 }}>
            {typeText}<span style={{ animation: "blink 1s infinite", color: T.a }}>|</span>
          </p>
        </div>

        <div style={{ ...glass({ padding: 38 }), boxShadow: `0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px ${T.a}10, inset 0 1px 0 rgba(255,255,255,0.04)` }} className="slide-up">
          <h2 style={{ color: BASE.text, fontSize: 23, fontWeight: 800, marginBottom: 5 }}>Welcome back</h2>
          <p style={{ color: BASE.muted, fontSize: 13.5, marginBottom: 30 }}>Sign in to your protected account</p>
          <Field T={T} label="EMAIL"    value={email} onChange={setEmail} placeholder="you@example.com" type="email" />
          <Field T={T} label="PASSWORD" value={pass}  onChange={setPass}  placeholder="••••••••••••"     type="password" />
          <div style={{ textAlign: "right", marginBottom: 26, marginTop: -4 }}>
            <span onClick={() => setShowForgot(true)} style={{ color: T.a, fontSize: 12.5, cursor: "pointer", fontWeight: 500 }}>Forgot password?</span>
          </div>
          <PrimaryBtn T={T} onClick={handleLogin} loading={loading}>{loading ? "Authenticating..." : "Sign in →"}</PrimaryBtn>
          <Divider />
          <GhostBtn onClick={handleLogin}><span>🔑</span> Sign in with Passkey</GhostBtn>
          <p style={{ textAlign: "center", marginTop: 22, fontSize: 13, color: BASE.muted }}>
            New here? <span onClick={onSignup} style={{ color: T.a, cursor: "pointer", fontWeight: 600 }}>Create account</span>
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 22, marginTop: 22 }} className="slide-up">
          {["🔒 End-to-end encrypted", "🧠 Behavioral AI", "🛡 Zero knowledge"].map(b => (
            <span key={b} style={{ color: BASE.muted, fontSize: 10, fontWeight: 600 }}>{b}</span>
          ))}
        </div>
      </div>

      {showForgot && (
        <Modal onClose={() => setShowForgot(false)}>
          {!forgotSent ? (
            <>
              <div style={{ fontSize: 44, marginBottom: 18, textAlign: "center" }}>🔐</div>
              <h3 style={{ color: BASE.text, fontSize: 20, fontWeight: 700, marginBottom: 7, textAlign: "center" }}>Reset password</h3>
              <p style={{ color: BASE.muted, fontSize: 13, marginBottom: 22, textAlign: "center", lineHeight: 1.65 }}>Enter your email and we'll send a secure reset link</p>
              <Field T={T} label="EMAIL" value={forgotEmail} onChange={setForgotEmail} placeholder="you@example.com" type="email" />
              <PrimaryBtn T={T} onClick={handleForgot}>Send reset link →</PrimaryBtn>
              <button onClick={() => setShowForgot(false)} style={{ width: "100%", marginTop: 9, padding: 12, borderRadius: 11, background: "transparent", border: `1px solid ${BASE.border}`, color: BASE.muted, fontSize: 13 }}>Cancel</button>
            </>
          ) : (
            <div className="slide-up" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>✉️</div>
              <h3 style={{ color: BASE.green, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Check your inbox</h3>
              <p style={{ color: BASE.muted, fontSize: 13 }}>Reset link sent to <span style={{ color: BASE.text, fontWeight: 600 }}>{forgotEmail}</span></p>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   SIGNUP
══════════════════════════════════════ */
function SignupPage({ T, onDone, onBack }) {
  const [step, setStep]       = useState(0);
  const [form, setForm]       = useState({ name: "", email: "", pass: "", phone: "", gate: "" });
  const [loading, setLoading] = useState(false);
  const [gateError, setGateError] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const strength = (() => {
    const p = form.pass;
    if (!p) return 0;
    return [p.length >= 8, /[A-Z]/.test(p), /[0-9]/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length;
  })();
  const sm = [null,
    { label: "Weak",   color: BASE.red   },
    { label: "Fair",   color: BASE.amber },
    { label: "Good",   color: T.a        },
    { label: "Strong", color: BASE.green },
  ][strength];

  const finish = () => {
    if (!form.gate) { setGateError(true); setTimeout(() => setGateError(false), 700); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); onDone(); }, 1600);
  };

  const steps = ["Account", "Contact", "Gate"];

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ width: "100%", maxWidth: 460 }}>
        <div style={{ textAlign: "center", marginBottom: 30 }} className="slide-up">
          <div style={{ width: 54, height: 54, borderRadius: 18, background: T.glow, border: `1px solid ${T.a}44`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", boxShadow: `0 0 32px ${T.glow}` }}>
            <HallowIcon T={T} size={28} />
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 900, color: BASE.text, letterSpacing: "-1.5px" }}>hallow</h1>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 22 }} className="slide-up">
          {steps.map((s, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                {i > 0 && <div style={{ flex: 1, height: 1, background: i <= step ? `${T.a}77` : BASE.border, transition: "background 0.4s" }} />}
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: i < step ? `${T.a}22` : i === step ? `${T.a}22` : "rgba(255,255,255,0.03)", border: `1.5px solid ${i <= step ? T.a + "77" : BASE.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.4s" }}>
                  {i < step
                    ? <span style={{ color: T.a, fontSize: 12, fontWeight: 700 }}>✓</span>
                    : <span style={{ color: i === step ? T.a : BASE.muted, fontSize: 10, fontWeight: 700 }}>{i + 1}</span>
                  }
                </div>
                {i < steps.length - 1 && <div style={{ flex: 1, height: 1, background: i < step ? `${T.a}77` : BASE.border, transition: "background 0.4s" }} />}
              </div>
              <span style={{ color: i === step ? T.a : BASE.muted, fontSize: 9, fontWeight: 700, letterSpacing: "1px", transition: "color 0.4s" }}>{s.toUpperCase()}</span>
            </div>
          ))}
        </div>

        <div style={{ ...glass({ padding: 38 }), boxShadow: "0 40px 100px rgba(0,0,0,0.7)" }} className="slide-up">
          {step === 0 && (
            <div className="slide-up">
              <h2 style={{ color: BASE.text, fontSize: 22, fontWeight: 800, marginBottom: 5 }}>Create your account</h2>
              <p style={{ color: BASE.muted, fontSize: 13.5, marginBottom: 26 }}>Get started with Hallow in seconds</p>
              <Field T={T} label="FULL NAME" value={form.name}  onChange={v => set("name", v)}  placeholder="Your name" />
              <Field T={T} label="EMAIL"     value={form.email} onChange={v => set("email", v)} placeholder="you@example.com" type="email" />
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", color: BASE.muted, fontSize: 9, fontWeight: 700, letterSpacing: "1.5px", marginBottom: 7 }}>PASSWORD</label>
                <input type="password" value={form.pass} onChange={e => set("pass", e.target.value)} placeholder="Min 8 characters" />
                {form.pass.length > 0 && (
                  <div style={{ marginTop: 9 }} className="slide-down">
                    <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
                      {[1, 2, 3, 4].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: i <= strength ? sm?.color : BASE.dim, transition: "background 0.3s" }} />)}
                    </div>
                    <p style={{ color: sm?.color, fontSize: 11, fontWeight: 700 }}>{sm?.label}</p>
                  </div>
                )}
              </div>
              <PrimaryBtn T={T} onClick={() => setStep(1)}>Continue →</PrimaryBtn>
              <p style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: BASE.muted }}>
                Already have an account? <span onClick={onBack} style={{ color: T.a, cursor: "pointer", fontWeight: 600 }}>Sign in</span>
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="slide-up">
              <BackBtn onClick={() => setStep(0)} />
              <h2 style={{ color: BASE.text, fontSize: 22, fontWeight: 800, marginBottom: 5 }}>Security contact</h2>
              <p style={{ color: BASE.muted, fontSize: 13.5, marginBottom: 26 }}>We'll alert you the moment someone else uses your account</p>
              <Field T={T} label="PHONE"        value={form.phone} onChange={v => set("phone", v)} placeholder="+91 98765 43210" type="tel" />
              <Field T={T} label="BACKUP EMAIL" value={form.email} onChange={v => set("email", v)} placeholder="backup@example.com" type="email" />
              <InfoBadge icon="🛡" color={T.a}>Only contacted on anomaly detection — never for marketing.</InfoBadge>
              <PrimaryBtn T={T} onClick={() => setStep(2)}>Set contact →</PrimaryBtn>
            </div>
          )}

          {step === 2 && (
            <div className={gateError ? "shake" : "slide-up"}>
              <BackBtn onClick={() => setStep(1)} />
              <h2 style={{ color: BASE.text, fontSize: 22, fontWeight: 800, marginBottom: 5 }}>Identity gate</h2>
              <p style={{ color: BASE.muted, fontSize: 13.5, marginBottom: 20 }}>How should Hallow verify you before logout or uninstall?</p>
              {gateError && <InfoBadge icon="⚠️" color={BASE.red}>Please select a verification method to continue.</InfoBadge>}
              {[
                { key: "fingerprint", icon: "👆", label: "Mobile fingerprint", sub: "Biometric from your phone", badge: "RECOMMENDED" },
                { key: "passkey",     icon: "🔑", label: "Passkey",            sub: "Hardware key or browser passkey" },
                { key: "email",       icon: "✉️", label: "Email code",         sub: "One-time code to your email" },
              ].map(opt => (
                <div key={opt.key} onClick={() => set("gate", opt.key)}
                  style={{ ...glass({ borderRadius: 13, padding: "15px 17px", marginBottom: 9 }), cursor: "pointer", borderColor: form.gate === opt.key ? T.a + "88" : BASE.border, background: form.gate === opt.key ? `${T.a}0d` : "rgba(255,255,255,0.035)", transition: "all 0.2s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                    <span style={{ fontSize: 22 }}>{opt.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <span style={{ color: BASE.text, fontSize: 13.5, fontWeight: 600 }}>{opt.label}</span>
                        {opt.badge && <span style={{ background: `${T.a}1a`, color: T.a, fontSize: 9, padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>{opt.badge}</span>}
                      </div>
                      <span style={{ color: BASE.muted, fontSize: 12 }}>{opt.sub}</span>
                    </div>
                    <div style={{ width: 19, height: 19, borderRadius: "50%", border: `2px solid ${form.gate === opt.key ? T.a : BASE.dim}`, background: form.gate === opt.key ? T.a : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", flexShrink: 0 }}>
                      {form.gate === opt.key && <span style={{ color: "#000", fontSize: 10, fontWeight: 900 }}>✓</span>}
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 10 }}>
                <PrimaryBtn T={T} onClick={finish} loading={loading}>{loading ? "Setting up Hallow..." : "Finish setup →"}</PrimaryBtn>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   DASHBOARD
══════════════════════════════════════ */
function DashboardPage({ T, onLost, unreadAlerts, onClearAlerts }) {
  const [trust, setTrust]       = useState(94.2);
  const [skelDone, setSkelDone] = useState(false);
  const [hovDev, setHovDev]     = useState(null);

  useEffect(() => {
    const s  = setTimeout(() => setSkelDone(true), 900);
    const id = setInterval(() => setTrust(v => +(Math.min(99, Math.max(86, v + (Math.random() - 0.5) * 1.2)).toFixed(1))), 3200);
    return () => { clearTimeout(s); clearInterval(id); };
  }, []);

  const alerts = [
    { type: "warn", title: "Unusual typing pattern", time: "2m ago",  detail: "Keystroke rhythm deviated 34% from baseline" },
    { type: "info", title: "New device sign-in",     time: "1h ago",  detail: "Chrome · Windows · New Delhi, IN" },
    { type: "ok",   title: "Session verified",        time: "3h ago",  detail: "Behavioral match confidence: 98.2%" },
  ];
  const devices = [
    { name: "MacBook Pro 14\"",   sub: "Hyderabad · Active now", icon: "💻", trusted: true  },
    { name: "iPhone 14 Pro",      sub: "Hyderabad · 20m ago",    icon: "📱", trusted: true  },
    { name: "Unknown Windows PC", sub: "Mumbai · 1h ago",        icon: "🖥",  trusted: false },
  ];
  const timeline = [
    { time: "16:27", label: "Anomaly flagged",   color: BASE.red   },
    { time: "13:10", label: "Identity verified",  color: BASE.green },
    { time: "09:03", label: "Session started",    color: T.a        },
    { time: "Yest.", label: "New device linked",  color: BASE.amber },
  ];

  return (
    <div style={{ padding: "30px 30px 56px", maxWidth: 1080 }} className="content-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 26, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ color: BASE.text, fontSize: 25, fontWeight: 900, letterSpacing: "-1px" }}>Dashboard</h1>
          <p style={{ color: BASE.muted, fontSize: 13, marginTop: 4 }}>Real-time behavioral identity protection</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 15px", background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.18)", borderRadius: 20 }}>
          <div className="blink" style={{ width: 6, height: 6, borderRadius: "50%", background: BASE.green }} />
          <span style={{ color: BASE.green, fontSize: 11.5, fontWeight: 700 }}>SAFE MODE</span>
        </div>
      </div>

      <div className="dash-grid" style={{ gap: 18 }}>
        {/* Trust hero */}
        <div className="full-w">
          {!skelDone ? (
            <div style={{ ...glass({ padding: 26 }), borderColor: `${T.a}22` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
                <div style={{ width: 88, height: 88, borderRadius: "50%", background: `linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)`, backgroundSize: "200% 100%", animation: "shimmer 1.4s ease infinite", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  {[["40%", 10], ["60%", 40], ["55%", 0]].map(([w, mb], i) => (
                    <div key={i} style={{ height: i === 1 ? 34 : 10, width: w, borderRadius: 5, background: "linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s ease infinite", marginBottom: mb }} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ ...glass({ padding: 26 }), background: `linear-gradient(135deg,${T.glow},${T.glowB})`, borderColor: `${T.a}28`, boxShadow: `0 0 65px ${T.glow}`, transition: "all 0.6s" }} className="slide-up">
              <div style={{ display: "flex", alignItems: "center", gap: 26, flexWrap: "wrap" }}>
                <TrustRing T={T} score={trust} />
                <div style={{ flex: 1, minWidth: 180 }}>
                  <p style={{ color: BASE.muted, fontSize: 9, fontWeight: 700, letterSpacing: "2px", marginBottom: 8 }}>TRUST SCORE</p>
                  <p style={{ fontSize: 50, fontWeight: 900, letterSpacing: "-3px", lineHeight: 1, background: `linear-gradient(135deg,${T.a},${T.b})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", transition: "background 0.6s" }}>
                    {trust.toFixed(1)}<span style={{ fontSize: 19, fontWeight: 600 }}>%</span>
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 9 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: BASE.green }} />
                    <span style={{ color: BASE.green, fontSize: 13, fontWeight: 600 }}>Strong behavioral match</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {[["KEYSTROKES", "99%", T.a], ["MOUSE", "91%", T.b], ["SCROLL", "94%", BASE.green]].map(([l, v, c]) => (
                    <div key={l} style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BASE.border}`, borderRadius: 12, padding: "12px 18px", textAlign: "center", minWidth: 85 }}>
                      <p style={{ fontSize: 20, fontWeight: 900, color: c, letterSpacing: "-0.5px" }}>{v}</p>
                      <p style={{ color: BASE.muted, fontSize: 9, marginTop: 4, fontWeight: 700, letterSpacing: "1.5px" }}>{l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Alerts */}
        <div>
          <SectionHead title="Recent Alerts" action="View all" T={T} />
          {alerts.map((a, i) => <AlertRow key={i} a={a} delay={i * 80} onLost={onLost} T={T} />)}
        </div>

        {/* Devices */}
        <div>
          <SectionHead title="Device Trust" action="Manage" T={T} />
          {devices.map((d, i) => (
            <div key={i}
              onMouseEnter={() => setHovDev(i)}
              onMouseLeave={() => setHovDev(null)}
              style={{ ...glass({ borderRadius: 13, padding: "15px 17px", marginBottom: 9 }), borderColor: hovDev === i ? `${T.a}44` : d.trusted ? BASE.border : "rgba(248,113,113,0.28)", transition: "all 0.2s", transform: hovDev === i ? "translateX(4px)" : "none", boxShadow: hovDev === i ? `0 0 18px ${T.glow}` : "none" }} className="slide-up">
              <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                <div style={{ width: 42, height: 42, borderRadius: 13, background: hovDev === i ? `${T.a}14` : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, transition: "background 0.2s" }}>{d.icon}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: BASE.text, fontSize: 13.5, fontWeight: 600 }}>{d.name}</p>
                  <p style={{ color: BASE.muted, fontSize: 11.5, marginTop: 3 }}>{d.sub}</p>
                </div>
                <Pill trusted={d.trusted} />
              </div>
            </div>
          ))}

          {/* Incident Timeline */}
          <div style={{ marginTop: 20 }}>
            <SectionHead title="Incident Timeline" action="" T={T} />
            {timeline.map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 11 }} className="slide-up">
                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: BASE.muted, fontSize: 10, width: 40, flexShrink: 0 }}>{t.time}</span>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: t.color, boxShadow: `0 0 8px ${t.color}`, flexShrink: 0 }} />
                <div style={{ flex: 1, height: 1, background: BASE.border }} />
                <span style={{ color: BASE.sub, fontSize: 12 }}>{t.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Behavioral Signature */}
        <div className="full-w">
          <SectionHead title="Behavioral Signature" action="" T={T} />
          <div style={{ ...glass({ padding: 20 }), borderColor: `${T.b}22` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: BASE.sub }}>Identity waveform · live session</p>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div className="blink" style={{ width: 5, height: 5, borderRadius: "50%", background: T.a }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.a }}>RECORDING</span>
              </div>
            </div>
            <SigCanvas T={T} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   SETTINGS
══════════════════════════════════════ */
function SettingsPage({ T, onDeleteAccount, theme, setTheme, themes }) {
  const [emailAlerts,  setEmailAlerts]  = useState(true);
  const [smsAlerts,    setSmsAlerts]    = useState(true);
  const [pushAlerts,   setPushAlerts]   = useState(true);
  const [mobileGate,   setMobileGate]   = useState(true);
  const [batteryPause, setBatteryPause] = useState(true);
  const [duressMode,   setDuressMode]   = useState(false);
  const [duressPhrase, setDuressPhrase] = useState("");
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2200); };

  return (
    <div style={{ padding: "30px 30px 72px", maxWidth: 900 }} className="content-in">
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ color: BASE.text, fontSize: 25, fontWeight: 900, letterSpacing: "-1px" }}>Settings</h1>
        <p style={{ color: BASE.muted, fontSize: 13, marginTop: 4 }}>Manage your security preferences</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(360px,1fr))", gap: 18 }}>
        <SettingsSection title="App Theme" icon="🎨">
          <p style={{ color: BASE.muted, fontSize: 13, marginBottom: 14 }}>Choose your system personality</p>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
            {Object.entries(themes).map(([key, th]) => (
              <div key={key} onClick={() => setTheme(key)}
                style={{ flex: "1 0 68px", padding: "13px 9px", borderRadius: 13, background: theme === key ? th.glow : "rgba(255,255,255,0.03)", border: `1.5px solid ${theme === key ? th.a + "77" : BASE.border}`, cursor: "pointer", textAlign: "center", transition: "all 0.25s", boxShadow: theme === key ? `0 0 22px ${th.glow}` : "none" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg,${th.a},${th.b})`, margin: "0 auto 7px", boxShadow: theme === key ? `0 0 12px ${th.a}66` : "none" }} />
                <p style={{ color: theme === key ? th.a : BASE.muted, fontSize: 9, fontWeight: 700, letterSpacing: "1px" }}>{th.name.toUpperCase().split(" ")[0]}</p>
              </div>
            ))}
          </div>
        </SettingsSection>

        <SettingsSection title="Security Contact" icon="📬">
          <Field T={T} label="EMAIL" value="you@example.com" onChange={() => {}} placeholder="Alert email" type="email" />
          <Field T={T} label="PHONE" value="+91 98765 43210"  onChange={() => {}} placeholder="Alert phone" type="tel" />
          <InfoBadge icon="ℹ️" color={T.b}>Hallow alerts this contact when an anomaly is detected.</InfoBadge>
        </SettingsSection>

        <SettingsSection title="Notifications" icon="🔔">
          <Toggle T={T} label="Email alerts" sub="Notified via email on anomaly"   value={emailAlerts}  onChange={setEmailAlerts}  />
          <Toggle T={T} label="SMS alerts"   sub="Text message for high-risk events" value={smsAlerts}    onChange={setSmsAlerts}    />
          <Toggle T={T} label="Push alerts"  sub="Instant push to your mobile app"  value={pushAlerts}   onChange={setPushAlerts}   />
        </SettingsSection>

        <SettingsSection title="Identity Gate" icon="🔐">
          <Toggle T={T} label="Require mobile biometric" sub="Fingerprint gate before logout or uninstall" value={mobileGate} onChange={setMobileGate} />
          <div style={{ ...glass({ borderRadius: 11, padding: "13px 15px", marginTop: 9 }) }}>
            <p style={{ color: BASE.muted, fontSize: 9, fontWeight: 700, letterSpacing: "1.5px", marginBottom: 9 }}>PASSKEY FALLBACK</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ color: BASE.text, fontSize: 13, fontWeight: 500 }}>Hardware passkey</p>
                <p style={{ color: BASE.muted, fontSize: 11, marginTop: 2 }}>Used if no mobile device registered</p>
              </div>
              <button style={{ padding: "7px 15px", borderRadius: 9, background: `${T.a}16`, border: `1px solid ${T.a}44`, color: T.a, fontSize: 12, fontWeight: 700 }}>Update</button>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection title="Advanced" icon="⚡">
          <Toggle T={T} label="Battery saver" sub="Pause AI monitoring when battery < 20%" value={batteryPause} onChange={setBatteryPause} />
          <Toggle T={T} label="Duress mode"   sub="Silent panic alert on duress phrase"    value={duressMode}   onChange={setDuressMode}  accent={BASE.amber} />
          {duressMode && (
            <div className="slide-down" style={{ marginTop: 11 }}>
              <Field T={T} label="DURESS PHRASE" value={duressPhrase} onChange={setDuressPhrase} placeholder="A secret word or phrase" />
              <InfoBadge icon="⚠️" color={BASE.amber}>Keep this private. Typing it anywhere silently alerts your emergency contact.</InfoBadge>
            </div>
          )}
        </SettingsSection>

        <SettingsSection title="Account" icon="👤">
          <button onClick={onDeleteAccount} style={{ width: "100%", padding: 13, borderRadius: 11, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", color: BASE.red, fontSize: 13, fontWeight: 700 }}>Delete account</button>
        </SettingsSection>
      </div>

      <button onClick={save} style={{ marginTop: 22, padding: "14px 46px", borderRadius: 13, background: saved ? "rgba(74,222,128,0.14)" : `linear-gradient(135deg,${T.a}28,${T.b}28)`, border: `1px solid ${saved ? "rgba(74,222,128,0.38)" : T.a + "44"}`, color: saved ? BASE.green : BASE.text, fontSize: 14.5, fontWeight: 800, transition: "all 0.35s" }}>
        {saved ? "✓ Saved" : "Save changes"}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════
   LOST DEVICE
══════════════════════════════════════ */
function LostPage({ T, step, setStep, onBack }) {
  const [dot, setDot] = useState({ x: 48, y: 46 });
  useEffect(() => {
    if (step !== 2) return;
    const id = setInterval(() => setDot({ x: 28 + Math.random() * 40, y: 22 + Math.random() * 48 }), 3200);
    return () => clearInterval(id);
  }, [step]);

  return (
    <div style={{ padding: "30px", maxWidth: 600, margin: "0 auto" }} className="content-in">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 26 }}>
        <button onClick={onBack} style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: `1px solid ${BASE.border}`, color: BASE.muted, fontSize: 12, fontWeight: 600 }}>← Back</button>
        <div>
          <h1 style={{ color: BASE.text, fontSize: 25, fontWeight: 900, letterSpacing: "-1px" }}>Lost Device</h1>
          <p style={{ color: BASE.muted, fontSize: 13, marginTop: 3 }}>Track and secure your device</p>
        </div>
      </div>

      {step === 0 && (
        <div className="slide-up">
          <div style={{ ...glass({ borderRadius: 18, padding: 22, marginBottom: 14 }), borderColor: "rgba(248,113,113,0.32)", background: "rgba(248,113,113,0.04)", boxShadow: "0 0 50px rgba(248,113,113,0.10)" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ width: 50, height: 50, borderRadius: 16, background: "rgba(248,113,113,0.14)", border: "1px solid rgba(248,113,113,0.26)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>🚨</div>
              <div>
                <p style={{ color: "#fca5a5", fontSize: 15.5, fontWeight: 700, marginBottom: 5 }}>Unauthorized access detected</p>
                <p style={{ color: BASE.sub, fontSize: 13, lineHeight: 1.65 }}>Behavioral confidence dropped to 31%.</p>
                <p style={{ color: BASE.muted, fontSize: 11.5, marginTop: 7 }}>Today · 4:27 PM · Chrome · Hyderabad, IN</p>
              </div>
            </div>
          </div>
          <div style={{ ...glass({ padding: 34, textAlign: "center" }) }}>
            <p style={{ color: BASE.text, fontSize: 22, fontWeight: 800, marginBottom: 9 }}>Was this you?</p>
            <p style={{ color: BASE.sub, fontSize: 14, lineHeight: 1.65, marginBottom: 30 }}>If your device is lost or stolen, Hallow can track it silently.</p>
            <div style={{ display: "flex", gap: 11, justifyContent: "center" }}>
              <button onClick={onBack}          style={{ flex: 1, maxWidth: 200, padding: 14, borderRadius: 13, background: "rgba(74,222,128,0.10)", border: "1px solid rgba(74,222,128,0.28)", color: BASE.green, fontWeight: 700, fontSize: 14 }}>✓ Yes, it was me</button>
              <button onClick={() => setStep(1)} style={{ flex: 1, maxWidth: 200, padding: 14, borderRadius: 13, background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.28)", color: "#fca5a5", fontWeight: 700, fontSize: 14 }}>🚨 Device lost</button>
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="slide-up">
          <BackBtn onClick={() => setStep(0)} />
          <div style={{ ...glass({ padding: 38, textAlign: "center" }), maxWidth: 480, margin: "0 auto" }}>
            <div style={{ width: 82, height: 82, borderRadius: 26, background: "linear-gradient(135deg,rgba(248,113,113,0.14),rgba(167,139,250,0.14))", border: "1px solid rgba(248,113,113,0.28)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 40 }}>📍</div>
            <h2 style={{ color: BASE.text, fontSize: 23, fontWeight: 900, marginBottom: 9 }}>Activate silent tracking?</h2>
            <p style={{ color: BASE.sub, fontSize: 14, lineHeight: 1.7, marginBottom: 26 }}>Hallow will stream GPS in real-time. Completely silent.</p>
            {["Live GPS update every 30 seconds", "Invisible — no indicator shown", "Shared only with you and emergency contact"].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 11, textAlign: "left" }}>
                <span style={{ color: T.b, fontSize: 10, flexShrink: 0 }}>◆</span>
                <span style={{ color: BASE.sub, fontSize: 14 }}>{item}</span>
              </div>
            ))}
            <button onClick={() => setStep(2)} style={{ width: "100%", padding: 15, borderRadius: 13, background: "linear-gradient(135deg,rgba(248,113,113,0.18),rgba(167,139,250,0.18))", border: "1px solid rgba(248,113,113,0.38)", color: BASE.text, fontWeight: 800, fontSize: 15.5, marginTop: 10, marginBottom: 9 }}>Confirm — Start Tracking</button>
            <button onClick={() => setStep(0)} style={{ width: "100%", padding: 12, borderRadius: 11, background: "transparent", border: `1px solid ${BASE.border}`, color: BASE.muted, fontSize: 14 }}>Cancel</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="slide-up">
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16 }}>
            <div className="blink" style={{ width: 9, height: 9, borderRadius: "50%", background: BASE.red, boxShadow: `0 0 14px ${BASE.red}` }} />
            <span style={{ color: "#fca5a5", fontWeight: 800, fontSize: 14.5 }}>LIVE TRACKING</span>
            <span style={{ color: BASE.muted, fontSize: 12.5, marginLeft: "auto" }}>30s refresh</span>
          </div>
          <div style={{ ...glass({ padding: 0, overflow: "hidden", marginBottom: 14 }), borderColor: `${T.a}28`, boxShadow: `0 0 50px ${T.glow}` }}>
            <div style={{ position: "relative", height: 280, background: `linear-gradient(135deg,${T.glow},${T.glowB})` }}>
              {[...Array(12)].map((_, i) => <div key={`v${i}`} style={{ position: "absolute", top: 0, bottom: 0, left: `${i * 8.33}%`, borderLeft: "1px solid rgba(255,255,255,0.02)" }} />)}
              {[...Array(8)].map((_, i)  => <div key={`h${i}`} style={{ position: "absolute", left: 0, right: 0, top: `${i * 12.5}%`, borderTop: "1px solid rgba(255,255,255,0.02)" }} />)}
              <div style={{ position: "absolute", left: `${dot.x}%`, top: `${dot.y}%`, transition: "all 2.8s cubic-bezier(0.4,0,0.2,1)", transform: "translate(-50%,-50%)", zIndex: 2 }}>
                <div className="blink" style={{ position: "absolute", inset: -13, borderRadius: "50%", border: "1px solid rgba(248,113,113,0.38)" }} />
                <div className="blink" style={{ position: "absolute", inset: -26, borderRadius: "50%", border: "1px solid rgba(248,113,113,0.16)", animationDelay: "0.5s" }} />
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: BASE.red, boxShadow: `0 0 22px ${BASE.red}` }} />
              </div>
              <div style={{ position: "absolute", bottom: 16, left: 20 }}>
                <p style={{ color: BASE.sub, fontSize: 13, fontWeight: 600 }}>Hyderabad, Telangana, IN</p>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", color: BASE.muted, fontSize: 11.5, marginTop: 3 }}>17.4239° N, 78.4738° E</p>
              </div>
              <div style={{ position: "absolute", top: 14, right: 14, background: "rgba(248,113,113,0.16)", border: "1px solid rgba(248,113,113,0.32)", borderRadius: 20, padding: "5px 13px" }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#fca5a5", fontSize: 11, fontWeight: 800, letterSpacing: "1.5px" }}>LIVE</span>
              </div>
            </div>
          </div>
          <div style={{ ...glass({ borderRadius: 15, padding: "19px 22px", marginBottom: 11 }) }}>
            {[["Emergency contact", BASE.green, "✓ Notified"], ["Extension", T.a, "Monitoring silently"], ["Alerts to", BASE.text, "you@example.com"], ["Tracking since", BASE.sub, "4:32 PM today"]].map(([l, c, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 13 }}>
                <span style={{ color: BASE.muted, fontSize: 13.5 }}>{l}</span>
                <span style={{ color: c, fontSize: 13.5, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setStep(0)} style={{ padding: "13px 30px", borderRadius: 12, background: "transparent", border: `1px solid ${BASE.border}`, color: BASE.muted, fontSize: 13.5, fontWeight: 600 }}>Stop tracking</button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   CHAT PANEL  — Bug fix: sendChatMsg receives msg as parameter
   avoiding the setState race condition entirely
══════════════════════════════════════ */
function ChatPanel({ T, onClose }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hey — I'm your Hallow AI. 🛡️\n\nI can explain security alerts, analyze behavioral patterns, or answer anything about your account." }
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Core send function takes the message as a direct parameter
  // This avoids the setState race condition entirely
  const sendChatMsg = useCallback(async (userMsg) => {
    if (!userMsg.trim() || loading) return;

    const newMessages = [...messages, { role: "user", text: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are the Hallow AI security assistant — intelligent, calm, precise. Hallow is a behavioral biometrics security platform. Help users understand alerts, trust scores, and behavioral patterns. Current user: Alex, trust score: 94.2%, recent alert: unusual typing pattern. Keep responses concise — 2-4 sentences.`,
          messages: newMessages.map(m => ({ role: m.role, content: m.text })),
        }),
      });
      const data = await res.json();
      setMessages(m => [...m, { role: "assistant", text: data.content?.[0]?.text || "Sorry, try again." }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", text: "Connection issue. Please try again." }]);
    }
    setLoading(false);
  }, [messages, loading]);

  // Input box send — reads input value directly, clears it, then calls sendChatMsg
  const handleSend = () => {
    const msg = input.trim();
    if (!msg) return;
    setInput("");
    sendChatMsg(msg);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(14px)" }} />
      <div style={{ position: "relative", background: "rgba(4,4,8,0.98)", border: `1px solid ${T.a}1e`, borderBottom: "none", borderRadius: "22px 22px 0 0", maxHeight: "80vh", display: "flex", flexDirection: "column", animation: "chatSlide 0.38s cubic-bezier(0.22,1,0.36,1) both" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "13px 0 7px" }}>
          <div style={{ width: 34, height: 4, borderRadius: 4, background: "rgba(255,255,255,0.11)" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 22px 15px", borderBottom: `1px solid ${BASE.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{ width: 38, height: 38, borderRadius: 13, background: `linear-gradient(135deg,${T.a}26,${T.b}26)`, border: `1px solid ${T.a}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, boxShadow: `0 0 18px ${T.glow}` }}>🤖</div>
            <div>
              <p style={{ color: BASE.text, fontSize: 14.5, fontWeight: 700 }}>Hallow AI</p>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: BASE.green }} />
                <p style={{ color: BASE.green, fontSize: 11, fontWeight: 600 }}>Online</p>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${BASE.border}`, color: BASE.muted, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 22px", display: "flex", flexDirection: "column", gap: 15 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", gap: 9 }} className="slide-up">
              {m.role === "assistant" && (
                <div style={{ width: 30, height: 30, borderRadius: 10, background: `linear-gradient(135deg,${T.a}22,${T.b}22)`, border: `1px solid ${T.a}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, marginTop: 2 }}>🤖</div>
              )}
              <div style={{ maxWidth: "76%", padding: "11px 15px", borderRadius: m.role === "user" ? "17px 17px 4px 17px" : "17px 17px 17px 4px", background: m.role === "user" ? `linear-gradient(135deg,${T.a}22,${T.b}22)` : "rgba(255,255,255,0.055)", border: `1px solid ${m.role === "user" ? T.a + "38" : BASE.border}`, fontSize: 13.5, color: BASE.text, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 30, height: 30, borderRadius: 10, background: `linear-gradient(135deg,${T.a}22,${T.b}22)`, border: `1px solid ${T.a}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🤖</div>
              <div style={{ padding: "11px 15px", borderRadius: "17px 17px 17px 4px", background: "rgba(255,255,255,0.055)", border: `1px solid ${BASE.border}`, display: "flex", gap: 5, alignItems: "center" }}>
                {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: T.a, opacity: 0.7, animation: "blink 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />)}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick-reply chips — now call sendChatMsg(q) directly, no setTimeout hack */}
        {messages.length <= 2 && (
          <div style={{ padding: "0 22px 11px", display: "flex", gap: 7, overflowX: "auto" }}>
            {["Was that alert dangerous?", "Why did my score drop?", "Flag the unknown PC"].map(q => (
              <button key={q}
                onClick={() => sendChatMsg(q)}
                style={{ padding: "8px 15px", borderRadius: 20, background: `${T.a}12`, border: `1px solid ${T.a}2e`, color: T.a, fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>
                {q}
              </button>
            ))}
          </div>
        )}

        <div style={{ padding: "7px 22px 30px", borderTop: `1px solid ${BASE.border}`, display: "flex", gap: 9, alignItems: "flex-end" }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about your security..."
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            rows={1}
            style={{ flex: 1, minHeight: 44, maxHeight: 118, padding: "12px 14px", borderRadius: 13, fontSize: 13.5, resize: "none" }}
          />
          <button onClick={handleSend} style={{ width: 44, height: 44, borderRadius: 13, background: `linear-gradient(135deg,${T.a}cc,${T.b}cc)`, color: "#000", fontSize: 19, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 900, boxShadow: `0 0 18px ${T.glow}` }}>↑</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   BIOMETRIC GATE
══════════════════════════════════════ */
function BiometricGate({ T, onConfirm, onCancel }) {
  const [state, setState]     = useState("idle");
  const [attempts, setAttempts] = useState(0);

  const scan = () => {
    setState("scanning");
    setTimeout(() => {
      if (attempts === 0 && Math.random() < 0.35) {
        setState("failed");
        setAttempts(a => a + 1);
      } else {
        setState("success");
        setTimeout(() => onConfirm(), 1200);
      }
    }, 2200);
  };

  const borderColor = { idle: BASE.border, scanning: `${T.a}55`, success: "rgba(74,222,128,0.48)", failed: "rgba(248,113,113,0.48)" }[state];
  const shadowColor = { idle: "none", scanning: `0 0 55px ${T.glow}`, success: "0 0 55px rgba(74,222,128,0.18)", failed: "0 0 55px rgba(248,113,113,0.18)" }[state];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.92)", backdropFilter: "blur(24px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ ...glass({ padding: 42, maxWidth: 392, width: "100%", textAlign: "center" }), background: "rgba(4,4,8,0.98)", borderColor, boxShadow: `0 32px 80px rgba(0,0,0,0.9), ${shadowColor}`, transition: "border-color 0.4s, box-shadow 0.4s" }} className="slide-up">
        <div style={{ position: "relative", width: 102, height: 102, margin: "0 auto 26px" }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: state === "success" ? "rgba(74,222,128,0.10)" : state === "failed" ? "rgba(248,113,113,0.10)" : T.glow, border: `1px solid ${state === "success" ? "rgba(74,222,128,0.38)" : state === "failed" ? "rgba(248,113,113,0.38)" : T.a + "38"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.4s" }}>
            {state === "scanning" && <div style={{ position: "absolute", inset: -11, borderRadius: "50%", border: `2px solid ${T.a}33`, animation: "blink 1s ease-in-out infinite" }} />}
            {state === "success"  && <div style={{ position: "absolute", inset: -11, borderRadius: "50%", border: "2px solid rgba(74,222,128,0.44)" }} />}
            {state === "failed"   && <div style={{ position: "absolute", inset: -11, borderRadius: "50%", border: "2px solid rgba(248,113,113,0.44)" }} />}
            <span style={{ fontSize: 46 }}>{state === "success" ? "✓" : state === "failed" ? "✕" : "👆"}</span>
          </div>
        </div>
        <h2 style={{ color: state === "success" ? BASE.green : state === "failed" ? BASE.red : BASE.text, fontSize: 22, fontWeight: 900, marginBottom: 9, transition: "color 0.4s" }}>
          {state === "idle" && "Verify your identity"}
          {state === "scanning" && "Scanning..."}
          {state === "success" && "Identity confirmed"}
          {state === "failed" && "Scan failed"}
        </h2>
        <p style={{ color: BASE.muted, fontSize: 13.5, lineHeight: 1.65, marginBottom: 26 }}>
          {state === "idle"     && "Hallow requires biometric verification before you can log out."}
          {state === "scanning" && "Hold your finger steady on the sensor..."}
          {state === "success"  && "Logging you out securely..."}
          {state === "failed"   && "Fingerprint didn't match. Try again or use your passkey."}
        </p>
        {state === "scanning" && (
          <div style={{ height: 3, background: BASE.dim, borderRadius: 3, marginBottom: 26, overflow: "hidden" }}>
            <div style={{ height: "100%", background: `linear-gradient(90deg,transparent,${T.a},${T.b},transparent)`, backgroundSize: "200% 100%", animation: "shimmer 1.2s linear infinite", borderRadius: 3 }} />
          </div>
        )}
        {(state === "idle" || state === "failed") && (
          <>
            {state === "idle"
              ? <button onClick={scan} style={{ width: "100%", padding: 15, borderRadius: 13, background: `${T.a}1a`, border: `1px solid ${T.a}44`, color: BASE.text, fontWeight: 800, fontSize: 15.5, marginBottom: 9, boxShadow: `0 0 28px ${T.glow}` }}>Use fingerprint →</button>
              : <button onClick={() => setState("idle")} style={{ width: "100%", padding: 15, borderRadius: 13, background: `${T.a}16`, border: `1px solid ${T.a}44`, color: T.a, fontWeight: 800, fontSize: 14.5, marginBottom: 9 }}>Try again</button>
            }
            <button style={{ width: "100%", padding: 12, borderRadius: 11, background: "rgba(255,255,255,0.03)", border: `1px solid ${BASE.border}`, color: BASE.sub, fontSize: 13.5, marginBottom: 9 }}>🔑 Use passkey instead</button>
            <button onClick={onCancel} style={{ width: "100%", padding: 10, borderRadius: 10, background: "transparent", border: "none", color: BASE.muted, fontSize: 13 }}>Cancel</button>
          </>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   DELETE CONFIRM
══════════════════════════════════════ */
function DeleteConfirm({ T, onConfirm, onCancel }) {
  const [typed, setTyped] = useState("");
  const confirmed = typed === "DELETE";
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.92)", backdropFilter: "blur(24px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ ...glass({ padding: 40, maxWidth: 392, width: "100%", textAlign: "center" }), background: "rgba(4,4,8,0.98)", borderColor: "rgba(248,113,113,0.32)", boxShadow: "0 32px 80px rgba(0,0,0,0.9)" }} className="slide-up">
        <div style={{ fontSize: 48, marginBottom: 18 }}>⚠️</div>
        <h2 style={{ color: BASE.text, fontSize: 22, fontWeight: 900, marginBottom: 9 }}>Delete your account?</h2>
        <p style={{ color: BASE.muted, fontSize: 13.5, lineHeight: 1.65, marginBottom: 24 }}>This permanently deletes all your data. Cannot be undone.</p>
        <div style={{ marginBottom: 20, textAlign: "left" }}>
          <label style={{ display: "block", color: BASE.muted, fontSize: 9, fontWeight: 700, letterSpacing: "1.5px", marginBottom: 7 }}>TYPE "DELETE" TO CONFIRM</label>
          <input value={typed} onChange={e => setTyped(e.target.value)} placeholder="DELETE"
            style={{ borderColor: confirmed ? "rgba(248,113,113,0.44)" : BASE.border }} />
        </div>
        <button onClick={onConfirm} disabled={!confirmed} style={{ width: "100%", padding: 14, borderRadius: 12, background: confirmed ? "rgba(248,113,113,0.16)" : "rgba(255,255,255,0.03)", border: `1px solid ${confirmed ? "rgba(248,113,113,0.42)" : BASE.border}`, color: confirmed ? BASE.red : BASE.muted, fontWeight: 800, fontSize: 14.5, marginBottom: 9, cursor: confirmed ? "pointer" : "not-allowed", transition: "all 0.3s" }}>Delete my account</button>
        <button onClick={onCancel} style={{ width: "100%", padding: 12, borderRadius: 11, background: "transparent", border: `1px solid ${BASE.border}`, color: BASE.muted, fontSize: 13.5 }}>Cancel</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MODAL WRAPPER
══════════════════════════════════════ */
function Modal({ onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(20px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ ...glass({ padding: 40, maxWidth: 420, width: "100%" }), background: "rgba(4,4,8,0.97)" }} className="slide-up">
        {children}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   SHARED COMPONENTS
══════════════════════════════════════ */
function HallowIcon({ T, size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path d="M14 2L4 7v7c0 6 4 11 10 13 6-2 10-7 10-13V7L14 2z" stroke={`url(#hg-${size})`} strokeWidth="1.5" strokeLinejoin="round" fill={T.glow} />
      <circle cx="14" cy="14" r="3" fill={T.b} opacity="0.9" />
      <defs>
        <linearGradient id={`hg-${size}`} x1="4" y1="2" x2="24" y2="28">
          <stop stopColor={T.a} /><stop offset="1" stopColor={T.b} />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Field({ T, label, value, onChange, placeholder, type = "text" }) {
  return (
    <div style={{ marginBottom: 17 }}>
      {label && <label style={{ display: "block", color: BASE.muted, fontSize: 9, fontWeight: 700, letterSpacing: "1.5px", marginBottom: 7 }}>{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        onFocus={e => { e.target.style.borderColor = T.a + "77"; e.target.style.boxShadow = `0 0 0 3px ${T.a}12`; }}
        onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }} />
    </div>
  );
}

function PrimaryBtn({ T, children, onClick, loading }) {
  return (
    <button onClick={onClick}
      style={{ width: "100%", padding: 14, borderRadius: 13, background: loading ? `${T.a}14` : `linear-gradient(135deg,${T.a}28,${T.b}28)`, border: `1px solid ${T.a}44`, color: BASE.text, fontWeight: 800, fontSize: 14.5, boxShadow: `0 0 28px ${T.glow}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.3s" }}>
      {loading && <span style={{ display: "flex", gap: 4 }}>{[0, 1, 2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: T.a, display: "inline-block", animation: "blink 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />)}</span>}
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick }) {
  return (
    <button onClick={onClick} style={{ width: "100%", padding: 13, borderRadius: 11, background: "rgba(255,255,255,0.03)", border: `1px solid ${BASE.border}`, color: BASE.sub, fontSize: 13.5, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
      {children}
    </button>
  );
}

function Toggle({ T, label, sub, value, onChange, accent }) {
  const c = accent || T.a;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 17 }}>
      <div style={{ paddingRight: 14 }}>
        <p style={{ color: BASE.text, fontSize: 13, fontWeight: 500 }}>{label}</p>
        {sub && <p style={{ color: BASE.muted, fontSize: 11, marginTop: 2 }}>{sub}</p>}
      </div>
      <div onClick={() => onChange(!value)}
        style={{ width: 44, height: 24, borderRadius: 12, background: value ? `${c}28` : "rgba(255,255,255,0.07)", border: `1px solid ${value ? c + "55" : BASE.border}`, cursor: "pointer", position: "relative", transition: "all 0.25s", flexShrink: 0 }}>
        <div style={{ position: "absolute", top: 4, left: value ? 22 : 4, width: 14, height: 14, borderRadius: "50%", background: value ? c : BASE.muted, transition: "all 0.25s", boxShadow: value ? `0 0 9px ${c}77` : "none" }} />
      </div>
    </div>
  );
}

function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ background: "none", color: BASE.muted, fontSize: 12.5, padding: 0, marginBottom: 20, display: "flex", alignItems: "center", gap: 5, fontWeight: 600 }}>← Back</button>
  );
}

function Divider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11, margin: "22px 0" }}>
      <div style={{ flex: 1, height: 1, background: BASE.border }} />
      <span style={{ color: BASE.muted, fontSize: 12 }}>or</span>
      <div style={{ flex: 1, height: 1, background: BASE.border }} />
    </div>
  );
}

function InfoBadge({ icon, color, children }) {
  return (
    <div style={{ background: `${color}10`, border: `1px solid ${color}28`, borderRadius: 11, padding: "11px 14px", marginBottom: 18 }}>
      <p style={{ color, fontSize: 13, display: "flex", gap: 8, alignItems: "flex-start", lineHeight: 1.55 }}>
        <span style={{ flexShrink: 0 }}>{icon}</span><span>{children}</span>
      </p>
    </div>
  );
}

function SettingsSection({ title, icon, children }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 13 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ color: BASE.muted, fontSize: 9, fontWeight: 700, letterSpacing: "2px" }}>{title.toUpperCase()}</span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.035)", backdropFilter: "blur(24px)", border: `1px solid ${BASE.border}`, borderRadius: 15, padding: "18px 20px" }}>{children}</div>
    </div>
  );
}

function SectionHead({ title, action, T }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 13 }}>
      <span style={{ color: BASE.muted, fontSize: 9, fontWeight: 700, letterSpacing: "2px" }}>{title.toUpperCase()}</span>
      {action && <span style={{ color: T.a, fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>{action}</span>}
    </div>
  );
}

function AlertRow({ a, delay = 0, onLost, T }) {
  const borderColor = { warn: "rgba(251,191,36,0.22)", info: BASE.border, ok: "rgba(74,222,128,0.18)" }[a.type];
  const icon = { warn: "⚠️", info: "ℹ️", ok: "✓" }[a.type];
  return (
    <div style={{ background: "rgba(255,255,255,0.035)", backdropFilter: "blur(24px)", border: `1px solid ${borderColor}`, borderRadius: 13, padding: "14px 17px", marginBottom: 9, animationDelay: `${delay}ms` }} className="slide-up">
      <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
        <span style={{ fontSize: 14, marginTop: 1 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: BASE.text, fontSize: 13, fontWeight: 600 }}>{a.title}</span>
            <span style={{ color: BASE.muted, fontSize: 11 }}>{a.time}</span>
          </div>
          <p style={{ color: BASE.sub, fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>{a.detail}</p>
        </div>
      </div>
      {a.type === "warn" && (
        <div style={{ display: "flex", gap: 7, marginTop: 11 }}>
          <button onClick={onLost} style={{ padding: "6px 14px", borderRadius: 9, background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.28)", color: BASE.red, fontSize: 11, fontWeight: 700 }}>Report lost</button>
          <button style={{ padding: "6px 14px", borderRadius: 9, background: "rgba(255,255,255,0.04)", border: `1px solid ${BASE.border}`, color: BASE.muted, fontSize: 11 }}>It was me</button>
        </div>
      )}
    </div>
  );
}

function Pill({ trusted }) {
  return (
    <span style={{ padding: "3px 11px", borderRadius: 20, fontSize: 9.5, fontWeight: 800, letterSpacing: "0.5px", background: trusted ? "rgba(74,222,128,0.09)" : "rgba(248,113,113,0.09)", color: trusted ? BASE.green : BASE.red, border: `1px solid ${trusted ? "rgba(74,222,128,0.26)" : "rgba(248,113,113,0.26)"}` }}>
      {trusted ? "TRUSTED" : "UNKNOWN"}
    </span>
  );
}