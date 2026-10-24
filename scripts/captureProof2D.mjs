import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const mode = process.argv[2] || 'before';
const outDir = path.resolve('scripts/shots/proof_2d', mode);
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log(`Starting Step 2D capture for mode: ${mode}`);

async function run() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: [
      '--disable-web-security',
      '--no-sandbox',
      '--use-gl=angle',
      '--use-angle=d3d11',
      '--enable-webgl',
      '--ignore-gpu-blocklist'
    ]
  });

  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1
  });

  console.log('Navigating to app...');
  await page.goto('http://localhost:3000/?testMode=true', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Deploy winch to 18m so the subsea cable and sonde are fully deployed for physics testing
  await page.evaluate(() => {
    if (window.__debug && window.__debug.setWinchDepth) {
      window.__debug.setWinchDepth(18.0);
    }
  });
  await page.waitForTimeout(1000);

  async function setCam(camNum) {
    await page.keyboard.press(`Digit${camNum}`);
    await page.waitForTimeout(2500); // Wait for GSAP camera tween to fully settle
  }

  // 1. CAM 02: Buoy Heave & Pitch Stability in Swell
  console.log('Capturing 1: Buoy Heave & Pitch Dynamics...');
  await setCam(2);
  await page.screenshot({ path: path.join(outDir, '01_buoy_heave_inertia.png') });

  // 2. CAM 05: Winch & Keel - Cable Catenary Deployed
  console.log('Capturing 2: Winch & Keel Cable Catenary...');
  await setCam(5);
  await page.screenshot({ path: path.join(outDir, '02_cable_catenary_deployed.png') });

  // 3. CAM 06: CTD Profiler Sonde - Current Shear & Trailing Lag
  console.log('Capturing 3: CTD Sonde Hydrodynamic Trailing Lag...');
  await setCam(6);
  await page.screenshot({ path: path.join(outDir, '03_ctd_current_shear_lag.png') });

  // 4. CAM 05 with orbit angle looking at Mooring Bridle
  console.log('Capturing 4: Keel Tether Bridle Dynamics...');
  await page.mouse.move(960, 540);
  await page.mouse.down();
  await page.mouse.move(960, 420, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, '04_keel_tether_bridle.png') });

  // 5. CAM 01: Panoramic View of Heaving Spar Buoy
  console.log('Capturing 5: Buoy Metacentric Rolling in Waves...');
  await setCam(1);
  await page.screenshot({ path: path.join(outDir, '05_buoy_roll_damping.png') });

  // 6. CAM 06: Subsea Profiling Dynamics & Umbilical Strumming
  console.log('Capturing 6: Subsea Profiling Dynamics...');
  await setCam(6);
  await page.mouse.move(960, 540);
  await page.mouse.down();
  await page.mouse.move(820, 540, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, '06_subsea_profiling_dynamics.png') });

  console.log(`Step 2D capture complete! Saved to ${outDir}`);
  await browser.close();
}

run().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
