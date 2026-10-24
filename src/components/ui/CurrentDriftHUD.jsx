import React, { useState, useEffect } from 'react';
import { Navigation, RefreshCw } from 'lucide-react';
import { currentModel } from '../../constants/currentModel';

/**
 * Isolated Ocean Current & Drift Readout HUD (Prydz Bay MIZ)
 * Decoupled from VFXScene render loop to eliminate 60fps React reconciliation overhead.
 */
const CurrentDriftHUD = React.memo(function CurrentDriftHUD({
  selectedPartId,
  isTourRunning,
  onRerollSeed,
  telemetrySubscriberRef
}) {
  const [telemetry, setTelemetry] = useState(() => {
    const initData = currentModel.get(0);
    return {
      headingDeg: initData.headingDeg,
      speedMps: initData.speedMps,
      speedCmpSec: initData.speedCmpSec,
      seed: currentModel.getSeed(),
      seasonName: initData.seasonName
    };
  });

  useEffect(() => {
    if (telemetrySubscriberRef) {
      telemetrySubscriberRef.current = (data) => setTelemetry(data);
    }
    return () => {
      if (telemetrySubscriberRef) {
        telemetrySubscriberRef.current = null;
      }
    };
  }, [telemetrySubscriberRef]);

  return (
    <div
      id="current-drift-hud"
      className={`current-drift-hud ${selectedPartId ? 'part-inspecting' : ''} ${isTourRunning ? 'tour-active' : ''}`}
    >
      {/* Rotating Compass Dial */}
      <div
        className="current-compass-dial"
        title={`Heading: ${telemetry.headingDeg.toFixed(1)}° (Westward Antarctic Slope Current)`}
      >
        <span className="compass-cardinal compass-n">N</span>
        <span className="compass-cardinal compass-s">S</span>
        <span className="compass-cardinal compass-w">W</span>
        <span className="compass-cardinal compass-e">E</span>
        <div
          className="compass-needle"
          style={{
            transform: `rotate(${telemetry.headingDeg}deg)`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease-out'
          }}
        >
          <Navigation size={17} className="needle-icon" />
        </div>
      </div>

      {/* Readout Numbers & Seed Controls */}
      <div className="current-readout-col">
        <div className="current-readout-eyebrow">
          Prydz Bay Current
        </div>
        <div className="current-readout-values">
          <span
            id="current-heading-val"
            className="current-heading-val"
          >
            {telemetry.headingDeg.toFixed(1)}°
          </span>
          <span
            id="current-speed-val"
            className="current-speed-val"
          >
            {telemetry.speedCmpSec.toFixed(1)} cm/s
          </span>
        </div>
        <div className="current-seed-row">
          <span
            id="current-seed-val"
            className="current-seed-val"
          >
            Seed #{telemetry.seed}
          </span>
          <button
            id="reroll-seed-btn"
            type="button"
            className="current-reroll-btn"
            onClick={onRerollSeed}
            title="Re-roll current drift seed"
          >
            <RefreshCw size={9} />
            Re-roll
          </button>
        </div>
      </div>
    </div>
  );
});

export default CurrentDriftHUD;
