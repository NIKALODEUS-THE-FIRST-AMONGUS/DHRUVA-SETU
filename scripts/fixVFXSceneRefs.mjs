import fs from 'fs';
import path from 'path';

const p = path.resolve('src/components/3d/VFXScene.jsx');
let s = fs.readFileSync(p, 'utf8');

const target = `  const heaterStateRef = useRef(heaterState);
  heaterStateRef.current = heaterState;

  // Regional Prydz Bay MIZ current & drift telemetry state
  const [currentTelemetry, setCurrentTelemetry] = useState(() => {
    const initData = currentModel.get(0);
    return {
      headingDeg: initData.headingDeg,
      speedMps: initData.speedMps,
      speedCmpSec: initData.speedCmpSec,
      seed: currentModel.getSeed(),
      seasonName: initData.seasonName
    };
  });`;

const replacement = `  const heaterStateRef = useRef(heaterState);
  heaterStateRef.current = heaterState;
  const lastBuoyPosRef = useRef(new THREE.Vector3());
  const telemetrySubscriberRef = useRef(null);`;

s = s.replace(target.replace(/\n/g, '\r\n'), replacement).replace(target, replacement);

fs.writeFileSync(p, s, 'utf8');
console.log('Fixed VFXScene refs!');
