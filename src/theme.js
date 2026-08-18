export const T = {
  bg: '#000000',
  card: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  cyan: '#22d3ee',
  violet: '#a78bfa',
  red: '#f87171',
  green: '#4ade80',
  amber: '#fbbf24',
  text: '#f1f5f9',
  sub: '#94a3b8',
  muted: '#475569',
};

export const glass = (extra = {}) => ({
  background: T.card,
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: `1px solid ${T.border}`,
  borderRadius: 16,
  ...extra,
});

export const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #000; font-family: 'Syne', sans-serif; }
  @keyframes floatA { 0%,100%{transform:translate(0,0)} 50%{transform:translate(24px,-18px)} }
  @keyframes floatB { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-18px,24px)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.35;transform:scale(0.92)} }
  .fade-up { animation: fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }
  .pulse { animation: pulse 2.2s ease-in-out infinite; }
  input { font-family: 'DM Sans', sans-serif; }
  input::placeholder { color: #334155; }
  input:focus { outline: none; }
  button { font-family: 'Syne', sans-serif; cursor: pointer; transition: opacity 0.18s, transform 0.18s; }
  button:hover { opacity: 0.88; transform: translateY(-1px); }
  button:active { transform: translateY(0); }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
`;