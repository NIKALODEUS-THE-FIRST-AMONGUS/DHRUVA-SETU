import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const outDir = path.resolve('scripts/shots/mobile_tour_verify');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function verify() {
  console.log('Testing Mobile Slide Show Tour on iPhone 12/13/14 (390x844)...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-web-security']
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });

  const page = await context.newPage();
  await page.goto('http://localhost:3000/?testMode=true', { waitUntil: 'commit', timeout: 30000 });
  await page.waitForTimeout(4000);

  // Trigger Slide Show
  console.log('Starting Slide Show...');
  const started = await page.evaluate(() => {
    // Look for Slide Show button
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Slide Show') || b.textContent.includes('Tour'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('Clicked Tour Button:', started);
  await page.waitForTimeout(2000);

  // Take screenshot of mobile slide show expanded
  await page.screenshot({ path: path.join(outDir, '01_mobile_tour_expanded.png') });
  console.log('Captured 01_mobile_tour_expanded.png');

  // Verify Peek 3D button exists and click it
  console.log('Clicking PEEK 3D button...');
  const peeked = await page.evaluate(() => {
    const peekBtn = document.querySelector('.slide-peek-btn');
    if (peekBtn) {
      peekBtn.click();
      return true;
    }
    return false;
  });
  console.log('Peek button clicked:', peeked);
  await page.waitForTimeout(1000);

  // Take screenshot of mobile slide show minimized
  await page.screenshot({ path: path.join(outDir, '02_mobile_tour_minimized.png') });
  console.log('Captured 02_mobile_tour_minimized.png');

  // Test mini next button
  console.log('Testing mini Next button...');
  await page.evaluate(() => {
    const nextBtn = document.querySelectorAll('.tour-min-nav-btn')[1];
    if (nextBtn) nextBtn.click();
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '03_mobile_tour_min_next_slide.png') });
  console.log('Captured 03_mobile_tour_min_next_slide.png');

  // Click expand
  console.log('Clicking EXPAND button...');
  await page.evaluate(() => {
    const expBtn = document.querySelector('.tour-min-expand-btn');
    if (expBtn) expBtn.click();
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '04_mobile_tour_reexpanded.png') });
  console.log('Captured 04_mobile_tour_reexpanded.png');

  // Test swipe gesture on the card
  console.log('Testing touch swipe gesture...');
  const cardBox = await page.evaluate(() => {
    const card = document.querySelector('.tour-slide-card');
    if (!card) return null;
    const r = card.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });

  if (cardBox) {
    // Swipe left (next slide)
    await page.touchscreen.tap(cardBox.x, cardBox.y);
    // Simulate touch swipe
    await page.evaluate(() => {
      const card = document.querySelector('.tour-slide-card');
      if (card) {
        card.dispatchEvent(new TouchEvent('touchstart', {
          touches: [{ clientX: 300, clientY: 500 }]
        }));
        card.dispatchEvent(new TouchEvent('touchend', {
          changedTouches: [{ clientX: 100, clientY: 500 }]
        }));
      }
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, '05_mobile_tour_after_swipe.png') });
    console.log('Captured 05_mobile_tour_after_swipe.png');
  }

  await browser.close();
  console.log('\nMobile Slide Show Verification Complete!');
}

verify().catch(console.error);
