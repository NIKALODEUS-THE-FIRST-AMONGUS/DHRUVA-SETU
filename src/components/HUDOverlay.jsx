import React, { useState, useEffect } from 'react';
import {
  Activity,
  Layers,
  Thermometer,
  Zap,
  Gauge,
  Compass,
  Cpu,
  Eye,
  Sliders,
  ShieldCheck,
  Radio,
  FileText,
  X
} from 'lucide-react';

/**
 * HUDOverlay.jsx
 * Industrial Dark UI with Cyan & Gold accents.
 * Features:
 * - Live 1 Hz Telemetry stream
 * - Exploded CAD Assembly slider
 * - View mode toggles (Normal, Exploded, Polar Blizzard, Power Flow)
 * - Component Inspection drawer with specifications & SIH BOM pricing (< ₹20,000)
 */
export function HUDOverlay({
  exploded,
  setExploded,
  viewMode,
  setViewMode,
  selectedComponent,
  onCloseInspect,
  onOpenBlueprint
}) {
  const [telemetry, setTelemetry] = useState({
    voltage: 12.8,
    intTemp: -1.5,
    sst: -1.82,
    salinity: 34.5,
    wavePeriod: 4.2,
    anomaly: 'NOMINAL',
    mpptPower: 14.6
  });

  // 1 Hz Telemetry Simulation Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry((prev) => ({
        voltage: +(12.75 + Math.random() * 0.15).toFixed(2),
        intTemp: +(-1.5 + (Math.random() - 0.5) * 0.2).toFixed(2),
        sst: +(-1.82 + (Math.random() - 0.5) * 0.05).toFixed(2),
        salinity: +(34.5 + (Math.random() - 0.5) * 0.1).toFixed(2),
        wavePeriod: +(4.2 + (Math.random() - 0.5) * 0.3).toFixed(1),
        anomaly: 'NOMINAL',
        mpptPower: +(14.2 + Math.random() * 0.8).toFixed(1)
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Component Technical Specifications Database
  const compDetails = {
    hull: {
      title: 'POM Delrin / HDPE Conical Hull',
      tier: 'Structural Envelope',
      cost: '₹2,800',
      specs: [
        { label: 'Material', value: 'High-Gloss POM Delrin / HDPE' },
        { label: 'Thermal Rating', value: '-40°C to +60°C Sub-Zero Safe' },
        { label: 'Anti-Fouling', value: 'Silicone Non-Stick Foul Release' },
        { label: 'Waterline Mark', value: 'Positive Metacentric Stability (GM > 0.45m)' }
      ],
      desc: 'High-impact conical Delrin hull designed for ice-slurry survivability and passive wave self-righting.'
    },
    solar: {
      title: 'Photovoltaic Solar Array & Anti-Bird Spikes',
      tier: 'Deck Power Harvester',
      cost: '₹1,500',
      specs: [
        { label: 'Cell Type', value: 'Monocrystalline PET Flexible Strips' },
        { label: 'Efficiency', value: '22.5% Low-Angle Polar Yield' },
        { label: 'Protection', value: 'UV & Marine Salt-Resistant Encapsulation' },
        { label: 'Bird Deterrent', value: '316L Stainless Steel Perimetric Spikes' }
      ],
      desc: 'Slanted upper ring solar cells harvesting polar summer sun with TP5100 MPPT buck converter.'
    },
    dome: {
      title: 'Polycarbonate Dome & Stevenson Radiation Shield',
      tier: 'Atmospheric Sensor & Comms',
      cost: '₹1,800',
      specs: [
        { label: 'Dome Material', value: 'UV-Stabilized Polycarbonate' },
        { label: 'RF Antennas', value: '433MHz LoRa + Iridium Satellite SBD' },
        { label: 'Met Sensor', value: 'SHT45 Humidity & TMP117 High-Precision Temp' },
        { label: 'Shielding', value: 'Tiered White Louvered Radiation Cupola' }
      ],
      desc: 'Hermetically sealed upper mast dome housing RF antennas and ambient weather telemetry.'
    },
    esp32: {
      title: 'ESP32-S3 Compute Deck & FreeRTOS Mainboard',
      tier: 'Tier 1 — Compute & Avionics',
      cost: '₹3,500',
      specs: [
        { label: 'Microcontroller', value: 'ESP32-S3 Dual-Core LX7 @ 240MHz' },
        { label: 'Firmware OS', value: 'ESP-IDF FreeRTOS Multi-Tasking' },
        { label: 'Motion IMU', value: 'BNO085 9-DOF Fused Wave Profiler' },
        { label: 'Data Logger', value: '32MB SPI Flash + Conformal MicroSD' },
        { label: 'Diagnostics', value: 'Closed-Hull Wi-Fi AP (Zero Port Leaks)' }
      ],
      desc: 'Main embedded avionics deck handling winch actuation, sensor polling, LoRa animal tag pings, and telemetry uplinks.'
    },
    battery: {
      title: 'Dual LiFePO4 Power Core in Kapton Thermal Foil',
      tier: 'Tier 2 — Power Core',
      cost: '₹4,200',
      specs: [
        { label: 'Chemistry', value: 'Lithium Iron Phosphate (LiFePO4)' },
        { label: 'Capacity', value: '12.8V 25Ah (320Wh Total Pack)' },
        { label: 'Thermal Wrap', value: 'Amber Kapton Polyimide + 12V PTC Heater' },
        { label: 'Freeze Protection', value: 'Thermal pulse activation @ -1.8°C seawater' }
      ],
      desc: 'Dual-bay thermal enclosure keeping battery cell core temperature > 5°C throughout the 6-month polar night.'
    },
    winch: {
      title: 'Motorized Worm Gearbox & Winch Drum',
      tier: 'Tier 3 — Profiling Actuation',
      cost: '₹3,200',
      specs: [
        { label: 'Gearbox', value: 'Cast Aluminum Worm Gear (Self-Locking)' },
        { label: 'Drive Motor', value: 'High-Torque NEMA 17 Stepper / 12V 40RPM' },
        { label: 'Tether Drum', value: '200m Kevlar-Reinforced PU Cable Spool' },
        { label: 'Rotary Feed', value: '6-Wire Gold-Contact Continuous Slip Ring' }
      ],
      desc: 'Precision winch lowering and retrieving the CTD sensor pod down to 200m depth columns.'
    },
    ctd: {
      title: 'Sub-Sea CTD Profiler Probe Payload',
      tier: 'Sub-Sea Sensor Cluster',
      cost: '₹3,200',
      specs: [
        { label: 'Acquisition Brain', value: 'TI MSP430 Bare Silicon Low-Power MCU' },
        { label: 'Pressure / Depth', value: 'GY-MS5837 24-bit Gel Cell (±1.5cm precision)' },
        { label: 'Temperature', value: 'DS18B20 316L Stainless Steel Needle' },
        { label: 'Salinity', value: 'Inductive Electrode-Less Toroidal Coil' },
        { label: 'Comms Loop', value: 'MAX485 Differential RS485 Transceivers' }
      ],
      desc: 'Tethered underwater probe performing high-resolution salinity, temperature, and depth profiling casts.'
    }
  };

  const currentComp = compDetails[selectedComponent];

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex flex-col justify-between p-4 font-sans text-slate-100">
      {/* =========================================================
          TOP HEADER: BRAND & 1Hz TELEMETRY STREAM
          ========================================================= */}
      <header className="pointer-events-auto flex items-center justify-between rounded-xl border border-cyan-500/30 bg-slate-950/85 px-5 py-3 shadow-[0_0_30px_rgba(0,229,255,0.15)] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
            <Compass className="h-5 w-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-base font-bold tracking-wider text-cyan-400">
                PROJECT DHRUVA SETU
              </h1>
              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-400">
                SIH PS 26065
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous Polar Ocean Observation & Marine Mammal Telemetry Buoy
            </p>
          </div>
        </div>

        {/* Live Telemetry Chips */}
        <div className="hidden items-center gap-4 md:flex">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <div className="text-right">
              <div className="text-[10px] text-slate-400">BATTERY</div>
              <div className="font-mono text-xs font-bold text-amber-400">
                {telemetry.voltage} V
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5">
            <Thermometer className="h-3.5 w-3.5 text-cyan-400" />
            <div className="text-right">
              <div className="text-[10px] text-slate-400">SST TEMP</div>
              <div className="font-mono text-xs font-bold text-cyan-400">
                {telemetry.sst} °C
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5">
            <Gauge className="h-3.5 w-3.5 text-emerald-400" />
            <div className="text-right">
              <div className="text-[10px] text-slate-400">SALINITY</div>
              <div className="font-mono text-xs font-bold text-emerald-400">
                {telemetry.salinity} PSU
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
            <div className="text-right">
              <div className="text-[10px] text-slate-400">TinyML STATUS</div>
              <div className="font-mono text-xs font-bold text-emerald-400">
                {telemetry.anomaly}
              </div>
            </div>
          </div>
        </div>

        {/* Blueprint & Info Button */}
        <button
          onClick={onOpenBlueprint}
          className="flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-400 transition-all hover:bg-cyan-500/20"
        >
          <FileText className="h-3.5 w-3.5" />
          <span>CAD BLUEPRINT</span>
        </button>
      </header>

      {/* =========================================================
          RIGHT SLIDE-OUT DRAWER: CLICKED COMPONENT INSPECTOR
          ========================================================= */}
      {currentComp && (
        <div className="pointer-events-auto absolute right-4 top-20 w-80 rounded-xl border border-cyan-500/40 bg-slate-950/90 p-4 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">
                {currentComp.tier}
              </span>
              <h3 className="font-mono text-sm font-bold text-cyan-400">{currentComp.title}</h3>
            </div>
            <button
              onClick={onCloseInspect}
              className="rounded p-1 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-2.5 text-xs leading-relaxed text-slate-300">{currentComp.desc}</p>

          <div className="mt-3 space-y-1.5">
            <div className="font-mono text-[10px] font-bold text-slate-400">
              ENGINEERING SPECIFICATIONS
            </div>
            {currentComp.specs.map((s, idx) => (
              <div
                key={idx}
                className="flex justify-between rounded bg-slate-900/70 px-2.5 py-1 text-xs"
              >
                <span className="text-slate-400">{s.label}:</span>
                <span className="font-mono font-semibold text-slate-200">{s.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-3 py-2">
            <span className="text-xs text-slate-300">BOM Cost Allocation:</span>
            <span className="font-mono text-sm font-bold text-emerald-400">
              {currentComp.cost}
            </span>
          </div>
        </div>
      )}

      {/* =========================================================
          BOTTOM CONTROL DECK: EXPLODED SLIDER & VIEW MODES
          ========================================================= */}
      <footer className="pointer-events-auto flex flex-wrap items-center justify-between gap-4 rounded-xl border border-cyan-500/30 bg-slate-950/85 p-3 shadow-lg backdrop-blur-md">
        {/* Exploded View Slider */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
            <Layers className="h-4 w-4" />
            <span>EXPLODED ASSEMBLY:</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={exploded}
            onChange={(e) => setExploded(parseFloat(e.target.value))}
            className="h-1.5 w-36 cursor-pointer appearance-none rounded-lg bg-slate-800 accent-cyan-400"
          />
          <span className="font-mono text-xs font-bold text-amber-400">
            {Math.round(exploded * 100)}%
          </span>
        </div>

        {/* Mode Selector Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('normal')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              viewMode === 'normal'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                : 'border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-cyan-500/50'
            }`}
          >
            NORMAL
          </button>
          <button
            onClick={() => setViewMode('xray')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              viewMode === 'xray'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                : 'border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-cyan-500/50'
            }`}
          >
            X-RAY VIEW
          </button>
          <button
            onClick={() => setViewMode('blizzard')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              viewMode === 'blizzard'
                ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-amber-500/50'
            }`}
          >
            POLAR BLIZZARD
          </button>
        </div>

        {/* Total Project BOM Badge */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-400">TOTAL ESTIMATED BOM:</span>
          <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-bold text-emerald-400">
            ~₹18,700 ($225 USD)
          </span>
        </div>
      </footer>
    </div>
  );
}
