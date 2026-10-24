import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));
  page.on('response', resp => {
    if (resp.status() >= 400) console.log('4XX/5XX RESPONSE:', resp.status(), resp.url());
  });

  await page.goto('http://localhost:3000/?testMode=true', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  // Test docked state
  const posDocked = await page.evaluate(() => {
    return window.__debug ? window.__debug.getPositions() : null;
  });

  // Test deployed state (18m)
  await page.evaluate(() => {
    if (window.__debug && window.__debug.setWinchDepth) {
      window.__debug.setWinchDepth(18.0);
    }
  });
  await page.waitForTimeout(2000);

  const posDeployed = await page.evaluate(() => {
    return window.__debug ? window.__debug.getPositions() : null;
  });

  console.log('DOCKED POSITIONS:', JSON.stringify(posDocked, null, 2));
  console.log('DEPLOYED POSITIONS:', JSON.stringify(posDeployed, null, 2));
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
