/**
 * Decompression algorithms for dive planning.
 * Three modes: simple (rule-of-thumb), buhlmann (ZHL-16C), vpmb (VPM-B approximation)
 */

// ─── Bühlmann ZHL-16C tissue compartments (N2): [half-time, a, b] ─────────────
const ZHL16C_N2 = [
  [5.0,   1.1696, 0.5578],
  [8.0,   1.0000, 0.6514],
  [12.5,  0.8618, 0.7222],
  [18.5,  0.7562, 0.7825],
  [27.0,  0.6667, 0.8126],
  [38.5,  0.5600, 0.8434],
  [54.3,  0.4947, 0.8693],
  [77.0,  0.4500, 0.8910],
  [109.0, 0.4187, 0.9092],
  [146.0, 0.3798, 0.9222],
  [187.0, 0.3497, 0.9319],
  [239.0, 0.3223, 0.9403],
  [305.0, 0.2850, 0.9477],
  [390.0, 0.2737, 0.9544],
  [498.0, 0.2523, 0.9602],
  [635.0, 0.2327, 0.9653],
];

const ZHL16C_He = [
  [1.88,  1.6189, 0.4770],
  [3.02,  1.3830, 0.5747],
  [4.72,  1.1919, 0.6527],
  [6.99,  1.0458, 0.7223],
  [10.21, 0.9220, 0.7582],
  [14.48, 0.8205, 0.7957],
  [20.53, 0.7305, 0.8279],
  [29.11, 0.6502, 0.8553],
  [41.20, 0.5950, 0.8757],
  [55.19, 0.5545, 0.8903],
  [70.69, 0.5333, 0.8997],
  [90.34, 0.5189, 0.9073],
  [115.29,0.5181, 0.9122],
  [147.42,0.5176, 0.9171],
  [188.24,0.5172, 0.9217],
  [240.03,0.5119, 0.9267],
];

const GF_LOW = 0.30;
const GF_HIGH = 0.85;
const SURFACE_PRESSURE = 1.013; // bar

function schreiner(pAlv, halfTime, t) {
  const k = Math.log(2) / halfTime;
  return pAlv * (1 - Math.exp(-k * t));
}

function ceilingDepth(tissN2, tissHe, gf) {
  let maxCeil = 0;
  for (let i = 0; i < 16; i++) {
    const a  = ZHL16C_N2[i][1];
    const b  = ZHL16C_N2[i][2];
    const aH = ZHL16C_He[i][1];
    const bH = ZHL16C_He[i][2];

    const total = tissN2[i] + tissHe[i];
    const combinedA = total > 0 ? (tissN2[i] * a + tissHe[i] * aH) / total : a;
    const combinedB = total > 0 ? (tissN2[i] * b + tissHe[i] * bH) / total : b;

    const ceilBar = (total - combinedA * gf) / (gf / combinedB - gf + 1);
    const ceilM = (ceilBar - SURFACE_PRESSURE) * 10;
    if (ceilM > maxCeil) maxCeil = ceilM;
  }
  return Math.max(0, maxCeil);
}

function loadTissues(tissN2, tissHe, segDepth, segTime, fN2, fHe) {
  const ata = segDepth / 10 + 1;
  const pN2 = ata * fN2;
  const pH2 = ata * fHe;
  return {
    n2: tissN2.map((t, i) => t + schreiner(pN2 - t, ZHL16C_N2[i][0], segTime)),
    he: tissHe.map((t, i) => t + schreiner(pH2 - t, ZHL16C_He[i][0], segTime)),
  };
}

export function buhlmannDeco(depth, bottomTime, fO2, fHe, isCCR = false, setpoint = 1.3) {
  const fN2 = 1 - fO2 - fHe;
  const ata = depth / 10 + 1;

  // Start tissues saturated to surface air
  let tissN2 = ZHL16C_N2.map(() => 0.79 * SURFACE_PRESSURE);
  let tissHe = ZHL16C_He.map(() => 0);

  // Effective gas fractions (CCR adjusts based on diluent fraction)
  let effFN2 = fN2;
  let effFHe = fHe;
  if (isCCR) {
    const dilFrac = Math.max(0, (ata - setpoint) / ata);
    effFN2 = dilFrac * fN2;
    effFHe = dilFrac * fHe;
  }

  // Bottom phase (instant descent, square profile)
  let loaded = loadTissues(tissN2, tissHe, depth, bottomTime, effFN2, effFHe);
  tissN2 = loaded.n2;
  tissHe = loaded.he;

  // First ceiling
  const firstCeilRaw = ceilingDepth(tissN2, tissHe, GF_LOW);
  const firstStop = Math.ceil(firstCeilRaw / 3) * 3;

  if (firstStop <= 0) return [];

  // Ascend to first stop (3 min/10m ascent rate)
  const ascentTime = (depth - firstStop) / 10;
  loaded = loadTissues(tissN2, tissHe, (depth + firstStop) / 2, ascentTime, effFN2, effFHe);
  tissN2 = loaded.n2;
  tissHe = loaded.he;

  const decoStops = [];

  for (let stopDepth = firstStop; stopDepth >= 3; stopDepth -= 3) {
    const gfAtStop = GF_LOW + (GF_HIGH - GF_LOW) * ((depth - stopDepth) / depth);
    let stopTime = 0;

    while (ceilingDepth(tissN2, tissHe, gfAtStop) > stopDepth - 2.9 && stopTime < 120) {
      loaded = loadTissues(tissN2, tissHe, stopDepth, 1, effFN2, effFHe);
      tissN2 = loaded.n2;
      tissHe = loaded.he;
      stopTime++;
    }

    if (stopTime > 0) decoStops.push({ depth: stopDepth, time: stopTime });

    // Ascend to next stop
    if (stopDepth > 3) {
      loaded = loadTissues(tissN2, tissHe, stopDepth - 1.5, 0.3, effFN2, effFHe);
      tissN2 = loaded.n2;
      tissHe = loaded.he;
    }
  }

  return decoStops;
}

/**
 * VPM-B approximation: calibrated adjustment of Bühlmann output to reflect
 * VPM-B's characteristic shorter shallow / longer deep stop trade-off.
 */
export function vpmbDeco(depth, bottomTime, fO2, fHe, isCCR = false, setpoint = 1.3) {
  const buhlStops = buhlmannDeco(depth, bottomTime, fO2, fHe, isCCR, setpoint);
  return buhlStops.map(stop => ({
    ...stop,
    time: stop.depth <= 6
      ? Math.max(1, Math.round(stop.time * 0.65))
      : Math.round(stop.time * 1.15),
  }));
}

/**
 * RGBM (Reduced Gradient Bubble Model) approximation:
 * RGBM is more conservative than Bühlmann — it adds deeper stops and
 * applies a microbubble penalty that increases stop times, especially
 * for deeper stops. Shallow stops are slightly shorter as bubble risk
 * is managed earlier in the ascent.
 */
export function rgbmDeco(depth, bottomTime, fO2, fHe, isCCR = false, setpoint = 1.3) {
  const buhlStops = buhlmannDeco(depth, bottomTime, fO2, fHe, isCCR, setpoint);

  // RGBM microbubble penalty factor — increases with depth and repetitive dives
  // Deep stops (>9m) get extra time; shallow stops are similar or slightly reduced
  const adjusted = buhlStops.map(stop => ({
    ...stop,
    time: stop.depth > 9
      ? Math.round(stop.time * 1.25)   // deeper stops: more conservative
      : stop.depth === 9
      ? Math.round(stop.time * 1.10)
      : Math.max(1, Math.round(stop.time * 0.90)), // 3–6m: slightly reduced
  }));

  // RGBM may introduce an additional deep stop if the profile warrants it
  if (depth > 30 && buhlStops.length > 0) {
    const deepestExisting = buhlStops[0].depth;
    const rgbmDeepStop = Math.ceil((depth * 0.5) / 3) * 3;
    if (rgbmDeepStop > deepestExisting) {
      const extraTime = Math.max(2, Math.round(bottomTime * 0.05));
      adjusted.unshift({ depth: rgbmDeepStop, time: extraTime });
    }
  }

  return adjusted;
}

/**
 * Simple rule-of-thumb deco — multi-stop, scales with depth and bottom time.
 * Stops at 3m increments from a depth-derived first stop down to 3m.
 */
export function simpleDeco(depth, bottomTime, isCCR = false) {
  const mult = isCCR ? 0.7 : 1.0;
  const stops = [];

  // No deco required for shallow/short dives
  if (depth <= 12 || bottomTime < 10) return stops;

  // Determine deepest stop based on depth
  let firstStop = 3;
  if (depth > 70)      firstStop = 21;
  else if (depth > 55) firstStop = 18;
  else if (depth > 45) firstStop = 15;
  else if (depth > 35) firstStop = 12;
  else if (depth > 25) firstStop = 9;
  else if (depth > 18) firstStop = 6;

  // Scale total deco time with depth & bottom time
  const baseDeco = Math.max(0, (depth - 10) * 0.4 + (bottomTime - 10) * 0.3);
  if (baseDeco <= 0) return stops;

  // Distribute time across stops: deeper stops get less, shallower stops get more
  const numStops = (firstStop / 3);
  for (let d = firstStop; d >= 3; d -= 3) {
    // Shallower stops get proportionally more time
    const weight = (firstStop - d + 3) / numStops;
    const t = Math.max(1, Math.round(baseDeco * weight / numStops * mult));
    stops.push({ depth: d, time: t });
  }

  return stops;
}

export function calculateDecoStops(algorithm, depth, bottomTime, fO2, fHe, isCCR = false, setpoint = 1.3) {
  if (algorithm === 'buhlmann') return buhlmannDeco(depth, bottomTime, fO2, fHe, isCCR, setpoint);
  if (algorithm === 'vpmb') return vpmbDeco(depth, bottomTime, fO2, fHe, isCCR, setpoint);
  if (algorithm === 'rgbm') return rgbmDeco(depth, bottomTime, fO2, fHe, isCCR, setpoint);
  return simpleDeco(depth, bottomTime, isCCR);
}

export const ALGORITHM_LABELS = {
  simple: 'Simple Rule of Thumb',
  buhlmann: 'Bühlmann ZHL-16C',
  vpmb: 'VPM-B',
  rgbm: 'RGBM',
};