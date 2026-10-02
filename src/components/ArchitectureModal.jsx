import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, Cpu, BatteryCharging, Compass, ShieldCheck, Download, ChevronRight, Zap } from 'lucide-react';

export default function ArchitectureModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const subsystems = [
    {
      title: "Exterior Hull & Anti-Icing Enclosure",
      badge: "Hydrodynamic & Thermal",
      color: "border-amber-500/40 text-amber-400 bg-amber-500/10",
      description: "Conical POM Delrin/HDPE hull with high buoyancy-to-weight ratio. Slanted top facets angle dark-blue monocrystalline solar panels for low polar sun angles, ringed by stainless steel anti-bird spikes to protect top sensors from avian fouling.",
      specs: [
        { label: "Material", val: "UV-Stabilized HDPE / POM Delrin" },
        { label: "Reserve Buoyancy", val: "145% (Metacentric Height GM = 18.2 cm)" },
        { label: "Ice Shedding", val: "Superhydrophobic silicone foul-release coat" },
        { label: "Ballast", val: "16.1 kg Cast Keel Counterweight" }
      ]
    },
    {
      title: "Tier 1: Compute, TinyML & RF Telemetry Deck",
      badge: "Edge AI & Low-Power Control",
      color: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
      description: "Custom conformal-coated high-density FR4 PCB hosting the ESP32-S3 dual-core microcontroller with TinyML inference engine for real-time anomaly detection, TPL5110 nano-power timer, and multi-band LoRa/Satellite uplink transceiver.",
      specs: [
        { label: "Main Processor", val: "ESP32-S3 Dual Tensilica LX7 @ 240MHz" },
        { label: "Sleep Current", val: "22 µA with TPL5110 Power Gating" },
        { label: "Edge AI Model", val: "TensorFlow Lite Micro (CTD Anomaly Classifier)" },
        { label: "Comms Link", val: "433MHz SX1268 LoRa + NEO-M9N GNSS" }
      ]
    },
    {
      title: "Tier 2: Dual LiFePO4 Power Core & Thermal Envelope",
      badge: "Sub-Zero Energy Storage",
      color: "border-amber-400/40 text-amber-300 bg-amber-400/10",
      description: "Twin 12.8V 25Ah (300Wh total) LiFePO4 battery modules encased in gold Kapton thermal polyimide barrier film with closed-cell aerogel insulation and low-loss TP5100 MPPT solar charge controllers.",
      specs: [
        { label: "Chemistry", val: "Grade-A LiFePO4 (2000+ Cycles @ -20°C)" },
        { label: "Thermal Shield", val: "Multi-layer Kapton Film + 12V Pulse Heater" },
        { label: "Solar Harvester", val: "4x 15W High-Efficiency Shingled Cells" },
        { label: "Operational Life", val: "18+ Months Autonomous Endurance" }
      ]
    },
    {
      title: "Tier 3: Autonomous Profiling Winch & Slip Ring",
      badge: "Robotic Depth Profiling",
      color: "border-cyan-500/40 text-cyan-400 bg-cyan-500/10",
      description: "Precision planetary/worm gear assembly powered by a high-torque NEMA stepper motor with rotary optical encoder and 6-channel gold-alloy mercury-free slip ring for continuous sub-sea telemetry transmission during spooling.",
      specs: [
        { label: "Tether Depth", val: "0 to 200m Profile Range (Kevlar Reinforced)" },
        { label: "Descent Speed", val: "0.2 m/s Controlled Profiling Descent" },
        { label: "Gearbox Ratio", val: "40:1 Self-Locking Worm Reduction" },
        { label: "Slip Ring", val: "IP68 Submersible 6-Conductor Signal Ring" }
      ]
    },
    {
      title: "Sub-Sea Deep-Water CTD Science Pod",
      badge: "Polar Ocean Sensing",
      color: "border-sky-500/40 text-sky-400 bg-sky-500/10",
      description: "Streamlined titanium/HDPE hydrodynamic sensor pod housing high-accuracy digital conductivity, temperature, and piezoresistive hydrostatic pressure sensors with RS485 differential bus communications.",
      specs: [
        { label: "Depth Sensor", val: "MS5837-30BA (0.2 cm Resolution)" },
        { label: "Temp Precision", val: "±0.05°C (Fast-Response Platinum RTD)" },
        { label: "Salinity Range", val: "0 - 45 PSU (Toroidal Inductive Cell)" },
        { label: "Pressure Rating", val: "30 Bar / 300m Hydrostatic Proof" }
      ]
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/50 flex flex-col overflow-hidden text-slate-200"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-slate-950/60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-wide text-white uppercase flex items-center gap-2">
                  <span>Project Dhruva Setu</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    SIH PS 26065 / MoES
                  </span>
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Autonomous Low-Cost Ocean Observation Platform for Polar & Southern Oceans
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-transparent hover:border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content - Scrollable */}
          <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
            {/* Top Overview Card */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-blue-950/40 border border-cyan-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-mono text-cyan-400 font-semibold mb-1 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> SYSTEM SUMMARY
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                  Low-cost, self-righting polar oceanographic buoy engineered for extreme sub-zero conditions (-30°C to +40°C), equipped with automated vertical profiling winch, high-yield solar harvesting, and TinyML sensor-health analytics for less than ₹20,000 total BOM cost.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <div className="px-4 py-2 rounded-lg bg-slate-950/80 border border-emerald-500/30 text-center">
                  <div className="text-[10px] font-mono text-emerald-400">TOTAL BOM COST</div>
                  <div className="text-base font-bold text-white font-mono">₹18,700 (~$225)</div>
                </div>
                <div className="px-4 py-2 rounded-lg bg-slate-950/80 border border-cyan-500/30 text-center">
                  <div className="text-[10px] font-mono text-cyan-400">DEPTH RATING</div>
                  <div className="text-base font-bold text-white font-mono">200m Profile</div>
                </div>
              </div>
            </div>

            {/* Subsystems Breakdown */}
            <div className="space-y-4">
              <h3 className="text-sm font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-2">
                <span>3-Tier Cutaway Architecture & Core Subsystems</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subsystems.map((sub, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-cyan-500/40 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h4 className="text-sm font-semibold text-white">{sub.title}</h4>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${sub.color}`}>
                          {sub.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed mb-4">
                        {sub.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80 text-[11px] font-mono">
                      {sub.specs.map((sp, idx) => (
                        <div key={idx} className="bg-slate-900/60 p-1.5 rounded border border-slate-800/60">
                          <span className="text-slate-500 block text-[9px]">{sp.label}</span>
                          <span className="text-slate-200 font-medium">{sp.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3 border-t border-cyan-500/20 bg-slate-950/80 flex items-center justify-between text-xs font-mono text-slate-400">
            <div>CONFIDENTIAL • MINISTRY OF EARTH SCIENCES (MoES) / SIH 2024-2026</div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors"
            >
              Close Blueprint
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
