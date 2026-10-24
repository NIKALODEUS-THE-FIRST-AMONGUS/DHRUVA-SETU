import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const mode = process.argv[2] || 'before';
const outDir = path.resolve('scripts/shots/proof_2e', mode);
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log(`Starting Step 2E capture for mode: ${mode}`);

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

  // Deploy winch to 18m so CTD sonde is visible in deep shots
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

  // 1. CAM 01: Panoramic Polar Vista (Sky, sun, glaciers, and heaving spar buoy)
  console.log('Capturing 1: Panoramic Polar Vista...');
  await setCam(1);
  await page.screenshot({ path: path.join(outDir, '01_panoramic_polar_vista.png') });

  // 2. CAM 03: Macro Lens Acrylic Dome & Avionics Bay
  console.log('Capturing 2: Macro Lens Acrylic Dome...');
  await setCam(3);
  await page.screenshot({ path: path.join(outDir, '02_macro_lens_acrylic_dome.png') });

  // 3. CAM 06: Subsea Caustic Bokeh & Deep Underwater Abyss
  console.log('Capturing 3: Subsea Caustic Bokeh...');
  await setCam(6);
  await page.screenshot({ path: path.join(outDir, '03_subsea_caustic_bokeh.png') });

  // 4. CAM 02: Grazing Rim-Light Specular & Water Meniscus
  console.log('Capturing 4: Grazing Rim-Light Specular...');
  await setCam(2);
  await page.screenshot({ path: path.join(outDir, '04_grazing_rim_light_specular.png') });

  // 5. Waterline Meniscus & Lens Droplets (Orbit near waterline)
  console.log('Capturing 5: Waterline Meniscus & Lens Droplets...');
  await setCam(2);
  await page.mouse.move(960, 540);
  await page.mouse.down();
  await page.mouse.move(960, 480, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, '05_waterline_meniscus_lens_droplets.png') });

  // 6. CAM 04: Inspection HUD & Telemetry Laser Downlink
  console.log('Capturing 6: Inspection HUD Cinematic...');
  await setCam(4);
  await page.screenshot({ path: path.join(outDir, '06_inspection_hud_cinematic.png') });

  console.log(`Step 2E capture complete! Saved to ${outDir}`);
  await browser.close();
}

run().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
