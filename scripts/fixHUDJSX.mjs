import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/components/3d/VFXScene.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const markerStart = '{/* ── Regional Ocean Current & Drift Readout (Prydz Bay MIZ) ── */}';
const startIndex = content.indexOf(markerStart);
const endIndex = content.lastIndexOf('</div>\n    </div>\n  );\n}');

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `{/* ── Regional Ocean Current & Drift Readout (Prydz Bay MIZ) ── */}
      <CurrentDriftHUD
        selectedPartId={selectedPartId}
        isTourRunning={isTourRunning}
        onRerollSeed={handleRerollSeed}
        telemetrySubscriberRef={telemetrySubscriberRef}
      />\n    `;
  content = content.substring(0, startIndex) + replacement + content.substring(endIndex + 7);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('HUD JSX successfully replaced!');
} else {
  console.log('Indices not found:', startIndex, endIndex);
}
