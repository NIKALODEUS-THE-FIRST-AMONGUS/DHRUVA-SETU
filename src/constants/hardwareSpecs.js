export const HARDWARE_SPECS = {
  pcb: {
    title: "Avionics Motherboard & Dual-Core Gateway",
    badge: "Main Controller & RF Hub",
    costInr: 18500, // Default INR with 18% GST included
    desc: "Custom 4-layer FR4 navy motherboard with gold ENIG circuit traces, housing the ESP32-S3 surface telemetry computer, LoRa SX1278 RF front-end, and isolated power buses.",
    specs: [
      { k: "Processing Unit", v: "ESP32-S3 Dual-Core Xtensa LX7 @ 240MHz (512KB SRAM, 8MB Flash)" },
      { k: "RF Transceiver", v: "Semtech SX1278 (433.05 MHz Sub-GHz, +20dBm PA Boost)" },
      { k: "Barometric / Depth ADC", v: "TE MS5837-30BA (0.2 mbar resolution, 24-bit ΔΣ ADC)" },
      { k: "Real-Time OS", v: "FreeRTOS: Core 0 (Winch Profiler), Core 1 (RF Telemetry & Sensor Bus)" },
      { k: "Operating Envelope", v: "-45°C to +85°C Industrial Polar Hardened" },
      { k: "Telemetry Status LEDs", v: "SYS_OK (Green), LORA_TX (Amber), CTD_RX (Cyan)" }
    ]
  },
  esp32: {
    title: "Avionics Motherboard & Dual-Core Gateway",
    badge: "Main Controller & RF Hub",
    costInr: 18500,
    desc: "Custom 4-layer FR4 navy motherboard with gold ENIG circuit traces, housing the ESP32-S3 surface telemetry computer, LoRa SX1278 RF front-end, and isolated power buses.",
    specs: [
      { k: "Processing Unit", v: "ESP32-S3 Dual-Core Xtensa LX7 @ 240MHz (512KB SRAM, 8MB Flash)" },
      { k: "RF Transceiver", v: "Semtech SX1278 (433.05 MHz Sub-GHz, +20dBm PA Boost)" },
      { k: "Barometric / Depth ADC", v: "TE MS5837-30BA (0.2 mbar resolution, 24-bit ΔΣ ADC)" },
      { k: "Real-Time OS", v: "FreeRTOS: Core 0 (Winch Profiler), Core 1 (RF Telemetry & Sensor Bus)" },
      { k: "Operating Envelope", v: "-45°C to +85°C Industrial Polar Hardened" }
    ]
  },
  motor: {
    title: "Winch Stepper Motor & Planetary Gearbox",
    badge: "Layer 1 Actuator",
    costInr: 12800,
    desc: "High-torque bipolar stepper motor and 5:1 planetary reduction gearbox driving the subsea cable drum to lower and raise the CTD profiler continuously through Antarctic halocline layers.",
    specs: [
      { k: "Motor Architecture", v: "NEMA-17 Bipolar Hybrid Stepper (1.8° step angle)" },
      { k: "Reduction Gearbox", v: "5:1 Low-Backlash Planetary Gearhead with hardened steel pinions" },
      { k: "Holding Torque", v: "4.2 N·m (tested under 200m water column cable drag)" },
      { k: "Payout Speed", v: "0.15 m/s controlled descent / 0.20 m/s rapid retrieval" },
      { k: "Umbilical Cable", v: "Kevlar-braided 4-conductor polyurethane jacket (250m max)" },
      { k: "Position Encoder", v: "Magnetic Hall-Effect Quadrature Encoder (1024 CPR resolution)" }
    ]
  },
  heater: {
    title: "Sub-Zero PTC Thermal Anti-Freeze Core",
    badge: "Thermal Management",
    costInr: 4500,
    desc: "Internal pulse-width modulated PTC ceramic heating elements and copper heat-spreader bars preventing lithium battery freezing and gearbox lubrication thickening in Antarctic blizzard conditions.",
    specs: [
      { k: "Heating Technology", v: "Positive Temperature Coefficient (PTC) Self-Regulating Ceramic" },
      { k: "Rated Thermal Output", v: "1.20 Watts pulsed (14% average duty cycle in winter)" },
      { k: "Target Setpoint", v: "+4.0°C internal payload chamber temperature" },
      { k: "Ambient Conditions", v: "Operational down to -25°C air / -1.82°C polar seawater" },
      { k: "Protected Subsystems", v: "LiFePO4 electrolyte, winch bearing grease, optical window de-icing" },
      { k: "Safety Cutoff", v: "Hardware bimetallic thermal breaker @ +45°C" }
    ]
  },
  solar: {
    title: "Conformal Solar Photovoltaic Shell",
    badge: "Renewable Energy Harvest",
    costInr: 14200,
    desc: "Curved marine-grade monocrystalline solar photovoltaic array conformally bonded to the spherical buoy dome with integrated MPPT buck charging.",
    isSolarCalculator: true,
    specs: [
      { k: "Cell Efficiency", v: "23.2% SunPower Gen III Maxeon Back-Contact Cells" },
      { k: "Gross Rated Array Peak", v: "4.80 Watts (at STC 1000 W/m², AM 1.5)" },
      { k: "Polar Zenith Angle Loss", v: "-1.80 Watts (-37.5% reduction due to 72° low sun elevation)" },
      { k: "Ice Rime & Surface Albedo Loss", v: "-0.45 Watts (-9.4% frost & diffuse reflection loss)" },
      { k: "MPPT DC-DC Conversion Efficiency", v: "94.2% (TI BQ25792 Synchronous Buck-Boost Controller)" },
      { k: "Net Usable Solar Harvest", v: "2.40 Watts (Polar Summer Noon) / 0.0 W (Polar Night)" },
      { k: "Continuous Buoy Baseload", v: "0.65 Watts (ESP32-S3 + LoRa standby + sensors)" },
      { k: "Net Battery Recharging Power", v: "+1.75 Watts net positive storage to LiFePO4 bank" }
    ]
  },
  battery: {
    title: "4S2P LiFePO4 Polar Battery Bank",
    badge: "Chemical Energy Storage",
    costInr: 22500,
    desc: "Cold-hardened lithium iron phosphate subsea battery bank with active cell balancing, low-temperature charge cutoffs, and hermetic cell insulation.",
    specs: [
      { k: "Cell Chemistry", v: "Lithium Iron Phosphate (LiFePO4) - intrinsically safe" },
      { k: "Configuration", v: "4S2P (8x 26650 cells, 12.8V nominal, 6.4 Ah capacity)" },
      { k: "Total Energy Reserve", v: "81.92 Watt-hours (8+ days continuous polar night buffer)" },
      { k: "BMS Protection", v: "Over-voltage, under-voltage (10.0V cutoff), over-current, and thermal sensor" },
      { k: "Cycle Life", v: "> 3,500 cycles at 80% DoD down to -20°C" }
    ]
  },
  mooring: {
    title: "Aramid Kevlar Mooring & Cast-Iron Clump Anchor",
    badge: "Physical Stationkeeping & Anti-Tangle Standoff",
    costInr: 28500,
    desc: "High-modulus Para-Aramid (Kevlar-29) braided mooring line with stainless steel anti-twist swivel, sacrificial nylon compliance link, and dense cast-iron clump anchor (density 7,850 kg/m³). Features an eccentric keel standoff fairlead to ensure zero cable fouling with the winch-lowered CTD sonde.",
    specs: [
      { k: "Tensile Strength", v: "42 kN (4.2 Tonne Breaking Tenacity, 12-strand braided Kevlar-29)" },
      { k: "Clump Anchor Mass", v: "350 kg Cast-Iron Sinker Block with anti-drift mud flukes" },
      { k: "Seawater Weight Retention", v: "87% effective mass retention (far superior to concrete's 55%)" },
      { k: "Anti-Fouling Geometry", v: "45° Keel Standoff fairlead separating CTD cable from anchor tether" },
      { k: "Watch Circle Compliance", v: "2.8m radius elliptical sway under 45-knot gale & 1.2 knot current" },
      { k: "Swivel Assembly", v: "Duplex 2205 Stainless Steel Ball-Bearing Subsea Swivel (anti-kink)" }
    ]
  },
  ctd: {
    title: "Autonomous CTD Profiler (TI MSP430G2553)",
    badge: "Subsea Hydrographic Profiler",
    costInr: 48000,
    desc: "Precision conductivity, temperature, and depth instrument package deployed down to 200m depth with micro-power standby endurance and platinized electrodes.",
    specs: [
      { k: "Microcontroller", v: "TI MSP430G2553 16-bit Ultra-Low Power MCU" },
      { k: "Conductivity Cell", v: "4-Electrode Platinized Flow-Through Cell (0-60 mS/cm, ±0.003 mS/cm)" },
      { k: "Temperature Sensor", v: "Pt1000 Class 1/10 DIN RTD (±0.005°C oceanographic precision)" },
      { k: "Pressure / Depth Rating", v: "20 bar (200m water column hydrostatic rating, 0.05m accuracy)" },
      { k: "Sampling Frequency", v: "8 Hz continuous acquisition during profiling descent" }
    ]
  },
  seal: {
    title: "Layer 2: Seal-Borne Biologger Tag",
    badge: "Under-Ice Mobile Animal Relay",
    costInr: 32000,
    desc: "Non-invasive dorsal biologging telemetry tag mounted on Weddell seals (Leptonychotes weddellii), profiling under fast ice and burst-broadcasting upon surface breathing.",
    specs: [
      { k: "Surface Telemetry", v: "LoRa SX1278 (433.05 MHz Sub-GHz CSS Burst)" },
      { k: "Sub-surface Modem", v: "12.5 kHz Acoustic FSK Pinger (range ~1.5 km to buoy acoustic hydrophone)" },
      { k: "Sensory Package", v: "Pressure depth + Micro-RTD temperature + 3D accelerometer" },
      { k: "Breach Detection", v: "Titanium saltwater conductivity switch (<15ms response)" },
      { k: "Battery Endurance", v: "18 Months (Primary Tadiran Li-SOCl2 Cell)" }
    ]
  }
};
