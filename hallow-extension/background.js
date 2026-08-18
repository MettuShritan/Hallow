 
// ─────────────────────────────────────────────
//  Hallow — Background Service Worker
//  Manages sessions, scores risk, handles
//  alerts, and talks to the Hallow API.
// ─────────────────────────────────────────────

const API_BASE = 'https://api.hallow.id/v1';

// In-memory state (resets on browser restart)
let state = {
  userId:        null,
  authToken:     null,
  sessionId:     null,
  trustScore:    100,
  isMonitoring:  false,
  batteryLow:    false,
  alertCount:    0,
};

// ── Restore auth from storage on startup ────
chrome.storage.local.get(['userId', 'authToken'], (data) => {
  if (data.authToken) {
    state.userId    = data.userId;
    state.authToken = data.authToken;
    state.isMonitoring = true;
    updateBadge();
  }
});

// ── Message handler ──────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  switch (msg.type) {

    // Feature vector from content script
    case 'FEATURE_VECTOR':
      handleFeatureVector(msg);
      sendResponse({ ok: true });
      break;

    // Battery events
    case 'BATTERY_LOW':
      state.batteryLow = true;
      broadcastToTabs({ type: 'PAUSE_MONITORING' });
      updateBadge();
      showNotification('Hallow paused', 'Battery below 20%. Monitoring will resume when plugged in.');
      sendResponse({ ok: true });
      break;

    case 'BATTERY_OK':
      state.batteryLow = false;
      broadcastToTabs({ type: 'RESUME_MONITORING' });
      updateBadge();
      sendResponse({ ok: true });
      break;

    // Login — save token
    case 'LOGIN':
      state.userId    = msg.userId;
      state.authToken = msg.token;
      state.isMonitoring = true;
      chrome.storage.local.set({ userId: msg.userId, authToken: msg.token });
      updateBadge();
      sendResponse({ ok: true });
      break;

    // Logout — requires biometric gate (handled in popup)
    case 'LOGOUT':
      clearState();
      sendResponse({ ok: true });
      break;

    // Popup requesting current state
    case 'GET_STATE':
      sendResponse({ ...state });
      break;

    // Popup requesting alert count reset
    case 'CLEAR_ALERTS':
      state.alertCount = 0;
      updateBadge();
      sendResponse({ ok: true });
      break;
  }

  return true; // Keep message channel open for async
});

// ── Handle incoming feature vector ──────────
async function handleFeatureVector(msg) {
  if (!state.authToken || state.batteryLow) return;

  try {
    // 1. Send to backend for server-side scoring
    const res = await fetch(`${API_BASE}/score`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${state.authToken}`,
      },
      body: JSON.stringify({
        sessionId: msg.sessionId,
        url:       msg.url,
        features:  msg.features,
      }),
    });

    if (!res.ok) return;
    const { trustScore, anomaly, riskLevel } = await res.json();

    // 2. Update local state
    state.trustScore = trustScore;
    updateBadge();

    // 3. Notify popup of score update
    chrome.runtime.sendMessage({
      type: 'SCORE_UPDATE',
      trustScore,
      anomaly,
      riskLevel,
    }).catch(() => {}); // Popup may not be open — ignore

    // 4. Fire alert if anomaly detected
    if (anomaly && riskLevel === 'high') {
      state.alertCount++;
      updateBadge();
      fireAnomalyAlert(trustScore, msg.url);
    }

  } catch (err) {
    // Silently fail — don't disrupt user
    console.warn('[Hallow] Scoring error:', err.message);
  }
}

// ── Fire anomaly notification ────────────────
function fireAnomalyAlert(score, url) {
  showNotification(
    '⚠️ Unusual behavior detected',
    `Trust score dropped to ${score.toFixed(1)}% on ${url}. Open Hallow to review.`,
  );

  // Also alert via API (sends email/SMS to user's contact)
  if (!state.authToken) return;
  fetch(`${API_BASE}/alert`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${state.authToken}`,
    },
    body: JSON.stringify({ type: 'anomaly', score, url }),
  }).catch(() => {});
}

// ── Chrome notifications ─────────────────────
function showNotification(title, message) {
  chrome.notifications.create({
    type:    'basic',
    iconUrl: 'icons/icon128.png',
    title,
    message,
    priority: 2,
  });
}

// ── Badge — shows trust score or status ─────
function updateBadge() {
  if (!state.isMonitoring) {
    chrome.action.setBadgeText({ text: '' });
    return;
  }
  if (state.batteryLow) {
    chrome.action.setBadgeText({ text: '⚡' });
    chrome.action.setBadgeBackgroundColor({ color: '#fbbf24' });
    return;
  }
  if (state.alertCount > 0) {
    chrome.action.setBadgeText({ text: `${state.alertCount}` });
    chrome.action.setBadgeBackgroundColor({ color: '#f87171' });
    return;
  }
  const score = Math.round(state.trustScore);
  chrome.action.setBadgeText({ text: `${score}` });
  chrome.action.setBadgeBackgroundColor({
    color: score >= 90 ? '#4ade80' : score >= 75 ? '#fbbf24' : '#f87171',
  });
}

// ── Broadcast to all tabs ────────────────────
async function broadcastToTabs(msg) {
  const tabs = await chrome.tabs.query({});
  tabs.forEach(tab => {
    chrome.tabs.sendMessage(tab.id, msg).catch(() => {});
  });
}

// ── Clear all state on logout ────────────────
function clearState() {
  state = {
    userId: null, authToken: null, sessionId: null,
    trustScore: 100, isMonitoring: false, batteryLow: false, alertCount: 0,
  };
  chrome.storage.local.clear();
  updateBadge();
  broadcastToTabs({ type: 'PAUSE_MONITORING' });
}

// ── Alarm for periodic baseline sync ────────
chrome.alarms.create('baseline-sync', { periodInMinutes: 30 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'baseline-sync' && state.authToken) {
    try {
      await fetch(`${API_BASE}/baseline/sync`, {
        headers: { 'Authorization': `Bearer ${state.authToken}` },
      });
    } catch {}
  }
});