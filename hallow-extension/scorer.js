// ─────────────────────────────────────────────
//  Hallow — Scorer
//  Ties everything together.
//  Called by content.js every FLUSH_MS.
//  Runs local TF.js inference first.
//  Falls back to API if model not ready.
// ─────────────────────────────────────────────

const HallowScorer = (() => {

  let initialized = false;

  // ── Initialize TF.js + model + trainer ───────
  async function init() {
    if (initialized) return;
    try {
      // Load TF.js from CDN (injected via manifest)
      await HallowModel.init();
      await HallowTrainer.load();
      initialized = true;
      console.log('[Hallow] Scorer ready');
    } catch (err) {
      console.error('[Hallow] Scorer init failed:', err);
    }
  }

  // ── Main scoring function ────────────────────
  // Called with a feature vector from content.js
  // Returns a full score result object
  async function scoreVector(vector) {
    if (!initialized) await init();
    if (!vector || vector.length !== HallowModel.INPUT_DIM) return null;

    // 1. Add to trainer baseline (also triggers retraining)
    await HallowTrainer.addSample(vector);

    // 2. Score locally
    const result = HallowTrainer.score(vector);

    // 3. Log for debugging
    const s = HallowTrainer.status();
    if (!s.trained) {
      console.log(`[Hallow] Baseline: ${s.samples}/${s.minSamples} samples (${s.progress}%)`);
    } else {
      console.log(`[Hallow] Score: ${result.trustScore}% | Risk: ${result.riskLevel} | Error: ${result.error?.toFixed(5)}`);
    }

    return result;
  }

  // ── Trainer progress for popup display ──────
  function getStatus() {
    return HallowTrainer.status();
  }

  return { init, scoreVector, getStatus };

})();

// ── Auto-init when script loads ───────────────
HallowScorer.init(); 
