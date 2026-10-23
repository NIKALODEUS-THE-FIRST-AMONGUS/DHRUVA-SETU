import { HARDWARE_SPECS } from './hardwareSpecs';

/**
 * Dhruva Setu - Cinematic Hardware Inspection Parts Registry
 * Phase 6A: Cinematic Inspection Registry
 *
 * Schema per entry:
 * {
 *   id: string,
 *   name: string,
 *   group: string,
 *   meshNames: string[],
 *   specKey: string | null,
 *   role: string,
 *   connectsTo: string[], // part IDs
 *   cameraPose: { pos: [x, y, z], target: [x, y, z], fov: number }
 * }
 */

export const PARTS_REGISTRY = [
  {
    id: 'hull',
    name: 'Spherical HDPE Buoy Hull & IP68 Cutaway',
    group: 'Marine Structure & Enclosure',
    meshNames: ['hull_back', 'hull_bottom', 'hull_top', 'acrylic_window', 'solas_band'],
    specKey: 'hull',
    role: 'Rotomolded marine-grade high-density polyethylene buoyant pressure envelope with optical acrylic cutaway for in-situ inspection.',
    connectsTo: ['pv_strips', 'antenna', 'winch_drum', 'tether'],
    cameraPose: {
      pos: [0.0, 1.4, 4.4],
      target: [0.0, 0.2, 0.0],
      fov: 44
    }
  },
  {
    id: 'pv_strips',
    name: 'Conformal Monocrystalline PV Strips',
    group: 'Renewable Power Generation',
    meshNames: ['solar_patch_0', 'solar_patch_1', 'solar_patch_2'],
    specKey: 'solar',
    role: 'Flexible SunPower Gen III Maxeon back-contact solar array conformally laminated over the spherical buoy dome to capture low polar sun angles.',
    connectsTo: ['mppt_regulator', 'hull', 'wiring_harness'],
    cameraPose: {
      pos: [1.8, 1.7, 3.0],
      target: [0.0, 0.75, 0.0],
      fov: 42
    }
  },
  {
    id: 'antenna',
    name: 'LoRa 433MHz Monopole & NavIC GNSS Patch',
    group: 'Surface Telemetry & Navigation',
    meshNames: ['lora_whip_antenna', 'copper_loading_coil', 'navic_gps_patch', 'mast_pillar'],
    specKey: 'pcb',
    role: 'Sub-GHz 433MHz high-gain omnidirectional whip antenna and dual-band NavIC/GPS L1 active patch for stationkeeping and satellite sync.',
    connectsTo: ['esp32_s3', 'wiring_harness', 'hull'],
    cameraPose: {
      pos: [0.75, 2.5, 2.1],
      target: [0.05, 1.85, 0.0],
      fov: 38
    }
  },
  {
    id: 'esp32_s3',
    name: 'ESP32-S3 Dual-Core Telemetry SoC',
    group: 'Avionics & Compute Hub',
    meshNames: ['esp32_can', 'esp32_pin_l', 'esp32_pin_r', 'led_sys_ok', 'led_lora_tx', 'led_ctd_rx'],
    specKey: 'esp32',
    role: '240MHz dual-core Xtensa LX7 surface computer executing FreeRTOS profiler management on Core 0 and RF downlink on Core 1.',
    connectsTo: ['sd_module', 'mppt_regulator', 'antenna', 'wiring_harness', 'kapton_pads'],
    cameraPose: {
      pos: [-0.14, 0.44, 0.98],
      target: [-0.16, 0.12, -0.04],
      fov: 28
    }
  },
  {
    id: 'sd_module',
    name: 'Micro-SD Black Box Flash Memory Slot',
    group: 'Telemetry & Persistent Storage',
    meshNames: ['sd_card_slot'],
    specKey: 'sd_card',
    role: 'Industrial high-endurance SPI flash storage logging raw uncompressed CTD halocline profiles, heave records, and acoustic breach logs.',
    connectsTo: ['esp32_s3'],
    cameraPose: {
      pos: [0.30, 0.36, 0.85],
      target: [0.28, 0.10, -0.22],
      fov: 24
    }
  },
  {
    id: 'mppt_regulator',
    name: 'MPPT Synchronous Buck-Boost Regulator',
    group: 'Power Conversion & Charging',
    meshNames: ['mppt_heatsink'],
    specKey: 'solar',
    role: 'High-efficiency TI BQ25792 maximum power point tracking buck-boost converter matching low-temperature solar output to battery curve.',
    connectsTo: ['pv_strips', 'inductor', 'battery_pack', 'esp32_s3'],
    cameraPose: {
      pos: [-0.14, 0.40, 1.05],
      target: [-0.16, 0.11, 0.20],
      fov: 28
    }
  },
  {
    id: 'inductor',
    name: 'Toroidal Power Filter Inductor',
    group: 'Power Conversion & Filtering',
    meshNames: ['toroid_power_inductor'],
    specKey: 'toroid_inductor',
    role: 'Heavy-gauge copper toroid choke providing high-frequency ripple suppression for clean subsea instrumentation bus power.',
    connectsTo: ['mppt_regulator', 'battery_pack'],
    cameraPose: {
      pos: [-0.04, 0.34, 0.95],
      target: [-0.04, 0.11, 0.20],
      fov: 24
    }
  },
  {
    id: 'battery_pack',
    name: '4S2P LiFePO4 Polar Battery Bank',
    group: 'Energy Storage Reserve',
    meshNames: ['battery_cell_0', 'battery_cell_1', 'battery_cell_2', 'battery_cell_3', 'battery_cell_4', 'battery_cell_5', 'battery_cell_6', 'battery_cell_7', 'battery_tray', 'bms_board', 'busbar_0', 'busbar_1', 'busbar_2'],
    specKey: 'battery',
    role: 'Cold-hardened 12.8V 6.4Ah lithium iron phosphate subsea bank providing 82Wh of reserve power (8+ days continuous polar night buffer).',
    connectsTo: ['kapton_pads', 'brass_terminals', 'retention_straps', 'mppt_regulator', 'wiring_harness'],
    cameraPose: {
      pos: [0.08, 0.02, 1.25],
      target: [0.05, -0.20, -0.10],
      fov: 34
    }
  },
  {
    id: 'kapton_pads',
    name: 'Flexible Polyimide Kapton Heating Pads',
    group: 'Thermal Protection Core',
    meshNames: ['battery_heater_pad', 'chassis_heater_pad', 'copper_heat_pipe', 'led_heater'],
    specKey: 'heater',
    role: 'Etched copper-foil serpentine heating elements maintaining lithium cells and avionics chamber at +4°C during Antarctic blizzards.',
    connectsTo: ['battery_pack', 'esp32_s3'],
    cameraPose: {
      pos: [0.05, 0.05, 1.20],
      target: [0.05, -0.18, -0.08],
      fov: 32
    }
  },
  {
    id: 'brass_terminals',
    name: 'Heavy-Duty Marine Brass Terminal Studs',
    group: 'Power Distribution',
    meshNames: ['term_pos_stud', 'term_pos_cap', 'term_neg_stud', 'term_neg_cap'],
    specKey: 'terminals',
    role: 'High-current gold-plated brass distribution lugs (+12.8V and GND) delivering low-resistance power coupling under freezing conditions.',
    connectsTo: ['battery_pack', 'wiring_harness'],
    cameraPose: {
      pos: [0.10, 0.16, 0.95],
      target: [0.05, -0.06, 0.0],
      fov: 24
    }
  },
  {
    id: 'retention_straps',
    name: 'Stainless Steel Battery Retention Straps',
    group: 'Mechanical Restraint',
    meshNames: ['retention_strap_l', 'retention_strap_r', 'thumbscrew_l', 'thumbscrew_r'],
    specKey: 'retention_straps',
    role: 'Grade 316 stainless steel bracket tie-downs with knurled captive thumbscrews immobilizing battery cells against violent sea heave.',
    connectsTo: ['battery_pack', 'hull'],
    cameraPose: {
      pos: [0.08, 0.05, 1.18],
      target: [0.05, -0.18, -0.10],
      fov: 32
    }
  },
  {
    id: 'winch_drum',
    name: 'Winch Spool Reel & Stepper Motor',
    group: 'Subsea Profiling Actuator',
    meshNames: ['winch_drum', 'cable_coil', 'winch_motor', 'gearbox_flange', 'slip_ring_capsule'],
    specKey: 'motor',
    role: 'Planetary geared NEMA-17 stepper motor and 12-channel gold rotary slip ring spooling 200m of Kevlar-braided umbilical.',
    connectsTo: ['wiring_harness', 'ctd_sonde', 'hull'],
    cameraPose: {
      pos: [0.0, -1.10, 2.60],
      target: [0.0, -1.80, 0.0],
      fov: 40
    }
  },
  {
    id: 'tether',
    name: 'Aramid Kevlar Tether & Subsea Swivel',
    group: 'Mooring & Stationkeeping',
    meshNames: ['swivel_ring', 'standoff_arm', 'anchor_block'],
    specKey: 'mooring',
    role: 'Para-Aramid 42kN tensile tether with Duplex 2205 anti-twist swivel anchoring the surface spar to the 350kg seabed clump sinker.',
    connectsTo: ['hull'],
    cameraPose: {
      pos: [1.60, -3.80, 4.40],
      target: [0.35, -5.50, 0.0],
      fov: 46
    }
  },
  {
    id: 'ctd_sonde',
    name: 'Autonomous CTD Sonde Titanium Housing',
    group: 'Oceanographic Instrumentation',
    meshNames: ['ctd_body', 'ctd_docking_collar', 'ctd_latch_ring', 'ctd_boot', 'ctd_stripe', 'ctd_cage'],
    specKey: 'ctd',
    role: 'Pressure-neutral grade 5 titanium profiling housing rated to 20 bar (200m depth) with integrated conical docking receiver interface.',
    connectsTo: ['winch_drum', 'ctd_sensors'],
    cameraPose: {
      pos: [0.45, -3.75, 2.70],
      target: [0.0, -3.95, 0.0],
      fov: 36
    }
  },
  {
    id: 'ctd_sensors',
    name: 'Conductivity Flow Cell & Pt1000 RTD',
    group: 'Oceanographic Instrumentation',
    meshNames: ['ctd_conductivity_cell', 'ctd_rtd_probe', 'ctd_led_beacon'],
    specKey: 'ctd',
    role: '4-electrode platinized quartz conductivity cell and Pt1000 Class 1/10 DIN RTD needle acquiring 8Hz halocline profiles.',
    connectsTo: ['ctd_sonde'],
    cameraPose: {
      pos: [0.22, -4.35, 1.85],
      target: [0.0, -4.68, 0.0],
      fov: 30
    }
  },
  {
    id: 'seal_tag',
    name: 'Seal-Borne Dorsal Biologger Tag',
    group: 'Mobile Biological Relay',
    meshNames: ['seal_tag_housing', 'seal_tag_strap'],
    specKey: 'seal',
    role: 'Hydrodynamic dorsal telemetry capsule mounted on Weddell seals with titanium saltwater conductivity breach switch.',
    connectsTo: ['seal_lora'],
    cameraPose: {
      pos: [0.35, 1.15, 2.05],
      target: [0.0, 0.50, 0.25],
      fov: 36
    }
  },
  {
    id: 'seal_lora',
    name: 'Seal Nitinol Whip & Telemetry Uplink',
    group: 'Mobile Biological Relay',
    meshNames: ['seal_lora_antenna', 'seal_tag_led'],
    specKey: 'seal',
    role: 'Flexible nitinol 433MHz Sub-GHz antenna and 12.5kHz acoustic transponder transmitting opportunistically during breathing surfacings.',
    connectsTo: ['seal_tag', 'antenna'],
    cameraPose: {
      pos: [0.25, 1.25, 1.65],
      target: [0.0, 0.60, 0.15],
      fov: 32
    }
  },
  {
    id: 'wiring_harness',
    name: 'Shielded Marine Silicone Wiring Harness',
    group: 'Electrical Bus & Cabling',
    meshNames: ['wire_bat_pos', 'wire_bat_neg', 'wire_solar_1', 'wire_solar_2', 'wire_winch_1', 'wire_winch_2', 'wire_winch_3', 'wire_winch_4', 'wire_coax', 'wire_i2c_a', 'wire_i2c_b'],
    specKey: 'wiring_harness',
    role: 'Dual-insulated subsea silicone cable routing high-current DC power, stepper motor phases, RG-316 RF coaxial and I2C telemetry.',
    connectsTo: ['esp32_s3', 'mppt_regulator', 'battery_pack', 'brass_terminals', 'winch_drum'],
    cameraPose: {
      pos: [0.12, 0.32, 1.20],
      target: [0.0, 0.05, 0.08],
      fov: 32
    }
  }
];

export function getPartById(id) {
  if (!id) return null;
  return PARTS_REGISTRY.find(p => p.id === id) || null;
}

export function getPartSpecs(specKey) {
  if (!specKey) return null;
  const specObj = HARDWARE_SPECS[specKey];
  if (!specObj) return null;
  return specObj;
}
