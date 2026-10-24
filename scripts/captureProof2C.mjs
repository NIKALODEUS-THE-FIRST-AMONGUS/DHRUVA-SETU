import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const mode = process.argv[2] || 'before';
const outDir = path.resolve('scripts/shots/proof_2c', mode);
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log(`Starting Step 2C capture for mode: ${mode}`);

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

  // Set Quality to High
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const highBtn = btns.find(b => b.textContent.trim().toLowerCase() === 'high');
    if (highBtn) highBtn.click();
  });
  await page.waitForTimeout(1000);

  async function setCam(camNum) {
    await page.keyboard.press(`Digit${camNum}`);
    await page.waitForTimeout(2500); // Wait for GSAP camera tween to fully settle
  }

  // 1. CAM 01: Ocean Swell & Horizon Vista
  console.log('Capturing 1: Ocean Swell & Horizon Vista...');
  await setCam(1);
  await page.screenshot({ path: path.join(outDir, '01_ocean_swell_hero.png') });

  // 2. CAM 01 with sun road angle
  console.log('Capturing 2: Polar Sun Road & Wave SSS...');
  // Orbit camera slightly to look into sun specular road
  await page.mouse.move(960, 540);
  await page.mouse.down();
  await page.mouse.move(760, 540, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, '02_polar_sun_road.png') });

  // 3. CAM 02: Buoy Waterline Contact & Meniscus Wake
  console.log('Capturing 3: Buoy Waterline Contact & Wake...');
  await setCam(2);
  await page.screenshot({ path: path.join(outDir, '03_buoy_waterline_contact.png') });

  // 4. CAM 03: Mast & Solar Shell looking at Wave Crets
  console.log('Capturing 4: Wave Crests from Mast...');
  await setCam(3);
  await page.screenshot({ path: path.join(outDir, '04_wave_crest_sss.png') });

  // 5. CAM 01: Sea Ice Floe & Waterline Interface
  console.log('Capturing 5: Sea Ice & Waterline Interface...');
  await setCam(1);
  await page.mouse.move(960, 540);
  await page.mouse.down();
  await page.mouse.move(1160, 540, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, '05_sea_ice_water_interface.png') });

  // 6. CAM 06: Subsea CTD, Snell's Window & Caustics
  console.log('Capturing 6: Subsea CTD, Snell Window & Caustics...');
  await setCam(6);
  await page.screenshot({ path: path.join(outDir, '06_subsea_caustics_godrays.png') });

  console.log(`Step 2C capture complete! Saved to ${outDir}`);
  await browser.close();
}

run().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
