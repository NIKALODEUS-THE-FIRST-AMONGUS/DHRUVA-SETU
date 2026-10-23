import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function run() {
  const shotsDir = path.resolve('scripts', 'shots');
  if (!fs.existsSync(shotsDir)) {
    fs.mkdirSync(shotsDir, { recursive: true });
  }

  console.log('Launching browser...');
  let browser;
  const launchOptions = {
    headless: true,
    channel: 'chrome',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-gpu-vsync',
      '--enable-webgl',
      '--ignore-gpu-blocklist'
    ]
  };
  try {
    browser = await chromium.launch(launchOptions);
  } catch (e) {
    browser = await chromium.launch({ ...launchOptions, channel: 'msedge' });
  }

  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1
  });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Navigating to http://localhost:3000/?view=ctd ...');
  await page.goto('http://localhost:3000/?view=ctd', { waitUntil: 'domcontentloaded', timeout: 60000 });
  console.log('DOM Content Loaded! Waiting 4s...');
  await new Promise(r => setTimeout(r, 4000));
  
  const debugInfo = await page.evaluate(() => {
    return {
      hasDebug: !!window.__debug,
      keys: window.__debug ? Object.keys(window.__debug) : [],
      types: window.__debug ? Object.entries(window.__debug).map(([k, v]) => `${k}:${typeof v}`) : []
    };
  });
  console.log('debugInfo in page:', JSON.stringify(debugInfo));

  // Switch to CAM 06 (ctd)
  await page.keyboard.press('6');
  console.log('Pressed key 6 for CTD camera');
  await new Promise(r => setTimeout(r, 1000));

  const testCases = [
    { depth: 0, t: 0 },
    { depth: 0, t: 60 },
    { depth: 10, t: 0 },
    { depth: 10, t: 60 },
    { depth: 40, t: 0 },
    { depth: 40, t: 60 }
  ];

  const results = [];

  for (const tc of testCases) {
    console.log(`Evaluating test case: depth=${tc.depth}m, t=${tc.t}s...`);
    // Set depth
    await page.evaluate((d) => {
      window.__debug.setWinchDepth(d);
    }, tc.depth);

    // If t == 0, allow a few settling frames
    if (tc.t === 0) {
      await page.evaluate(() => {
        window.__debug.stepTime(1);
      });
      await new Promise(r => setTimeout(r, 500));
    } else {
      // Advance deterministically by 60s
      await page.evaluate(() => {
        window.__debug.stepTime(60);
      });
      await new Promise(r => setTimeout(r, 500));
    }

    // Capture screenshot
    const shotPath = path.join(shotsDir, `cam06-depth${tc.depth}-t${tc.t}s.png`);
    await page.screenshot({ path: shotPath });

    // Read positions
    const pos = await page.evaluate(() => {
      return window.__debug.getPositions();
    });

    // Horizontal distance between sonde and winch exit port
    const horizDist = Math.hypot(pos.sonde.x - pos.winchExit.x, pos.sonde.z - pos.winchExit.z);
    
    // Allowed tolerance based on depth
    const maxTolerance = tc.depth === 0 ? 0.05 : (tc.depth === 10 ? 0.50 : 1.20);
    const matchesTolerance = horizDist <= maxTolerance;
    const pass = matchesTolerance && pos.tetherConnected;

    results.push({
      depth: `${tc.depth} m`,
      t: `${tc.t}s`,
      buoyX: pos.buoy.x,
      buoyZ: pos.buoy.z,
      sondeX: pos.sonde.x,
      sondeZ: pos.sonde.z,
      winchExitX: pos.winchExit.x,
      winchExitZ: pos.winchExit.z,
      horizDist: horizDist.toFixed(4),
      matchesTolerance: matchesTolerance ? 'YES' : 'NO',
      tetherConnected: pos.tetherConnected ? 'YES' : 'NO',
      status: pass ? 'PASS' : 'FAIL',
      shotPath
    });
  }

  await browser.close();

  console.log('\n=== STEP 3: CTD SONDE & BUOY CO-MOTION VERIFICATION ===\n');
  console.log('| depth | t | sonde displacement matches buoy displacement within tolerance | tether connected | PASS/FAIL |');
  console.log('| :--- | :--- | :--- | :--- | :--- |');
  for (const r of results) {
    console.log(`| ${r.depth} | ${r.t} | ${r.matchesTolerance} (offset ${r.horizDist}m) | ${r.tetherConnected} | ${r.status} |`);
  }

  console.log('\n=== NUMERIC BUOY AND SONDE X/Z POSITIONS ===\n');
  console.log('| depth | t | buoy (x, z) | winch exit (x, z) | sonde (x, z) | horiz offset |');
  console.log('| :--- | :--- | :--- | :--- | :--- | :--- |');
  for (const r of results) {
    console.log(`| ${r.depth} | ${r.t} | (${r.buoyX}, ${r.buoyZ}) | (${r.winchExitX}, ${r.winchExitZ}) | (${r.sondeX}, ${r.sondeZ}) | ${r.horizDist}m |`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
