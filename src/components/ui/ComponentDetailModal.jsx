import React from 'react';
import { X, Anchor, Cpu, Radio, Activity, Sun, RotateCw, ShieldCheck, Flame, Battery, Compass, Zap, ArrowDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { HARDWARE_SPECS } from '../../constants/hardwareSpecs';

export default function ComponentDetailModal({
  componentId,
  onClose,
  onSelectComponent,
  onFocusCamera,
  onContractDeck
}) {
  if (!componentId) return null;
  const spec = HARDWARE_SPECS[componentId];
  if (!spec) return null;

  const iconMap = {
    pcb: Cpu,
    esp32: Cpu,
    motor: RotateCw,
    heater: Flame,
    solar: Sun,
    battery: Battery,
    mooring: Anchor,
    ctd: Activity,
    seal: ShieldCheck,
    lora: Radio
  };

  const IconComponent = iconMap[componentId] || Cpu;

  // Subsystems list with mapped 3D camera angles
  const quickSubsystems = [
    { id: 'pcb', label: 'Avionics PCB', cam: 'electronics' },
    { id: 'mooring', label: 'Kevlar Mooring', cam: 'anchor' },
    { id: 'motor', label: 'Winch Motor', cam: 'buoy' },
    { id: 'heater', label: 'PTC Heater', cam: 'electronics' },
    { id: 'solar', label: 'Solar Shell', cam: 'buoy' },
    { id: 'battery', label: 'LiFePO4 Bank', cam: 'electronics' },
    { id: 'ctd', label: 'CTD Profiler', cam: 'ctd' }
  ];

  const handleSubsystemClick = (sub) => {
    // 1. Focus 3D camera angle on that exact subsystem area
    if (onFocusCamera) {
      onFocusCamera(sub.cam);
    }
    // 2. Contract the unified control deck
    if (onContractDeck) {
      onContractDeck();
    }
    // 3. Close the right side information panel
    if (onClose) {
      onClose();
    }
  };

  const STUDENT_BOM_LIMIT_INR = 20000;
  const exceedsLimit = spec.costInr && spec.costInr > STUDENT_BOM_LIMIT_INR;

  return (
    <div className="subsystem-inspector-container oswald-modal glass-panel" role="dialog" aria-modal="true">
      {/* Sticky Header with Persistent Close Button (Problem 11) */}
      <div className="inspector-header sticky-header">
        <div className="inspector-header-left">
          <div className="inspector-icon-badge">
            <IconComponent size={18} className="accent-amber" />
          </div>
          <div>
            <h3 className="inspector-title oswald-bold">{spec.title}</h3>
            <span className="inspector-badge oswald-sub">{spec.badge}</span>
          </div>
        </div>
        <button
          type="button"
          className="inspector-close-btn"
          onClick={onClose}
          title="Close Inspector [Esc]"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="inspector-body">
        {/* Commercial Unit BOM Cost in INR (incl. 18% GST) */}
        {spec.costInr && (
          <div className="inspector-cost-block">
            <div className="inspector-cost-banner">
              <span className="cost-tag-label oswald-bold">COMMERCIAL DEPLOYMENT BOM:</span>
              <span className="cost-tag-value number-bebas">₹{spec.costInr.toLocaleString('en-IN')}</span>
              <span className="cost-tag-gst oswald-sub">(INCL. 18% GST)</span>
            </div>

            {/* Clear Student Refundable Cap Notice */}
            {exceedsLimit ? (
              <div className="bom-cap-alert exceeded">
                <div className="bom-alert-top">
                  <AlertTriangle size={14} className="accent-amber" />
                  <span className="bom-alert-heading oswald-bold">
                    EXCEEDS MAXIMUM REFUNDABLE STUDENT BOM AMOUNT (₹20,000 INR INCL. GST)
                  </span>
                </div>
                <div className="bom-alert-body oswald-body">
                  Institutional commercial grade spec requires NCPOR / MoES research grant. Student prototype uses open-hardware calibrated sensors (total prototype package: ₹19,450 INR) strictly within the ₹20,000 INR refund limit.
                </div>
              </div>
            ) : (
              <div className="bom-cap-alert within-limit">
                <div className="bom-alert-top">
                  <CheckCircle2 size={14} className="accent-green" />
                  <span className="bom-alert-heading oswald-bold">
                    WITHIN STUDENT REFUNDABLE BOM ALLOCATION (&lt; ₹20,000 INR INCL. GST)
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="inspector-desc oswald-body">{spec.desc}</p>

        {/* If Solar: Render Practical Calculated Watts & Power Loss Analysis */}
        {spec.isSolarCalculator && (
          <div className="solar-power-budget-card">
            <div className="budget-card-title oswald-bold">
              <Zap size={13} className="accent-amber" />
              <span>PRACTICAL POLAR SOLAR HARVEST &amp; LOSS BUDGET</span>
            </div>
            
            <div className="loss-breakdown-list oswald-body">
              <div className="loss-item gross">
                <span>STC Rated Array Gross Peak</span>
                <span className="val number-bebas">+4.80 W</span>
              </div>
              <div className="loss-item deduction">
                <span>Polar Sun Angle Loss (72° Zenith)</span>
                <span className="val number-bebas">-1.80 W (-37.5%)</span>
              </div>
              <div className="loss-item deduction">
                <span>Frost / Ice Rime Albedo Reflection</span>
                <span className="val number-bebas">-0.45 W (-9.4%)</span>
              </div>
              <div className="loss-item deduction">
                <span>MPPT DC-DC Buck Conversion (94%)</span>
                <span className="val number-bebas">-0.15 W (-3.1%)</span>
              </div>
              <div className="loss-item net-harvest">
                <span className="oswald-bold">= Net Usable Summer Daylight Power</span>
                <span className="val accent-green font-bold number-bebas">2.40 W</span>
              </div>
              <div className="loss-item baseload">
                <span>Continuous Buoy Baseload Consumption</span>
                <span className="val accent-amber number-bebas">-0.65 W</span>
              </div>
              <div className="loss-item surplus">
                <span className="oswald-bold">⚡ Net Positive Battery Charge Margin</span>
                <span className="val accent-green font-bold number-bebas">+1.75 W</span>
              </div>
            </div>
          </div>
        )}

        {/* Specifications Table */}
        <div className="inspector-table-title oswald-bold">ENGINEERING ARCHITECTURE</div>
        <table className="inspector-specs-table">
          <tbody>
            {spec.specs.map((item, idx) => (
              <tr key={idx}>
                <td className="spec-key-cell oswald-sub">{item.k}</td>
                <td className="spec-val-cell number-bebas">{item.v}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Quick Nav Row to inspect neighboring 3D components */}
        <div className="inspector-quick-nav">
          <span className="quick-nav-label oswald-bold">INSPECT OTHER 3D SUBSYSTEMS (ZOOM &amp; CONTRACT DECK):</span>
          <div className="quick-nav-chips">
            {quickSubsystems.map((sub) => (
              <button
                type="button"
                key={sub.id}
                className={`quick-nav-chip oswald-sub ${sub.id === componentId ? 'active' : ''}`}
                onClick={() => handleSubsystemClick(sub)}
                title={`Focus camera directly on ${sub.label} & close information panel`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
