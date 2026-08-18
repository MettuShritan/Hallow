 // ─────────────────────────────────────────────
//  Hallow — Autoencoder Model
//  Learns YOUR behavioral patterns.
//  High reconstruction error = anomaly.
//
//  Input vector (12 features):
//  [avgDwell, stdDwell, avgFlight, stdFlight,
//   typingSpeed, avgMouseSpeed, stdMouseSpeed,
//   avgAngleChange, straightness,
//   avgScrollDelta, avgScrollInterval, scrollRate]
// ─────────────────────────────────────────────

const HallowModel = (() => {

  const INPUT_DIM  = 12;  // Feature vector size
  const LATENT_DIM = 6;   // Compressed representation
  let   model      = null;
  let   isReady    = false;

  // ── Build autoencoder architecture ──────────
  // Encoder: 12 → 8 → 6
  // Decoder: 6  → 8 → 12
  function buildModel() {
    const input = tf.input({ shape: [INPUT_DIM] });

    // Encoder
    const enc1 = tf.layers.dense({
      units: 8, activation: 'relu',
      kernelInitializer: 'glorotUniform',
      name: 'encoder_1',
    }).apply(input);

    const enc2 = tf.layers.dense({
      units: LATENT_DIM, activation: 'relu',
      kernelInitializer: 'glorotUniform',
      name: 'encoder_2',
    }).apply(enc1);

    // Decoder
    const dec1 = tf.layers.dense({
      units: 8, activation: 'relu',
      kernelInitializer: 'glorotUniform',
      name: 'decoder_1',
    }).apply(enc2);

    const output = tf.layers.dense({
      units: INPUT_DIM, activation: 'linear',
      name: 'decoder_output',
    }).apply(dec1);

    const autoencoder = tf.model({ inputs: input, outputs: output });

    autoencoder.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
    });

    return autoencoder;
  }

  // ── Initialize or load saved model ──────────
  async function init() {
    try {
      // Try to load saved model from IndexedDB
      model = await tf.loadLayersModel('indexeddb://hallow-model');
      console.log('[Hallow] Model loaded from storage');
      isReady = true;
    } catch {
      // No saved model — build fresh
      console.log('[Hallow] Building new model');
      model = buildModel();
      isReady = false; // Not trained yet
    }
    return isReady;
  }

  // ── Save model to IndexedDB ──────────────────
  async function save() {
    if (!model) return;
    await model.save('indexeddb://hallow-model');
    console.log('[Hallow] Model saved');
  }

  // ── Reconstruction error for one vector ─────
  // Lower error = matches your baseline
  // Higher error = anomaly
  function reconstructionError(vector) {
    if (!model || !isReady) return null;

    return tf.tidy(() => {
      const input  = tf.tensor2d([vector], [1, INPUT_DIM]);
      const output = model.predict(input);
      const error  = tf.losses.meanSquaredError(input, output);
      return error.dataSync()[0];
    });
  }

  // ── Convert error to trust score 0-100 ──────
  // Calibrated so:
  //   error < 0.01  → score ~95-100 (normal)
  //   error ~ 0.05  → score ~75     (suspicious)
  //   error > 0.15  → score ~30     (anomaly)
  function errorToScore(error, threshold) {
    const t = threshold || 0.05;
    const normalized = Math.min(error / (t * 3), 1);
    const score = Math.round((1 - normalized) * 100);
    return Math.max(0, Math.min(100, score));
  }

  // ── Getters ──────────────────────────────────
  const getModel   = () => model;
  const getReady   = () => isReady;
  const setReady   = (v) => { isReady = v; };

  return {
    init,
    save,
    buildModel,
    reconstructionError,
    errorToScore,
    getModel,
    getReady,
    setReady,
    INPUT_DIM,
  };

})();
