 // ─────────────────────────────────────────────
//  Hallow — Popup Script
//  Connects popup UI to background state.
//  Updates trust score, handles alerts,
//  and manages user actions.
// ─────────────────────────────────────────────

// ── DOM refs ─────────────────────────────────
const $  = id => document.getElementById(id);
const statusPill    = $('statusPill');
const statusText    = $('statusText');
const batteryBanner = $('batteryBanner');
const alertCard     = $('alertCard');
const alertDetail   = $('alertDetail');
const scoreDisplay  = $('trustScoreDisplay');
const trustSub      = $('trustSubtext');
const trustArc      = $('trustArc');
const metricKeys    = $('metricKeys');
const metricMouse   = $('metricMouse');
const metricScroll  = $('metricScroll');

const CIRC = 2 * Math.PI * 28; // SVG ring circumference (r=28)

// ── Render trust score ring ───────────────────
function renderRing(score) {
  const dash = (score / 100) * CIRC;
  trustArc.style.strokeDasharray = `${dash} ${CIRC}`;
  trustArc.style.strokeDashoffset = CIRC / 4;
}

// ── Render full state ────────────────────────
function renderState(state) {

  // Trust score
  const score = state.trustScore ?? 100;
  scoreDisplay.textContent = `${score.toFixed(1)}%`;
  renderRing(score);

  // Sub text
  if (score >= 90)      trustSub.textContent = 'Strong behavioral match';
  else if (score >= 75) trustSub.textContent = 'Moderate — stay alert';
  else                  trustSub.textContent = 'Low — anomaly detected';
  trustSub.style.color = score >= 90 ? '#4ade80' : score >= 75 ? '#fbbf24' : '#f87171';

  // Status pill
  if (!state.isMonitoring) {
    statusPill.className = 'status-pill paused';
    statusText.textContent = 'Off';
  } else if (state.batteryLow) {
    statusPill.className = 'status-pill paused';
    statusText.textContent = 'Paused';
  } else if (state.alertCount > 0) {
    statusPill.className = 'status-pill alert';
    statusText.textContent = `${state.alertCount} Alert${state.alertCount > 1 ? 's' : ''}`;
  } else {
    statusPill.className = 'status-pill';
    statusText.textContent = 'Active';
  }

  // Battery banner
  batteryBanner.classList.toggle('visible', !!state.batteryLow);

  // Alert card
  if (state.alertCount > 0) {
    alertCard.classList.add('visible');
    alertDetail.textContent = `Trust score dropped to ${score.toFixed(1)}%. This may indicate unauthorized access.`;
  } else {
    alertCard.classList.remove('visible');
  }

  // Metrics — placeholder values until real data flows
  metricKeys.textContent  = state.isMonitoring ? '99%' : '--';
  metricMouse.textContent = state.isMonitoring ? '91%' : '--';
  metricScroll.textContent= state.isMonitoring ? '94%' : '--';
}

// ── Load initial state from background ───────
chrome.runtime.sendMessage({ type: 'GET_STATE' }, (state) => {
  if (chrome.runtime.lastError) return;
  renderState(state || {});
});

// ── Listen for live score updates ────────────
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'SCORE_UPDATE') {
    renderState({
      trustScore:   msg.trustScore,
      isMonitoring: true,
      batteryLow:   false,
      alertCount:   msg.anomaly ? 1 : 0,
    });
  }
});

// ── Button: Open dashboard ───────────────────
$('btnDashboard').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://app.hallow.id/dashboard' });
  window.close();
});

// ── Button: Open settings ────────────────────
$('btnSettings').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://app.hallow.id/settings' });
  window.close();
});

// ── Button: Log out (triggers biometric gate) ─
$('btnLogout').addEventListener('click', () => {
  // Open the web app's biometric gate page
  // The web app will send a LOGOUT message back on success
  chrome.tabs.create({ url: 'https://app.hallow.id/logout' });
  window.close();
});

// ── Alert: Report device lost ────────────────
$('btnReportLost').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://app.hallow.id/lost' });
  window.close();
});

// ── Alert: Dismiss (it was me) ───────────────
$('btnDismiss').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'CLEAR_ALERTS' });
  alertCard.classList.remove('visible');
  statusPill.className = 'status-pill';
  statusText.textContent = 'Active';
});
