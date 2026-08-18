 // ─────────────────────────────────────────────
//  Hallow — Feature Extractor
//  Converts raw browser events into normalized
//  feature vectors for the AI model
// ─────────────────────────────────────────────

const FeatureExtractor = (() => {

  // Rolling buffers — last 100 events per type
  const buffers = {
    keydown:   [],
    mouseMove: [],
    scroll:    [],
    click:     [],
  };

  const MAX_BUFFER = 100;

  // ── Push raw event into buffer ──────────────
  function push(type, data) {
    if (!buffers[type]) return;
    buffers[type].push({ ...data, t: Date.now() });
    if (buffers[type].length > MAX_BUFFER) {
      buffers[type].shift();
    }
  }

  // ── Keystroke features ───────────────────────
  // Dwell time: how long a key is held
  // Flight time: gap between key up and next key down
  function keystrokeFeatures() {
    const events = buffers.keydown;
    if (events.length < 5) return null;

    const dwellTimes  = [];
    const flightTimes = [];

    for (let i = 0; i < events.length - 1; i++) {
      const curr = events[i];
      const next = events[i + 1];

      if (curr.duration > 0)               dwellTimes.push(curr.duration);
      if (next.t - (curr.t + curr.duration) > 0) {
        flightTimes.push(next.t - (curr.t + curr.duration));
      }
    }

    return {
      avgDwell:    mean(dwellTimes),
      stdDwell:    stdDev(dwellTimes),
      avgFlight:   mean(flightTimes),
      stdFlight:   stdDev(flightTimes),
      typingSpeed: events.length / ((events[events.length-1].t - events[0].t) / 1000 || 1),
    };
  }

  // ── Mouse movement features ──────────────────
  // Speed, direction changes, straightness ratio
  function mouseFeatures() {
    const events = buffers.mouseMove;
    if (events.length < 10) return null;

    const speeds      = [];
    const angles      = [];
    let   totalDist   = 0;

    for (let i = 1; i < events.length; i++) {
      const dx = events[i].x - events[i-1].x;
      const dy = events[i].y - events[i-1].y;
      const dt = (events[i].t - events[i-1].t) || 1;
      const dist = Math.sqrt(dx*dx + dy*dy);

      totalDist += dist;
      speeds.push(dist / dt);
      angles.push(Math.atan2(dy, dx));
    }

    // Direction changes — how much the angle shifts
    const angleDiffs = [];
    for (let i = 1; i < angles.length; i++) {
      angleDiffs.push(Math.abs(angles[i] - angles[i-1]));
    }

    // Straightness: direct dist / total dist
    const first = events[0];
    const last  = events[events.length - 1];
    const directDist = Math.sqrt(
      Math.pow(last.x - first.x, 2) + Math.pow(last.y - first.y, 2)
    );

    return {
      avgSpeed:       mean(speeds),
      stdSpeed:       stdDev(speeds),
      avgAngleChange: mean(angleDiffs),
      straightness:   totalDist > 0 ? directDist / totalDist : 1,
      totalDistance:  totalDist,
    };
  }

  // ── Scroll features ──────────────────────────
  function scrollFeatures() {
    const events = buffers.scroll;
    if (events.length < 3) return null;

    const deltas     = events.map(e => e.deltaY);
    const intervals  = [];

    for (let i = 1; i < events.length; i++) {
      intervals.push(events[i].t - events[i-1].t);
    }

    return {
      avgDelta:    mean(deltas.map(Math.abs)),
      stdDelta:    stdDev(deltas),
      avgInterval: mean(intervals),
      scrollRate:  events.length / ((events[events.length-1].t - events[0].t) / 1000 || 1),
    };
  }

  // ── Combine into one flat vector ─────────────
  function extract() {
    const kf = keystrokeFeatures();
    const mf = mouseFeatures();
    const sf = scrollFeatures();

    // Return null if we don't have enough data yet
    if (!kf && !mf && !sf) return null;

    return {
      timestamp: Date.now(),
      keystrokes: kf || {},
      mouse:      mf || {},
      scroll:     sf || {},
      // Flat vector for ML model input
      vector: [
        kf?.avgDwell    ?? 0,
        kf?.stdDwell    ?? 0,
        kf?.avgFlight   ?? 0,
        kf?.stdFlight   ?? 0,
        kf?.typingSpeed ?? 0,
        mf?.avgSpeed    ?? 0,
        mf?.stdSpeed    ?? 0,
        mf?.avgAngleChange ?? 0,
        mf?.straightness   ?? 1,
        sf?.avgDelta    ?? 0,
        sf?.avgInterval ?? 0,
        sf?.scrollRate  ?? 0,
      ],
    };
  }

  // ── Reset buffers (new session) ──────────────
  function reset() {
    Object.keys(buffers).forEach(k => (buffers[k] = []));
  }

  // ── Math helpers ─────────────────────────────
  function mean(arr) {
    if (!arr.length) return 0;
    return arr.reduce((s, v) => s + v, 0) / arr.length;
  }

  function stdDev(arr) {
    if (arr.length < 2) return 0;
    const m = mean(arr);
    return Math.sqrt(mean(arr.map(v => Math.pow(v - m, 2))));
  }

  return { push, extract, reset };
})();

// Export for content.js
if (typeof module !== 'undefined') module.exports = FeatureExtractor;
