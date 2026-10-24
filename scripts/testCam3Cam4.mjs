import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-web-security']
  });

  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 }
  });

  console.log('Navigating to http://localhost:3000/?testMode=true ...');
  await page.goto('http://localhost:3000/?testMode=true', { waitUntil: 'commit', timeout: 30000 });
  await page.waitForTimeout(4000);

  const measureCam = async (camId, camName) => {
    console.log(`\n--- Testing ${camName} (${camId}) ---`);
    const keyMap = { 'wide': '1', 'buoy': '2', 'electronics_a': '3', 'electronics': '4', 'electronics_c': '5', 'ctd': '6', 'seal': '7', 'anchor': '8' };
    if (keyMap[camId]) {
      await page.keyboard.press(keyMap[camId]);
    }

    await page.waitForTimeout(2000); // Wait for camera transition

    // Sample performance over 60 frames
    const stats = await page.evaluate(async () => {
      const times = [];
      let last = performance.now();

      for (let i = 0; i < 60; i++) {
        await new Promise(r => requestAnimationFrame(r));
        const now = performance.now();
        times.push(now - last);
        last = now;
      }

      times.sort((a, b) => a - b);
      const avgMs = times.reduce((s, v) => s + v, 0) / times.length;
      const fps = 1000 / avgMs;
      const p99Ms = times[Math.floor(times.length * 0.99)];
      const low1PctMs = times[Math.floor(times.length * 0.99)];
      const low1PctFps = 1000 / low1PctMs;

      return {
        fps: Math.round(fps * 10) / 10,
        low1PctFps: Math.round(low1PctFps * 10) / 10,
        avgMs: Math.round(avgMs * 10) / 10,
        p99Ms: Math.round(p99Ms * 10) / 10
      };
    });

    console.log(`Result: avgFrameTime: ${stats.avgMs}ms | p99: ${stats.p99Ms}ms | avgFps: ${stats.fps} | low1PctFps: ${stats.low1PctFps}`);
    return stats;
  };

  await measureCam('wide', 'CAM 01: Panoramic Vista');
  await measureCam('buoy', 'CAM 02: Spar Buoy');
  await measureCam('electronics_a', 'CAM 03: Antenna Mast');
  await measureCam('electronics', 'CAM 04: Avionics Bay & Battery Rack');

  await browser.close();
  console.log('\nAll done!');
}

run().catch(console.error);
