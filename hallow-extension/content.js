 
// ─────────────────────────────────────────────
//  Hallow — Content Script
//  Runs on every page. Captures behavioral
//  signals and sends feature vectors to
//  the background service worker.
// ─────────────────────────────────────────────

(() => {
  // Don't run on extension pages
  if (window.location.protocol === 'chrome-extension:') return;

  const SESSION_ID   = crypto.randomUUID();
  const FLUSH_MS     = 5000;   // Send features every 5s
  const MIN_EVENTS   = 20;     // Minimum events before scoring

  let active         = true;
  let eventCount     = 0;
  let keyDownTimes   = {};     // Track key press start times

  // ── Battery check ───────────────────────────
  // Pause AI if battery < 20%
  const checkBattery = async () => {
    if (!navigator.getBattery) return true;
    try {
      const batt = await navigator.getBattery();
      const low  = batt.level < 0.20 && !batt.charging;
      if (low) {
        active = false;
        chrome.runtime.sendMessage({ type: 'BATTERY_LOW' });
      }
      batt.addEventListener('levelchange',   () => checkBattery());
      batt.addEventListener('chargingchange',() => checkBattery());
      if (!low && !active) {
        active = true;
        chrome.runtime.sendMessage({ type: 'BATTERY_OK' });
      }
      return !low;
    } catch { return true; }
  };
  checkBattery();

  // ── Event listeners ─────────────────────────

  // Keystroke — capture dwell time (key hold duration)
  document.addEventListener('keydown', e => {
    if (!active) return;
    if (!keyDownTimes[e.code]) {
      keyDownTimes[e.code] = Date.now();
    }
  }, true);

  document.addEventListener('keyup', e => {
    if (!active) return;
    const downTime = keyDownTimes[e.code];
    if (!downTime) return;
    const duration = Date.now() - downTime;
    delete keyDownTimes[e.code];

    FeatureExtractor.push('keydown', {
      code:     e.code,
      duration: duration,
      shift:    e.shiftKey,
      ctrl:     e.ctrlKey,
    });
    eventCount++;
  }, true);

  // Mouse movement — throttled to every 50ms
  let lastMouseTime = 0;
  document.addEventListener('mousemove', e => {
    if (!active) return;
    const now = Date.now();
    if (now - lastMouseTime < 50) return;
    lastMouseTime = now;

    FeatureExtractor.push('mouseMove', {
      x: e.clientX,
      y: e.clientY,
    });
    eventCount++;
  }, true);

  // Scroll — capture delta and direction
  document.addEventListener('wheel', e => {
    if (!active) return;
    FeatureExtractor.push('scroll', {
      deltaY: e.deltaY,
      deltaX: e.deltaX,
    });
    eventCount++;
  }, true);

  // Click — position and timing
  document.addEventListener('click', e => {
    if (!active) return;
    FeatureExtractor.push('click', {
      x: e.clientX,
      y: e.clientY,
    });
    eventCount++;
  }, true);

  // ── Flush loop ───────────────────────────────
  // Every FLUSH_MS, extract features and send
  // to background for scoring
  const flush = () => {
    if (!active || eventCount < MIN_EVENTS) return;

    const features = FeatureExtractor.extract();
    if (!features) return;

    chrome.runtime.sendMessage({
      type:      'FEATURE_VECTOR',
      sessionId: SESSION_ID,
      url:       window.location.hostname,
      features,
    });

    eventCount = 0;
  };

  setInterval(flush, FLUSH_MS);

  // ── Listen for commands from background ─────
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'PAUSE_MONITORING')  active = false;
    if (msg.type === 'RESUME_MONITORING') active = true;
  });

  // ── Unload — flush remaining data ───────────
  window.addEventListener('beforeunload', () => {
    if (eventCount < 5) return;
    const features = FeatureExtractor.extract();
    if (!features) return;
    // Use sendBeacon for reliable unload sending
    const payload = JSON.stringify({
      type: 'FEATURE_VECTOR', sessionId: SESSION_ID,
      url: window.location.hostname, features,
    });
    navigator.sendBeacon('/api/events', payload);
  });

})();

// ── Override flush to use local scorer ───────
// This replaces the simple flush above with
// full local TF.js inference via HallowScorer

const originalFlush = flush;
const smartFlush = async () => {
  if (!active || eventCount < 20) return;

  const features = FeatureExtractor.extract();
  if (!features || !features.vector) return;

  // Score locally with TF.js
  const result = await HallowScorer.scoreVector(features.vector);
  if (!result) return;

  // Send result to background
  chrome.runtime.sendMessage({
    type:       'SCORE_RESULT',
    sessionId:  SESSION_ID,
    url:        window.location.hostname,
    trustScore: result.trustScore,
    anomaly:    result.anomaly,
    riskLevel:  result.riskLevel,
    trained:    HallowTrainer.status().trained,
  });

  eventCount = 0;
};

// Replace the interval with smart flush
setInterval(smartFlush, 5000);