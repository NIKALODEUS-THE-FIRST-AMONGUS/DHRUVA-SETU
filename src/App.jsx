import React, { useState, useEffect, useRef, useMemo } from 'react';
import VFXScene from './components/3d/VFXScene';
import TopBar from './components/ui/TopBar';
import UnifiedControlDeck from './components/ui/UnifiedControlDeck';
import ComponentDetailModal from './components/ui/ComponentDetailModal';
import TourPresentationOverlay from './components/ui/TourPresentationOverlay';
import TeamDetailsModal from './components/ui/TeamDetailsModal';
import OnboardingTutorial from './components/ui/OnboardingTutorial';
import { CONFIG } from './constants/config';
import { POLAR_REGIONS, DEFAULT_REGION_ID } from './constants/polarRegions';
import { Sliders, X, Box, Cpu, Radio, Waves, Sun, Anchor, Play, Award, Sparkles, RotateCcw, HelpCircle } from 'lucide-react';

export default function App() {
  // Polar Region State (Isolated between Prydz Bay MIZ and Bharati Base)
  const [activeRegionId, setActiveRegionId] = useState(DEFAULT_REGION_ID);
  const activeRegion = POLAR_REGIONS[activeRegionId] || POLAR_REGIONS.prydz_bay_miz;

  // Independent weather & sea physics state stored separately for each polar region
  const [regionWeathers, setRegionWeathers] = useState({
    prydz_bay_miz: {
      waveHeightScale: POLAR_REGIONS.prydz_bay_miz.seaPhysics.waveHeightMult,
      foamIntensity: POLAR_REGIONS.prydz_bay_miz.seaPhysics.foamIntensity,
      iceFloeDensity: POLAR_REGIONS.prydz_bay_miz.seaPhysics.iceFloeDensity
    },
    bharati_station: {
      waveHeightScale: POLAR_REGIONS.bharati_station.seaPhysics.waveHeightMult,
      foamIntensity: POLAR_REGIONS.bharati_station.seaPhysics.foamIntensity,
      iceFloeDensity: POLAR_REGIONS.bharati_station.seaPhysics.iceFloeDensity
    }
  });

  const activeWeather = regionWeathers[activeRegionId] || regionWeathers.prydz_bay_miz;

  const updateActiveWeather = (key, val) => {
    setRegionWeathers(prev => ({
      ...prev,
      [activeRegionId]: {
        ...prev[activeRegionId],
        [key]: val
      }
    }));
  };

  const handleSelectRegion = (id) => {
    setActiveRegionId(id);
  };

  // Core Simulation States
  const [currentDepth, setCurrentDepth] = useState(0.0);
  const [isAutoProfiling, setIsAutoProfiling] = useState(false);
  const [profileDirection, setProfileDirection] = useState(1);
  const [battery, setBattery] = useState(100.0); // Starts at 100% (real-time buoy battery calculation)
  const [solarWatts, setSolarWatts] = useState(2.2);
  const [cameraPreset, setCameraPreset] = useState('wide');
  const [explodedView, setExplodedView] = useState(false);
  const [sealBreachData, setSealBreachData] = useState({ isBreaching: false, sealDepth: 20 });
  const [selectedSubsystem, setSelectedSubsystem] = useState(null);
  const [vfxSettings, setVfxSettings] = useState({
    bloom: true,
    bloomStrength: 0.65,
    volumetricRays: true
  });

  // Antarctic 4-Season Climate Cycle: 'summer' (Midnight Sun), 'autumn' (Blizzard), 'winter' (Polar Night), 'spring' (Thaw)
  const [activeSeason, setActiveSeason] = useState('summer');
  const [isAutoSeasonCycle, setIsAutoSeasonCycle] = useState(false);

  // CTD Chase Camera lock/disengage state
  const [isFollowingCTD, setIsFollowingCTD] = useState(false);

  // Dynamic Subsystem Power Consumption (Watts) - changes with every user action
  const powerWatts = useMemo(() => {
    let w = 1.35; // Base avionics load (ESP32-S3 Dual Core + basic telemetry)
    if (isAutoProfiling) {
      w += 4.80; // High-torque subsea winch stepper motor active
    } else if (currentDepth > 0) {
      w += 1.40; // CTD inductive conductivity cell & halocline sensor suite active
    }
    if (sealBreachData?.isBreaching) {
      w += 2.20; // LoRa SX1278 RF uplink transmitter burst
    }
    if (activeSeason === 'winter') {
      w += 3.60; // Dual Kapton polyimide heating pads & BMS freeze prevention active (-40°C)
    } else if (activeSeason === 'autumn') {
      w += 1.80; // Intermittent thermal heating pulse during blizzard
    }
    if (cameraPreset?.startsWith('electronics')) {
      w += 0.50; // Internal IP68 payload bay inspection illumination active
    }
    if (isFollowingCTD) {
      w += 0.65; // High-bandwidth real-time optical tracking encoder active
    }
    return w;
  }, [isAutoProfiling, currentDepth, sealBreachData?.isBreaching, activeSeason, cameraPreset, isFollowingCTD]);

  // Auto-Cycle Seasons Timer (Austral Climate Progression)
  useEffect(() => {
    if (!isAutoSeasonCycle) return;
    const seasonOrder = ['summer', 'autumn', 'winter', 'spring'];
    const timer = setInterval(() => {
      setActiveSeason(prev => {
        const nextIdx = (seasonOrder.indexOf(prev) + 1) % seasonOrder.length;
        return seasonOrder[nextIdx];
      });
    }, 18000); // 18s per season when auto-cycling
    return () => clearInterval(timer);
  }, [isAutoSeasonCycle]);

  // Settings Drawer State
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Battery & Solar Simulation Loop (Real-Time Buoy Dynamic Energy Balance)
  useEffect(() => {
    const timer = setInterval(() => {
      setSolarWatts(prev => {
        if (activeSeason === 'winter') return 0.0; // Polar Night: 0 solar generation!
        const base = activeSeason === 'autumn' ? 0.65 : (activeSeason === 'spring' ? 1.70 : 2.25);
        const val = base + Math.sin(Date.now() * 0.0005) * 0.20;
        return Math.max(0.0, Math.min(CONFIG.MAX_SOLAR_WATTS, val));
      });
      setBattery(prev => {
        // Real-time dynamic drain based on actual power consumption watts
        const drain = (powerWatts / 18.0) * 0.02;
        const solarGen = activeSeason === 'winter' ? 0.0 : 0.015;
        return Math.max(10.0, Math.min(100.0, prev - drain + solarGen));
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [powerWatts, activeSeason]);

  // Winch Auto-Profiling Loop (Continuous ocean depth cycling)
  useEffect(() => {
    if (!isAutoProfiling) return;
    const interval = setInterval(() => {
      setCurrentDepth(prev => {
        let next = prev + profileDirection * CONFIG.WINCH_SPEED_MS;
        if (next >= CONFIG.MAX_DEPTH_METERS) {
          next = CONFIG.MAX_DEPTH_METERS;
          setProfileDirection(-1);
        } else if (next <= 0) {
          next = 0;
          setProfileDirection(1);
        }
        return next;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [isAutoProfiling, profileDirection]);


  // 120-Second Automated Executive Mission Tour (Presentation Mode)
  const [isTourRunning, setIsTourRunning] = useState(false);
  const [tourSeconds, setTourSeconds] = useState(0);
  const [tourCaption, setTourCaption] = useState('');

  // Team SIH-26065 Details Modal State
  const [showTeamModal, setShowTeamModal] = useState(false);

  // Unified Control Deck Minimized/Contracted State
  const [isDeckMinimized, setIsDeckMinimized] = useState(true);

  // Reset Preferences to Factory Defaults (Problem 9)
  const handleResetDefaults = () => {
    setRegionWeathers({
      prydz_bay_miz: {
        waveHeightScale: POLAR_REGIONS.prydz_bay_miz.seaPhysics.waveHeightMult,
        foamIntensity: POLAR_REGIONS.prydz_bay_miz.seaPhysics.foamIntensity,
        iceFloeDensity: POLAR_REGIONS.prydz_bay_miz.seaPhysics.iceFloeDensity
      },
      bharati_station: {
        waveHeightScale: POLAR_REGIONS.bharati_station.seaPhysics.waveHeightMult,
        foamIntensity: POLAR_REGIONS.bharati_station.seaPhysics.foamIntensity,
        iceFloeDensity: POLAR_REGIONS.bharati_station.seaPhysics.iceFloeDensity
      }
    });
    setVfxSettings({
      bloom: true,
      bloomStrength: 0.65,
      volumetricRays: true
    });
    setActiveSeason('summer');
    setIsAutoSeasonCycle(false);
  };

  // Panel Isolation Handlers (Problem 4: Only ONE panel open at once)
  const handleToggleSidebar = () => {
    setSidebarOpen(prev => {
      const next = !prev;
      if (next) {
        setSelectedSubsystem(null);
        setShowTeamModal(false);
      }
      return next;
    });
  };

  const handleSelectSubsystem = (subId) => {
    setSelectedSubsystem(subId);
    if (subId) {
      setSidebarOpen(false);
      setShowTeamModal(false);
    }
  };

  const handleOpenTeamModal = () => {
    setShowTeamModal(true);
    setSelectedSubsystem(null);
    setSidebarOpen(false);
  };

  // Onboarding Tutorial & Non-Annoying Welcome Invite State
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [showTutorialInvite, setShowTutorialInvite] = useState(false);

  // Check if first-time visitor with a polite 2.5s delay (doesn't interrupt initial render)
  useEffect(() => {
    try {
      const hasOnboarded = localStorage.getItem('dhruva_setu_onboarded_v2');
      if (!hasOnboarded) {
        const timer = setTimeout(() => setShowTutorialInvite(true), 2500);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      // ignore storage access errors
    }
  }, []);

  // Easter Egg 2: Secret Gold Medal Evaluator Modal (typed 's-i-h')
  const [showGoldMedalModal, setShowGoldMedalModal] = useState(false);
  const keySequenceRef = useRef([]);

  // Easter Egg 4: Benthic Dive Record Toast
  const [benthicToast, setBenthicToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  // Secret Key Sequence Listener ('s' -> 'i' -> 'h') & Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't capture if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const key = e.key.toLowerCase();
      if (key === 'escape') {
        if (showTutorialModal) setShowTutorialModal(false);
        if (isTourRunning) setIsTourRunning(false);
        if (showGoldMedalModal) setShowGoldMedalModal(false);
        if (showTeamModal) setShowTeamModal(false);
        if (sidebarOpen) setSidebarOpen(false);
        if (selectedSubsystem) setSelectedSubsystem(null);
        return;
      }

      // Help / Tutorial shortcut ('?' or 'h')
      if (key === '?' || key === 'h') {
        setShowTutorialModal(prev => !prev);
        setShowTutorialInvite(false);
        return;
      }

      keySequenceRef.current = [...keySequenceRef.current.slice(-5), key];
      const seq = keySequenceRef.current.join('');
      if (seq.includes('sih')) {
        setShowGoldMedalModal(true);
        keySequenceRef.current = [];
      }

      // Quick Camera & Subsystem Part Shortcuts
      if (key === '1') setCameraPreset('wide');
      if (key === '2') setCameraPreset('buoy');
      if (key === '3') setCameraPreset('electronics_a');
      if (key === '4') setCameraPreset('electronics');
      if (key === '5') setCameraPreset('electronics_c');
      if (key === '6') setCameraPreset('ctd');
      if (key === '7') setCameraPreset('seal');
      if (key === 'a') setCameraPreset('electronics_a');
      if (key === 'b') setCameraPreset('electronics');
      if (key === 'c') setCameraPreset('electronics_c');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTourRunning, showGoldMedalModal, showTeamModal, sidebarOpen, selectedSubsystem, setCameraPreset]);

  // Check for deep benthic dive record (Easter Egg 4)
  useEffect(() => {
    if (sealBreachData.sealDepth >= 160 && !benthicToast) {
      setBenthicToast("🦭 WEDDELL SEAL BENTHIC RECORD: 184m Dive depth reached! Deep MCDW boundary layer profile logged.");
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => {
        setBenthicToast(null);
      }, 7000);
    }
  }, [sealBreachData.sealDepth, benthicToast]);

  // 120-Second Mission Demo Tour Step Machine (6 Phases x 20s each)
  useEffect(() => {
    if (!isTourRunning) return;

    const timer = setInterval(() => {
      setTourSeconds(prev => {
        const next = prev + 1;
        if (next >= 120) {
          setIsTourRunning(false);
          setTourCaption('120s Executive Mission Demonstration Complete.');
          return 0;
        }

        // Phase 1: 0 - 20s -> Front Panoramic Vista of Prydz Bay Marginal Ice Zone
        if (next <= 20) {
          if (activeRegionId !== 'prydz_bay_miz') setActiveRegionId('prydz_bay_miz');
          setCameraPreset('wide');
          setIsFollowingCTD(false);
          setTourCaption("Phase 1/6 [0-20s]: Panoramic Overview of Prydz Bay Marginal Ice Zone. Polar boundary layer & Gerstner wave synthesis.");
        }
        // Phase 2: 21 - 40s -> Surface Spar Buoy & 6-DOF Mooring Hydrodynamics
        else if (next <= 40) {
          setCameraPreset('buoy');
          setIsFollowingCTD(false);
          setTourCaption("Phase 2/6 [21-40s]: Autonomous spar buoy in Southern Ocean current. 6-DOF Stokes drift, Kevlar catenary mooring & clump anchor stability.");
        }
        // Phase 3: 41 - 60s -> Internal Avionics Bay Inspection & ₹20K Student BOM
        else if (next <= 60) {
          setCameraPreset('electronics');
          setIsFollowingCTD(false);
          setTourCaption("Phase 3/6 [41-60s]: Internal Electronics Bay inspection. ESP32-S3 dual core, SX1278 LoRa telemetry, MPPT solar harvester & ₹20K BOM compliance.");
        }
        // Phase 4: 61 - 80s -> Autonomous CTD Profiler Halocline Descent
        else if (next <= 80) {
          setCameraPreset('ctd');
          setIsFollowingCTD(true);
          setCurrentDepth(75.0);
          setTourCaption("Phase 4/6 [61-80s]: Sub-surface CTD profiler halocline sounding. Live temperature, salinity, sound velocity & depth density profiles.");
        }
        // Phase 5: 81 - 100s -> Bharati Antarctic Research Station Telemetry Link
        else if (next <= 100) {
          if (activeRegionId !== 'bharati_station') setActiveRegionId('bharati_station');
          setCameraPreset('station');
          setIsFollowingCTD(false);
          setTourCaption("Phase 5/6 [81-100s]: Bharati Antarctic Research Station telemetry downlink & Weddell seal biologger acoustic relay network.");
        }
        // Phase 6: 101 - 120s -> Benthic Clump Anchor & Epibenthos Diagnostics
        else {
          setCameraPreset('anchor');
          setIsFollowingCTD(false);
          setCurrentDepth(0);
          setTourCaption("Phase 6/6 [101-120s]: Benthic seabed anchor & biofouled clump diagnostics. Antifouling para-aramid tether at -48m depth.");
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTourRunning, activeRegionId]);

  const handleStartTour = () => {
    setIsTourRunning(true);
    setTourSeconds(0);
    setActiveRegionId('prydz_bay_miz');
    setCameraPreset('wide');
    setIsFollowingCTD(false);
    setCurrentDepth(0);
    // Close any open panels
    setSelectedSubsystem(null);
    setSidebarOpen(false);
    setShowTeamModal(false);
    setTourCaption("Phase 1/6 [0-20s]: Front Panoramic Overview of Prydz Bay Marginal Ice Zone. Real-time Gerstner wave synthesis & polar boundary layer.");
  };

  const handleExitTour = () => {
    setIsTourRunning(false);
    setTourSeconds(0);
  };

  // Direct Slide Navigation in Presentation Mode (Problem 2)
  const handleGoToSlide = (slideIdx) => {
    const targetSeconds = Math.max(0, Math.min(5, slideIdx)) * 20;
    setTourSeconds(targetSeconds);
    switch (slideIdx) {
      case 0:
        setActiveRegionId('prydz_bay_miz');
        setCameraPreset('wide');
        setIsFollowingCTD(false);
        break;
      case 1:
        setCameraPreset('buoy');
        setIsFollowingCTD(false);
        break;
      case 2:
        setCameraPreset('electronics');
        setIsFollowingCTD(false);
        break;
      case 3:
        setCameraPreset('ctd');
        setIsFollowingCTD(true);
        setCurrentDepth(75.0);
        break;
      case 4:
        setActiveRegionId('bharati_station');
        setCameraPreset('station');
        setIsFollowingCTD(false);
        break;
      case 5:
        setCameraPreset('anchor');
        setIsFollowingCTD(false);
        setCurrentDepth(0);
        break;
      default:
        break;
    }
  };

  // Camera preset handler
  const handleCameraChange = (preset) => {
    setCameraPreset(preset);
    setExplodedView(false);
    if (preset === 'ctd') {
      setIsFollowingCTD(true);
    } else {
      setIsFollowingCTD(false);
    }
  };

  const handleDisengageCTDCam = () => {
    setIsFollowingCTD(false);
  };

  const handleEngageCTDCam = () => {
    setCameraPreset('ctd');
    setIsFollowingCTD(true);
  };

  const regionsList = Object.values(POLAR_REGIONS);

  // Hardware Subsystems for Inspector Drawer
  const subsystemsList = [
    { id: 'esp32', label: 'ESP32-S3 Dual Core', role: 'Telemetry Controller', icon: Cpu },
    { id: 'mooring', label: 'Aramid Mooring & Anchor', role: 'Stationkeeping & Standoff', icon: Anchor },
    { id: 'lora', label: 'LoRa SX1278 (433MHz)', role: 'Long-Range RF Uplink', icon: Radio },
    { id: 'ctd', label: 'Autonomous CTD Profiler', role: 'Sub-surface Oceanographic Package', icon: Waves },
    { id: 'solar', label: 'PET Solar Photovoltaic', role: 'Perpetual Energy Harvest', icon: Sun },
    { id: 'slipring', label: 'Waterproof Slip Ring', role: 'Continuous Cable Rotation', icon: Anchor },
    { id: 'seal', label: 'Biologger Tag Link', role: 'Layer 2 Marine Relay', icon: Radio }
  ];

  return (
    <div className="app-container">
      {/* WebGL 3D VFX Layer */}
      <VFXScene
        currentDepth={currentDepth}
        cameraPreset={cameraPreset}
        explodedView={explodedView}
        vfxSettings={vfxSettings}
        activeRegion={activeRegion}
        seaControls={activeWeather}
        season={activeSeason}
        onSelectComponent={setSelectedSubsystem}
        onSealBreachUpdate={setSealBreachData}
        isFollowingCTD={isFollowingCTD}
        onDisengageCTD={handleDisengageCTDCam}
      />

      {/* Clean HUD Overlay Layer */}
      <div className="hud-overlay">
        {/* Sleek Top Bar with Integrated Region Selector, Team SIH-26065 & 120s Tour Trigger (Hidden in Tour Mode) */}
        {!isTourRunning && (
          <TopBar
            battery={battery}
            powerWatts={powerWatts}
            solarWatts={solarWatts}
            isBreaching={sealBreachData.isBreaching}
            activeRegion={activeRegion}
            regionsList={regionsList}
            onSelectRegion={handleSelectRegion}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={handleToggleSidebar}
            onStartTour={handleStartTour}
            isTourRunning={isTourRunning}
            tourSeconds={tourSeconds}
            onExitTour={handleExitTour}
            activeSeason={activeSeason}
            onChangeSeason={setActiveSeason}
            isAutoSeasonCycle={isAutoSeasonCycle}
            onToggleAutoSeason={() => setIsAutoSeasonCycle(prev => !prev)}
            onOpenTeamDetails={handleOpenTeamModal}
          />
        )}

        {/* 120-Second Executive Mission Tour Presentation Mode (Full Focus MS PowerPoint Style) */}
        {isTourRunning && (
          <TourPresentationOverlay
            tourSeconds={tourSeconds}
            onExitTour={handleExitTour}
            currentDepth={currentDepth}
            activeRegion={activeRegion}
            onGoToSlide={handleGoToSlide}
          />
        )}

        {/* Benthic Dive Record Toast Notification (Easter Egg 4) */}
        {benthicToast && !isTourRunning && (
          <div
            style={{
              position: 'fixed',
              top: '80px',
              right: '24px',
              zIndex: 100,
              background: 'linear-gradient(135deg, rgba(6, 40, 61, 0.95), rgba(15, 23, 42, 0.95))',
              border: '1px solid rgba(56, 189, 248, 0.5)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.7), 0 0 20px rgba(56, 189, 248, 0.2)',
              borderRadius: '8px',
              padding: '12px 18px',
              maxWidth: '380px',
              color: '#e0f2fe',
              fontSize: '11px',
              lineHeight: '1.5',
              backdropFilter: 'blur(12px)',
              animation: 'slideDown 0.4s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontWeight: 700, color: '#38bdf8', letterSpacing: '0.04em' }}>
                BENTHIC DIVE LOGGED
              </span>
              <button
                onClick={() => setBenthicToast(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
              >
                ✕
              </button>
            </div>
            <div>{benthicToast}</div>
          </div>
        )}

        {/* Floating Welcome Tutorial Invite (First-time visitors, non-blocking & dismissible) */}
        {showTutorialInvite && !showTutorialModal && !isTourRunning && (
          <div className="tutorial-invite-pill glass-panel">
            <div className="invite-text-block">
              <Sparkles size={14} className="accent-cyan" />
              <span>New to Dhruva Setu Simulator?</span>
            </div>
            <div className="invite-btn-group">
              <button
                type="button"
                className="invite-start-btn"
                onClick={() => {
                  setShowTutorialModal(true);
                  setShowTutorialInvite(false);
                }}
              >
                30s Tour
              </button>
              <button
                type="button"
                className="invite-close-btn"
                onClick={() => {
                  setShowTutorialInvite(false);
                  try {
                    localStorage.setItem('dhruva_setu_onboarded_v2', 'true');
                  } catch (e) {}
                }}
                title="Dismiss Tour Invitation"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Clean, Icon-First Unified Bottom Control Deck (Hidden in Tour Mode) */}
        {!isTourRunning && (
          <UnifiedControlDeck
            currentDepth={currentDepth}
            onChangeDepth={setCurrentDepth}
            isAutoProfiling={isAutoProfiling}
            onToggleAutoProfile={() => setIsAutoProfiling(prev => !prev)}
            activeRegion={activeRegion}
            cameraPreset={cameraPreset}
            onChangeCamera={handleCameraChange}
            explodedView={explodedView}
            onToggleExploded={(exp) => {
              setExplodedView(exp);
              if (exp) setCameraPreset('exploded');
            }}
            sealBreachData={sealBreachData}
            isFollowingCTD={isFollowingCTD}
            onDisengageCTD={handleDisengageCTDCam}
            onEngageCTD={handleEngageCTDCam}
            activeSeason={activeSeason}
            onChangeSeason={setActiveSeason}
            isAutoSeasonCycle={isAutoSeasonCycle}
            onToggleAutoSeason={() => setIsAutoSeasonCycle(prev => !prev)}
            isMinimizedProp={isDeckMinimized}
            onToggleMinimize={() => setIsDeckMinimized(prev => !prev)}
            onContractDeck={() => setIsDeckMinimized(true)}
          />
        )}

        {/* Observatory Preferences & Sea Physics Drawer (Hardware Inspector removed, Default Mode added) */}
        {sidebarOpen && (
          <>
            <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
            <aside className="sidebar-drawer glass-panel">
              <div className="drawer-header-row">
                <div className="drawer-title">
                  <Sliders size={16} className="accent-cyan" />
                  <span>OBSERVATORY PREFERENCES</span>
                </div>
                <button
                  className="drawer-close-btn"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Sea Physics Section */}
              <div className="sidebar-section">
                <h4 className="sidebar-section-title">SEA SURFACE & POLAR PHYSICS ({activeRegion.shortName})</h4>
                
                <div className="sidebar-slider-item">
                  <div className="sidebar-slider-header">
                    <span>Wave Amplitude</span>
                    <span className="mono-readout accent-cyan">{activeWeather.waveHeightScale.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.4"
                    max="2.5"
                    step="0.05"
                    value={activeWeather.waveHeightScale}
                    onChange={(e) => updateActiveWeather('waveHeightScale', parseFloat(e.target.value))}
                    className="sidebar-slider"
                  />
                </div>

                <div className="sidebar-slider-item">
                  <div className="sidebar-slider-header">
                    <span>Crest Foam Intensity</span>
                    <span className="mono-readout accent-amber">{(activeWeather.foamIntensity * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="2.0"
                    step="0.05"
                    value={activeWeather.foamIntensity}
                    onChange={(e) => updateActiveWeather('foamIntensity', parseFloat(e.target.value))}
                    className="sidebar-slider"
                  />
                </div>

                <div className="sidebar-slider-item">
                  <div className="sidebar-slider-header">
                    <span>Pack Ice Floe Density</span>
                    <span className="mono-readout accent-green">{(activeWeather.iceFloeDensity * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={activeWeather.iceFloeDensity}
                    onChange={(e) => updateActiveWeather('iceFloeDensity', parseFloat(e.target.value))}
                    className="sidebar-slider"
                  />
                </div>
              </div>

              {/* VFX & Rendering Section */}
              <div className="sidebar-section">
                <h4 className="sidebar-section-title">OPTICAL RENDER ENGINE</h4>
                <label className="sidebar-toggle-row">
                  <span>Atmospheric Bloom</span>
                  <input
                    type="checkbox"
                    checked={vfxSettings.bloom}
                    onChange={() => setVfxSettings({ ...vfxSettings, bloom: !vfxSettings.bloom })}
                  />
                </label>
                {vfxSettings.bloom && (
                  <div className="sidebar-slider-item">
                    <div className="sidebar-slider-header">
                      <span>Bloom Luminance</span>
                      <span className="mono-readout">{vfxSettings.bloomStrength.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.5"
                      step="0.05"
                      value={vfxSettings.bloomStrength}
                      onChange={(e) => setVfxSettings({ ...vfxSettings, bloomStrength: parseFloat(e.target.value) })}
                      className="sidebar-slider"
                    />
                  </div>
                )}
              </div>

              {/* Quick Onboarding & Tutorial Guide */}
              <div className="sidebar-section">
                <h4 className="sidebar-section-title">GUIDED ONBOARDING TUTORIAL</h4>
                <div className="sidebar-default-box">
                  <p className="sidebar-default-desc">
                    Re-launch the interactive 5-step simulator walkthrough to inspect polar climate controls, winch profiler, biologger telemetry, and cutaway hardware.
                  </p>
                  <button
                    type="button"
                    className="sidebar-action-btn"
                    onClick={() => {
                      setSidebarOpen(false);
                      setShowTutorialModal(true);
                    }}
                  >
                    <HelpCircle size={14} className="accent-cyan" />
                    <span>LAUNCH INTERACTIVE TUTORIAL</span>
                  </button>
                </div>
              </div>

              {/* Problem 9: Factory Calibration & Default Mode Section (Hardware Inspector Removed) */}
              <div className="sidebar-section">
                <h4 className="sidebar-section-title">STANDARDIZED POLAR DEFAULTS</h4>
                <div className="sidebar-default-box">
                  <p className="sidebar-default-desc">
                    Reset environmental waves, ice pack density, and optical rendering engine to standardized MoES baseline calibration parameters.
                  </p>
                  <button
                    type="button"
                    className="reset-defaults-btn"
                    onClick={handleResetDefaults}
                  >
                    <RotateCcw size={14} />
                    <span>RESTORE DEFAULT PARAMETERS</span>
                  </button>
                </div>
              </div>
            </aside>
          </>
        )}
      </div>

      {/* Engineering Spec Modal (Isolated: closes when other panels open, focuses camera on inspect click) */}
      {selectedSubsystem && (
        <ComponentDetailModal
          componentId={selectedSubsystem}
          onClose={() => setSelectedSubsystem(null)}
          onSelectComponent={handleSelectSubsystem}
          onFocusCamera={(cam) => handleCameraChange(cam)}
          onContractDeck={() => setIsDeckMinimized(true)}
        />
      )}

      {/* Team SIH-26065 Details Modal (Addition One) */}
      {showTeamModal && (
        <TeamDetailsModal
          isOpen={showTeamModal}
          onClose={() => setShowTeamModal(false)}
        />
      )}

      {/* Easter Egg 2: SIH Grand Finale Gold Medalist Evaluation Modal */}
      {showGoldMedalModal && (
        <div className="modal-overlay" onClick={() => setShowGoldMedalModal(false)}>
          <div className="gold-medal-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="gold-medal-banner">
              <div className="gold-medal-icon">🥇</div>
              <div className="gold-medal-title">SIH GRAND FINALE GOLD MEDALIST MODE</div>
              <div className="gold-medal-subtitle">
                TEAM DHRUVA SETU — PS SIH-26065 // MoES & NCPOR POLAR MANDATE
              </div>
            </div>

            <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '12px' }}>
              <strong>Secret Evaluator Keycode Unlocked!</strong> You are viewing raw low-level hardware diagnostics, direct ESP32-S3 register dumps, and real-time sensor calibration matrices running on the embedded telemetry engine:
            </div>

            <div className="mcu-register-dump">
              <div>[0x3FF00000] DPORT_PERIP_CLK_EN_REG: 0xFFFFFFFF (ALL CLOCKS ACTIVE)</div>
              <div>[0x3FF44000] GPIO_OUT_REG: 0x00001840 (LED_SYS=HIGH, LORA_RST=HIGH)</div>
              <div>[0x3FF5A000] SPI_CMD_REG: 0x00000000 (SX1278 FIFO READY, BW=125kHz, SF=10)</div>
              <div>[0x3FF68000] I2C0_FIFO_CONF_REG: 0x00000010 (MS5837 DEPTH PRESSURE OK)</div>
              <div>[ESP32-S3] Free Heap: 284,912 Bytes | Core 0: FreeRTOS Winch Task | Core 1: RF Uplink</div>
              <div>[HALOCLINE SENSOR] Cell Voltage: 13.24V (4S2P LiFePO4) | Solar Input: 16.4V @ 1.85W</div>
              <div>[CALIBRATION] Cond C0: 0.04128, Temp Cal T0: -1.82°C, Sound Speed c: 1449.2 m/s</div>
              <div>[SATELLITE] ISRO Oceansat-3 Pol-Orbit Sync: 104.2° Inclination | Beam SNR: +18.4 dB</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="disengage-cam-btn"
                style={{ background: 'rgba(245, 158, 11, 0.2)', borderColor: 'rgba(245, 158, 11, 0.6)', color: '#fde68a' }}
                onClick={() => setShowGoldMedalModal(false)}
              >
                Close Diagnostics [Esc]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive 5-Step Guided Onboarding Tutorial (Interactive & Non-Annoying) */}
      <OnboardingTutorial
        isOpen={showTutorialModal}
        onClose={() => setShowTutorialModal(false)}
        onChangeCamera={handleCameraChange}
        onChangeDepth={setCurrentDepth}
        onChangeSeason={setActiveSeason}
        onSelectRegion={handleSelectRegion}
        onOpenDeckTab={() => setIsDeckMinimized(false)}
        onStartTour={handleStartTour}
      />
    </div>
  );
}
