import React, { useState, useEffect, useRef } from 'react';
import { Radio, Battery, Sun, MapPin, ChevronDown, Sliders, X, Play, Square, Zap, Flame } from 'lucide-react';

export default function TopBar({
  battery = 100.0,
  powerWatts = 1.35,
  solarWatts = 2.2,
  isBreaching,
  activeRegion,
  regionsList,
  onSelectRegion,
  sidebarOpen,
  onToggleSidebar,
  onStartTour,
  isTourRunning,
  tourSeconds,
  onExitTour,
  activeSeason = 'summer',
  onChangeSeason,
  isAutoSeasonCycle = false,
  onToggleAutoSeason,
  onOpenTeamDetails,
  qualityTier = 'high',
  onToggleQuality,
  heaterState = null,
  onSelectPart
}) {
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);
  const [seasonDropdownOpen, setSeasonDropdownOpen] = useState(false);
  const [timeStr, setTimeStr] = useState('');
  
  const regionRef = useRef(null);
  const seasonRef = useRef(null);

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeStr(d.toISOString().substring(11, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (regionRef.current && !regionRef.current.contains(e.target)) {
        setRegionDropdownOpen(false);
      }
      if (seasonRef.current && !seasonRef.current.contains(e.target)) {
        setSeasonDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const stationName = activeRegion?.shortName || "PRYDZ BAY MIZ";
  const stationShort = (activeRegion?.id === 'bharati_station' || stationName.includes('BHARATI')) ? 'BHARATI' : 'PRYDZ';
  const coordinates = activeRegion?.coordinates || "68°22'S, 76°45'E";

  const seasons = [
    { id: 'summer', label: 'Summer', emoji: '☀️', desc: 'Austral Summer (Midnight Sun — 24h Day)' },
    { id: 'autumn', label: 'Blizzard', emoji: '❄️', desc: 'Austral Autumn Freeze (Blizzard & Snow)' },
    { id: 'winter', label: 'Polar Night', emoji: '🌌', desc: 'Austral Winter (No Sun + Aurora)' },
    { id: 'spring', label: 'Rain', emoji: '🌧️', desc: 'Austral Spring Rain (Ice Breakup & Sleet)' }
  ];

  const currentSeasonObj = seasons.find(s => s.id === activeSeason) || seasons[0];

  return (
    <header className="top-bar glass-panel">
      {/* ════════════════════════════════════════════════
          LEFT SIDE OF CENTER (Problem 3 Specifications)
          1. Brand: Dhruva Setu, subtext, online green circle
          2. Label: "Select Area"
          3. Dropdown: Select Area menu
          4. Label: "Select Season" + top-down Select Season menu
          5. Button: Auto right next to season
          ════════════════════════════════════════════════ */}
      <div className="topbar-cluster-left">
        {/* Step 1: Brand module with online glowing indicator */}
        <div className="brand-group">
          <div className="status-indicator-dot online" />
          <div className="brand-text-block">
            <div className="brand-title">DHRUVA SETU</div>
            <div className="brand-sub">SIH-26065 // POLAR OBSERVATORY</div>
          </div>
        </div>

        {/* Hairline Divider */}
        <div className="topbar-cluster-divider" />

        {/* Step 2 & 3: Small Label "Select Area" & Dropdown Menu */}
        <div className="topbar-labeled-section">
          <span className="topbar-section-label desktop-only">Select Area</span>
          <div className="topbar-region-container" ref={regionRef}>
            <button
              type="button"
              id="topbar-region-btn"
              className="topbar-region-btn"
              onClick={(e) => {
                e.stopPropagation();
                setRegionDropdownOpen(prev => !prev);
                setSeasonDropdownOpen(false);
              }}
              title="Select Polar Deployment Zone"
            >
              <MapPin size={13} className="accent-cyan" />
              <span className="topbar-region-label desktop-station-name">{stationName}</span>
              <span className="topbar-region-label mobile-station-name">{stationShort}</span>
              <span className="topbar-region-coord mono-readout desktop-only">{coordinates}</span>
              <ChevronDown size={13} className={`chevron-icon ${regionDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {regionDropdownOpen && (
              <div className="topbar-region-dropdown glass-panel" onClick={(e) => e.stopPropagation()}>
                <div className="dropdown-header-title">POLAR DEPLOYMENT SECTORS</div>
                {(regionsList || []).map((reg) => (
                  <button
                    type="button"
                    key={reg?.id || Math.random()}
                    className={`topbar-dropdown-item ${reg?.id && activeRegion?.id && reg.id === activeRegion.id ? 'active' : ''}`}
                    onClick={() => {
                      if (reg?.id && onSelectRegion) onSelectRegion(reg.id);
                      setRegionDropdownOpen(false);
                    }}
                  >
                    <div className="item-name-row">
                      <span className="item-short-name">{reg?.shortName || reg?.name}</span>
                      <span className="item-badge-basin">{reg?.station}</span>
                    </div>
                    <div className="item-coord-row mono-readout">{reg?.coordinates} • {reg?.basin}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Hairline Divider */}
        <div className="topbar-cluster-divider" />

        {/* Step 4 & 5: Small Label "Select Season" & Top-Down Menu + Auto */}
        <div className="topbar-labeled-section">
          <span className="topbar-section-label desktop-only">Select Season</span>
          <div className="topbar-season-combo-wrap">
            <div className="topbar-season-dropdown-wrap" ref={seasonRef}>
              <button
                type="button"
                id="topbar-season-btn"
                className="topbar-season-dropdown-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setSeasonDropdownOpen(prev => !prev);
                  setRegionDropdownOpen(false);
                }}
                title={currentSeasonObj.desc}
              >
                <span className="season-pill-emoji">{currentSeasonObj.emoji}</span>
                <span className="topbar-season-name">{currentSeasonObj.label}</span>
                <ChevronDown size={13} className={`chevron-icon ${seasonDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {seasonDropdownOpen && (
                <div className="topbar-season-dropdown glass-panel" onClick={(e) => e.stopPropagation()}>
                  <div className="dropdown-header-title">AUSTRAL POLAR SEASONS</div>
                  {seasons.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      className={`topbar-dropdown-item ${s.id === activeSeason ? 'active' : ''}`}
                      onClick={() => {
                        onChangeSeason && onChangeSeason(s.id);
                        setSeasonDropdownOpen(false);
                      }}
                    >
                      <div className="item-name-row">
                        <span className="season-item-title-box">
                          <span className="season-dropdown-emoji">{s.emoji}</span>
                          <span className="item-short-name">{s.label}</span>
                        </span>
                        {s.id === activeSeason && <span className="item-badge-basin">ACTIVE</span>}
                      </div>
                      <div className="item-coord-row mono-readout">{s.desc}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Step 5: Right next to it is Auto */}
            <button
              type="button"
              className={`topbar-season-cycle-btn ${isAutoSeasonCycle ? 'active' : ''}`}
              onClick={onToggleAutoSeason}
              title={isAutoSeasonCycle ? "Auto-cycling seasons: ON (18s interval)" : "Enable automatic 4-season climate cycle"}
            >
              <span className={isAutoSeasonCycle ? "spin-icon" : ""}>↺</span>
              <span className="cycle-btn-text">Auto</span>
            </button>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          RIGHT SIDE OF CENTER (Problem 3 Specifications)
          1. Slide Show as it is
          2. Dynamic Watts consumption (changes with every action) & Battery % (starts at 100%)
          3. Preferences button
          4. Team details in Information icon (at far right after preferences)
          ════════════════════════════════════════════════ */}
      <div className="topbar-cluster-right">
        {/* Step 1: Slide Show button as it is */}
        {isTourRunning ? (
          <button
            type="button"
            id="topbar-tour-btn"
            className="topbar-tour-btn active-tour"
            onClick={onExitTour}
            title="Exit Slide Show Presentation"
          >
            <Square size={12} className="accent-red" />
            <span className="number-bebas desktop-tour-text">EXIT SLIDES ({tourSeconds}S)</span>
            <span className="number-bebas mobile-tour-text">EXIT ({tourSeconds}S)</span>
          </button>
        ) : (
          <button
            type="button"
            id="topbar-tour-btn"
            className="topbar-tour-btn"
            onClick={onStartTour}
            title="Launch Slide Show Presentation (Executive Mode)"
          >
            <Play size={12} className="accent-amber" />
            <span className="desktop-tour-text">Slide Show</span>
            <span className="mobile-tour-text">Slides</span>
          </button>
        )}

        {/* Step 2: Dynamic Watts Consumption (changes with actions) */}
        <div className="hud-mini-pill power-chip" title={`Real-Time Dynamic Subsystem Power Draw: ${powerWatts.toFixed(1)}W | Solar Generation: ${solarWatts.toFixed(1)}W`}>
          <Sun size={13} className="accent-amber" />
          <span className="mono-readout font-bold">{powerWatts.toFixed(1)}W</span>
        </div>

        {/* Step 2: Simulated Battery Percentage (starts at 100%) */}
        <div className="hud-mini-pill battery-chip" title={`LiFePO4 Buoy Battery State of Charge: ${battery.toFixed(1)}%`}>
          <Battery size={13} className={battery > 25 ? "accent-green" : "accent-red"} />
          <span className="mono-readout font-bold">{battery.toFixed(0)}%</span>
        </div>

        {/* Phase 6B: Compact Kapton Heater & Thermal Power Budget Chip */}
        {heaterState && (
          <button
            type="button"
            className={`hud-mini-pill thermal-chip ${
              heaterState.isTripped ? 'cutoff' : heaterState.isOverWattage ? 'overwatt' : heaterState.isOverheat ? 'overheat' : heaterState.powerWatts > 0 ? 'heating' : ''
            }`}
            onClick={() => onSelectPart && onSelectPart('kapton_pads')}
            title={
              heaterState.isTripped
                ? "BIMETALLIC BREAKER TRIPPED (+45°C CUTOFF) - Click to inspect & reset"
                : heaterState.isOverWattage
                ? `OVER-WATTAGE WARNING: ${(heaterState.powerWatts + 0.65).toFixed(1)}W > ${(heaterState.sourceLimitWatts || 14.8).toFixed(1)}W - Click to inspect`
                : heaterState.isOverheat
                ? `OVERHEAT WARNING: Pad ${heaterState.temperature.toFixed(1)}°C > +35°C - Click to inspect`
                : `Kapton Thermal Control: ${heaterState.temperature > 0 ? '+' : ''}${heaterState.temperature.toFixed(1)}°C (${heaterState.powerWatts.toFixed(1)}W) - Click to inspect`
            }
          >
            <Flame
              size={13}
              className={
                heaterState.isTripped
                  ? "accent-red"
                  : (heaterState.isOverWattage || heaterState.isOverheat)
                  ? "accent-amber blink-fast"
                  : heaterState.powerWatts > 0
                  ? "accent-amber"
                  : "accent-cyan"
              }
            />
            {heaterState.isTripped ? (
              <span className="mono-readout font-bold text-cutoff">CUTOFF</span>
            ) : heaterState.isOverWattage ? (
              <span className="mono-readout font-bold text-overwatt">OVER-WATT</span>
            ) : heaterState.isOverheat ? (
              <span className="mono-readout font-bold text-overheat">OVERHEAT</span>
            ) : (
              <span className="mono-readout font-bold">
                {heaterState.temperature > 0 ? '+' : ''}{heaterState.temperature.toFixed(1)}°C
                <span className="mobile-hide" style={{ opacity: 0.7, marginLeft: '3px', fontWeight: 500 }}>
                  ({heaterState.powerWatts.toFixed(1)}W)
                </span>
              </span>
            )}
          </button>
        )}

        {/* Real-Time SCADA Quality Tier Toggle Pill */}
        <button
          type="button"
          className="hud-mini-pill quality-tier-chip"
          onClick={onToggleQuality}
          title={`Active GPU Quality Tier: ${String(qualityTier).toUpperCase()} (Click to toggle LOW / MED / HIGH)`}
        >
          <Zap size={12} className={qualityTier === 'high' ? "accent-cyan" : qualityTier === 'medium' ? "accent-amber" : "accent-green"} />
          <span className="mono-readout font-bold uppercase">{qualityTier}</span>
        </button>

        {/* LoRa SX1278 Uplink Burst Indicator */}
        <div className={`hud-mini-pill mobile-hide ${isBreaching ? "uplink-bursting" : ""}`} title="LoRa SX1278 Acoustic & Surface Gateway (433.05 MHz)">
          <div className="rf-meter-group" aria-hidden="true">
            <span className="rf-meter-bar bar-1 active" />
            <span className="rf-meter-bar bar-2 active" />
            <span className={`rf-meter-bar bar-3 ${isBreaching ? 'active' : ''}`} />
            <span className={`rf-meter-bar bar-4 ${isBreaching ? 'active' : ''}`} />
          </div>
          <Radio size={13} className={isBreaching ? "accent-green pulse-anim" : "accent-cyan"} />
          <span className="mono-readout">{isBreaching ? "BURST" : "LORA"}</span>
        </div>

        {/* UTC Clock */}
        <div className="hud-mini-pill clock-pill mobile-hide">
          <span className="mono-readout text-muted">{timeStr}</span>
        </div>

        {/* Step 3: Preferences button */}
        <button
          type="button"
          className={`topbar-settings-btn ${sidebarOpen ? 'active' : ''}`}
          onClick={onToggleSidebar}
          title="Hardware Subsystems & Sea Preferences"
        >
          {sidebarOpen ? <X size={16} /> : <Sliders size={16} />}
        </button>

        {/* Step 4: Team details in Information icon (repositioned to the far right after preferences) */}
        <button
          type="button"
          className="topbar-info-circle-btn"
          onClick={onOpenTeamDetails}
          title="Team SIH-26065 Details & Evaluator Grant Compliance"
        >
          <span className="info-circle-text">ⓘ</span>
        </button>
      </div>
    </header>
  );
}
