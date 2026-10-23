/**
 * Prydz Bay MIZ Ocean Current & Drift Model (68°22'S, 76°45'E)
 * ====================================================================
 * Regional oceanographic baseline documentation:
 * 
 * 1. Mean surface flow: Westward flow driven by the Antarctic Slope Current (ASC),
 *    the Antarctic Coastal Current (East Wind Drift), and the southern limb of the
 *    cyclonic Prydz Bay Gyre. Base heading ~270° (due West), allowed to vary
 *    roughly +/-40° [230° to 310°]. (approximation)
 * 
 * 2. Mean surface speed: 0.05 to 0.20 m/s (5 to 20 cm/s) across seasonal baselines.
 *    (approximation)
 * 
 * 3. Seasonal stability: In-situ moorings and satellite altimetry show no seasonal
 *    reversal in the mean westward flow. The direction is strictly preserved
 *    across Austral Summer, Autumn, Winter, and Spring. (approximation)
 * 
 * 4. Wind drift: Coastal winds along Ingrid Christensen Coast and the Amery Ice Shelf
 *    margin are predominantly Easterly or South-Easterly (katabatic-influenced).
 *    Surface drift is ~2-3% of 10m wind speed, deflected to the LEFT of the downwind
 *    direction due to Coriolis force in the Southern Hemisphere (Ekman deflection
 *    angle ~30°-40°). (approximation)
 * 
 * 5. Tides: Mixed diurnal/semidiurnal tides (dominated by K1, O1, M2, S2)
 *    produce a small elliptical oscillatory velocity component (~0.015 - 0.025 m/s).
 *    (approximation)
 * 
 * 6. Slow noise: Mesoscale eddies and baroclinic instabilities introduce low-frequency
 *    fluctuations with correlation times on the order of tens of minutes (10 - 45 min).
 *    (approximation)
 * 
 * Model Equation:
 *   current(t) = meanCurrent(season) + windDriftComponent + tidal + slowNoise
 */

// Mulberry32 deterministic seeded PRNG
function createPRNG(seedVal) {
  let s = (Math.abs(Math.floor(seedVal)) || 123456789) >>> 0;
  return function() {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Convert meteorological/nautical heading (degrees clockwise from North) to 3D Cartesian vector.
 * Convention:
 *   0° (North) -> (0, -1)
 *  90° (East)  -> (1,  0)
 * 180° (South) -> (0,  1)
 * 270° (West)  -> (-1, 0)
 */
export function headingToVector(headingDeg, speed) {
  const rad = (headingDeg * Math.PI) / 180;
  return {
    x: Math.sin(rad) * speed,
    z: -Math.cos(rad) * speed
  };
}

/**
 * Convert 3D Cartesian (x, z) flow vector to heading (degrees) and magnitude (speed).
 */
export function vectorToHeading(x, z) {
  const speed = Math.hypot(x, z);
  if (speed < 1e-6) {
    return { headingDeg: 270.0, speed: 0.0 };
  }
  let deg = (Math.atan2(x, -z) * 180) / Math.PI;
  if (deg < 0) deg += 360;
  return { headingDeg: deg, speed };
}

// Seasonal configuration baselines for Prydz Bay MIZ
const SEASON_CONFIGS = {
  summer: {
    name: 'Austral Summer (Midnight Sun)',
    meanSpeed: 0.078,       // m/s (approximation)
    windSpeed: 4.8,         // m/s (approximation)
    windFromDeg: 110.0,     // E-SE (approximation)
    windDriftRatio: 0.0065, // MIZ partial sea ice cover
    tideAmp: 0.016          // m/s (approximation)
  },
  winter: {
    name: 'Austral Winter (Polar Night)',
    meanSpeed: 0.068,       // m/s (approximation: heavy sea ice cover dampens drift)
    windSpeed: 7.5,         // m/s (approximation: cold katabatic gusts)
    windFromDeg: 125.0,     // SE (approximation)
    windDriftRatio: 0.0050, // Sea ice attenuation
    tideAmp: 0.014          // m/s (approximation)
  },
  autumn: {
    name: 'Autumn Freeze-up (Blizzard)',
    meanSpeed: 0.082,       // m/s (approximation)
    windSpeed: 16.5,        // m/s (approximation: gale-force blizzard winds)
    windFromDeg: 100.0,     // Easterly blizzard (approximation)
    windDriftRatio: 0.0035, // High form drag & grease ice damping
    tideAmp: 0.018          // m/s (approximation)
  },
  blizzard: {
    name: 'Autumn Freeze-up (Blizzard)',
    meanSpeed: 0.082,       // m/s (approximation)
    windSpeed: 16.5,        // m/s (approximation)
    windFromDeg: 100.0,     // Easterly blizzard (approximation)
    windDriftRatio: 0.0035, // High form drag & grease ice damping
    tideAmp: 0.018          // m/s (approximation)
  },
  spring: {
    name: 'Austral Spring Thaw',
    meanSpeed: 0.076,       // m/s (approximation)
    windSpeed: 6.2,         // m/s (approximation)
    windFromDeg: 115.0,     // E-SE (approximation)
    windDriftRatio: 0.0060,
    tideAmp: 0.016          // m/s (approximation)
  },
  rain: {
    name: 'Polar Sleet / Rain',
    meanSpeed: 0.076,       // m/s (approximation)
    windSpeed: 6.5,         // m/s (approximation)
    windFromDeg: 118.0,     // E-SE (approximation)
    windDriftRatio: 0.0060,
    tideAmp: 0.016          // m/s (approximation)
  },
  aurora: {
    name: 'Clear Winter Night (Aurora)',
    meanSpeed: 0.065,       // m/s (approximation)
    windSpeed: 3.8,         // m/s (approximation: calm katabatic lull)
    windFromDeg: 125.0,     // SE (approximation)
    windDriftRatio: 0.0050,
    tideAmp: 0.013          // m/s (approximation)
  }
};

class PrydzBayCurrentModel {
  constructor(initialSeed = null) {
    // Resolve initial seed from URL parameter ?seed= or randomly generate
    this.seed = this._resolveInitialSeed(initialSeed);
    this.currentSeasonKey = 'summer';
    this.previousSeasonKey = 'summer';
    this.seasonChangeTime = 0.0;
    this.transitionDuration = 5.0; // 5+ second smooth continuous blend

    this._initNoiseHarmonics();
  }

  _resolveInitialSeed(forcedSeed) {
    if (forcedSeed !== null && forcedSeed !== undefined) {
      return Number(forcedSeed);
    }
    if (typeof window !== 'undefined' && window.location) {
      try {
        const params = new URLSearchParams(window.location.search);
        const s = params.get('seed');
        if (s !== null && !isNaN(Number(s))) {
          return Number(s);
        }
      } catch (e) {}
    }
    return Math.floor(Math.random() * 899999) + 100000;
  }

  setSeed(newSeed) {
    this.seed = Number(newSeed);
    this._initNoiseHarmonics();
  }

  getSeed() {
    return this.seed;
  }

  setSeason(seasonKey, currentTime = 0.0) {
    const key = String(seasonKey || 'summer').toLowerCase();
    const resolvedKey = SEASON_CONFIGS[key] ? key : 'summer';
    if (resolvedKey !== this.currentSeasonKey) {
      this.previousSeasonKey = this.currentSeasonKey;
      this.currentSeasonKey = resolvedKey;
      this.seasonChangeTime = currentTime;
    }
  }

  _initNoiseHarmonics() {
    const rng = createPRNG(this.seed);

    // Multi-harmonic Fourier series generating smooth low-frequency noise (correlation time 10 - 45 min)
    // 4 distinct frequency bands with seeded phases and bounded amplitude
    this.noiseOctaves = [
      { period: 2700.0 + rng() * 600.0, phase: rng() * Math.PI * 2, weight: 0.012 }, // ~45 min
      { period: 1800.0 + rng() * 400.0, phase: rng() * Math.PI * 2, weight: 0.008 }, // ~30 min
      { period: 1200.0 + rng() * 300.0, phase: rng() * Math.PI * 2, weight: 0.006 }, // ~20 min
      { period: 750.0  + rng() * 200.0, phase: rng() * Math.PI * 2, weight: 0.003 }  // ~12.5 min
    ];

    // Seeded tidal phase offsets
    this.tidePhaseX = rng() * Math.PI * 2;
    this.tidePhaseZ = rng() * Math.PI * 2;
  }

  _getBlendedSeasonParams(t) {
    const target = SEASON_CONFIGS[this.currentSeasonKey] || SEASON_CONFIGS.summer;
    const prev = SEASON_CONFIGS[this.previousSeasonKey] || target;

    if (this.currentSeasonKey === this.previousSeasonKey || t <= this.seasonChangeTime) {
      return target;
    }

    const elapsed = t - this.seasonChangeTime;
    const progress = Math.min(1.0, Math.max(0.0, elapsed / this.transitionDuration));
    // Smoothstep cubic easing: 3x^2 - 2x^3 (zero derivative at endpoints, no sudden jumps)
    const alpha = progress * progress * (3 - 2 * progress);

    const targetDrift = target.windDriftRatio || 0.006;
    const prevDrift = prev.windDriftRatio || targetDrift;

    return {
      name: target.name,
      meanSpeed: prev.meanSpeed + (target.meanSpeed - prev.meanSpeed) * alpha,
      windSpeed: prev.windSpeed + (target.windSpeed - prev.windSpeed) * alpha,
      windFromDeg: prev.windFromDeg + (target.windFromDeg - prev.windFromDeg) * alpha,
      windDriftRatio: prevDrift + (targetDrift - prevDrift) * alpha,
      tideAmp: prev.tideAmp + (target.tideAmp - prev.tideAmp) * alpha
    };
  }

  /**
   * Evaluates the complete physical current model at simulation time t (in seconds).
   * Returns consistent current vector, wind vector, ice drift vector, and telemetry.
   */
  get(t = 0.0) {
    const params = this._getBlendedSeasonParams(t);

    // 1. Mean Westward Current Vector (Heading 270°)
    // Never flipped by season; stable westward Antarctic Slope Current
    const meanHeading = 270.0;
    const meanVec = headingToVector(meanHeading, params.meanSpeed);

    // 2. Wind Vector & Ekman Surface Drift Component
    // Coastal wind blows FROM windFromDeg (approx 100° to 125°, E-SE)
    // Downwind heading = (windFromDeg + 180) % 360 (approx 280° to 305°, W-NW)
    const downwindHeading = (params.windFromDeg + 180.0) % 360.0;
    const windVec = headingToVector(downwindHeading, params.windSpeed);

    // In Southern Hemisphere, Ekman surface drift is deflected ~30° to the LEFT of downwind
    const ekmanDeflectionDeg = 32.0; // Leftward (counter-clockwise)
    const driftHeading = (downwindHeading - ekmanDeflectionDeg + 360.0) % 360.0;
    const windDriftRatio = params.windDriftRatio || 0.006;
    const driftSpeed = params.windSpeed * windDriftRatio;
    const windDriftVec = headingToVector(driftHeading, driftSpeed);

    // 3. Tidal Oscillation Component
    // Principal lunar semidiurnal M2 tidal harmonic (T = 12.42 hrs = 44712 seconds)
    const tidalOmega = (2.0 * Math.PI) / 44712.0;
    const tideX = Math.cos(t * tidalOmega + this.tidePhaseX) * params.tideAmp;
    const tideZ = Math.sin(t * tidalOmega + this.tidePhaseZ) * (params.tideAmp * 0.55);

    // 4. Slow Noise Component (Ornstein-Uhlenbeck / Fourier synthesis)
    // Smooth, low-frequency mesoscale noise with tens of minutes correlation time
    let noiseHeadingOffset = 0.0;
    let noiseSpeedOffset = 0.0;
    for (let i = 0; i < this.noiseOctaves.length; i++) {
      const oct = this.noiseOctaves[i];
      const angle = (t * 2.0 * Math.PI) / oct.period + oct.phase;
      noiseHeadingOffset += Math.sin(angle) * (oct.weight * 650.0); // Bounded angle perturbation
      noiseSpeedOffset += Math.cos(angle * 1.13) * oct.weight;
    }

    // Combine components into raw current vector
    let rawX = meanVec.x + windDriftVec.x + tideX;
    let rawZ = meanVec.z + windDriftVec.z + tideZ;

    const rawHeadingInfo = vectorToHeading(rawX, rawZ);
    let totalHeading = rawHeadingInfo.headingDeg + noiseHeadingOffset;
    let totalSpeed = Math.max(0.045, rawHeadingInfo.speed + noiseSpeedOffset);

    // Strictly enforce the regional physical band: 270° +/- 40° [230° to 310°]
    // Using a smooth hyperbolic tangent clamp so heading never clips abruptly at boundaries
    const headingDeviation = totalHeading - 270.0;
    const maxDeviation = 36.0; // Comfortably within +/-40° band [234° to 306°]
    const boundedDeviation = Math.tanh(headingDeviation / maxDeviation) * maxDeviation;
    const finalHeading = 270.0 + boundedDeviation;

    // Strictly enforce the regional physical speed band: 0.05 to 0.20 m/s (5 to 20 cm/s)
    // Using a smooth hyperbolic tangent clamp centered around 0.115 m/s with +/-0.065 m/s reach
    // (guarantees bounds [0.050, 0.180] m/s under any turbulence, seed, or wind surge)
    const targetMidSpeed = 0.115;
    const maxSpeedDev = 0.065;
    const speedDev = totalSpeed - targetMidSpeed;
    const finalSpeed = targetMidSpeed + Math.tanh(speedDev / maxSpeedDev) * maxSpeedDev;

    // Final unified current vector
    const finalVec = headingToVector(finalHeading, finalSpeed);

    // Sea ice floes drift with a combined hydrodynamic balance: 85% ocean current + 15% wind drag
    const iceDriftVec = {
      x: finalVec.x * 0.85 + (windVec.x / (params.windSpeed || 1.0)) * 0.035,
      z: finalVec.z * 0.85 + (windVec.z / (params.windSpeed || 1.0)) * 0.035
    };

    return {
      x: finalVec.x,
      z: finalVec.z,
      headingDeg: Number(finalHeading.toFixed(1)),
      speedMps: Number(finalSpeed.toFixed(4)),
      speedCmpSec: Number((finalSpeed * 100.0).toFixed(1)),
      wind: {
        x: windVec.x,
        z: windVec.z,
        speedMps: Number(params.windSpeed.toFixed(1)),
        downwindHeadingDeg: Number(downwindHeading.toFixed(1)),
        windFromDeg: Number(params.windFromDeg.toFixed(1))
      },
      iceDrift: iceDriftVec,
      seasonName: params.name,
      seed: this.seed
    };
  }
}

// Global Singleton Instance for Dhruva Setu Simulator
export const currentModel = new PrydzBayCurrentModel();

if (typeof window !== 'undefined') {
  window.__debug = window.__debug || {};
  window.__debug.setSeed = (n) => currentModel.setSeed(n);
  window.__debug.getSeed = () => currentModel.getSeed();
  window.__debug.getCurrent = (t = 0) => currentModel.get(t);
  window.__debug.setSeason = (s, t = 0) => currentModel.setSeason(s, t);
}

export default currentModel;
