import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function testMobile() {
  const outDir = path.resolve('scripts', 'shots', 'mobile-audit');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

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

  // Test iPhone 14/15 dimensions (390x844)
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });

  const page = await context.newPage();

  console.log('Loading mobile view...');
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // 1. Initial State
  await page.screenshot({ path: path.join(outDir, '01_mobile_initial.png') });
  console.log('Screenshot 01: Initial');

  // 2. Expand Bottom Deck via direct evaluate click
  await page.evaluate(() => {
    const btn = document.querySelector('.deck-expand-btn') || document.querySelector('.deck-current-cam-btn');
    if (btn) btn.click();
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '02_mobile_deck_expanded.png') });
  console.log('Screenshot 02: Deck Expanded');

  // Collapse it back
  await page.evaluate(() => {
    const btn = document.querySelector('.deck-expand-btn');
    if (btn) btn.click();
  });
  await page.waitForTimeout(300);

  // 3. Open Preferences Sidebar Drawer
  await page.evaluate(() => {
    const btn = document.querySelector('.topbar-settings-btn');
    if (btn) btn.click();
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '03_mobile_preferences_open.png') });
  console.log('Screenshot 03: Preferences Drawer');

  // Close Preferences
  await page.evaluate(() => {
    const btn = document.querySelector('.drawer-close-btn');
    if (btn) btn.click();
  });
  await page.waitForTimeout(300);

  // 4. Select a part to inspect
  await page.evaluate(() => {
    if (window.__debug?.selectPart) {
      window.__debug.selectPart('avionics_chassis');
    }
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '04_mobile_part_inspector.png') });
  console.log('Screenshot 04: Part Inspector');

  // Deselect part
  await page.evaluate(() => {
    if (window.__debug?.selectPart) {
      window.__debug.selectPart(null);
    }
  });
  await page.waitForTimeout(300);

  // 5. Open Season Dropdown
  await page.evaluate(() => {
    const btn = document.querySelector('#topbar-season-btn');
    if (btn) btn.click();
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, '05_mobile_season_dropdown.png') });
  console.log('Screenshot 05: Season Dropdown');

  // Close Season Dropdown
  await page.evaluate(() => {
    const btn = document.querySelector('#topbar-season-btn');
    if (btn) btn.click();
  });
  await page.waitForTimeout(200);

  // 6. Open Region Dropdown
  await page.evaluate(() => {
    const btn = document.querySelector('#topbar-region-btn');
    if (btn) btn.click();
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, '06_mobile_region_dropdown.png') });
  console.log('Screenshot 06: Region Dropdown');

  // Close Region Dropdown
  await page.evaluate(() => {
    const btn = document.querySelector('#topbar-region-btn');
    if (btn) btn.click();
  });
  await page.waitForTimeout(200);

  // 7. Open Team Modal
  await page.evaluate(() => {
    const btn = document.querySelector('.topbar-info-circle-btn');
    if (btn) btn.click();
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '07_mobile_team_modal.png') });
  console.log('Screenshot 07: Team Modal');

  // Close Team Modal
  await page.evaluate(() => {
    const btn = document.querySelector('.team-modal-close-btn') || document.querySelector('.team-dismiss-btn');
    if (btn) btn.click();
  });
  await page.waitForTimeout(300);

  // 8. Launch Slideshow
  await page.evaluate(() => {
    const btn = document.querySelector('#topbar-tour-btn');
    if (btn) btn.click();
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, '08_mobile_tour_presentation.png') });
  console.log('Screenshot 08: Tour Presentation');

  // Exit Slideshow
  await page.evaluate(() => {
    const btn = document.querySelector('.tour-exit-btn') || document.querySelector('#topbar-tour-btn');
    if (btn) btn.click();
  });
  await page.waitForTimeout(500);

  // 9. Open Guided Simulation Tutorial HUD
  await page.evaluate(() => {
    const inviteBtn = document.querySelector('.invite-start-btn');
    if (inviteBtn) inviteBtn.click();
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '09_mobile_tutorial_hud.png') });
  console.log('Screenshot 09: Tutorial HUD');

  // Close Tutorial HUD
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.sim-hud-close-btn');
    if (closeBtn) closeBtn.click();
  });
  await page.waitForTimeout(400);

  // 10. Ultra Narrow Viewport Test (360x740 Galaxy S-series)
  await page.setViewportSize({ width: 360, height: 740 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, '10_mobile_360px_narrow.png') });
  console.log('Screenshot 10: 360px Ultra-Narrow Viewport');

  await browser.close();
  console.log('Audit complete! Output saved to scripts/shots/mobile-audit');
}

testMobile().catch(console.error);
