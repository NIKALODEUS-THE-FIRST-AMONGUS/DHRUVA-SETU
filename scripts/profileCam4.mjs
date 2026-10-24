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

  await page.goto('http://localhost:3000/?testMode=true', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Switch to CAM 04
  await page.keyboard.press('4');
  await page.waitForTimeout(2000);

  // Profile 60 frames and break down time spent
  const profile = await page.evaluate(async () => {
    const logs = [];
    const renderer = window.__renderer;
    
    // Inject timers into key stages if possible, or measure total frame breakdown
    for (let f = 0; f < 30; f++) {
      const start = performance.now();
      await new Promise(r => requestAnimationFrame(r));
      const dur = performance.now() - start;
      if (dur > 50) {
        logs.push({ frame: f, durationMs: Math.round(dur * 10) / 10 });
      }
    }
    return logs;
  });

  console.log('Spike frames in CAM 04:', profile);

  // Now let's inspect what materials/shaders compiled or what happened
  const details = await page.evaluate(() => {
    const r = window.__renderer;
    return {
      calls: r.info.render.calls,
      lines: r.info.render.lines,
      points: r.info.render.points,
      triangles: r.info.render.triangles,
      frame: r.info.render.frame,
      programs: r.info.programs?.length || 0,
      geometries: r.info.memory.geometries,
      textures: r.info.memory.textures
    };
  });

  console.log('Renderer details in CAM 04:', details);
  await browser.close();
}

run().catch(console.error);
