 // ─────────────────────────────────────────────
//  Hallow — Trainer
//  Collects baseline behavioral vectors and
//  trains the autoencoder locally in-browser.
//
//  Training flow:
//  1. Collect 50+ vectors during first sessions
//  2. Normalize the data (z-score)
//  3. Train autoencoder on normalized vectors
//  4. Save model + normalization stats
//  5. From now on, score every new vector
// ─────────────────────────────────────────────

const HallowTrainer = (() => {

  const MIN_SAMPLES    = 50;   // Minimum vectors to start training
  const EPOCHS         = 60;   // Training epochs
  const BATCH_SIZE     = 8;
  const RETRAIN_EVERY  = 200;  // Retrain after this many new samples

  // Persistent state (saved to chrome.storage)
  let state = {
    baseline:     [],      // Raw feature vectors collected
    normMean:     null,    // Per-feature mean for normalization
    normStd:      null,    // Per-feature std dev for normalization
    threshold:    0.05,    // Anomaly threshold (auto-calibrated)
    sampleCount:  0,       // Total samples seen since last retrain
    trained:      false,   // Has the model been trained at least once
  };

  // ── Load state from chrome.storage ──────────
  async function load() {
    return new Promise(resolve => {
      chrome.storage.local.get(['hallowTrainerState'], data => {
        if (data.hallowTrainerState) {
          state = { ...state, ...data.hallowTrainerState };
        }
        resolve();
      });
    });
  }

  // ── Save state to chrome.storage ────────────
  async function save() {
    chrome.storage.local.set({ hallowTrainerState: state });
  }

  // ── Add a new feature vector to baseline ────
  async function addSample(vector) {
    if (!vector || vector.length !== HallowModel.INPUT_DIM) return;

    // Keep baseline size manageable (last 500 samples)
    state.baseline.push(vector);
    if (state.baseline.length > 500) state.baseline.shift();

    state.sampleCount++;

    // Auto-train triggers
    const shouldTrain =
      (!state.trained && state.baseline.length >= MIN_SAMPLES) ||
      (state.trained  && state.sampleCount >= RETRAIN_EVERY);

    if (shouldTrain) {
      await train();
      state.sampleCount = 0;
    }

    await save();
  }

  // ── Normalize vectors (z-score) ─────────────
  function computeNormStats(vectors) {
    const n   = vectors.length;
    const dim = vectors[0].length;

    const mean = new Array(dim).fill(0);
    const std  = new Array(dim).fill(0);

    // Compute mean per feature
    vectors.forEach(v => v.forEach((val, i) => { mean[i] += val / n; }));

    // Compute std dev per feature
    vectors.forEach(v => v.forEach((val, i) => {
      std[i] += Math.pow(val - mean[i], 2) / n;
    }));
    std.forEach((v, i) => { std[i] = Math.sqrt(v) || 1; }); // Avoid /0

    return { mean, std };
  }

  function normalize(vector, mean, std) {
    return vector.map((v, i) => (v - mean[i]) / std[i]);
  }

  // ── Train the autoencoder ────────────────────
  async function train() {
    if (state.baseline.length < MIN_SAMPLES) {
      console.log(`[Hallow] Need ${MIN_SAMPLES - state.baseline.length} more samples to train`);
      return false;
    }

    console.log(`[Hallow] Training on ${state.baseline.length} samples...`);

    try {
      // 1. Compute normalization stats
      const stats = computeNormStats(state.baseline);
      state.normMean = stats.mean;
      state.normStd  = stats.std;

      // 2. Normalize all baseline vectors
      const normalized = state.baseline.map(v => normalize(v, stats.mean, stats.std));

      // 3. Convert to tensor
      const xs = tf.tensor2d(normalized);

      // 4. Get or build model
      const m = HallowModel.getModel() || HallowModel.buildModel();

      // 5. Train
      await m.fit(xs, xs, {
        epochs:    EPOCHS,
        batchSize: BATCH_SIZE,
        shuffle:   true,
        verbose:   0,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 20 === 0) {
              console.log(`[Hallow] Epoch ${epoch}: loss = ${logs.loss.toFixed(6)}`);
            }
          },
        },
      });

      xs.dispose();

      // 6. Auto-calibrate threshold
      // Set threshold at 95th percentile of baseline errors
      const errors = normalized.map(v =>
        HallowModel.reconstructionError(v) || 0
      );
      errors.sort((a, b) => a - b);
      state.threshold = errors[Math.floor(errors.length * 0.95)] || 0.05;
      console.log(`[Hallow] Threshold calibrated: ${state.threshold.toFixed(5)}`);

      // 7. Save
      state.trained = true;
      HallowModel.setReady(true);
      await HallowModel.save();
      await save();

      console.log('[Hallow] Training complete ✅');
      return true;

    } catch (err) {
      console.error('[Hallow] Training failed:', err);
      return false;
    }
  }

  // ── Score a new vector ───────────────────────
  // Returns { trustScore, anomaly, riskLevel, error }
  function score(vector) {
    if (!state.trained || !HallowModel.getReady()) {
      // Not trained yet — return neutral score
      const remaining = Math.max(0, MIN_SAMPLES - state.baseline.length);
      return {
        trustScore: 100,
        anomaly:    false,
        riskLevel:  'unknown',
        error:      0,
        message:    remaining > 0
          ? `Collecting baseline — ${remaining} more samples needed`
          : 'Training in progress...',
      };
    }

    // Normalize the incoming vector
    const normalized = normalize(vector, state.normMean, state.normStd);

    // Get reconstruction error
    const error = HallowModel.reconstructionError(normalized);
    if (error === null) return { trustScore: 100, anomaly: false, riskLevel: 'unknown', error: 0 };

    // Convert to trust score
    const trustScore = HallowModel.errorToScore(error, state.threshold);

    // Determine risk level
    const ratio = error / state.threshold;
    const riskLevel =
      ratio < 0.6  ? 'low' :
      ratio < 1.0  ? 'medium' :
      ratio < 1.8  ? 'high' : 'critical';

    const anomaly = riskLevel === 'high' || riskLevel === 'critical';

    return { trustScore, anomaly, riskLevel, error, threshold: state.threshold };
  }

  // ── Status ───────────────────────────────────
  function status() {
    return {
      trained:     state.trained,
      samples:     state.baseline.length,
      minSamples:  MIN_SAMPLES,
      threshold:   state.threshold,
      progress:    Math.min(100, Math.round((state.baseline.length / MIN_SAMPLES) * 100)),
    };
  }

  // ── Reset (for testing) ──────────────────────
  async function reset() {
    state = { baseline: [], normMean: null, normStd: null, threshold: 0.05, sampleCount: 0, trained: false };
    chrome.storage.local.remove(['hallowTrainerState']);
    chrome.storage.local.remove(['tensorflowjs_models/hallow-model/info']);
    await save();
  }

  return { load, addSample, train, score, status, reset };

})();
