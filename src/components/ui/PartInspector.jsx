import React from 'react';
import { getPartById, getPartSpecs } from '../../constants/partsRegistry';

/**
 * Holographic Cinematic Part Inspector
 * 
 * Features:
 * 1. Polar Cyber-Aerospace Holographic Inspection Card
 * 2. Real-time Spec Table from hardwareSpecs.js (or TBD fallback)
 * 3. Interactive "Connected To" chips that transition inspection
 * 4. Animated SVG Dashed Lines connecting selected part to connected hardware nodes
 * 5. Dynamic Hover Name Tag with glowing 3D-projected leader line
 */
function MiniSparkline({ data = [], minVal = 0, maxVal = 50, color = '#38bdf8', unit = '', setpoint = null, cutoff = null }) {
  if (!data || data.length < 2) {
    return (
      <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#64748b', background: 'rgba(2, 6, 23, 0.45)', borderRadius: 6, marginBottom: 8 }}>
        Awaiting Telemetry Stream...
      </div>
    );
  }
  const width = 340;
  const height = 46;
  const pad = 6;
  const graphH = height - pad * 2;
  const graphW = width - pad * 2;
  
  const min = Math.min(minVal, ...data);
  const max = Math.max(maxVal, ...data, (cutoff || 0));
  const range = (max - min) || 1.0;

  const points = data.map((val, idx) => {
    const x = pad + (idx / (data.length - 1)) * graphW;
    const y = height - pad - ((val - min) / range) * graphH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const currentVal = data[data.length - 1];
  const setpointY = setpoint !== null ? height - pad - ((setpoint - min) / range) * graphH : null;
  const cutoffY = cutoff !== null ? height - pad - ((cutoff - min) / range) * graphH : null;

  return (
    <div style={{ position: 'relative', width: '100%', height: height, margin: '2px 0 8px 0' }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ background: 'rgba(2, 6, 23, 0.5)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Setpoint Reference Line */}
        {setpointY !== null && setpointY >= pad && setpointY <= height - pad && (
          <g>
            <line x1={pad} y1={setpointY} x2={width - pad} y2={setpointY} stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
            <text x={pad + 2} y={Math.max(8, setpointY - 3)} fill="#10b981" fontSize="7.5" fontFamily="monospace" opacity="0.9">SET +{setpoint}°C</text>
          </g>
        )}
        {/* Cutoff Reference Line */}
        {cutoffY !== null && cutoffY >= pad && cutoffY <= height - pad && (
          <g>
            <line x1={pad} y1={cutoffY} x2={width - pad} y2={cutoffY} stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" opacity="0.75" />
            <text x={width - pad - 68} y={Math.max(8, cutoffY - 3)} fill="#ef4444" fontSize="7.5" fontFamily="monospace">LIMIT {cutoff}{unit}</text>
          </g>
        )}
        {/* Sparkline curve */}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        {/* Current Point Dot */}
        {data.length > 0 && (
          <circle
            cx={pad + graphW}
            cy={height - pad - ((currentVal - min) / range) * graphH}
            r="3"
            fill={color}
            stroke="#ffffff"
            strokeWidth="1"
          />
        )}
      </svg>
      <div style={{ position: 'absolute', right: 8, bottom: 3, fontSize: '9.5px', fontFamily: 'monospace', color: color, fontWeight: 700 }}>
        {currentVal !== undefined ? (currentVal > 0 && unit.includes('°C') ? '+' : '') + currentVal + unit : ''}
      </div>
    </div>
  );
}

export default function PartInspector({
  selectedPartId,
  hoveredPart, // { id, name, group, screenX, screenY }
  onSelectPart,
  onDeselectPart,
  connectedPartPositions = [], // array of { id, name, x, y, targetX, targetY }
  heaterState = null,
  onSetHeaterState,
  onResetTrip,
  onInjectFault
}) {
  const selectedPart = getPartById(selectedPartId);
  const specData = selectedPart ? getPartSpecs(selectedPart.specKey) : null;

  return (
    <>
      <style>{`
        .part-inspector-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 50;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }

        /* ── SVG Connection Network ── */
        .part-network-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .network-dash-line {
          stroke: #38bdf8;
          stroke-width: 1.6;
          stroke-dasharray: 6, 6;
          opacity: 0.75;
          animation: networkDashAnim 1.2s linear infinite;
        }

        @keyframes networkDashAnim {
          from {
            stroke-dashoffset: 24;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        .network-node-dot {
          fill: #0ea5e9;
          stroke: #e0f2fe;
          stroke-width: 1.5;
          filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.8));
          animation: pulseNodeDot 1.8s ease-in-out infinite;
        }

        @keyframes pulseNodeDot {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.3); opacity: 1; }
        }

        /* ── Holographic Inspection Card ── */
        .hologram-card-container {
          position: absolute;
          top: 74px;
          right: 24px;
          width: 380px;
          max-width: calc(100vw - 48px);
          max-height: calc(100vh - 100px);
          overflow-y: auto;
          pointer-events: auto;
          background: rgba(4, 15, 30, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(56, 189, 248, 0.35);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.65), 0 0 25px rgba(56, 189, 248, 0.15);
          border-radius: 12px;
          padding: 20px;
          color: #f1f5f9;
          transform: translateY(0);
          animation: cardSlideIn 0.32s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes cardSlideIn {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .hologram-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          border-bottom: 1px solid rgba(56, 189, 248, 0.18);
          padding-bottom: 14px;
          margin-bottom: 14px;
        }

        .hologram-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #38bdf8;
          background: rgba(56, 189, 248, 0.12);
          padding: 2px 8px;
          border-radius: 4px;
          border: 1px solid rgba(56, 189, 248, 0.25);
          font-weight: 600;
          margin-bottom: 6px;
        }

        .hologram-title {
          font-size: 17px;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.3;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .hologram-close-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #94a3b8;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .hologram-close-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.4);
          color: #fca5a5;
        }

        .hologram-role-box {
          background: rgba(15, 23, 42, 0.6);
          border-left: 3px solid #38bdf8;
          padding: 10px 12px;
          border-radius: 0 6px 6px 0;
          font-size: 12.5px;
          line-height: 1.48;
          color: #cbd5e1;
          margin-bottom: 16px;
        }

        .hologram-section-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #94a3b8;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        /* ── Specification Table ── */
        .hologram-spec-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          margin-bottom: 18px;
          background: rgba(15, 23, 42, 0.4);
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .hologram-spec-table tr:nth-child(even) {
          background: rgba(255, 255, 255, 0.02);
        }

        .hologram-spec-table td {
          padding: 8px 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          vertical-align: top;
        }

        .hologram-spec-key {
          color: #7dd3fc;
          font-weight: 500;
          width: 40%;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 11px;
        }

        .hologram-spec-val {
          color: #f8fafc;
          font-weight: 400;
        }

        .spec-tbd-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 600;
          color: #f59e0b;
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.3);
          padding: 2px 6px;
          border-radius: 4px;
        }

        /* ── Connected Hardware Nodes Chips ── */
        .connected-chips-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 16px;
        }

        .connected-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(56, 189, 248, 0.08);
          border: 1px solid rgba(56, 189, 248, 0.25);
          color: #e0f2fe;
          padding: 5px 10px;
          border-radius: 6px;
          font-size: 11.5px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .connected-chip:hover {
          background: rgba(56, 189, 248, 0.22);
          border-color: #38bdf8;
          color: #ffffff;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(56, 189, 248, 0.25);
        }

        .connected-chip-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #38bdf8;
          box-shadow: 0 0 6px #38bdf8;
        }

        .hologram-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 11px;
          color: #64748b;
        }

        .esc-hint {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .esc-kbd {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 3px;
          padding: 1px 5px;
          font-size: 10px;
          color: #cbd5e1;
          font-family: monospace;
        }

        /* ── Hover Tag with Thin Leader Line ── */
        .hover-leader-container {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .hover-tag-badge {
          position: absolute;
          background: rgba(4, 15, 30, 0.88);
          border: 1px solid rgba(56, 189, 248, 0.45);
          backdrop-filter: blur(12px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6), 0 0 14px rgba(56, 189, 248, 0.25);
          padding: 8px 12px;
          border-radius: 6px;
          color: #ffffff;
          font-size: 12px;
          pointer-events: none;
          transform: translate(25px, -35px);
          white-space: nowrap;
          z-index: 65;
        }

        .hover-tag-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 9.5px;
          font-weight: 700;
          text-transform: uppercase;
          color: #38bdf8;
          letter-spacing: 0.05em;
          margin-bottom: 2px;
        }

        .hover-tag-name {
          font-weight: 600;
          font-size: 12.5px;
          color: #f8fafc;
        }

        .hover-tag-prompt {
          font-size: 10px;
          color: #94a3b8;
          margin-top: 3px;
        }

        /* ── Phase 6B: Kapton Heater & Thermal Power Budget Console ── */
        .heater-console {
          margin-bottom: 18px;
          background: rgba(8, 20, 38, 0.7);
          border: 1px solid rgba(56, 189, 248, 0.25);
          border-radius: 8px;
          padding: 12px;
          box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.5);
        }

        .heater-alert-box {
          padding: 8px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          line-height: 1.4;
          margin-bottom: 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          animation: alertFlash 1.6s ease-in-out infinite;
        }

        .heater-alert-box.tripped {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.6);
          color: #fecaca;
        }

        .heater-alert-box.overwatt {
          background: rgba(245, 158, 11, 0.2);
          border: 1px solid rgba(245, 158, 11, 0.6);
          color: #fef3c7;
        }

        .heater-alert-box.overheat {
          background: rgba(249, 115, 22, 0.2);
          border: 1px solid rgba(249, 115, 22, 0.6);
          color: #ffedd5;
        }

        .heater-status-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 10px;
          border-radius: 6px;
          background: rgba(14, 165, 233, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.25);
          font-size: 11px;
          font-weight: 600;
          color: #bae6fd;
          margin-bottom: 10px;
        }

        .heater-badge-active {
          font-size: 9.5px;
          padding: 2px 6px;
          border-radius: 3px;
          background: rgba(16, 185, 129, 0.25);
          color: #6ee7b7;
          border: 1px solid rgba(16, 185, 129, 0.4);
          letter-spacing: 0.04em;
        }

        .heater-badge-active.idle {
          background: rgba(100, 116, 139, 0.2);
          color: #94a3b8;
          border-color: rgba(100, 116, 139, 0.3);
        }

        .heater-reset-btn {
          align-self: flex-start;
          background: #ef4444;
          color: #ffffff;
          border: none;
          border-radius: 4px;
          padding: 4px 10px;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: 0.04em;
          transition: all 0.15s ease;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
        }

        .heater-reset-btn:hover {
          background: #dc2626;
          box-shadow: 0 0 14px rgba(239, 68, 68, 0.8);
        }

        @keyframes alertFlash {
          0%, 100% { opacity: 0.95; }
          50% { opacity: 0.7; }
        }

        /* Metrics grid */
        .heater-metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          margin-bottom: 12px;
        }

        .heater-metric-card {
          background: rgba(15, 23, 42, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          padding: 6px 8px;
        }

        .heater-metric-label {
          font-size: 9.5px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 2px;
        }

        .heater-metric-val {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-variant-numeric: tabular-nums;
          font-size: 14px;
          font-weight: 700;
          color: #f8fafc;
        }

        .heater-metric-sub {
          font-size: 9px;
          color: #64748b;
          margin-top: 1px;
          font-family: ui-monospace, monospace;
        }

        /* Sliders */
        .heater-slider-group {
          margin-bottom: 12px;
          background: rgba(15, 23, 42, 0.4);
          border-radius: 6px;
          padding: 8px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .heater-slider-row {
          margin-bottom: 8px;
        }

        .heater-slider-row:last-child {
          margin-bottom: 0;
        }

        .heater-slider-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
          color: #cbd5e1;
          margin-bottom: 3px;
        }

        .heater-slider-val {
          font-family: ui-monospace, monospace;
          font-variant-numeric: tabular-nums;
          font-weight: 700;
          color: #38bdf8;
        }

        .heater-slider-input {
          width: 100%;
          height: 4px;
          accent-color: #38bdf8;
          cursor: pointer;
        }

        .heater-quick-btn-row {
          display: flex;
          gap: 4px;
          margin-top: 3px;
        }

        .heater-quick-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94a3b8;
          font-size: 8.5px;
          padding: 1px 5px;
          border-radius: 3px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .heater-quick-btn:hover {
          background: rgba(56, 189, 248, 0.15);
          color: #e0f2fe;
          border-color: rgba(56, 189, 248, 0.35);
        }

        /* Fault injection buttons */
        .heater-fault-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 5px;
          margin-top: 6px;
        }

        .heater-fault-btn {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #cbd5e1;
          font-size: 10px;
          font-weight: 600;
          padding: 6px 8px;
          border-radius: 5px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: all 0.15s ease;
          text-align: left;
        }

        .heater-fault-btn:hover {
          background: rgba(56, 189, 248, 0.12);
          border-color: rgba(56, 189, 248, 0.35);
          color: #f0f9ff;
        }

        .heater-fault-btn.active {
          background: rgba(239, 68, 68, 0.25);
          border-color: rgba(239, 68, 68, 0.6);
          color: #fecaca;
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.3);
        }

        .heater-fault-btn.clear {
          background: rgba(16, 185, 129, 0.12);
          border-color: rgba(16, 185, 129, 0.3);
          color: #a7f3d0;
        }

        .heater-fault-btn.clear:hover {
          background: rgba(16, 185, 129, 0.22);
          color: #ecfdf5;
        }
      `}</style>

      <div className="part-inspector-overlay">
        {/* ── Connected Hardware Animated Dashed Lines (SVG Overlay) ── */}
        {selectedPart && connectedPartPositions && connectedPartPositions.length > 0 && (
          <svg className="part-network-svg">
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {connectedPartPositions.map((node) => {
              if (node.x == null || node.y == null || node.targetX == null || node.targetY == null) return null;
              return (
                <g key={node.id}>
                  {/* Dashed line from selected part to connected part */}
                  <line
                    x1={node.targetX}
                    y1={node.targetY}
                    x2={node.x}
                    y2={node.y}
                    className="network-dash-line"
                  />
                  {/* Glowing anchor dots */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="4.5"
                    className="network-node-dot"
                    style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                  />
                  {/* Mini node title label */}
                  <text
                    x={node.x + 8}
                    y={node.y + 4}
                    fill="#38bdf8"
                    fontSize="10"
                    fontWeight="600"
                    fontFamily="ui-monospace, monospace"
                    letterSpacing="0.04em"
                    filter="url(#glow)"
                  >
                    {node.name}
                  </text>
                </g>
              );
            })}
          </svg>
        )}

        {/* ── Hover Name Tag with Leader Line ── */}
        {!selectedPartId && hoveredPart && hoveredPart.screenX != null && hoveredPart.screenY != null && (
          <div className="hover-leader-container">
            <svg className="part-network-svg">
              <circle
                cx={hoveredPart.screenX}
                cy={hoveredPart.screenY}
                r="3.5"
                fill="#38bdf8"
                stroke="#e0f2fe"
                strokeWidth="1.5"
                filter="drop-shadow(0 0 6px #38bdf8)"
              />
              <line
                x1={hoveredPart.screenX}
                y1={hoveredPart.screenY}
                x2={hoveredPart.screenX + 25}
                y2={hoveredPart.screenY - 20}
                stroke="#38bdf8"
                strokeWidth="1.2"
                strokeDasharray="3,3"
                opacity="0.85"
              />
            </svg>
            <div
              className="hover-tag-badge"
              style={{
                left: `${hoveredPart.screenX}px`,
                top: `${hoveredPart.screenY}px`
              }}
            >
              <div className="hover-tag-header">
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38bdf8', display: 'inline-block' }} />
                {hoveredPart.group || 'Inspectable Hardware Node'}
              </div>
              <div className="hover-tag-name">{hoveredPart.name}</div>
              <div className="hover-tag-prompt">Click to focus & inspect specs</div>
            </div>
          </div>
        )}

        {/* ── Holographic Inspection Card for Selected Part ── */}
        {selectedPart && (
          <div className="hologram-card-container" onClick={(e) => e.stopPropagation()}>
            <div className="hologram-header">
              <div>
                <span className="hologram-eyebrow">
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38bdf8' }} />
                  {selectedPart.group}
                </span>
                <h3 className="hologram-title">{selectedPart.name}</h3>
              </div>
              <button
                className="hologram-close-btn"
                onClick={onDeselectPart}
                title="Exit Inspection (ESC)"
              >
                ×
              </button>
            </div>

            {/* Role Box */}
            <div className="hologram-role-box">
              {selectedPart.role}
            </div>

            {/* Phase 6B: Kapton Heater & Thermal Power Budget Console */}
            {selectedPart.id === 'kapton_pads' && heaterState && (
              <div className="heater-console">
                {/* 1. Alert Banner */}
                {heaterState.isTripped ? (
                  <div className="heater-alert-box tripped">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>⛔</span>
                      <span><strong>PROTECTION CUTOFF TRIPPED</strong> (+45.0°C)</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#fca5a5' }}>
                      {heaterState.tripReason || 'Hardware bimetallic thermal breaker tripped. Substrate protected.'}
                    </div>
                    <button
                      type="button"
                      className="heater-reset-btn"
                      onClick={() => onResetTrip && onResetTrip()}
                    >
                      🔄 RESET BIMETALLIC BREAKER
                    </button>
                  </div>
                ) : heaterState.isOverWattage ? (
                  <div className="heater-alert-box overwatt">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>⚡</span>
                      <span><strong>OVER-WATTAGE EXCEEDED</strong></span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#fde68a' }}>
                      Total load ({(heaterState.powerWatts + 0.65).toFixed(2)}W) exceeds source limit ({(heaterState.sourceLimitWatts || 14.8).toFixed(1)}W). Supply bus and MPPT stressed!
                    </div>
                  </div>
                ) : heaterState.isOverheat ? (
                  <div className="heater-alert-box overheat">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>🔥</span>
                      <span><strong>OVERHEAT WARNING</strong></span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#fed7aa' }}>
                      Film temperature ({heaterState.temperature.toFixed(1)}°C) exceeds +35.0°C safety envelope!
                    </div>
                  </div>
                ) : (
                  <div className="heater-status-banner">
                    <span>THERMOSTAT: Target +4.0°C (±1.0°C Hysteresis)</span>
                    <span className={`heater-badge-active ${heaterState.isHeating ? '' : 'idle'}`}>
                      {heaterState.isHeating ? 'CYCLE: ACTIVE' : 'CYCLE: IDLE'}
                    </span>
                  </div>
                )}

                {/* 2. Tabular Numbers Telemetry Grid */}
                <div className="heater-metrics-grid">
                  <div className="heater-metric-card">
                    <div className="heater-metric-label">Heater Power (V²/R)</div>
                    <div className="heater-metric-val" style={{ color: heaterState.powerWatts > 10 ? '#f59e0b' : '#38bdf8' }}>
                      {heaterState.powerWatts.toFixed(2)} W
                    </div>
                    <div className="heater-metric-sub">
                      V: {heaterState.voltage.toFixed(1)}V | R: 19.3Ω
                    </div>
                  </div>

                  <div className="heater-metric-card">
                    <div className="heater-metric-label">Film Temperature</div>
                    <div
                      className="heater-metric-val"
                      style={{
                        color: heaterState.isTripped ? '#ef4444' : heaterState.temperature > 35 ? '#f97316' : (heaterState.temperature >= 3 && heaterState.temperature <= 5) ? '#10b981' : '#38bdf8'
                      }}
                    >
                      {heaterState.temperature > 0 ? '+' : ''}{heaterState.temperature.toFixed(1)} °C
                    </div>
                    <div className="heater-metric-sub">
                      Ambient: {heaterState.ambientTemperature > 0 ? '+' : ''}{heaterState.ambientTemperature.toFixed(1)}°C
                    </div>
                  </div>

                  <div className="heater-metric-card">
                    <div className="heater-metric-label">Duty Cycle</div>
                    <div className="heater-metric-val">
                      {(heaterState.dutyCycle * 100).toFixed(1)} %
                    </div>
                    <div className="heater-metric-sub">
                      Cap: {(heaterState.dutyCap * 100).toFixed(0)}% limit
                    </div>
                  </div>

                  <div className="heater-metric-card">
                    <div className="heater-metric-label">Battery Draw</div>
                    <div className="heater-metric-val">
                      {heaterState.batteryCurrentAmps >= 1.0 ? heaterState.batteryCurrentAmps.toFixed(2) + ' A' : (heaterState.batteryCurrentAmps * 1000).toFixed(0) + ' mA'}
                    </div>
                    <div className="heater-metric-sub">
                      Load: {(heaterState.powerWatts + 0.65).toFixed(2)}W / {(heaterState.sourceLimitWatts || 14.8).toFixed(1)}W
                    </div>
                  </div>
                </div>

                {/* 3. Live Sparklines */}
                <div style={{ marginBottom: 12 }}>
                  <div className="hologram-section-title" style={{ fontSize: '10px', marginBottom: 4 }}>
                    <span>Live Temperature Trend (1D Lumped ODE)</span>
                    <span style={{ color: '#38bdf8', fontSize: '9px' }}>C_th=42 J/°C | R_th=22.5 °C/W</span>
                  </div>
                  <MiniSparkline
                    data={heaterState.history?.temp || []}
                    minVal={-25}
                    maxVal={50}
                    color={heaterState.isTripped ? '#ef4444' : heaterState.temperature > 35 ? '#f97316' : '#38bdf8'}
                    unit="°C"
                    setpoint={4.0}
                    cutoff={45.0}
                  />

                  <div className="hologram-section-title" style={{ fontSize: '10px', marginBottom: 4, marginTop: 6 }}>
                    <span>Power Draw & Source Envelope</span>
                    <span style={{ color: '#f59e0b', fontSize: '9px' }}>Limit: {(heaterState.sourceLimitWatts || 14.8).toFixed(1)}W</span>
                  </div>
                  <MiniSparkline
                    data={heaterState.history?.power || []}
                    minVal={0}
                    maxVal={20}
                    color="#f59e0b"
                    unit="W"
                    cutoff={heaterState.sourceLimitWatts || 14.8}
                  />
                </div>

                {/* 4. Interactive Sliders */}
                <div className="heater-slider-group">
                  {/* Supply Voltage */}
                  <div className="heater-slider-row">
                    <div className="heater-slider-header">
                      <span>Supply Voltage (V)</span>
                      <span className="heater-slider-val">{heaterState.voltage.toFixed(1)} V</span>
                    </div>
                    <input
                      type="range"
                      min="10.0"
                      max="18.5"
                      step="0.1"
                      value={heaterState.voltage}
                      onChange={(e) => onSetHeaterState && onSetHeaterState({ voltage: parseFloat(e.target.value) })}
                      className="heater-slider-input"
                    />
                    <div className="heater-quick-btn-row">
                      <button type="button" className="heater-quick-btn" onClick={() => onSetHeaterState && onSetHeaterState({ voltage: 10.0 })}>10.0V (BMS Min)</button>
                      <button type="button" className="heater-quick-btn" onClick={() => onSetHeaterState && onSetHeaterState({ voltage: 12.8 })}>12.8V (Nominal)</button>
                      <button type="button" className="heater-quick-btn" onClick={() => onSetHeaterState && onSetHeaterState({ voltage: 14.6 })}>14.6V (Charged)</button>
                    </div>
                  </div>

                  {/* Duty Cap */}
                  <div className="heater-slider-row" style={{ marginTop: 8 }}>
                    <div className="heater-slider-header">
                      <span>Duty Cycle Cap</span>
                      <span className="heater-slider-val">{(heaterState.dutyCap * 100).toFixed(0)} %</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={heaterState.dutyCap}
                      onChange={(e) => onSetHeaterState && onSetHeaterState({ dutyCap: parseFloat(e.target.value) })}
                      className="heater-slider-input"
                    />
                    <div className="heater-quick-btn-row">
                      <button type="button" className="heater-quick-btn" onClick={() => onSetHeaterState && onSetHeaterState({ dutyCap: 0.25 })}>25% Cap</button>
                      <button type="button" className="heater-quick-btn" onClick={() => onSetHeaterState && onSetHeaterState({ dutyCap: 0.50 })}>50% Cap</button>
                      <button type="button" className="heater-quick-btn" onClick={() => onSetHeaterState && onSetHeaterState({ dutyCap: 1.00 })}>100% Uncapped</button>
                    </div>
                  </div>

                  {/* Ambient Temperature */}
                  <div className="heater-slider-row" style={{ marginTop: 8 }}>
                    <div className="heater-slider-header">
                      <span>Ambient Temperature (T_amb)</span>
                      <span className="heater-slider-val">{heaterState.ambientTemperature > 0 ? '+' : ''}{heaterState.ambientTemperature.toFixed(1)} °C</span>
                    </div>
                    <input
                      type="range"
                      min="-40.0"
                      max="15.0"
                      step="0.5"
                      value={heaterState.ambientTemperature}
                      onChange={(e) => onSetHeaterState && onSetHeaterState({ ambientTemperature: parseFloat(e.target.value) })}
                      className="heater-slider-input"
                    />
                    <div className="heater-quick-btn-row">
                      <button type="button" className="heater-quick-btn" onClick={() => onSetHeaterState && onSetHeaterState({ ambientTemperature: -2.0 })}>Summer (-2°C)</button>
                      <button type="button" className="heater-quick-btn" onClick={() => onSetHeaterState && onSetHeaterState({ ambientTemperature: -15.0 })}>Autumn (-15°C)</button>
                      <button type="button" className="heater-quick-btn" onClick={() => onSetHeaterState && onSetHeaterState({ ambientTemperature: -25.0 })}>Winter (-25°C)</button>
                    </div>
                  </div>
                </div>

                {/* 5. Inject Fault Buttons */}
                <div>
                  <div className="hologram-section-title" style={{ fontSize: '10px', marginBottom: 2 }}>
                    <span>Fault Injection Matrix</span>
                    <span style={{ color: '#94a3b8', fontSize: '9px' }}>Stress simulation</span>
                  </div>
                  <div className="heater-fault-grid">
                    <button
                      type="button"
                      className={`heater-fault-btn ${heaterState.fault === 'stuck_on' ? 'active' : ''}`}
                      onClick={() => onInjectFault && onInjectFault(heaterState.fault === 'stuck_on' ? 'none' : 'stuck_on')}
                      title="Forces heater contact stuck closed continuously"
                    >
                      <span>⚡</span>
                      <span>Stuck-On Heater</span>
                    </button>

                    <button
                      type="button"
                      className={`heater-fault-btn ${heaterState.fault === 'thermostat_failure' ? 'active' : ''}`}
                      onClick={() => onInjectFault && onInjectFault(heaterState.fault === 'thermostat_failure' ? 'none' : 'thermostat_failure')}
                      title="Simulates failed thermostat sensor demanding constant heating"
                    >
                      <span>❄️</span>
                      <span>Thermostat Fail</span>
                    </button>

                    <button
                      type="button"
                      className={`heater-fault-btn ${heaterState.fault === 'overvoltage' ? 'active' : ''}`}
                      onClick={() => onInjectFault && onInjectFault(heaterState.fault === 'overvoltage' ? 'none' : 'overvoltage')}
                      title="Simulates MPPT regulator failure pushing 18.5V (17.7W) surge"
                    >
                      <span>💥</span>
                      <span>Overvoltage (18.5V)</span>
                    </button>

                    <button
                      type="button"
                      className="heater-fault-btn clear"
                      onClick={() => onInjectFault && onInjectFault('none')}
                      title="Clear injected faults and restore nominal hysteresis control"
                    >
                      <span>✓</span>
                      <span>Normal / Clear</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Specifications Section */}
            <div className="hologram-section-title">
              <span>Technical Specifications</span>
              {specData ? (
                <span style={{ color: '#38bdf8', fontSize: '10px', textTransform: 'none' }}>
                  {specData.badge || 'Verified Telemetry'}
                </span>
              ) : (
                <span className="spec-tbd-badge">TBD</span>
              )}
            </div>

            <table className="hologram-spec-table">
              <tbody>
                {specData && specData.specs && specData.specs.length > 0 ? (
                  specData.specs.map((item, idx) => (
                    <tr key={idx}>
                      <td className="hologram-spec-key">{item.k}</td>
                      <td className="hologram-spec-val">{item.v}</td>
                    </tr>
                  ))
                ) : (
                  <>
                    <tr>
                      <td className="hologram-spec-key">Status</td>
                      <td className="hologram-spec-val"><span className="spec-tbd-badge">TBD</span></td>
                    </tr>
                    <tr>
                      <td className="hologram-spec-key">Specification</td>
                      <td className="hologram-spec-val">Marine polar hardening specifications in active review.</td>
                    </tr>
                    <tr>
                      <td className="hologram-spec-key">Standard</td>
                      <td className="hologram-spec-val">MoES / NIOT Polar Oceanographic Payload Standard</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>

            {/* Connected Hardware Links */}
            {selectedPart.connectsTo && selectedPart.connectsTo.length > 0 && (
              <div>
                <div className="hologram-section-title">
                  <span>Connected Hardware Bus</span>
                  <span style={{ color: '#64748b', fontSize: '10px' }}>Click to trace</span>
                </div>
                <div className="connected-chips-grid">
                  {selectedPart.connectsTo.map((targetId) => {
                    const targetPart = getPartById(targetId);
                    if (!targetPart) return null;
                    return (
                      <button
                        key={targetId}
                        className="connected-chip"
                        onClick={() => onSelectPart(targetId)}
                        title={`Fly to ${targetPart.name}`}
                      >
                        <span className="connected-chip-dot" />
                        <span>{targetPart.name.split(' ')[0]} {targetPart.name.split(' ')[1] || ''}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Card Footer */}
            <div className="hologram-footer">
              <span className="esc-hint">
                Press <kbd className="esc-kbd">ESC</kbd> to exit inspect mode
              </span>
              <span style={{ color: '#38bdf8', fontSize: '10px' }}>DH-SETU-6A</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
