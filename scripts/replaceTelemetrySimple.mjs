import fs from 'fs';
import path from 'path';

const p = path.resolve('src/components/3d/VFXScene.jsx');
let s = fs.readFileSync(p, 'utf8');

s = s.replace(/setCurrentTelemetry\([\s\S]*?\);/g, (match) => {
  return `if (telemetrySubscriberRef.current) {
        const _telData = typeof data !== 'undefined' ? data : currentData;
        telemetrySubscriberRef.current({
          headingDeg: _telData.headingDeg,
          speedMps: _telData.speedMps,
          speedCmpSec: _telData.speedCmpSec,
          seed: typeof newSeed !== 'undefined' ? newSeed : (typeof n !== 'undefined' ? Number(n) : _telData.seed),
          seasonName: _telData.seasonName
        });
      }`;
});

fs.writeFileSync(p, s, 'utf8');
console.log('Successfully replaced all setCurrentTelemetry calls!');
