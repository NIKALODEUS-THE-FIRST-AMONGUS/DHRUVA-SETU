import React, { useState, useMemo } from 'react';
import {
  Anchor, Waves, Eye, Camera, Layers, Box, Play, Square, Cpu,
  Thermometer, Droplets, Activity, Radio, ChevronUp, ChevronDown, Compass,
  BarChart2, Binary, ShieldCheck, ChevronLeft, ChevronRight, Lock, Unlock
} from 'lucide-react';
import { CONFIG } from '../../constants/config';

export default function UnifiedControlDeck({
  currentDepth,
  onChangeDepth,
  isAutoProfiling,
  onToggleAutoProfile,
  activeRegion,
  cameraPreset,
  onChangeCamera,
  explodedView,
  onToggleExploded,
  sealBreachData,
  isFollowingCTD,
  onDisengageCTD,
  onEngageCTD,
  isMinimizedProp,
  onToggleMinimize,
  onContractDeck
}) {
  const [activeTab, setActiveTab] = useState('winch');
  const [internalMinimized, setInternalMinimized] = useState(true);
  const isMinimized = isMinimizedProp !== undefined ? isMinimizedProp : internalMinimized;

  const setIsMinimized = (val) => {
    if (typeof val === 'function') {
      const nextVal = val(isMinimized);
      if (onToggleMinimize) onToggleMinimize(nextVal);
      setInternalMinimized(nextVal);
    } else {
      if (onToggleMinimize) onToggleMinimize(val);
      setInternalMinimized(val);
    }
  };

  const [hoveredDeckTab, setHoveredDeckTab] = useState(null);

  // Hydrographic formulas for CTD tab
  const hydro = activeRegion?.hydrography || {
    haloclineDepth: CONFIG.HALOCLINE_DEPTH_M,
    surfaceTemp: CONFIG.HALOCLINE_T_SURF,
    deepTemp: CONFIG.HALOCLINE_T_DEEP,
    surfaceSalinity: CONFIG.HALOCLINE_S_SURF,
    deepSalinity: CONFIG.HALOCLINE_S_DEEP,
    transitionWidth: 12.0,
    layerNameSurface: "ANTARCTIC SURFACE WATER (AASW)",
    layerNameHalocline: "⚡ PYCNOCLINE / HALOCLINE TRANSITION",
    layerNameDeep: "MODIFIED CIRCUMPOLAR DEEP WATER (MCDW)"
  };

  const [ctdGraphMode, setCtdGraphMode] = useState('profile'); // 'profile' or 'ts'

  // Dynamic hydrographic calculations for active depth
  const sigmoid = (z, center, width) => 1.0 / (1.0 + Math.exp(-(z - center) / width));
  const tFactor = sigmoid(currentDepth, hydro.haloclineDepth, hydro.transitionWidth || 12.0);
  const currentTemp = hydro.surfaceTemp + tFactor * (hydro.deepTemp - hydro.surfaceTemp);
  const sFactor = sigmoid(currentDepth, hydro.haloclineDepth, (hydro.transitionWidth || 12.0) * 1.15);
  const currentSalinity = hydro.surfaceSalinity + sFactor * (hydro.deepSalinity - hydro.surfaceSalinity);
  const soundSpeed = (1449.2 + 4.6 * currentTemp - 0.055 * Math.pow(currentTemp, 2) + 1.34 * (currentSalinity - 35) + 0.016 * currentDepth).toFixed(1);

  // UNESCO EOS-80 Seawater Density (approx kg/m³) & Hydrostatic Pressure (Bar)
  const currentDensity = (1000 + 28.1 + (currentDepth * 0.045) + (currentSalinity - 35) * 0.78 - (currentTemp + 1.8) * 0.06).toFixed(2);
  const hydrostaticPressure = (1.0 + (currentDepth * 1025 * 9.81) / 100000).toFixed(2);

  // Pre-calculated sampling points for Depth Sounding Profile (0 to 200m)
  const profileCurvePoints = useMemo(() => {
    const pts = [];
    const step = 8;
    for (let z = 0; z <= 200; z += step) {
      const tf = sigmoid(z, hydro.haloclineDepth, hydro.transitionWidth || 12.0);
      const t = hydro.surfaceTemp + tf * (hydro.deepTemp - hydro.surfaceTemp);
      const sf = sigmoid(z, hydro.haloclineDepth, (hydro.transitionWidth || 12.0) * 1.15);
      const s = hydro.surfaceSalinity + sf * (hydro.deepSalinity - hydro.surfaceSalinity);
      
      const xT = 10 + Math.max(0, Math.min(110, ((t - (-2.0)) / 4.0) * 110));
      const xS = 140 + Math.max(0, Math.min(110, ((s - 33.5) / 1.5) * 110));
      const y = 5 + (z / 200) * 75;
      pts.push({ z, t, s, xT, xS, y });
    }
    return pts;
  }, [hydro]);

  // Water layer calculation
  let layerLabel = hydro.layerNameSurface;
  if (Math.abs(currentDepth - hydro.haloclineDepth) < (hydro.transitionWidth || 10.0)) {
    layerLabel = hydro.layerNameHalocline;
  } else if (currentDepth > hydro.haloclineDepth) {
    layerLabel = hydro.layerNameDeep;
  }

  // Isolated 3D Camera Angles based on active polar scenario
  const cameraViews = useMemo(() => {
    return [
      { id: 'wide', label: 'Panoramic Vista', sub: 'Southern Ocean Horizon & MIZ', icon: Layers },
      { id: 'buoy', label: 'Spar Buoy', sub: 'Surface Spar 6-DOF Wave Hydrodynamics', icon: Anchor },
      { id: 'electronics_a', label: 'Part A: Antenna & Solar', sub: '433MHz Whip, GPS & Flexible PV Conduit', icon: Radio },
      { id: 'electronics', label: 'Part B: PCB & Heaters', sub: 'Main Hull, ESP32-S3 & Kapton Heaters', icon: Cpu },
      { id: 'electronics_c', label: 'Part C: Motor & HDPE Tubes', sub: 'Winch Motor, Slip Rings & Keel Guide', icon: Box },
      { id: 'ctd', label: 'CTD Profiler', sub: 'Underwater Halocline Sonde (-200m)', icon: Waves },
      { id: 'seal', label: 'Seal Pod (4x)', sub: 'Natural Foraging Weddell Seal Pod', icon: Eye },
      ...(activeRegion?.id === 'bharati_station' ? [
        { id: 'station', label: 'Bharati Station 🇮🇳', sub: 'Larsemann Hills Antarctic Base', icon: Compass }
      ] : []),
      { id: 'anchor', label: 'Benthic Anchor 🌿', sub: 'Macro-Algae Biofouled Clump (-48m)', icon: Anchor }
    ];
  }, [activeRegion?.id]);

  const currentCamIdx = Math.max(0, cameraViews.findIndex(v => v.id === cameraPreset));
  const activeCam = cameraViews[currentCamIdx] || cameraViews[0];

  const handlePrevCamera = (e) => {
    e.stopPropagation();
    const prevIdx = (currentCamIdx - 1 + cameraViews.length) % cameraViews.length;
    const target = cameraViews[prevIdx];
    onChangeCamera(target.id);
    if (target.id === 'ctd' && onEngageCTD) onEngageCTD();
    if (!isMinimized && activeTab !== 'camera') {
      setIsMinimized(true);
    }
  };

  const handleNextCamera = (e) => {
    e.stopPropagation();
    const nextIdx = (currentCamIdx + 1) % cameraViews.length;
    const target = cameraViews[nextIdx];
    onChangeCamera(target.id);
    if (target.id === 'ctd' && onEngageCTD) onEngageCTD();
    if (!isMinimized && activeTab !== 'camera') {
      setIsMinimized(true);
    }
  };

  return (
    <div className={`unified-deck-wrapper ${isMinimized ? 'minimized' : ''}`}>
      {/* Floating Sleek Mode Bar (All Icons!) */}
      <div className="deck-tab-bar glass-panel">
        <div className="deck-tabs-left">
          {/* 1. Winch Icon Tab */}
          <button
            type="button"
            className={`deck-tab-btn ${activeTab === 'winch' && !isMinimized ? 'active' : ''}`}
            onClick={() => {
              if (activeTab === 'winch' && !isMinimized) {
                setIsMinimized(true);
              } else {
                setActiveTab('winch');
                setIsMinimized(false);
              }
            }}
            onMouseEnter={() => setHoveredDeckTab('winch')}
            onMouseLeave={() => setHoveredDeckTab(null)}
            title={`Winch & Profiler Depth: ${currentDepth.toFixed(1)}m`}
          >
            <Anchor size={15} />
            <span className="tab-label desktop-only">Winch</span>
            <span className="tab-badge mono-readout">{currentDepth.toFixed(0)}m</span>
          </button>

          {/* 2. CTD Profiler Icon Tab */}
          <button
            type="button"
            className={`deck-tab-btn ${activeTab === 'ctd' && !isMinimized ? 'active' : ''}`}
            onClick={() => {
              if (activeTab === 'ctd' && !isMinimized) {
                setIsMinimized(true);
              } else {
                setActiveTab('ctd');
                setIsMinimized(false);
              }
            }}
            onMouseEnter={() => setHoveredDeckTab('ctd')}
            onMouseLeave={() => setHoveredDeckTab(null)}
            title={`CTD Sonde: ${currentTemp.toFixed(1)}°C | ${currentSalinity.toFixed(1)} PSU`}
          >
            <Waves size={15} />
            <span className="tab-label desktop-only">CTD</span>
            <span className="tab-badge mono-readout accent-cyan">{currentTemp.toFixed(1)}°C</span>
          </button>

          {/* 3. Weddell Seal Pod Icon Tab */}
          <button
            type="button"
            className={`deck-tab-btn ${activeTab === 'seal' && !isMinimized ? 'active' : ''}`}
            onClick={() => {
              if (activeTab === 'seal' && !isMinimized) {
                setIsMinimized(true);
              } else {
                setActiveTab('seal');
                setIsMinimized(false);
              }
            }}
            onMouseEnter={() => setHoveredDeckTab('seal')}
            onMouseLeave={() => setHoveredDeckTab(null)}
            title="Wild Weddell Seal Pod Telemetry Relay (<800m cone)"
          >
            <Radio size={15} className={sealBreachData?.isBreaching ? "accent-green pulse-anim" : ""} />
            <span className="tab-label desktop-only">Seal Pod</span>
            {sealBreachData?.isBreaching && <span className="tab-dot-pulse" />}
          </button>

          {/* Hairline Divider */}
          <div className="dock-pill-divider" />

          {/* 4. 8-Camera 3D Stepper (All-Icon Stepper) */}
          <div className="dock-camera-stepper-group">
            <button
              type="button"
              className="deck-tab-btn cam-arrow-btn"
              onClick={handlePrevCamera}
              title="Previous 3D Camera Angle [‹]"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              className={`deck-tab-btn cam-center-btn ${activeTab === 'camera' && !isMinimized ? 'active' : ''}`}
              onClick={() => {
                if (activeTab === 'camera' && !isMinimized) {
                  setIsMinimized(true);
                } else {
                  setActiveTab('camera');
                  setIsMinimized(false);
                }
              }}
              onMouseEnter={() => setHoveredDeckTab('camera')}
              onMouseLeave={() => setHoveredDeckTab(null)}
              title={`3D Camera Angle [${currentCamIdx + 1}/8]: ${activeCam.label} (${activeCam.sub})`}
            >
              <Camera size={15} className="accent-cyan" />
              <span className="cam-dock-label desktop-cam-label">{activeCam.label}</span>
              <span className="cam-dock-label mobile-cam-label">CAM 0{currentCamIdx + 1}</span>
              <span className="cam-count-badge mono-readout desktop-cam-label">{currentCamIdx + 1}</span>
            </button>

            <button
              type="button"
              className="deck-tab-btn cam-arrow-btn"
              onClick={handleNextCamera}
              title="Next 3D Camera Angle [›]"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Minimize / Expand Toggle */}
        <button
          type="button"
          className="deck-minimize-btn"
          onClick={() => setIsMinimized(prev => !prev)}
          title={isMinimized ? "Expand Telemetry Details" : "Collapse Telemetry Details"}
        >
          {isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Floating Hover Glance Card */}
      {hoveredDeckTab && (
        <div className="deck-hover-popup glass-panel">
          {hoveredDeckTab === 'ctd' && (
            <div className="popup-content">
              <div className="popup-title">AUTONOMOUS CTD PROFILER</div>
              <div className="popup-val-row mono-readout">
                <span>T: <strong className="accent-amber">{currentTemp.toFixed(2)}°C</strong></span>
                <span>S: <strong className="accent-cyan">{currentSalinity.toFixed(2)} PSU</strong></span>
                <span>c: <strong className="accent-purple">{soundSpeed} m/s</strong></span>
                <span>ρ: <strong className="accent-green">{currentDensity} kg/m³</strong></span>
              </div>
              <div className="popup-sub-text">{layerLabel}</div>
            </div>
          )}
          {hoveredDeckTab === 'winch' && (
            <div className="popup-content">
              <div className="popup-title">SUBSEA WINCH ACTUATOR</div>
              <div className="popup-val-row mono-readout">
                <span>Depth: <strong className="accent-cyan">{currentDepth.toFixed(1)} m</strong></span>
                <span>P: <strong>{hydrostaticPressure} bar</strong></span>
                <span>Torque: <strong>{currentDepth > 0 ? "4.2 N·m" : "0.0 N·m"}</strong></span>
              </div>
            </div>
          )}
          {hoveredDeckTab === 'seal' && (
            <div className="popup-content">
              <div className="popup-title">WILD WEDDELL SEAL POD TELEMETRY</div>
              <div className="popup-val-row mono-readout">
                <span>Pod Size: <strong>4 Wild Seals</strong></span>
                <span>Leader Tag: <strong>{activeRegion?.seal?.tagId || "WED-PRYDZ-42"}</strong></span>
                <span>Uplink: <strong className={sealBreachData?.isBreaching ? "accent-green" : "accent-cyan"}>
                  {sealBreachData?.isBreaching ? "⚡ BURST PACKET HARVEST" : "ACOUSTIC STANDBY (<800m)"}
                </strong></span>
              </div>
            </div>
          )}
          {hoveredDeckTab === 'camera' && (
            <div className="popup-content">
              <div className="popup-title">3D CAMERA PERSPECTIVE [{currentCamIdx + 1}/8]</div>
              <div className="popup-val-row mono-readout">
                <span className="accent-cyan font-bold">{activeCam.label}</span>
              </div>
              <div className="popup-sub-text">{activeCam.sub} • Click [‹] [›] to step in 3D</div>
            </div>
          )}
        </div>
      )}

      {/* Expanded Tab Content Card */}
      {!isMinimized && (
        <div className="deck-content-card glass-panel">
          {/* TAB 1: WINCH & DEPTH PROFILER */}
          {activeTab === 'winch' && (
            <div className="deck-section-winch">
              <div className="winch-header-row">
                <div className="depth-readout-pill">
                  <span className="depth-big mono-readout">{currentDepth.toFixed(1)}</span>
                  <span className="depth-unit">METERS DEPTH</span>
                </div>

                {/* Quick Depth Preset Icons */}
                <div className="quick-presets-group">
                  <button
                    type="button"
                    className={`preset-chip ${currentDepth === 0 ? 'active' : ''}`}
                    onClick={() => { onChangeDepth(0); setIsMinimized(true); }}
                    title="Reel Profiler to Surface (0m)"
                  >
                    Surface (0m)
                  </button>
                  <button
                    type="button"
                    className={`preset-chip ${Math.abs(currentDepth - hydro.haloclineDepth) < 3 ? 'active' : ''}`}
                    onClick={() => { onChangeDepth(hydro.haloclineDepth); setIsMinimized(true); }}
                    title={`Descend to Halocline Shear Layer (~${hydro.haloclineDepth}m)`}
                  >
                    Halocline (~{hydro.haloclineDepth.toFixed(0)}m)
                  </button>
                  <button
                    type="button"
                    className={`preset-chip ${currentDepth === CONFIG.MAX_DEPTH_METERS ? 'active' : ''}`}
                    onClick={() => { onChangeDepth(CONFIG.MAX_DEPTH_METERS); setIsMinimized(true); }}
                    title={`Full Depth Benthic Dive (${CONFIG.MAX_DEPTH_METERS}m)`}
                  >
                    Abyss ({CONFIG.MAX_DEPTH_METERS}m)
                  </button>
                </div>

                {/* Auto Profile Action Button */}
                <button
                  type="button"
                  className={`auto-profile-action-btn ${isAutoProfiling ? 'profiling-active' : ''}`}
                  onClick={() => { onToggleAutoProfile(); setIsMinimized(true); }}
                >
                  {isAutoProfiling ? (
                    <>
                      <Square size={14} className="icon-pulse" />
                      <span>Stop Profiling</span>
                    </>
                  ) : (
                    <>
                      <Play size={14} />
                      <span>Auto Profile</span>
                    </>
                  )}
                </button>
              </div>

              {/* Smooth Depth Slider */}
              <div className="winch-slider-container">
                <input
                  type="range"
                  min="0"
                  max={CONFIG.MAX_DEPTH_METERS}
                  step="0.5"
                  value={currentDepth}
                  onChange={(e) => onChangeDepth(parseFloat(e.target.value))}
                  onMouseUp={() => setIsMinimized(true)}
                  onTouchEnd={() => setIsMinimized(true)}
                  className="depth-interactive-slider"
                />
                <div className="depth-scale-ticks">
                  <span>0m (Surface)</span>
                  <span>50m (Pycnocline)</span>
                  <span>100m</span>
                  <span>150m</span>
                  <span>200m (Benthic Limit)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CTD PROFILER HYDROGRAPHY */}
          {activeTab === 'ctd' && (
            <div className="deck-section-ctd">
              {/* Top 4-metric Telemetry Header Strip */}
              <div className="ctd-cards-row">
                <div className="ctd-metric-box">
                  <div className="metric-box-top">
                    <Thermometer size={13} className="accent-amber" />
                    <span>TEMPERATURE</span>
                  </div>
                  <div className="metric-box-val mono-readout">
                    {currentTemp > 0 ? `+${currentTemp.toFixed(2)}` : currentTemp.toFixed(2)}
                    <span className="metric-box-unit">°C</span>
                  </div>
                  <div className="metric-bar-track">
                    <div
                      className="metric-bar-fill temp-gradient"
                      style={{ width: `${Math.max(5, Math.min(100, ((currentTemp + 2.0) / 4.0) * 100))}%` }}
                    />
                  </div>
                </div>

                <div className="ctd-metric-box">
                  <div className="metric-box-top">
                    <Droplets size={13} className="accent-cyan" />
                    <span>SALINITY</span>
                  </div>
                  <div className="metric-box-val mono-readout">
                    {currentSalinity.toFixed(2)}
                    <span className="metric-box-unit">PSU</span>
                  </div>
                  <div className="metric-bar-track">
                    <div
                      className="metric-bar-fill salinity-gradient"
                      style={{ width: `${Math.max(5, Math.min(100, ((currentSalinity - 33.0) / 2.0) * 100))}%` }}
                    />
                  </div>
                </div>

                <div className="ctd-metric-box">
                  <div className="metric-box-top">
                    <Activity size={13} className="accent-purple" />
                    <span>SOUND VELOCITY</span>
                  </div>
                  <div className="metric-box-val mono-readout">
                    {soundSpeed}
                    <span className="metric-box-unit">m/s</span>
                  </div>
                  <div className="metric-bar-track">
                    <div
                      className="metric-bar-fill sound-gradient"
                      style={{ width: `${Math.max(5, Math.min(100, ((parseFloat(soundSpeed) - 1435.0) / 20.0) * 100))}%` }}
                    />
                  </div>
                </div>

                <div className="ctd-metric-box">
                  <div className="metric-box-top">
                    <Compass size={13} className="accent-green" />
                    <span>DENSITY (EOS-80)</span>
                  </div>
                  <div className="metric-box-val mono-readout">
                    {currentDensity}
                    <span className="metric-box-unit">kg/m³</span>
                  </div>
                  <div className="metric-bar-track">
                    <div
                      className="metric-bar-fill density-gradient"
                      style={{ width: `${Math.max(5, Math.min(100, ((parseFloat(currentDensity) - 1026.0) / 4.0) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Space-Saving Real-Time Hydrographic Sounding Graph */}
              <div className="ctd-graph-container">
                <div className="ctd-graph-header">
                  <div className="ctd-graph-tabs">
                    <button
                      type="button"
                      className={`ctd-graph-toggle-btn ${ctdGraphMode === 'profile' ? 'active' : ''}`}
                      onClick={() => setCtdGraphMode('profile')}
                    >
                      <BarChart2 size={11} />
                      <span>Depth Sounding Profile</span>
                    </button>
                    <button
                      type="button"
                      className={`ctd-graph-toggle-btn ${ctdGraphMode === 'ts' ? 'active' : ''}`}
                      onClick={() => setCtdGraphMode('ts')}
                    >
                      <Waves size={11} />
                      <span>T-S Water Mass Diagram</span>
                    </button>
                  </div>
                  <span className="ctd-graph-depth-badge mono-readout">
                    Z: {currentDepth.toFixed(1)}m | P: {hydrostaticPressure} bar
                  </span>
                </div>

                {ctdGraphMode === 'profile' ? (
                  <div className="ctd-svg-wrapper">
                    <svg viewBox="0 0 260 85" className="ctd-profile-svg" aria-label="CTD Hydrographic Depth Profile">
                      {/* Grid depth lines */}
                      <line x1="5" y1="5" x2="255" y2="5" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 2" />
                      <line x1="5" y1="42" x2="255" y2="42" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 2" />
                      <line x1="5" y1="80" x2="255" y2="80" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 2" />
                      
                      {/* Halocline Depth boundary line */}
                      <line
                        x1="5"
                        y1={5 + (hydro.haloclineDepth / 200) * 75}
                        x2="255"
                        y2={5 + (hydro.haloclineDepth / 200) * 75}
                        stroke="rgba(245, 158, 11, 0.45)"
                        strokeDasharray="3 3"
                      />
                      <text x="8" y={Math.max(12, 3 + (hydro.haloclineDepth / 200) * 75)} fill="#f59e0b" fontSize="7" fontFamily="monospace">
                        PYCNOCLINE ({hydro.haloclineDepth.toFixed(0)}m)
                      </text>

                      {/* Temperature Profile Trace (Amber) */}
                      <polyline
                        points={profileCurvePoints.map(p => `${p.xT},${p.y}`).join(' ')}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="1.6"
                      />

                      {/* Salinity Profile Trace (Cyan) */}
                      <polyline
                        points={profileCurvePoints.map(p => `${p.xS},${p.y}`).join(' ')}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="1.6"
                      />

                      {/* Active Winch Profiler Depth Line & Markers */}
                      <line
                        x1="5"
                        y1={5 + (currentDepth / 200) * 75}
                        x2="255"
                        y2={5 + (currentDepth / 200) * 75}
                        stroke="#ffffff"
                        strokeWidth="1.2"
                      />
                      <circle
                        cx={10 + Math.max(0, Math.min(110, ((currentTemp - (-2.0)) / 4.0) * 110))}
                        cy={5 + (currentDepth / 200) * 75}
                        r="3"
                        fill="#f59e0b"
                        stroke="#ffffff"
                        strokeWidth="1"
                      />
                      <circle
                        cx={140 + Math.max(0, Math.min(110, ((currentSalinity - 33.5) / 1.5) * 110))}
                        cy={5 + (currentDepth / 200) * 75}
                        r="3"
                        fill="#38bdf8"
                        stroke="#ffffff"
                        strokeWidth="1"
                      />
                    </svg>
                    <div className="ctd-svg-legend">
                      <span className="legend-item"><span className="legend-dot amber" /> Temp T(z) [-2 to +2°C]</span>
                      <span className="legend-item"><span className="legend-dot cyan" /> Salinity S(z) [33.5 to 35 PSU]</span>
                      <span className="legend-item mono-readout">SOFAR Duct: Active</span>
                    </div>
                  </div>
                ) : (
                  <div className="ctd-svg-wrapper">
                    {/* T-S Diagram */}
                    <svg viewBox="0 0 260 85" className="ctd-profile-svg" aria-label="Temperature-Salinity Diagram">
                      <rect x="15" y="45" width="90" height="35" fill="rgba(56, 189, 248, 0.08)" stroke="rgba(56, 189, 248, 0.25)" strokeDasharray="2 2" />
                      <text x="20" y="58" fill="#38bdf8" fontSize="6.5" fontFamily="monospace">AASW (Surface Water)</text>
                      
                      <rect x="140" y="8" width="105" height="40" fill="rgba(245, 158, 11, 0.08)" stroke="rgba(245, 158, 11, 0.25)" strokeDasharray="2 2" />
                      <text x="145" y="22" fill="#f59e0b" fontSize="6.5" fontFamily="monospace">MCDW (Deep Water)</text>

                      <polyline
                        points={profileCurvePoints.map(p => {
                          const x = 15 + Math.max(0, Math.min(230, ((p.s - 33.5) / 1.5) * 230));
                          const y = 80 - Math.max(0, Math.min(72, ((p.t - (-2.0)) / 4.0) * 72));
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="1.8"
                      />

                      <circle
                        cx={15 + Math.max(0, Math.min(230, ((currentSalinity - 33.5) / 1.5) * 230))}
                        cy={80 - Math.max(0, Math.min(72, ((currentTemp - (-2.0)) / 4.0) * 72))}
                        r="4"
                        fill="#10b981"
                        stroke="#ffffff"
                        strokeWidth="1.2"
                      />
                    </svg>
                    <div className="ctd-svg-legend">
                      <span className="legend-item"><span className="legend-dot purple" /> T-S Hydrographic Curve</span>
                      <span className="legend-item"><span className="legend-dot green" /> Active Sounding ({currentSalinity.toFixed(2)} PSU, {currentTemp.toFixed(2)}°C)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Water Mass Layer Status */}
              <div className="ctd-layer-strip">
                <span className="layer-strip-label">WATER MASS:</span>
                <span className="layer-strip-val mono-readout font-bold">{layerLabel}</span>
              </div>
            </div>
          )}

          {/* TAB 3: WEDDELL SEAL BIO-LOGGER POD */}
          {activeTab === 'seal' && (
            <div className="deck-section-seal">
              <div className="seal-deck-row">
                <div className="seal-status-badge">
                  <div className="seal-antenna-icon-wrap">
                    <Radio size={16} className={sealBreachData?.isBreaching ? "accent-green pulse-anim" : "accent-cyan"} />
                    {sealBreachData?.isBreaching && <span className="acoustic-beacon-ring" />}
                  </div>
                  <div>
                    <div className="seal-tag-id mono-readout font-bold">
                      {activeRegion?.seal?.tagId || "WED-PRYDZ-42"} (WILD POD // 4 SEALS)
                      <span className="seal-protocol-chip">{sealBreachData?.isBreaching ? "433MHz LORA BURST" : "12.5kHz ACOUSTIC HARVEST"}</span>
                    </div>
                    <div className="seal-species-name">
                      Wild Antarctic Weddell Seals (Leptonychotes weddellii) — Opportunistic Telemetry Cone (&lt;800m)
                    </div>
                  </div>
                </div>

                <div className="seal-telemetry-readouts">
                  <div className="seal-readout-item">
                    <span className="label">EST. POD DEPTH</span>
                    <span className="val mono-readout font-bold accent-cyan">{sealBreachData?.sealDepth?.toFixed(1) || "18.4"} m</span>
                  </div>
                  <div className="seal-readout-item">
                    <span className="label">OPPORTUNISTIC LINK</span>
                    <span className={`val mono-readout font-bold ${sealBreachData?.isBreaching ? "accent-green" : "accent-cyan"}`}>
                      {sealBreachData?.isBreaching ? "⚡ BURST RX LOCKED" : "SONAR SCAN (<800m)"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="seal-track-btn"
                  onClick={() => {
                    onChangeCamera('seal');
                    setIsMinimized(true);
                  }}
                  title="Direct 3D Camera View to Weddell Seal Pod"
                >
                  <Eye size={14} />
                  <span>Track Wild Pod</span>
                </button>
              </div>

              {/* Dual-Panel Acoustic Sonar Scope + Hardware Telemetry Terminal */}
              <div className="seal-sonar-waterfall-grid">
                <div className="sonar-radar-card">
                  <div className="sonar-card-header">
                    <span className="sonar-card-title">ACOUSTIC HYDROPHONE SONAR</span>
                    <span className="sonar-card-badge mono-readout">RANGE: 800m // 360° PPI</span>
                  </div>
                  <div className="sonar-scope-viewport">
                    <svg viewBox="0 0 160 160" className="sonar-svg" aria-label="Acoustic Sonar Radar Display">
                      <defs>
                        <radialGradient id="sonarBgGradient" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="rgba(56, 189, 248, 0.16)" />
                          <stop offset="65%" stopColor="rgba(16, 185, 129, 0.06)" />
                          <stop offset="100%" stopColor="rgba(3, 10, 22, 0.75)" />
                        </radialGradient>
                        <linearGradient id="sonarSweepGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="rgba(16, 185, 129, 0.85)" />
                          <stop offset="35%" stopColor="rgba(56, 189, 248, 0.35)" />
                          <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                      </defs>

                      <circle cx="80" cy="80" r="74" fill="url(#sonarBgGradient)" stroke="rgba(56, 189, 248, 0.35)" strokeWidth="1" />
                      <circle cx="80" cy="80" r="22" fill="none" stroke="rgba(56, 189, 248, 0.2)" strokeDasharray="2 3" />
                      <circle cx="80" cy="80" r="46" fill="none" stroke="rgba(56, 189, 248, 0.2)" strokeDasharray="2 3" />
                      <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="1" />

                      <line x1="80" y1="6" x2="80" y2="154" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="0.8" />
                      <line x1="6" y1="80" x2="154" y2="80" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="0.8" />

                      <text x="80" y="15" fill="rgba(56, 189, 248, 0.75)" fontSize="6" fontFamily="monospace" textAnchor="middle">000°</text>
                      <text x="147" y="82" fill="rgba(56, 189, 248, 0.75)" fontSize="6" fontFamily="monospace" textAnchor="middle">090°</text>
                      <text x="80" y="151" fill="rgba(56, 189, 248, 0.75)" fontSize="6" fontFamily="monospace" textAnchor="middle">180°</text>
                      <text x="13" y="82" fill="rgba(56, 189, 248, 0.75)" fontSize="6" fontFamily="monospace" textAnchor="middle">270°</text>

                      {/* Center Spar Buoy */}
                      <circle cx="80" cy="80" r="3.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
                      <text x="85" y="77" fill="#38bdf8" fontSize="5.5" fontFamily="monospace" fontWeight="600">SPAR BUOY</text>

                      {/* Rotating Radar Sweep */}
                      <g className="sonar-sweep-group">
                        <line x1="80" y1="80" x2="148" y2="40" stroke="rgba(16, 185, 129, 0.95)" strokeWidth="1.5" />
                        <path d="M 80 80 L 148 40 A 70 70 0 0 0 122 22 Z" fill="url(#sonarSweepGradient)" />
                      </g>

                      {/* Seal Contacts */}
                      <g transform="translate(118, 56)">
                        {sealBreachData?.isBreaching && (
                          <>
                            <circle cx="0" cy="0" r="8" fill="none" stroke="rgba(16, 185, 129, 0.85)" className="acoustic-ping-wave wave-1" />
                            <circle cx="0" cy="0" r="16" fill="none" stroke="rgba(56, 189, 248, 0.55)" className="acoustic-ping-wave wave-2" />
                          </>
                        )}
                        <circle cx="0" cy="0" r="3.5" fill={sealBreachData?.isBreaching ? "#10b981" : "#38bdf8"} className="sonar-target-blip" />
                        <text x="6" y="2" fill="#10b981" fontSize="6" fontFamily="monospace" fontWeight="bold">
                          WED-42
                        </text>
                      </g>
                      <circle cx="128" cy="62" r="2.2" fill="#38bdf8" opacity="0.85" />
                      <circle cx="112" cy="70" r="2.0" fill="#38bdf8" opacity="0.75" />
                      <circle cx="132" cy="50" r="1.8" fill="#38bdf8" opacity="0.65" />
                    </svg>
                  </div>
                </div>

                <div className="seal-packet-terminal">
                  <div className="packet-terminal-header">
                    <div className="terminal-title">
                      <Binary size={11} className="accent-cyan" />
                      <span>SX1278 RF / ACOUSTIC TELEMETRY BUFFER</span>
                    </div>
                    <div className="terminal-status-tag">
                      <ShieldCheck size={11} className="accent-green" />
                      <span>CRC-16 VALID</span>
                    </div>
                  </div>

                  <div className="lora-spectrum-waterfall">
                    <div className="waterfall-header-row">
                      <span className="waterfall-sub-title">CHIRP SPREAD SPECTRUM (CSS) 433.05 MHz</span>
                      <span className={`waterfall-status-text mono-readout ${sealBreachData?.isBreaching ? 'rx-lock' : ''}`}>
                        {sealBreachData?.isBreaching ? "● RX CARRIER LOCK" : "IDLE PING CARRIER"}
                      </span>
                    </div>
                    <div className="waterfall-bars-row">
                      {[42, 68, 85, 96, 74, 90, 64, 48].map((baseHeight, idx) => (
                        <div key={idx} className="spectrum-col">
                          <div
                            className={`spectrum-bar ${sealBreachData?.isBreaching ? 'bursting' : ''}`}
                            style={{
                              height: sealBreachData?.isBreaching ? `${Math.min(100, baseHeight + 14)}%` : `${Math.max(16, baseHeight * 0.42)}%`,
                              animationDelay: `${idx * 0.08}s`
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="waterfall-metrics mono-readout">
                      <span>RSSI: {sealBreachData?.isBreaching ? "-92dBm" : "-108dBm"}</span>
                      <span>SNR: {sealBreachData?.isBreaching ? "+8.4dB" : "+2.1dB"}</span>
                      <span>BW: 125kHz</span>
                      <span>SF: 10</span>
                      <span>CR: 4/5</span>
                    </div>
                  </div>

                  <div className="packet-terminal-body mono-readout">
                    {sealBreachData?.isBreaching ? (
                      <>
                        <div className="packet-line rx-active">
                          <span className="pkt-badge lora">RF BURST</span>
                          <span>[433.05MHz] RSSI: -92dBm | SNR: +8.4dB | MOD: CSS BW125 SF10</span>
                        </div>
                        <div className="packet-line hex">
                          PAYLOAD: 0x26065 0x{activeRegion?.seal?.tagId?.replace(/[^0-9]/g, '') || '42'} 0x{((sealBreachData?.sealDepth || 20) * 10).toFixed(0).padStart(4, '0')} 0xFC12 [SYNC OK]
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="packet-line">
                          <span className="pkt-badge acoustic">ACOUSTIC</span>
                          <span>[12.5kHz FSK] Proximity cone standby (wild pod forages in range)</span>
                        </div>
                        <div className="packet-line hex">
                          BEACON: POD [4 WEDDELL SEALS] DEPTH: {sealBreachData?.sealDepth?.toFixed(1) || "18.4"}m | FORAGING DIVE CYCLE ACTIVE
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="seal-info-note">
                <Compass size={12} className="accent-cyan" />
                <span>Wild Weddell seal pod carries non-invasive bio-logging CTD tags. Opportunistic acoustic harvesting relays CTD profiles directly through the spar buoy to LEO satellites when seals forage within ~800m.</span>
              </div>
            </div>
          )}

          {/* TAB 4: ISOLATED 3D CAMERA SELECTOR & COMPACT BENCH */}
          {activeTab === 'camera' && (
            <div className="deck-section-camera">
              {/* Problem 2: Single clean Lock Camera button near the camera when expanded */}
              <div className="camera-header-lock-row">
                <span className="camera-header-title">MISSION PERSPECTIVES</span>
                <button
                  type="button"
                  className={`camera-lock-pill-btn ${isFollowingCTD ? 'active' : ''}`}
                  onClick={() => {
                    if (isFollowingCTD) {
                      onDisengageCTD();
                    } else {
                      if (onEngageCTD) onEngageCTD();
                    }
                  }}
                  title={isFollowingCTD ? "Camera is Locked to Target. Click to Unlock (Free Orbit)" : "Lock Camera to Target"}
                >
                  {isFollowingCTD ? <Lock size={12} className="accent-green" /> : <Unlock size={12} />}
                  <span>{isFollowingCTD ? "Locked" : "Lock Camera"}</span>
                </button>
              </div>

              <div className="camera-grid-selector">
                {cameraViews.map((cam, idx) => {
                  const Icon = cam.icon;
                  const isActive = cameraPreset === cam.id;
                  return (
                    <button
                      key={cam.id}
                      type="button"
                      className={`cam-card-pill ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        onChangeCamera(cam.id);
                        if (cam.id === 'ctd' && onEngageCTD) onEngageCTD();
                        setIsMinimized(true);
                      }}
                      title={cam.sub}
                    >
                      <div className="cam-card-icon-box">
                        <Icon size={14} className={isActive ? "accent-cyan" : ""} />
                      </div>
                      <div className="cam-card-text-col">
                        <span className="cam-card-micro-tag">CAM 0{idx + 1}</span>
                        <span className="cam-card-title-text">{cam.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {cameraPreset?.startsWith('electronics') && (
                <div className="nodal-hardware-bench-card glass-panel">
                  <div className="bench-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Cpu size={13} className="accent-cyan" />
                      <span className="bench-title">3D SUBSYSTEM BREAKDOWN // CAMERA 3 PARTS A · B · C</span>
                    </div>
                    <span className="bench-badge">INSPECTION ACTIVE</span>
                  </div>

                  {/* 3-Tier Hardware Inspector Tabs */}
                  <div className="subsystem-part-pill-row">
                    <button
                      type="button"
                      className={`subsystem-part-pill ${cameraPreset === 'electronics_a' ? 'active' : ''}`}
                      onClick={() => onChangeCamera('electronics_a')}
                    >
                      <Radio size={12} />
                      <span>Part A: Antenna & Solar</span>
                    </button>
                    <button
                      type="button"
                      className={`subsystem-part-pill ${(cameraPreset === 'electronics' || cameraPreset === 'electronics_b') ? 'active' : ''}`}
                      onClick={() => onChangeCamera('electronics')}
                    >
                      <Cpu size={12} />
                      <span>Part B: PCB & Heating Pads</span>
                    </button>
                    <button
                      type="button"
                      className={`subsystem-part-pill ${cameraPreset === 'electronics_c' ? 'active' : ''}`}
                      onClick={() => onChangeCamera('electronics_c')}
                    >
                      <Box size={12} />
                      <span>Part C: Motor & HDPE Tubes</span>
                    </button>
                  </div>

                  {/* Dynamic Technical Specs according to active part */}
                  {cameraPreset === 'electronics_a' && (
                    <div className="bench-specs-grid mono-readout">
                      <div className="bench-spec-item">
                        <span className="spec-label">ANTENNA:</span>
                        <span className="spec-val">433MHz Monopole (+2.5dBi)</span>
                      </div>
                      <div className="bench-spec-item">
                        <span className="spec-label">GPS/NavIC:</span>
                        <span className="spec-val">L1 Ceramic Patch (RTK)</span>
                      </div>
                      <div className="bench-spec-item">
                        <span className="spec-label">SOLAR PV:</span>
                        <span className="spec-val">3x ETFE Flexible (65Wp)</span>
                      </div>
                      <div className="bench-spec-item">
                        <span className="spec-label">CONDUIT:</span>
                        <span className="spec-val">IP68 Glands + UV Dual-Wire</span>
                      </div>
                    </div>
                  )}

                  {(cameraPreset === 'electronics' || cameraPreset === 'electronics_b') && (
                    <div className="bench-specs-grid mono-readout">
                      <div className="bench-spec-item">
                        <span className="spec-label">MCU:</span>
                        <span className="spec-val">ESP32-S3 (240MHz) 16MB</span>
                      </div>
                      <div className="bench-spec-item">
                        <span className="spec-label">RF:</span>
                        <span className="spec-val">SX1278 (433MHz) +20dBm</span>
                      </div>
                      <div className="bench-spec-item">
                        <span className="spec-label">HEATING:</span>
                        <span className="spec-val">2x Kapton Pads (12V 15W, -40°C)</span>
                      </div>
                      <div className="bench-spec-item">
                        <span className="spec-label">BATTERY:</span>
                        <span className="spec-val">4S2P LiFePO4 (13.2V, 84.5Wh)</span>
                      </div>
                    </div>
                  )}

                  {cameraPreset === 'electronics_c' && (
                    <div className="bench-specs-grid mono-readout">
                      <div className="bench-spec-item">
                        <span className="spec-label">MOTOR:</span>
                        <span className="spec-val">NEMA-17 Stepper (1:50 Planetary)</span>
                      </div>
                      <div className="bench-spec-item">
                        <span className="spec-label">SLIP RING:</span>
                        <span className="spec-val">12-Ch Gold Rotary Capsule (2A/ch)</span>
                      </div>
                      <div className="bench-spec-item">
                        <span className="spec-label">MOONPOOL:</span>
                        <span className="spec-val">Solid HDPE Keel Tube (50mm Wall)</span>
                      </div>
                      <div className="bench-spec-item">
                        <span className="spec-label">UMBILICAL:</span>
                        <span className="spec-val">HDPE Sensor Conduit + P-Clamps</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {cameraPreset === 'anchor' && (
                <div className="nodal-hardware-bench-card glass-panel">
                  <div className="bench-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Anchor size={13} className="accent-green" />
                      <span className="bench-title">BENTHIC ANCHOR (-48.0M)</span>
                    </div>
                    <span className="bench-badge" style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)' }}>
                      SEABED BENTHOS
                    </span>
                  </div>
                  <div className="bench-specs-grid mono-readout">
                    <div className="bench-spec-item">
                      <span className="spec-label">MASS:</span>
                      <span className="spec-val">280 kg Iron Clump</span>
                    </div>
                    <div className="bench-spec-item">
                      <span className="spec-label">SUBSTRATE:</span>
                      <span className="spec-val">Glaciomarine Diamicton</span>
                    </div>
                    <div className="bench-spec-item">
                      <span className="spec-label">ALGAE:</span>
                      <span className="spec-val">Desmarestia Fronds</span>
                    </div>
                    <div className="bench-spec-item">
                      <span className="spec-label">MOORING:</span>
                      <span className="spec-val">Aramid Kevlar Core</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
