import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function run() {
  const shotsDir = path.resolve('scripts', 'shots');
  if (!fs.existsSync(shotsDir)) {
    fs.mkdirSync(shotsDir, { recursive: true });
  }

  console.log('Launching browser for current & drift verification...');
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

  let browser;
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
  await new Promise(r => setTimeout(r, 4000));

  await page.waitForFunction(() => {
    return window.__debug && typeof window.__debug.setSeed === 'function';
  }, { timeout: 30000 });
  console.log('Debug interface ready!');

  // Capture screenshot of the compass / current readout HUD
  const hudElement = await page.$('#current-drift-hud');
  const hudShotPath = path.join(shotsDir, 'current-readout-hud.png');
  if (hudElement) {
    await hudElement.screenshot({ path: hudShotPath });
    console.log(`Saved HUD readout screenshot to ${hudShotPath}`);
  }

  // Verification parameters: 3 seeds and 3 seasons
  const seeds = [42, 101, 777];
  const seasons = ['summer', 'winter', 'blizzard'];

  const results = [];

  for (const seed of seeds) {
    for (const season of seasons) {
      console.log(`Running simulation: seed=${seed}, season=${season} over 6 hours (36 samples)...`);

      // Initialize seed and season
      await page.evaluate(({ s, sea }) => {
        window.__debug.setSeed(s);
        window.__debug.setSeason(sea);
      }, { s: seed, sea: season });

      // Settle initial transition
      await new Promise(r => setTimeout(r, 200));

      const samples = [];
      const totalMinutes = 360; // 6 hours
      const sampleIntervalMin = 10; // 10 minutes
      const steps = totalMinutes / sampleIntervalMin; // 36 steps

      for (let step = 0; step <= steps; step++) {
        const curInfo = await page.evaluate(() => {
          return window.__debug.getCurrent();
        });

        samples.push({
          timeMin: step * sampleIntervalMin,
          heading: curInfo.headingDeg,
          speed: curInfo.speedMps
        });

        // Step time by 10 minutes (600 seconds)
        if (step < steps) {
          await page.evaluate((intervalSec) => {
            window.__debug.stepTime(intervalSec);
          }, sampleIntervalMin * 60);
        }
      }

      // Compute statistics over 6 hours
      const headings = samples.map(s => s.heading);
      const speeds = samples.map(s => s.speed);

      const meanHeading = headings.reduce((a, b) => a + b, 0) / headings.length;
      const minHeading = Math.min(...headings);
      const maxHeading = Math.max(...headings);
      const meanSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;

      // Band criteria:
      // Heading must stay strictly within 270° +/- 40° [230° to 310°]
      // Mean speed within 0.05 to 0.20 m/s
      const headingWithinBand = minHeading >= 230.0 && maxHeading <= 310.0;
      const speedWithinBand = meanSpeed >= 0.05 && meanSpeed <= 0.20;
      const withinStatedBand = (headingWithinBand && speedWithinBand) ? 'Y' : 'N';

      results.push({
        seed,
        season,
        meanHeading: meanHeading.toFixed(1) + '°',
        minHeading: minHeading.toFixed(1) + '°',
        maxHeading: maxHeading.toFixed(1) + '°',
        meanSpeed: (meanSpeed * 100).toFixed(1) + ' cm/s (' + meanSpeed.toFixed(3) + ' m/s)',
        withinStatedBand
      });
    }
  }

  await browser.close();

  console.log('\n=== REGIONAL OCEAN CURRENT & DRIFT MODEL VERIFICATION ===\n');
  console.log('| seed | season | mean heading | min | max | mean speed | within the stated band Y/N |');
  console.log('| :--- | :--- | :--- | :--- | :--- | :--- | :--- |');
  for (const r of results) {
    console.log(`| ${r.seed} | ${r.season} | ${r.meanHeading} | ${r.minHeading} | ${r.maxHeading} | ${r.meanSpeed} | ${r.withinStatedBand} |`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
