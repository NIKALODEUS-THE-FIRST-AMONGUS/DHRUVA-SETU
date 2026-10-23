import React, { useState, useEffect } from 'react';
import { 
  Compass, Anchor, Waves, Radio, Eye, Camera, Cpu, Sparkles, 
  ChevronRight, ChevronLeft, X, Check, HelpCircle, Layers, Sliders, Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';

const STORAGE_KEY = 'dhruva_setu_onboarded_v2';

export default function OnboardingTutorial({
  isOpen,
  onClose,
  onChangeCamera,
  onChangeDepth,
  onChangeSeason,
  onSelectRegion,
  onOpenDeckTab,
  onStartTour
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Auto-trigger actions per step to demonstrate live capabilities
  useEffect(() => {
    if (!isOpen) return;

    if (currentStep === 0) {
      // Step 1: Environment & Climate Overview
      if (onChangeCamera) onChangeCamera('wide');
    } else if (currentStep === 1) {
      // Step 2: Spar Buoy 6-DOF Hydrodynamics
      if (onChangeCamera) onChangeCamera('buoy');
    } else if (currentStep === 2) {
      // Step 3: Winch & Subsea CTD Profiler
      if (onChangeCamera) onChangeCamera('ctd');
      if (onChangeDepth) onChangeDepth(45.0); // Show Halocline depth
      if (onOpenDeckTab) onOpenDeckTab('winch');
    } else if (currentStep === 3) {
      // Step 4: Wild Weddell Seal Pod & Acoustics
      if (onChangeCamera) onChangeCamera('seal');
      if (onOpenDeckTab) onOpenDeckTab('seal');
    } else if (currentStep === 4) {
      // Step 5: 3-Tier Cutaway Hardware Bay
      if (onChangeCamera) onChangeCamera('electronics');
      if (onOpenDeckTab) onOpenDeckTab('camera');
    }
  }, [currentStep, isOpen]);

  const steps = [
    {
      id: 'polar-env',
      badge: 'STEP 1 OF 5 // POLAR CLIMATE',
      title: 'Polar Deployment & Seasons',
      icon: Compass,
      accent: 'cyan',
      desc: 'Dhruva Setu simulates India’s autonomous polar ocean observation platform across the high-energy Marginal Ice Zone (MIZ) of Prydz Bay and the coastal Antarctic waters of Bharati Station.',
      highlights: [
        { label: 'Deployment Sectors', detail: 'Toggle between Prydz Bay MIZ (68°22\'S) and Bharati Station in the Top Bar.' },
        { label: '4-Season Climate', detail: 'Austral Summer (Midnight Sun), Autumn Blizzard, Polar Night, and Spring Breakup.' },
        { label: '↺ Auto-Cycle', detail: 'Toggle automatic seasonal progression with real-time solar watt variations.' }
      ],
      quickTip: 'Tip: Click the Area or Season pill in the Top Bar anytime to change polar conditions.'
    },
    {
      id: 'spar-buoy',
      badge: 'STEP 2 OF 5 // HYDRODYNAMICS',
      title: '6-DOF Spar Buoy & Ocean Physics',
      icon: Anchor,
      accent: 'amber',
      desc: 'The surface spar buoy uses metacentric ballast and a slender hydrodynamic draft to survive violent Southern Ocean swells and sea ice collisions without power.',
      highlights: [
        { label: 'Interactive 3D Camera', detail: 'Drag to Orbit, Scroll to Zoom, Right-Click / Two-Finger drag to Pan.' },
        { label: 'Wave & Ice Synthesis', detail: 'Real-time Gerstner wave mechanics with damping from pancake ice floes.' },
        { label: 'Mooring Catenary', detail: 'Aramid Kevlar line anchored with a 280kg benthic clump mud anchor at -48m.' }
      ],
      quickTip: 'Tip: Open Observatory Preferences (⚙️ icon) to adjust wave amplitude and ice density.'
    },
    {
      id: 'ctd-profiler',
      badge: 'STEP 3 OF 5 // HYDROGRAPHY',
      title: 'Subsea Winch & Halocline CTD',
      icon: Waves,
      accent: 'cyan',
      desc: 'An automated winch lowers the hydrodynamic titanium CTD sonde from 0m to 200m depth to log live ocean stratification, sound velocity channels, and polar meltwater.',
      highlights: [
        { label: 'Depth Winch', detail: 'Use the bottom dock slider or tap Quick Presets (Surface, Halocline, Abyss).' },
        { label: 'Live CTD Graph', detail: 'Calculates real-time UNESCO EOS-80 density, salinity, and sound speed.' },
        { label: 'Pycnocline Shear Layer', detail: 'Observe rapid water mass transition between AASW and deep MCDW.' }
      ],
      quickTip: 'Tip: Tap "Auto Profile" in the Winch tab to let the sonde continuously sound the water column.'
    },
    {
      id: 'marine-seal',
      badge: 'STEP 4 OF 5 // MARINE TELEMETRY',
      title: 'Weddell Seal Opportunistic Relay',
      icon: Radio,
      accent: 'green',
      desc: 'Wild Weddell seals (Leptonychotes weddellii) fitted with non-invasive bio-loggers act as mobile oceanographic sensors, harvesting data across a <800m acoustic cone.',
      highlights: [
        { label: '12.5 kHz Underwater Sonar', detail: 'Spar buoy hydrophone listens for acoustic ping packets from the diving pod.' },
        { label: 'Surface LoRa Burst (433MHz)', detail: 'When seals surface to breathe, high-speed RF uplink transfers ocean soundings.' },
        { label: 'PPI Sonar Radar', detail: 'View the live 360° PPI sonar scope and RF waterfall spectrum in the Seal Pod tab.' }
      ],
      quickTip: 'Tip: Click "Track Wild Pod" to follow the Weddell seal pod directly in 3D.'
    },
    {
      id: 'hardware-inspection',
      badge: 'STEP 5 OF 5 // HARDWARE & PRESENTATION',
      title: '3-Tier Cutaway & Evaluator Tools',
      icon: Cpu,
      accent: 'purple',
      desc: 'Dhruva Setu was engineered under a ₹18,700 (~$225) student BOM budget for the Smart India Hackathon Grand Finale.',
      highlights: [
        { label: 'Part A: Antenna & Solar', detail: 'Inspect 433MHz whip, RTK GPS ceramic patch, and flexible ETFE solar conduit.' },
        { label: 'Part B: PCB & Heaters', detail: 'Watertight bay with ESP32-S3, SX1278 LoRa, and Kapton thermal anti-freeze pads.' },
        { label: 'Part C: Winch Motor', detail: 'Worm-drive motor, waterproof slip rings, and HDPE keel guide tubes.' },
        { label: '120s Slide Show (▶)', detail: 'One-click automated executive PowerPoint-style presentation mode for evaluators.' }
      ],
      quickTip: 'Secret: Type "s-i-h" on your keyboard anytime to reveal the Evaluator Gold Medal compliance audit!'
    }
  ];

  const activeStepData = steps[currentStep];
  const StepIcon = activeStepData.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch (e) {
      // ignore storage errors
    }
    
    // Evaluator Celebration Confetti
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.75 },
      colors: ['#38bdf8', '#10b981', '#f59e0b', '#a855f7']
    });

    onClose();
  };

  const handleDismiss = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
      } catch (e) {
        // ignore
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="onboarding-overlay">
      {/* Semi-transparent non-blocking backdrop */}
      <div className="onboarding-backdrop" onClick={handleDismiss} />

      <aside className={`onboarding-card glass-panel ${isMinimized ? 'minimized' : ''}`}>
        {/* Top Header Row */}
        <div className="onboarding-header">
          <div className="onboarding-badge-row">
            <span className={`onboarding-step-pill accent-${activeStepData.accent}`}>
              <Sparkles size={11} />
              <span>{activeStepData.badge}</span>
            </span>
          </div>

          <div className="onboarding-window-controls">
            <button
              type="button"
              className="onboarding-icon-btn"
              onClick={() => setIsMinimized(prev => !prev)}
              title={isMinimized ? "Expand Tutorial" : "Minimize Tutorial"}
            >
              <HelpCircle size={14} />
            </button>
            <button
              type="button"
              className="onboarding-icon-btn close-btn"
              onClick={handleDismiss}
              title="Close Tutorial"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Step Progress Line */}
        <div className="onboarding-progress-bar">
          <div 
            className="onboarding-progress-fill" 
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} 
          />
        </div>

        {!isMinimized && (
          <div className="onboarding-body">
            {/* Title & Icon Header */}
            <div className="onboarding-title-group">
              <div className={`onboarding-icon-box bg-accent-${activeStepData.accent}`}>
                <StepIcon size={20} className={`accent-${activeStepData.accent}`} />
              </div>
              <div>
                <h3 className="onboarding-title">{activeStepData.title}</h3>
                <p className="onboarding-desc">{activeStepData.desc}</p>
              </div>
            </div>

            {/* Core Feature Bullet Points */}
            <div className="onboarding-features-list">
              {activeStepData.highlights.map((h, i) => (
                <div key={i} className="onboarding-feature-item">
                  <div className="feature-bullet-dot" />
                  <div className="feature-text">
                    <strong className="feature-label">{h.label}:</strong> {h.detail}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Pro-Tip Callout */}
            <div className="onboarding-tip-banner">
              <span className="tip-sparkle">💡</span>
              <span className="tip-text">{activeStepData.quickTip}</span>
            </div>

            {/* Bottom Controls Bar */}
            <div className="onboarding-footer">
              <label className="onboarding-dont-show">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                />
                <span>Don't show on launch</span>
              </label>

              <div className="onboarding-nav-btns">
                {currentStep > 0 && (
                  <button
                    type="button"
                    className="onboarding-prev-btn"
                    onClick={handlePrev}
                  >
                    <ChevronLeft size={14} />
                    <span>Back</span>
                  </button>
                )}

                <button
                  type="button"
                  className="onboarding-next-btn"
                  onClick={handleNext}
                >
                  <span>{currentStep === steps.length - 1 ? "Start Exploring" : "Next Step"}</span>
                  {currentStep === steps.length - 1 ? <Check size={14} /> : <ChevronRight size={14} />}
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
