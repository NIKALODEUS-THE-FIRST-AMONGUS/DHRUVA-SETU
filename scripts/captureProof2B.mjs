import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const mode = process.argv[2] || 'before';
const outDir = path.resolve('scripts', 'shots', 'proof_2b', mode);
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function captureAngles() {
  console.log(`Starting Step 2B capture for mode: ${mode}`);
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

  // 1. Hero Spar Buoy View (CAM 02: buoy)
  console.log('Capturing 1: Hero Spar Buoy View...');
  await page.keyboard.press('2');
  await page.waitForTimeout(2200);
  await page.screenshot({ path: path.join(outDir, '01_hero_spar_buoy.png') });

  // 2. Polar Sunset & Atmosphere Horizon View (CAM 01: wide)
  console.log('Capturing 2: Polar Sunset & Horizon View...');
  await page.keyboard.press('1');
  await page.waitForTimeout(2200);
  await page.screenshot({ path: path.join(outDir, '02_polar_sunset_horizon.png') });

  // 3. Macro Materials & Avionics Bay View (CAM 04: electronics)
  console.log('Capturing 3: Macro Materials & Avionics Bay View...');
  await page.keyboard.press('4');
  await page.waitForTimeout(2200);
  await page.screenshot({ path: path.join(outDir, '03_macro_materials_deck.png') });

  // 4. PBR Solar Shell & 316L Hardware Close-up (CAM 03: antenna & solar mast)
  console.log('Capturing 4: Solar Shell & Mast Hardware Close-up...');
  await page.keyboard.press('3');
  await page.waitForTimeout(2200);
  await page.screenshot({ path: path.join(outDir, '04_pbr_solar_clearcoat.png') });

  // 5. Sea Ice & Glacier Lighting View
  console.log('Capturing 5: Sea Ice & Glacier View...');
  await page.keyboard.press('1');
  await page.waitForTimeout(1500);
  // Orbit slightly to capture sea ice floes in sun glint
  await page.mouse.move(800, 450);
  await page.mouse.down();
  await page.mouse.move(950, 430, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, '05_sea_ice_glacier_lighting.png') });

  // 6. Subsea CTD Titanium Housing View (CAM 06: ctd)
  console.log('Capturing 6: Subsea CTD Titanium Housing View...');
  await page.keyboard.press('6');
  await page.waitForTimeout(2200);
  await page.screenshot({ path: path.join(outDir, '06_subsea_ctd_titanium.png') });

  console.log(`Step 2B capture complete! Saved to ${outDir}`);
  await browser.close();
}

captureAngles().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
