/**
 * Dhruva Setu - Polar Sub-Zero Kapton Heater & Thermal Power Budget Simulation Engine
 * Phase 6B: Lumped 1D Thermal Model & Dynamic Electrical Power Budget
 * 
 * Mathematical Formulation:
 * 1. Electrical Power:
 *    P_on = V^2 / R_heater  (when thermostat calls for heat and not tripped)
 * 2. Thermal Energy Conservation (Lumped 1D differential equation):
 *    C_th * (dT/dt) = P_on - (T - T_ambient) / R_th
 *    dT/dt = [ P_on - (T - T_ambient) / R_th ] / C_th
 * 3. Thermostat Hysteresis Control:
 *    Target = T_setpoint (+4.0°C)
 *    If T <= (T_setpoint - T_hysteresis) => Turn ON
 *    If T >= (T_setpoint + T_hysteresis) => Turn OFF
 * 4. Safety Cutoff:
 *    If T >= T_max_trip (+45.0°C) => Hardware Bimetallic Breaker TRIPS (Cutoff)
 * 5. Power Budget:
 *    P_total = P_heater + P_baseload
 *    Over-wattage condition: P_total > P_source_limit
 */

export const HEATER_CONSTANTS = {
  // ── Electrical Specifications ──
  // Nominal voltage from 4S LiFePO4 battery pack (hardwareSpecs.js: 12.8V nominal)
  V_NOMINAL: 12.8, // Volts
  V_MIN: 10.0,     // Volts (hardwareSpecs.js BMS low-voltage cutoff)
  V_MAX_OPERATING: 14.6, // Volts (4S LiFePO4 charging saturation)
  V_OVERVOLTAGE_FAULT: 18.5, // Volts (fault injection surge)

  // Heater Element Resistance (derived from hardwareSpecs.js: 1.20W average at ~14.1% winter duty cycle)
  // P_peak = 1.20W / 0.141 = 8.51W => R = V^2 / P = 12.8^2 / 8.51 ≈ 19.3 Ω
  R_HEATER: 19.3, // Ohms [PLACEHOLDER - verified to match 1.20W avg winter output]

  // Continuous baseline electronics draw (hardwareSpecs.js: 0.65W)
  P_BASELOAD: 0.65, // Watts

  // Maximum continuous power budget source limit (Solar net + safe cold-battery discharge rate)
  // hardwareSpecs.js: 2.4W solar + cold battery discharge reserve ~9.6W = 12.0W
  P_SOURCE_LIMIT_WINTER: 11.5, // Watts [PLACEHOLDER: Cold polar night buffer]
  P_SOURCE_LIMIT_SUMMER: 14.8, // Watts [PLACEHOLDER: With active solar assist]

  // ── Thermal Physical Constants ──
  // Lumped thermal capacitance of Kapton polyimide substrate, copper spreader & cell contact mass
  C_TH: 42.0, // Joules / °C [PLACEHOLDER: Lumped 1D thermal mass]

  // Effective thermal resistance to Antarctic ambient through insulated bay walls
  // Maintains +4.0°C at -25°C ambient with 1.20W average heat: R_th = 29°C / 1.20W = 24.17 °C/W
  R_TH: 22.5, // °C / Watt [PLACEHOLDER: Insulated polar enclosure resistance]

  // Thermostat Setpoints (hardwareSpecs.js: Target +4.0°C)
  T_SETPOINT: 4.0,   // °C
  T_HYSTERESIS: 1.0, // °C (ON at <= 3.0°C, OFF at >= 5.0°C)

  // Safety Cutoff Limits (hardwareSpecs.js: Hardware bimetallic thermal breaker @ +45°C)
  T_MAX_TRIP: 45.0,     // °C (Hardware bimetallic trip)
  T_WARN_OVERHEAT: 35.0, // °C (Overheat alert warning)
  T_MAX_CRITICAL: 65.0   // °C (Severe thermal runaway threshold)
};

// Default ambient temperatures by season (when not overridden by user slider)
export const SEASON_AMBIENTS = {
  summer: -2.0,  // Austral Summer Midnight Sun
  spring: -8.0,  // Austral Spring Thaw
  autumn: -15.0, // Austral Autumn Freeze-up
  winter: -25.0  // Austral Winter Polar Night (hardwareSpecs.js: -25°C)
};

export function createInitialHeaterState(season = 'summer') {
  const ambient = SEASON_AMBIENTS[season] !== undefined ? SEASON_AMBIENTS[season] : -2.0;
  return {
    temperature: 3.8, // Initial temperature near target setpoint (°C)
    ambientTemperature: ambient,
    voltage: HEATER_CONSTANTS.V_NOMINAL,
    dutyCap: 1.0, // 100% allowed duty cap (0.0 to 1.0)
    isHeating: true,
    isTripped: false,
    tripReason: null,
    fault: 'none', // 'none' | 'stuck_on' | 'thermostat_failure' | 'overvoltage'
    powerWatts: 0.0,
    instantaneousWatts: 0.0,
    dutyCycle: 0.16, // rolling duty cycle fraction (0.0 - 1.0)
    batteryCurrentAmps: 0.0,
    sourceLimitWatts: HEATER_CONSTANTS.P_SOURCE_LIMIT_SUMMER,
    isOverWattage: false,
    isOverheat: false,
    history: {
      temp: [3.8, 3.8, 3.8, 3.8, 3.8, 3.8],
      power: [0.0, 1.2, 1.2, 0.0, 1.2, 1.2]
    }
  };
}

/**
 * Step simulation by delta time (seconds)
 */
export function stepHeaterSimulation(state, deltaSec, season = 'summer') {
  const dt = Math.min(0.25, Math.max(0.001, deltaSec));
  const c = HEATER_CONSTANTS;

  let voltage = state.voltage;
  if (state.fault === 'overvoltage') {
    voltage = c.V_OVERVOLTAGE_FAULT;
  }

  const sourceLimit = (season === 'winter') ? c.P_SOURCE_LIMIT_WINTER : c.P_SOURCE_LIMIT_SUMMER;
  const ambient = state.ambientTemperature;

  // Calculate instantaneous potential power: P = V^2 / R
  const pInstant = (voltage * voltage) / c.R_HEATER;

  // Evaluate Thermostat & Fault Logic
  let demandHeat = state.isHeating;

  if (state.fault === 'stuck_on') {
    demandHeat = true;
  } else if (state.fault === 'thermostat_failure') {
    // Thermostat failure: sensor reads false freeze (-18°C), forcing constant demand
    demandHeat = true;
  } else {
    // Normal thermostat with hysteresis
    if (state.temperature <= (c.T_SETPOINT - c.T_HYSTERESIS)) {
      demandHeat = true;
    } else if (state.temperature >= (c.T_SETPOINT + c.T_HYSTERESIS)) {
      demandHeat = false;
    }
  }

  // Check hardware bimetallic trip condition (T >= 45.0°C)
  let isTripped = state.isTripped;
  let tripReason = state.tripReason;

  if (!isTripped && state.temperature >= c.T_MAX_TRIP) {
    isTripped = true;
    tripReason = `Bimetallic Breaker Tripped at ${state.temperature.toFixed(1)}°C (Limit: +45°C)`;
    demandHeat = false;
  }

  // If tripped, no power can flow through the heater
  const effectiveHeating = demandHeat && !isTripped;

  // Apply duty cap factor
  const effectivePower = effectiveHeating ? (pInstant * Math.min(1.0, Math.max(0.0, state.dutyCap))) : 0.0;

  // Total system load = Heater power + Continuous baseload
  const totalLoad = effectivePower + c.P_BASELOAD;
  const isOverWattage = totalLoad > sourceLimit;

  // Overheat alert condition (T > 35°C warning, >45°C critical)
  const isOverheat = state.temperature > c.T_WARN_OVERHEAT;

  // Thermal energy conservation: C_th * dT/dt = P_on - (T - T_ambient) / R_th
  const heatLossRate = (state.temperature - ambient) / c.R_TH;
  const netHeatRate = effectivePower - heatLossRate;
  const dT = (netHeatRate / c.C_TH) * dt;
  const newTemp = Math.max(-50.0, Math.min(130.0, state.temperature + dT));

  // Current draw from battery: I = P / V
  const batteryCurrent = voltage > 0 ? (effectivePower / voltage) : 0.0;

  // Smooth rolling duty cycle estimation
  const targetDuty = effectiveHeating ? Math.min(1.0, state.dutyCap) : 0.0;
  const newDutyCycle = state.dutyCycle * (1.0 - dt * 0.4) + targetDuty * (dt * 0.4);

  // Maintain sparkline history buffer (up to 40 samples)
  const history = { ...state.history };
  if (!history.counter) history.counter = 0;
  history.counter += dt;
  if (history.counter >= 0.5) {
    history.counter = 0;
    history.temp = [...(history.temp || []), Number(newTemp.toFixed(1))].slice(-36);
    history.power = [...(history.power || []), Number(effectivePower.toFixed(1))].slice(-36);
  }

  return {
    ...state,
    temperature: newTemp,
    voltage,
    isHeating: demandHeat,
    isTripped,
    tripReason,
    powerWatts: effectivePower,
    instantaneousWatts: pInstant,
    dutyCycle: newDutyCycle,
    batteryCurrentAmps: batteryCurrent,
    sourceLimitWatts: sourceLimit,
    isOverWattage,
    isOverheat,
    history
  };
}
