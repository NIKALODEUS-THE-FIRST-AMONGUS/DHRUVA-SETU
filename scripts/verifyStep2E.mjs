import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('http://localhost:3000/?testMode=true', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Test quality tier switches
  const tierResults = await page.evaluate(() => {
    const el = window.__debug;
    return {
      hasDebug: !!el,
      positions: el && el.getPositions ? el.getPositions() : null
    };
  });

  console.log('TIER RESULTS:', JSON.stringify(tierResults, null, 2));
  console.log('CONSOLE ERRORS COUNT:', errors.length);
  if (errors.length > 0) {
    console.log('ERRORS:', errors);
  }

  await browser.close();
  if (errors.length > 0) process.exit(1);
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
