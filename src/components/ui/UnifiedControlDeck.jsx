import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Anchor, Waves, Eye, Camera, Layers, Box, Cpu,
  Radio, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Lock, Unlock
} from 'lucide-react';
import { CONFIG } from '../../constants/config';

// 8 mission perspectives grouped under 3 headers: SURFACE, SUBSEA, BIOLOGGER
export const CAMERA_GROUPS = [
  {
    title: 'SURFACE',
    cams: [
      { id: 'wide', num: 1, label: 'Panoramic Vista', fullName: 'Panoramic Vista', icon: Layers },
      { id: 'buoy', num: 2, label: 'Spar Buoy', fullName: 'Spar Buoy', icon: Anchor },
      { id: 'electronics_a', num: 3, label: 'Antenna & Solar Mast', fullName: 'Antenna & Solar Mast', icon: Radio },
      { id: 'electronics', num: 4, label: 'Avionics Bay & Battery Rack', fullName: 'Avionics Bay & Battery Rack', icon: Cpu }
    ]
  },
  {
    title: 'SUBSEA',
    cams: [
      { id: 'electronics_c', num: 5, label: 'Winch & Keel', fullName: 'Subsea Winch & Keel Mechanism', icon: Box },
      { id: 'ctd', num: 6, label: 'CTD Profiler', fullName: 'CTD Profiler', icon: Waves },
      { id: 'anchor', num: 8, label: 'Benthic Anchor', fullName: 'Benthic Anchor', icon: Anchor }
    ]
  },
  {
    title: 'BIOLOGGER',
    cams: [
      { id: 'seal', num: 7, label: 'Seal Pod (4x)', fullName: 'Seal Pod (4x)', icon: Eye }
    ]
  }
];

// Flat 8-cam navigation list in strict order 1-8
export const ALL_CAMS = [
  { id: 'wide', num: 1, label: 'Panoramic Vista', fullName: 'Panoramic Vista', icon: Layers, group: 'SURFACE' },
  { id: 'buoy', num: 2, label: 'Spar Buoy', fullName: 'Spar Buoy', icon: Anchor, group: 'SURFACE' },
  { id: 'electronics_a', num: 3, label: 'Antenna & Solar Mast', fullName: 'Antenna & Solar Mast', icon: Radio, group: 'SURFACE' },
  { id: 'electronics', num: 4, label: 'Avionics Bay & Battery Rack', fullName: 'Avionics Bay & Battery Rack', icon: Cpu, group: 'SURFACE' },
  { id: 'electronics_c', num: 5, label: 'Winch & Keel', fullName: 'Subsea Winch & Keel Mechanism', icon: Box, group: 'SUBSEA' },
  { id: 'ctd', num: 6, label: 'CTD Profiler', fullName: 'CTD Profiler', icon: Waves, group: 'SUBSEA' },
  { id: 'seal', num: 7, label: 'Seal Pod (4x)', fullName: 'Seal Pod (4x)', icon: Eye, group: 'BIOLOGGER' },
  { id: 'anchor', num: 8, label: 'Benthic Anchor', fullName: 'Benthic Anchor', icon: Anchor, group: 'SUBSEA' }
];

export default function UnifiedControlDeck({
  currentDepth,
  activeRegion,
  cameraPreset,
  onChangeCamera,
  sealBreachData,
  isFollowingCTD,
  onDisengageCTD,
  onEngageCTD,
  isMinimizedProp,
  onToggleMinimize,
  isTourRunning = false
}) {
  const [internalMinimized, setInternalMinimized] = useState(true);
  const isMinimized = isTourRunning ? true : (isMinimizedProp !== undefined ? isMinimizedProp : internalMinimized);

  const setIsMinimized = (val) => {
    const nextVal = typeof val === 'function' ? val(isMinimized) : val;
    if (onToggleMinimize) onToggleMinimize(nextVal);
    setInternalMinimized(nextVal);
  };

  const collapseTimerRef = useRef(null);

  // Hydrographic values (read-only telemetry calculation without modification)
  const hydro = activeRegion?.hydrography || {
    haloclineDepth: CONFIG.HALOCLINE_DEPTH_M,
    surfaceTemp: CONFIG.HALOCLINE_T_SURF,
    deepTemp: CONFIG.HALOCLINE_T_DEEP,
    transitionWidth: 12.0
  };

  const sigmoid = (z, center, width) => 1.0 / (1.0 + Math.exp(-(z - center) / width));
  const tFactor = sigmoid(currentDepth, hydro.haloclineDepth, hydro.transitionWidth || 12.0);
  const currentTemp = hydro.surfaceTemp + tFactor * (hydro.deepTemp - hydro.surfaceTemp);

  // Active camera index mapping
  const currentCamIdx = Math.max(
    0,
    ALL_CAMS.findIndex(
      (c) =>
        c.id === cameraPreset ||
        (c.id === 'electronics' && cameraPreset === 'electronics_b')
    )
  );
  const activeCam = ALL_CAMS[currentCamIdx] || ALL_CAMS[0];

  const handleSelectCam = (camId, e) => {
    onChangeCamera(camId);
    if (camId === 'ctd' && onEngageCTD) onEngageCTD();

    // Requirement 4: Auto-collapse after ~600ms unless Shift is held
    if (!e?.shiftKey) {
      if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = setTimeout(() => {
        setIsMinimized(true);
      }, 600);
    }
  };

  const handlePrevCamera = (e) => {
    if (e) e.stopPropagation();
    const prevIdx = (currentCamIdx - 1 + ALL_CAMS.length) % ALL_CAMS.length;
    const target = ALL_CAMS[prevIdx];
    handleSelectCam(target.id, e);
  };

  const handleNextCamera = (e) => {
    if (e) e.stopPropagation();
    const nextIdx = (currentCamIdx + 1) % ALL_CAMS.length;
    const target = ALL_CAMS[nextIdx];
    handleSelectCam(target.id, e);
  };

  const handleToggleLock = (e) => {
    if (e) e.stopPropagation();
    if (isFollowingCTD) {
      if (onDisengageCTD) onDisengageCTD();
    } else {
      if (onEngageCTD) onEngageCTD();
    }
  };

  // Requirement 5: Keyboard shortcuts: 1-8 jump, [ and ] step, L toggles lock, Esc collapses
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName) ||
        e.target?.isContentEditable
      ) {
        return;
      }

      // Keys 1-8 jump to camera
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= 8) {
        const targetCam = ALL_CAMS[num - 1];
        if (targetCam) {
          e.preventDefault();
          handleSelectCam(targetCam.id, e);
        }
        return;
      }

      // [ and ] step prev/next
      if (e.key === '[') {
        e.preventDefault();
        handlePrevCamera(e);
        return;
      }
      if (e.key === ']') {
        e.preventDefault();
        handleNextCamera(e);
        return;
      }

      // L toggles lock camera
      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        handleToggleLock(e);
        return;
      }

      // Esc collapses deck
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsMinimized(true);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
    };
  }, [currentCamIdx, isFollowingCTD]);

  const CurrentCamIcon = activeCam.icon;

  return (
    <div
      className={`unified-deck-wrapper ${isMinimized ? 'minimized' : 'expanded'} ${isTourRunning ? 'tour-mode' : ''}`}
      role="region"
      aria-label="Mission Perspectives and Telemetry Deck"
    >
      {/* 2. Expanded Bottom Sheet (capped at 220px, <= 25% viewport height on desktop) */}
      {!isMinimized && (
        <div
          className="deck-bottom-sheet glass-panel"
          role="region"
          aria-label="Mission Perspectives Expanded View"
        >
          <div className="camera-groups-container">
            {CAMERA_GROUPS.map((group) => (
              <section key={group.title} className="camera-group-col" aria-label={`${group.title} Cameras`}>
                <div className="camera-group-header">
                  <span className="group-title">{group.title}</span>
                  <span className="group-count">{group.cams.length}</span>
                </div>
                <div className="camera-group-grid">
                  {group.cams.map((cam) => {
                    const Icon = cam.icon;
                    const isActive =
                      cam.id === cameraPreset ||
                      (cam.id === 'electronics' && cameraPreset === 'electronics_b');
                    return (
                      <button
                        key={cam.id}
                        type="button"
                        className={`camera-card ${isActive ? 'active' : ''}`}
                        onClick={(e) => handleSelectCam(cam.id, e)}
                        title={`${cam.fullName} • Hold Shift to keep open`}
                        aria-label={`CAM 0${cam.num}: ${cam.fullName}. Key [${cam.num}]`}
                      >
                        <div className="cam-card-meta">
                          <span className="cam-num-badge">CAM 0{cam.num}</span>
                          <span className="cam-key-hint">[{cam.num}]</span>
                        </div>
                        <div className="cam-card-body">
                          <div className="cam-icon-box">
                            <Icon
                              size={14}
                              className={isActive ? 'accent-cyan' : ''}
                              fill={isActive ? 'currentColor' : 'none'}
                              aria-hidden="true"
                            />
                          </div>
                          <span className="cam-name-text">{cam.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}

      {/* 1. Collapsed Slim Bar (Max height 56px, default view) */}
      <div className="deck-slim-bar glass-panel">
        {/* Left: 3 read-only telemetry chips (visually distinct, no hover affordance) */}
        <div className="deck-telemetry-cluster" aria-label="Live Sensor Telemetry Readouts">
          <div
            className="telemetry-chip"
            aria-label={`Winch depth ${currentDepth.toFixed(0)} meters`}
          >
            <Anchor size={12} className="chip-icon" aria-hidden="true" />
            <span className="chip-label">Winch</span>
            <span className="chip-val font-mono">{currentDepth.toFixed(0)}m</span>
          </div>

          <div
            className="telemetry-chip"
            aria-label={`CTD temperature ${currentTemp.toFixed(1)} degrees Celsius`}
          >
            <Waves size={12} className="chip-icon" aria-hidden="true" />
            <span className="chip-label">CTD</span>
            <span className="chip-val font-mono">{currentTemp.toFixed(1)}°C</span>
          </div>

          <div
            className="telemetry-chip"
            aria-label={`Weddell Seal Pod ${sealBreachData?.isBreaching ? 'Harvesting Burst Packet' : 'Acoustic Standby'}`}
          >
            <Radio
              size={12}
              className={`chip-icon ${sealBreachData?.isBreaching ? 'accent-green pulse-anim' : ''}`}
              aria-hidden="true"
            />
            <span className="chip-label">Seal Pod</span>
            {sealBreachData?.isBreaching && <span className="chip-pulse-dot" aria-hidden="true" />}
          </div>
        </div>

        {/* Center: Prev / Current Cam / Next / Lock Camera */}
        <div className="deck-nav-cluster">
          <button
            type="button"
            className="deck-nav-btn"
            onClick={handlePrevCamera}
            aria-label="Previous Camera Angle [ [ ]"
            title="Previous Camera ([)"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>

          <button
            type="button"
            className="deck-current-cam-btn"
            onClick={() => setIsMinimized((prev) => !prev)}
            aria-label={`Current Camera: CAM 0${activeCam.num} ${activeCam.label}. Click to toggle perspectives`}
            title={`CAM 0${activeCam.num}: ${activeCam.fullName} (${activeCam.group}) • Click to expand`}
          >
            <CurrentCamIcon size={14} className="current-cam-icon accent-cyan" aria-hidden="true" />
            <span className="current-cam-text desktop-cam-name">CAM 0{activeCam.num}: {activeCam.label}</span>
            <span className="current-cam-text mobile-cam-name">CAM 0{activeCam.num}</span>
          </button>

          <button
            type="button"
            className="deck-nav-btn"
            onClick={handleNextCamera}
            aria-label="Next Camera Angle [ ] ]"
            title="Next Camera (])"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>

          <button
            type="button"
            className={`deck-lock-camera-btn ${isFollowingCTD ? 'locked' : ''}`}
            onClick={handleToggleLock}
            aria-label={isFollowingCTD ? "Unlock Camera tracking [L]" : "Lock Camera to Target [L]"}
            title={isFollowingCTD ? "Camera is Locked to Target. Press L to Unlock" : "Lock Camera to Target. Press L to Lock"}
          >
            {isFollowingCTD ? (
              <Lock size={12} className="lock-icon accent-green" aria-hidden="true" />
            ) : (
              <Unlock size={12} className="lock-icon" aria-hidden="true" />
            )}
            <span className="lock-label desktop-only">{isFollowingCTD ? "LOCKED [L]" : "LOCK [L]"}</span>
          </button>
        </div>

        {/* Right: Expand / Collapse Toggle */}
        <div className="deck-toggle-cluster">
          <button
            type="button"
            className="deck-expand-btn"
            onClick={() => setIsMinimized((prev) => !prev)}
            aria-label={isMinimized ? "Expand Mission Perspectives Deck" : "Collapse Mission Perspectives Deck"}
            title={isMinimized ? "Expand Perspectives (Esc to close)" : "Collapse Perspectives (Esc)"}
          >
            {isMinimized ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </div>
  );
}
