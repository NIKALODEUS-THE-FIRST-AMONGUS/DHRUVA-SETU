import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const mode = process.argv[2] || 'before';
const outDir = path.resolve('scripts', 'shots', 'proof_2a', mode);
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function captureAngles() {
  console.log(`Starting capture for mode: ${mode}`);
  const launchOptions = {
    headless: true,
    channel: 'chrome',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu-vsync',
      '--enable-webgl',
      '--ignore-gpu-blocklist'
    ]
  };

  let browser;
  try {
    browser = await chromium.launch(launchOptions);
  } catch (e) {
    browser = await chromium.launch({ ...launchOptions, channel: 'msedge' });
  }

  const page = await browser.newPage({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 1
  });

  console.log('Navigating to app...');
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3000);

  // 1. Full Buoy View (CAM 02: buoy)
  console.log('Capturing 1: Full Buoy View...');
  await page.keyboard.press('2');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, '01_full_buoy.png') });

  // 2. Cutaway Close-up (CAM 04: electronics)
  console.log('Capturing 2: Cutaway Close-up...');
  await page.keyboard.press('4');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, '02_cutaway_closeup.png') });

  // 3. PCB Macro View
  console.log('Capturing 3: PCB Macro View...');
  await page.evaluate(() => {
    if (window.__debug?.selectPart) {
      window.__debug.selectPart('esp32_s3');
    }
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, '03_pcb_macro.png') });

  // 4. Battery Box View
  console.log('Capturing 4: Battery Box View...');
  await page.evaluate(() => {
    if (window.__debug?.selectPart) {
      window.__debug.selectPart('battery_pack');
    }
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, '04_battery_box.png') });

  // 5. SOLAS Band Intersection View
  console.log('Capturing 5: SOLAS Band Intersection View...');
  await page.evaluate(() => {
    if (window.__debug?.deselectPart) {
      window.__debug.deselectPart();
    }
  });
  await page.keyboard.press('2');
  await page.waitForTimeout(1000);
  // Position camera to look directly at the equator boundary of the acrylic window and hull
  await page.evaluate(() => {
    const el = window.__debug;
    // We can rotate orbit controls or set camera position directly
    const camera = window.__debugCamera || (window.__stepSimFrame && window.__lastCamera);
  });
  // Adjust orbit via mouse drag to focus on the equator band
  await page.mouse.move(800, 450);
  await page.mouse.down();
  await page.mouse.move(700, 380, { steps: 10 });
  await page.mouse.up();
  await page.mouse.wheel(0, -600); // Zoom in on the equator band
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '05_solas_band.png') });

  // 6. Extreme Grazing Angle View on Acrylic Dome Cutaway
  console.log('Capturing 6: Extreme Angle View...');
  await page.mouse.move(800, 450);
  await page.mouse.down();
  await page.mouse.move(950, 480, { steps: 10 });
  await page.mouse.up();
  await page.mouse.wheel(0, -300);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '06_extreme_angle.png') });

  await browser.close();
  console.log(`Capture complete! Saved to ${outDir}`);
}

captureAngles().catch(console.error);
