import React from 'react';
import { X, Award, ShieldCheck, Users, IndianRupee, Compass, Layers, Radio } from 'lucide-react';

export default function TeamDetailsModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="team-details-modal-card oswald-modal glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="team-modal-header">
          <div className="team-badge-row">
            <span className="team-sih-pill oswald-badge">SMART INDIA HACKATHON // GRAND FINALE</span>
            <span className="team-ps-pill oswald-badge">PS SIH-26065</span>
          </div>
          <button
            type="button"
            className="team-modal-close-btn"
            onClick={onClose}
            title="Close [Esc]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Project Branding */}
        <div className="team-hero-block">
          <div className="team-hero-icon">
            <Compass size={28} className="accent-cyan" />
          </div>
          <div>
            <h2 className="team-hero-title oswald-bold">TEAM DHRUVA SETU</h2>
            <p className="team-hero-mandate oswald-sub">
              Ministry of Earth Sciences (MoES) &amp; National Centre for Polar and Ocean Research (NCPOR)
            </p>
          </div>
        </div>

        {/* Core Problem Statement & Mandate */}
        <div className="team-info-card">
          <div className="team-card-label oswald-bold">PROBLEM STATEMENT OBJECTIVE</div>
          <p className="team-card-text oswald-body">
            Indigenous development of a self-powered, two-layer autonomous polar ocean monitoring buoy capable of surviving sub-zero Antarctic freeze-up in the Southern Ocean, continuous pycnocline CTD profiling down to 200m depth, and opportunistic biologger relay through foraging Weddell seal pods.
          </p>
        </div>

        {/* Financial Innovation & Student BOM Compliance Matrix */}
        <div className="team-financial-grid">
          <div className="fin-box student-cap">
            <div className="fin-tag-row">
              <IndianRupee size={14} className="accent-green" />
              <span className="fin-label oswald-bold">STUDENT PROTOTYPE BOM</span>
              <span className="fin-badge-ok oswald-badge">WITHIN ₹20K CAP</span>
            </div>
            <div className="fin-amount number-bebas">₹19,450</div>
            <div className="fin-sub oswald-body">
              Strictly compliant with SIH refundable grant limit of ₹20,000 INR (including 18% GST). Optimized with open-hardware industrial sensors, 3D-printed PETG housings, and commercial-off-the-shelf MCU cores.
            </div>
          </div>

          <div className="fin-box commercial-target">
            <div className="fin-tag-row">
              <ShieldCheck size={14} className="accent-cyan" />
              <span className="fin-label oswald-bold">COMMERCIAL DEPLOYMENT SPEC</span>
              <span className="fin-badge-ind oswald-badge">INDUSTRIAL GRADE</span>
            </div>
            <div className="fin-amount number-bebas">₹1,24,500</div>
            <div className="fin-sub oswald-body">
              Target for deep-sea expedition trials funded through NCPOR institutional grants. Features Duplex 2205 stainless swivel, platinized 4-electrode conductivity cells, and class 1/10 DIN RTD temperature probes.
            </div>
          </div>
        </div>

        {/* Key System Innovations */}
        <div className="innovations-list">
          <div className="innov-item">
            <Layers size={14} className="accent-cyan" />
            <span className="oswald-body"><strong className="oswald-bold">Two-Layer Sensor Architecture:</strong> Layer 1 Winch-Lowered CTD profiler + Layer 2 Seal Bio-logger Relay.</span>
          </div>
          <div className="innov-item">
            <Radio size={14} className="accent-amber" />
            <span className="oswald-body"><strong className="oswald-bold">Zero-Cost Telemetry:</strong> LoRa SX1278 (433MHz) long-range chirp link to coastal Bharati Station + ISRO Oceansat downlink.</span>
          </div>
          <div className="innov-item">
            <Award size={14} className="accent-green" />
            <span className="oswald-body"><strong className="oswald-bold">Anti-Fouling Keel Standoff:</strong> 45° eccentric fairlead isolating Kevlar catenary anchor line from profiling winch cable.</span>
          </div>
        </div>

        <div className="team-modal-footer">
          <span className="footer-tagline oswald-sub">Designed &amp; Engineered with pride for Indian Antarctic Research</span>
          <button type="button" className="team-dismiss-btn oswald-bold" onClick={onClose}>
            Close Details [Esc]
          </button>
        </div>
      </div>
    </div>
  );
}
