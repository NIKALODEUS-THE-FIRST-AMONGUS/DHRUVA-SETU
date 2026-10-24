import React, { useState, useEffect } from 'react';
import { Play, Square, X, Compass, Anchor, Cpu, Waves, Radio, ShieldCheck, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Move } from 'lucide-react';

export default function TourPresentationOverlay({
  tourSeconds,
  onExitTour,
  currentDepth,
  activeRegion,
  onGoToSlide
}) {
  const totalSeconds = 120;
  const progressPercent = Math.min(100, (tourSeconds / totalSeconds) * 100);

  // 6 Presentation Slides (20 seconds each)
  const slides = [
    {
      id: 1,
      timeWindow: "00:00 - 00:20",
      phaseTag: "PHASE 1 // POLAR MANDATE",
      title: "Prydz Bay Marginal Ice Zone",
      subTitle: "MoES & NCPOR Indigenous Ocean Observing Mandate",
      icon: Compass,
      desc: "Deploying an autonomous polar observatory in the Southern Ocean (Indian Sector) to monitor rapid freshwater freshening, polar front heat flux, and melting Antarctic ice sheet dynamics.",
      points: [
        "Positioned at 68°22'S, 76°45'E in the high-energy Marginal Ice Zone (MIZ).",
        "Continuous Gerstner wave synthesis with wave-ice damping from pancake floes.",
        "Zero environmental footprint with non-invasive acoustic instrumentation."
      ],
      metrics: [
        { label: "COORDINATES", val: "68°22'S, 76°45'E" },
        { label: "WIND SPEED", val: "38 kts" },
        { label: "AIR TEMP", val: "-14.2°C" }
      ]
    },
    {
      id: 2,
      timeWindow: "00:20 - 00:40",
      phaseTag: "PHASE 2 // HYDRODYNAMICS",
      title: "6-DOF Spar Buoy & Mooring",
      subTitle: "Stokes Drift Damping & 280kg Benthic Clump Anchor",
      icon: Anchor,
      desc: "A high-aspect-ratio slender spar buoy engineered with 6 degrees-of-freedom compliance to minimize heave and pitch resonance in heavy Southern Ocean swells.",
      points: [
        "12-strand braided Kevlar-29 catenary line with Duplex 2205 anti-kink swivel.",
        "280 kg cast-iron gravity clump anchor with anti-drift mud flukes at -48m.",
        "45° eccentric keel fairlead ensures zero cable tangling with profiling CTD."
      ],
      metrics: [
        { label: "SURFACE DRIFT", val: "1.2 kts" },
        { label: "MOORING TENSION", val: "4.8 kN" },
        { label: "WATCH RADIUS", val: "2.8m" }
      ]
    },
    {
      id: 3,
      timeWindow: "00:40 - 01:00",
      phaseTag: "PHASE 3 // AVIONICS & BOM",
      title: "Internal Avionics & 20K BOM",
      subTitle: "ESP32-S3 FreeRTOS, MPPT Solar & Cold-Hardened LiFePO4",
      icon: Cpu,
      desc: "Housed in a hermetically sealed acrylic cutaway chamber with internal amber heating, the dual-core ESP32-S3 computer orchestrates autonomous winch profiling and LoRa RF telemetry.",
      points: [
        "Optimized Student Prototype BOM: ₹19,450 INR (strictly within ₹20K cap).",
        "TI BQ24650 synchronous MPPT controller harvesting 2.4W net polar solar energy.",
        "4S2P cold-hardened LiFePO4 battery with 8+ days dark winter polar endurance."
      ],
      metrics: [
        { label: "STUDENT BOM", val: "₹19,450" },
        { label: "SOLAR HARVEST", val: "2.40 Watts" },
        { label: "MCU CLOCK", val: "240 MHz" }
      ]
    },
    {
      id: 4,
      timeWindow: "01:00 - 01:20",
      phaseTag: "PHASE 4 // HALOCLINE PROFILING",
      title: "Autonomous CTD Winch Sounding",
      subTitle: "Two-Layer Oceanographic Profiler (0m to -200m Abyss)",
      icon: Waves,
      desc: "A motorized subsea winch continuously reels a precision micro-CTD sonde through the Antarctic Surface Water (AASW) into the warm Modified Circumpolar Deep Water (MCDW).",
      points: [
        "Real-time EOS-80 seawater density and sound velocity duct computation.",
        "Detects pycnocline shear transition and basal meltwater layers at ~38m.",
        "Platinized conductivity electrodes with 8 Hz continuous vertical logging."
      ],
      metrics: [
        { label: "ACTIVE DEPTH", val: `${currentDepth.toFixed(1)}m` },
        { label: "HALOCLINE", val: "~38.0m" },
        { label: "SOUND SPEED", val: "1449.2 m/s" }
      ]
    },
    {
      id: 5,
      timeWindow: "01:20 - 01:40",
      phaseTag: "PHASE 5 // BIO-LOGGING RELAY",
      title: "Weddell Seal Acoustic Network",
      subTitle: "Layer 2 Animal-Borne Mobile Ocean Sensing (<800m Cone)",
      icon: Radio,
      desc: "Wild Weddell seals (Leptonychotes weddellii) foraging under heavy sea ice carry non-invasive biologging CTD tags, opportunistically offloading ocean data to the buoy.",
      points: [
        "Acoustic 12.5 kHz FSK hydrophone uplink harvests subsea seal profiles.",
        "Burst LoRa RF packet transmission upon seal surface breathing in ice leads.",
        "Bypasses pack ice barriers to map uncharted under-ice coastal polynyas."
      ],
      metrics: [
        { label: "SEAL POD", val: "4 Tags" },
        { label: "DIVE RECORD", val: "184m" },
        { label: "ACOUSTIC RANGE", val: "800m" }
      ]
    },
    {
      id: 6,
      timeWindow: "01:40 - 02:00",
      phaseTag: "PHASE 6 // TELEMETRY & BASE",
      title: "Bharati Station & ISRO Satellite",
      subTitle: "National Polar Cyber-Physical Infrastructure (ISRO Sync)",
      icon: ShieldCheck,
      desc: "Real-time polar ocean telemetry relays to India's permanent Antarctic station, Bharati, and uplinks directly to ISRO Oceansat-3 polar-orbiting satellites.",
      points: [
        "Direct RF link across Larsemann Hills coastal base station receiver.",
        "Syncs with NCPOR oceanographic climate models for Southern Ocean monitoring.",
        "Fully autonomous, self-healing polar IoT architecture ready for deployment."
      ],
      metrics: [
        { label: "DOWNLINK", val: "Bharati Base" },
        { label: "SATELLITE", val: "Oceansat-3" },
        { label: "STATUS", val: "100% OK" }
      ]
    }
  ];

  const currentSlideIndex = Math.min(5, Math.floor(tourSeconds / 20));
  const currentSlide = slides[currentSlideIndex] || slides[0];
  const Icon = currentSlide.icon;

  // Problem 3: Dynamic 4-corner positions with slight coordinates randomization to never block 3D center
  const [cornerIndex, setCornerIndex] = useState(0);
  const [isMobileMinimized, setIsMobileMinimized] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);

  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      setTouchStartX(e.touches[0].clientX);
      setTouchStartY(e.touches[0].clientY);
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null || touchStartY === null || !e.changedTouches || !e.changedTouches[0]) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    // Dominant horizontal swipe > 40px
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0) {
        handleNextSlide();
      } else {
        handlePrevSlide();
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  // Auto-cycle corner when slide changes to keep 3D simulation visible
  useEffect(() => {
    // 4 corners: 0: Bottom-Left, 1: Bottom-Right, 2: Top-Right, 3: Top-Left
    setCornerIndex((currentSlideIndex * 3 + 1) % 4);
  }, [currentSlideIndex]);

  const cornerStyles = [
    { bottom: '86px', left: '32px' },                           // Bottom-Left
    { bottom: '86px', right: '32px', left: 'auto' },             // Bottom-Right
    { top: '88px', right: '32px', bottom: 'auto', left: 'auto' }, // Top-Right
    { top: '88px', left: '32px', bottom: 'auto' }               // Top-Left
  ];

  const activeCornerStyle = cornerStyles[cornerIndex % cornerStyles.length];

  const handleNextSlide = () => {
    const nextIdx = (currentSlideIndex + 1) % slides.length;
    if (onGoToSlide) onGoToSlide(nextIdx);
  };

  const handlePrevSlide = () => {
    const prevIdx = (currentSlideIndex - 1 + slides.length) % slides.length;
    if (onGoToSlide) onGoToSlide(prevIdx);
  };

  const handleCycleCorner = () => {
    setCornerIndex(prev => (prev + 1) % 4);
  };

  const formatMinutes = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="tour-presentation-hud oswald-modal" role="region" aria-label="Slide Show Executive Presentation">
      {/* Cinematic Top Letterbox Bar */}
      <div className="tour-cinematic-header">
        <div className="tour-header-left">
          <div className="tour-live-dot pulse-anim" />
          <div className="tour-header-titles">
            <span className="tour-title-super oswald-badge">SIH-26065 GRAND FINALE // EXECUTIVE SLIDE SHOW</span>
            <span className="tour-title-main oswald-bold">Autonomous Dual-Layer Polar Observatory</span>
          </div>
        </div>

        {/* Horizontal Timeline Pips */}
        <div className="tour-header-center">
          <div className="tour-slide-timeline-row">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                className={`timeline-step-pip ${idx === currentSlideIndex ? 'active' : (idx < currentSlideIndex ? 'completed' : '')}`}
                onClick={() => onGoToSlide && onGoToSlide(idx)}
                title={`Jump to Slide ${idx + 1}: ${s.title}`}
              >
                <span className="step-num number-bebas">0{idx + 1}</span>
              </button>
            ))}
          </div>
          <div className="tour-clock-badge number-bebas">
            {formatMinutes(tourSeconds)} / {formatMinutes(totalSeconds)} (120S)
          </div>
        </div>

        <div className="tour-header-right">
          <button
            type="button"
            className="tour-exit-btn oswald-bold"
            onClick={onExitTour}
            title="Exit Presentation Slide Show [Esc]"
          >
            <X size={15} />
            <span>EXIT SLIDE SHOW [ESC]</span>
          </button>
        </div>
      </div>

      {/* Progress Track Ribbon */}
      <div className="tour-progress-track">
        <div
          className="tour-progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Presentation Slide Card (Dynamically Positioned in 4 Corners or Minimized on Mobile) */}
      <div
        className={`tour-slide-card glass-panel dynamic-corner-card ${isMobileMinimized ? 'is-mobile-minimized' : ''}`}
        style={isMobileMinimized ? undefined : activeCornerStyle}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {isMobileMinimized ? (
          /* Sleek Minimized Bottom Bar for Mobile: 100% 3D Viewability */
          <div className="tour-minimized-bar" onClick={() => setIsMobileMinimized(false)}>
            <div className="tour-min-info">
              <span className="slide-counter-badge number-bebas">0{currentSlideIndex + 1}/06</span>
              <span className="tour-min-title oswald-bold">{currentSlide.title}</span>
              <span className="tour-min-time number-bebas">{currentSlide.timeWindow}</span>
            </div>
            <div className="tour-min-actions" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="tour-min-nav-btn"
                onClick={handlePrevSlide}
                title="Previous Slide"
                aria-label="Previous Slide"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="tour-min-nav-btn"
                onClick={handleNextSlide}
                title="Next Slide"
                aria-label="Next Slide"
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                className="tour-min-expand-btn oswald-bold"
                onClick={() => setIsMobileMinimized(false)}
                title="Expand Full Slide Card"
                aria-label="Expand Full Slide Card"
              >
                <ChevronUp size={15} />
                <span>EXPAND</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="tour-card-header">
              <div className="tour-slide-badge-row">
                <span className="slide-phase-badge oswald-badge">{currentSlide.phaseTag}</span>
                <span className="slide-counter-badge number-bebas">SLIDE 0{currentSlideIndex + 1} / 06</span>
                <span className="slide-time-badge number-bebas">{currentSlide.timeWindow}</span>

                {/* Mobile Peek/Minimize Toggle Button */}
                <button
                  type="button"
                  className="slide-peek-btn oswald-bold"
                  onClick={() => setIsMobileMinimized(true)}
                  title="Minimize card to peek at 3D simulation"
                  aria-label="Minimize card to peek at 3D simulation"
                >
                  <ChevronDown size={14} />
                  <span>PEEK 3D</span>
                </button>

                <button
                  type="button"
                  className="slide-reposition-btn oswald-bold"
                  onClick={handleCycleCorner}
                  title="Relocate Slide to Another Corner (Keep 3D View Clear)"
                >
                  <Move size={12} />
                  <span>REPOSITION [⤢]</span>
                </button>
              </div>

              <div className="tour-slide-title-group">
                <div className="slide-icon-box">
                  <Icon size={24} className="accent-cyan" />
                </div>
                <div>
                  <h2 className="slide-title-text oswald-bold">{currentSlide.title}</h2>
                  <div className="slide-subtitle-text oswald-sub">{currentSlide.subTitle}</div>
                </div>
              </div>
            </div>

            <p className="tour-slide-desc oswald-body">{currentSlide.desc}</p>

            {/* Engineering Highlights */}
            <div className="tour-slide-points">
              {currentSlide.points.map((pt, pIdx) => (
                <div key={pIdx} className="slide-point-item">
                  <span className="point-bullet-dot">◆</span>
                  <span className="point-text oswald-body">{pt}</span>
                </div>
              ))}
            </div>

            {/* Real-time Telemetry Metrics Strip with Bebas Neue for Numbers */}
            <div className="tour-slide-metrics-strip">
              {currentSlide.metrics.map((m, mIdx) => (
                <div key={mIdx} className="slide-metric-item">
                  <span className="metric-label oswald-bold">{m.label}:</span>
                  <span className="metric-val number-bebas">{m.val}</span>
                </div>
              ))}
            </div>

            {/* Swipe gesture hint on mobile */}
            <div className="tour-mobile-swipe-hint oswald-sub">
              <span>⇄ SWIPE LEFT / RIGHT TO CHANGE SLIDE</span>
            </div>

            {/* Next & Previous Slide Buttons with Full Functionality */}
            <div className="slide-nav-controls-row">
              <button
                type="button"
                className="slide-nav-btn prev oswald-bold"
                onClick={handlePrevSlide}
                title="Previous Slide"
              >
                <ChevronLeft size={16} />
                <span>PREV SLIDE</span>
              </button>

              <span className="slide-nav-indicator number-bebas">
                0{currentSlideIndex + 1} / 06
              </span>

              <button
                type="button"
                className="slide-nav-btn next oswald-bold"
                onClick={handleNextSlide}
                title="Next Slide"
              >
                <span>NEXT SLIDE</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Cinematic Bottom HUD Ribbon */}
      <div className="tour-cinematic-footer">
        <div className="footer-left-status oswald-sub">
          <span>REGION: <strong className="accent-cyan oswald-bold">{activeRegion?.shortName || "PRYDZ BAY MIZ"}</strong></span>
          <span>DEPTH: <strong className="accent-amber number-bebas">{currentDepth.toFixed(1)}M</strong></span>
          <span>ORBITAL SYNC: <strong className="accent-green oswald-bold">ISRO OCEANSAT-3 LOCKED</strong></span>
        </div>
        <div className="footer-right-tip oswald-body">
          Slide Show Presentation • Auto Corner Repositioning Active • Press [Esc] to exit
        </div>
      </div>
    </div>
  );
}
