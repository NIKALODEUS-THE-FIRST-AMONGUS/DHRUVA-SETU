import React, { useState, useEffect } from 'react';
import { 
  Compass, Anchor, Waves, Radio, Eye, Camera, Cpu, Sparkles, 
  ChevronRight, ChevronLeft, X, Check, HelpCircle, Layers, Sliders, Zap,
  Play, Square, ShieldCheck, Sun, Snowflake, Moon, ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

const STORAGE_KEY = 'dhruva_setu_onboarded_v2';

export default function OnboardingTutorial({
  isOpen,
  onClose,
  currentDepth = 0,
  onChangeDepth,
  cameraPreset = 'wide',
  onChangeCamera,
  activeSeason = 'summer',
  onChangeSeason,
  isAutoProfiling = false,
  onToggleAutoProfile,
  sealBreachData,
  powerWatts = 1.35,
  battery = 100,
  onOpenDeckTab
}) {
  const [activeMission, setActiveMission] = useState(0);
  const [isCompact, setIsCompact] = useState(false);
  const [missionCompleted, setMissionCompleted] = useState([false, false, false, false, false]);

  // Track user actions inside the simulation to auto-check off missions
  useEffect(() => {
    if (!isOpen) return;

    // Mission 0: Winch deployed >= 40m
    if (activeMission === 0 && currentDepth >= 35) {
      setMissionCompleted(prev => {
        const next = [...prev];
        next[0] = true;
        return next;
      });
    }

    // Mission 1: Camera focused on buoy
    if (activeMission === 1 && cameraPreset === 'buoy') {
      setMissionCompleted(prev => {
        const next = [...prev];
        next[1] = true;
        return next;
      });
    }

    // Mission 2: Tracking seal pod
    if (activeMission === 2 && cameraPreset === 'seal') {
      setMissionCompleted(prev => {
        const next = [...prev];
        next[2] = true;
        return next;
      });
    }

    // Mission 3: Inspecting electronics
    if (activeMission === 3 && cameraPreset?.startsWith('electronics')) {
      setMissionCompleted(prev => {
        const next = [...prev];
        next[3] = true;
        return next;
      });
    }

    // Mission 4: Triggered winter or autumn season
    if (activeMission === 4 && (activeSeason === 'winter' || activeSeason === 'autumn')) {
      setMissionCompleted(prev => {
        const next = [...prev];
        next[4] = true;
        return next;
      });
    }
  }, [currentDepth, cameraPreset, activeSeason, activeMission, isOpen]);

  const missions = [
    {
      id: 'ctd-depth',
      tag: 'MISSION 01 // SUBSEA HYDROGRAPHY',
      title: 'Sounding the Antarctic Pycnocline',
      icon: Waves,
      accent: 'cyan',
      objective: 'Deploy the automated winch to 50m depth to profile the sub-zero Halocline shear boundary layer.',
      actionLabel: 'Deploy Winch to 50m',
      onAction: () => {
        if (onChangeDepth) onChangeDepth(50.0);
        if (onChangeCamera) onChangeCamera('ctd');
        if (onOpenDeckTab) onOpenDeckTab('winch');
      },
      statusText: currentDepth >= 35 
        ? `✓ Pycnocline penetrated (${currentDepth.toFixed(1)}m) — Halocline profile active (-1.85°C)`
        : `Sonde currently at ${currentDepth.toFixed(1)}m — Descend below 35m to complete`,
      isDone: currentDepth >= 35
    },
    {
      id: 'buoy-physics',
      tag: 'MISSION 02 // WAVE HYDRODYNAMICS',
      title: '6-DOF Spar Buoy & Sea Ice Damping',
      icon: Anchor,
      accent: 'amber',
      objective: 'Switch camera to the surface spar buoy and observe 6-DOF Stokes drift stability amidst colliding pancake ice floes.',
      actionLabel: 'Focus Spar Buoy (Cam 2)',
      onAction: () => {
        if (onChangeCamera) onChangeCamera('buoy');
      },
      statusText: cameraPreset === 'buoy'
        ? '✓ 6-DOF hydrodynamic tracking active — Metacentric ballast self-righting verified'
        : 'Click the button or drag the 3D viewport to orbit around the spar buoy',
      isDone: cameraPreset === 'buoy'
    },
    {
      id: 'seal-telemetry',
      tag: 'MISSION 03 // MARINE BIO-LOGGERS',
      title: 'Weddell Seal Acoustic Telemetry Relay',
      icon: Radio,
      accent: 'green',
      objective: 'Track the 4 foraging Weddell seals harvesting subsea ocean data and transmitting packets over the 12.5kHz acoustic link.',
      actionLabel: 'Track Weddell Seal Pod',
      onAction: () => {
        if (onChangeCamera) onChangeCamera('seal');
        if (onOpenDeckTab) onOpenDeckTab('seal');
      },
      statusText: cameraPreset === 'seal'
        ? `✓ Acoustic sonar link locked (<800m cone) — ${sealBreachData?.isBreaching ? '433MHz LoRa burst active' : '12.5kHz acoustic standby'}`
        : 'Track the seal pod to monitor opportunistic biological sensor relays',
      isDone: cameraPreset === 'seal'
    },
    {
      id: 'electronics-cutaway',
      tag: 'MISSION 04 // AVIONICS CUTAWAY',
      title: '3-Tier Watertight Avionics Bay',
      icon: Cpu,
      accent: 'purple',
      objective: 'Inspect the interior electronics: ESP32-S3 microcontroller, SX1278 LoRa transceiver, and Kapton thermal heaters.',
      actionLabel: 'Inspect Part B (Avionics)',
      onAction: () => {
        if (onChangeCamera) onChangeCamera('electronics');
        if (onOpenDeckTab) onOpenDeckTab('camera');
      },
      statusText: cameraPreset?.startsWith('electronics')
        ? '✓ Watertight IP68 hull cutaway active — Dual Kapton thermal heating pads verified'
        : 'Switch to Part B to examine the cold-weather electronics hardware',
      isDone: cameraPreset?.startsWith('electronics')
    },
    {
      id: 'climate-seasons',
      tag: 'MISSION 05 // POLAR CLIMATE',
      title: 'Dynamic Blizzard & Aurora Australis',
      icon: Snowflake,
      accent: 'cyan',
      objective: 'Switch the climate to Autumn Blizzard or Winter Polar Night to simulate sub-zero heating power balance and night sky auroras.',
      actionLabel: 'Trigger Polar Night & Aurora',
      onAction: () => {
        if (onChangeSeason) onChangeSeason('winter');
        if (onChangeCamera) onChangeCamera('wide');
      },
      statusText: (activeSeason === 'winter' || activeSeason === 'autumn')
        ? `✓ Austral ${activeSeason.toUpperCase()} climate active — Power consumption: ${powerWatts.toFixed(1)}W`
        : 'Change polar season to test sub-zero freeze survival and heating load',
      isDone: activeSeason === 'winter' || activeSeason === 'autumn'
    }
  ];

  const current = missions[activeMission];
  const StepIcon = current.icon;
  const allMissionsFinished = missionCompleted.every(Boolean);

  const handleNext = () => {
    if (activeMission < missions.length - 1) {
      setActiveMission(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (activeMission > 0) {
      setActiveMission(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch (e) {}

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.65 },
      colors: ['#38bdf8', '#10b981', '#f59e0b', '#a855f7']
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="sim-tutorial-overlay">
      <div className={`sim-tutorial-hud glass-panel ${isCompact ? 'compact' : ''}`}>
        {/* HUD Top Bar */}
        <div className="sim-hud-top-row">
          <div className="sim-hud-badge-group">
            <span className={`sim-mission-pill accent-${current.accent}`}>
              <Sparkles size={11} className="spin-icon" />
              <span>{current.tag}</span>
            </span>

            {/* Micro Step Dots */}
            <div className="sim-step-dots">
              {missions.map((m, idx) => (
                <button
                  key={m.id}
                  type="button"
                  className={`sim-step-dot ${idx === activeMission ? 'active' : ''} ${missionCompleted[idx] ? 'completed' : ''}`}
                  onClick={() => setActiveMission(idx)}
                  title={m.title}
                />
              ))}
            </div>
          </div>

          <div className="sim-hud-actions">
            <button
              type="button"
              className="sim-hud-btn"
              onClick={() => setIsCompact(prev => !prev)}
              title={isCompact ? "Expand Mission HUD" : "Minimize Mission HUD"}
            >
              {isCompact ? "EXPAND ▾" : "MINIMIZE ▴"}
            </button>
            <button
              type="button"
              className="sim-hud-close-btn"
              onClick={onClose}
              title="Exit Simulation Tutorial"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* HUD Interactive Content (Hidden in compact view) */}
        {!isCompact && (
          <div className="sim-hud-body">
            <div className="sim-hud-main-content">
              <div className={`sim-icon-frame bg-accent-${current.accent}`}>
                <StepIcon size={20} className={`accent-${current.accent}`} />
              </div>
              <div className="sim-text-block">
                <div className="sim-mission-title">{current.title}</div>
                <div className="sim-mission-objective">{current.objective}</div>
              </div>
            </div>

            {/* Live Simulation Feedback Banner */}
            <div className={`sim-live-feedback ${current.isDone ? 'is-complete' : 'in-progress'}`}>
              <div className="feedback-status-indicator">
                {current.isDone ? <ShieldCheck size={14} className="accent-green" /> : <Zap size={14} className="accent-cyan pulse-anim" />}
              </div>
              <div className="feedback-status-text mono-readout">
                {current.statusText}
              </div>
            </div>

            {/* Bottom Directive Actions Bar */}
            <div className="sim-hud-controls-row">
              {/* Simulator Action Trigger Button */}
              <button
                type="button"
                className={`sim-trigger-action-btn ${current.isDone ? 'done' : ''}`}
                onClick={current.onAction}
              >
                <Zap size={13} />
                <span>{current.actionLabel}</span>
              </button>

              <div className="sim-nav-btn-group">
                {activeMission > 0 && (
                  <button
                    type="button"
                    className="sim-nav-prev-btn"
                    onClick={handlePrev}
                  >
                    <ChevronLeft size={14} />
                    <span>Prev</span>
                  </button>
                )}

                <button
                  type="button"
                  className="sim-nav-next-btn"
                  onClick={handleNext}
                >
                  <span>{activeMission === missions.length - 1 ? "Complete Training" : "Next Mission"}</span>
                  {activeMission === missions.length - 1 ? <Check size={14} /> : <ChevronRight size={14} />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
