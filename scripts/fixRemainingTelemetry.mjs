import fs from 'fs';
import path from 'path';

const p = path.resolve('src/components/3d/VFXScene.jsx');
let s = fs.readFileSync(p, 'utf8');

// 1. handleRerollSeed
s = s.replace(
`      setCurrentTelemetry({
        headingDeg: data.headingDeg,
        speedMps: data.speedMps,
        speedCmpSec: data.speedCmpSec,
        seed: newSeed,
        seasonName: data.seasonName
      });`,
`      if (telemetrySubscriberRef.current) {
        telemetrySubscriberRef.current({
          headingDeg: data.headingDeg,
          speedMps: data.speedMps,
          speedCmpSec: data.speedCmpSec,
          seed: newSeed,
          seasonName: data.seasonName
        });
      }`
);

// 2. window.__debug.setSeed
s = s.replace(
`      setCurrentTelemetry({
        headingDeg: data.headingDeg,
        speedMps: data.speedMps,
        speedCmpSec: data.speedCmpSec,
        seed: Number(n),
        seasonName: data.seasonName
      });`,
`      if (telemetrySubscriberRef.current) {
        telemetrySubscriberRef.current({
          headingDeg: data.headingDeg,
          speedMps: data.speedMps,
          speedCmpSec: data.speedCmpSec,
          seed: Number(n),
          seasonName: data.seasonName
        });
      }`
);

// 3. render loop
s = s.replace(
`        // Update telemetry readout HUD state every 10 frames
        if (frameCount % 10 === 0) {
          setCurrentTelemetry({
            headingDeg: currentData.headingDeg,
            speedMps: currentData.speedMps,
            speedCmpSec: currentData.speedCmpSec,
            seed: currentData.seed,
            seasonName: currentData.seasonName
          });
        }`,
`        // Update telemetry readout HUD state every 10 frames without triggering VFXScene re-render
        if (frameCount % 10 === 0 && telemetrySubscriberRef.current) {
          telemetrySubscriberRef.current({
            headingDeg: currentData.headingDeg,
            speedMps: currentData.speedMps,
            speedCmpSec: currentData.speedCmpSec,
            seed: currentData.seed,
            seasonName: currentData.seasonName
          });
        }`
);

fs.writeFileSync(p, s, 'utf8');
console.log('Replaced all setCurrentTelemetry calls successfully!');
