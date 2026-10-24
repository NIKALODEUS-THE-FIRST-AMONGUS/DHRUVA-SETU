import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const outDir = path.resolve('scripts/shots/baseline_step0');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function getRenderer(page) {
  return await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return null;
    const parent = canvas.parentElement;
    const fiberKey = Object.keys(parent).find(k => k.startsWith('__reactFiber'));
    if (!fiberKey) return null;
    let cur = parent[fiberKey];
    while (cur) {
      if (cur.memoizedState) {
        let hook = cur.memoizedState;
        while (hook) {
          if (hook.memoizedState && hook.memoizedState.current && hook.memoizedState.current.renderer) {
            return hook.memoizedState.current;
          }
          hook = hook.next;
        }
      }
      cur = cur.return;
    }
    return null;
  });
}

async function measureFpsAndRender(page, durationMs = 4000) {
  return await page.evaluate(async (ms) => {
    // Locate renderer from React fiber
    const canvas = document.querySelector('canvas');
    let renderer = null;
    let composer = null;
    if (canvas) {
      const parent = canvas.parentElement;
      const fiberKey = Object.keys(parent).find(k => k.startsWith('__reactFiber'));
      let cur = parent[fiberKey];
      while (cur) {
        if (cur.memoizedState) {
          let hook = cur.memoizedState;
          while (hook) {
            if (hook.memoizedState && hook.memoizedState.current && hook.memoizedState.current.renderer) {
              renderer = hook.memoizedState.current.renderer;
              composer = hook.memoizedState.current.postProcessing?.composer;
              break;
            }
            hook = hook.next;
          }
        }
        if (renderer) break;
        cur = cur.return;
      }
    }

    // Measure frame times
    const frameTimes = [];
    const callsList = [];
    const trianglesList = [];
    let lastTime = performance.now();

    // Hook render loop stats
    let originalRender = renderer ? renderer.render.bind(renderer) : null;
    let sceneCalls = 0;
    let sceneTriangles = 0;
    let scenePoints = 0;
    let sceneLines = 0;

    if (renderer) {
      renderer.info.autoReset = false;
    }

    const start = performance.now();
    await new Promise((resolve) => {
      function onFrame(now) {
        const delta = now - lastTime;
        lastTime = now;
        frameTimes.push(delta);

        if (renderer) {
          callsList.push(renderer.info.render.calls);
          trianglesList.push(renderer.info.render.triangles);
          sceneCalls = Math.max(sceneCalls, renderer.info.render.calls);
          sceneTriangles = Math.max(sceneTriangles, renderer.info.render.triangles);
          scenePoints = renderer.info.render.points;
          sceneLines = renderer.info.render.lines;
          renderer.info.reset();
        }

        if (now - start < ms) {
          requestAnimationFrame(onFrame);
        } else {
          resolve();
        }
      }
      requestAnimationFrame(onFrame);
    });

    if (renderer) {
      renderer.info.autoReset = true;
    }

    // Drop first 5 frames to ignore warm-up
    const validFrames = frameTimes.slice(5);
    const sorted = [...validFrames].sort((a, b) => a - b);
    const avgDelta = validFrames.reduce((a, b) => a + b, 0) / validFrames.length;
    const avgFps = 1000 / avgDelta;

    // 1% low frame time (99th percentile frame time = slowest 1% of frames)
    const p99Index = Math.floor(sorted.length * 0.99);
    const p99Delta = sorted[p99Index] || sorted[sorted.length - 1];
    const fps1PercentLow = 1000 / p99Delta;

    const maxDelta = sorted[sorted.length - 1];
    const minDelta = sorted[0];

    // Standard deviation
    const variance = validFrames.reduce((acc, v) => acc + Math.pow(v - avgDelta, 2), 0) / validFrames.length;
    const stdDev = Math.sqrt(variance);

    // Filter non-zero calls
    const validCalls = callsList.filter(c => c > 0);
    const avgCalls = validCalls.length > 0 ? validCalls.reduce((a, b) => a + b, 0) / validCalls.length : sceneCalls;
    const validTris = trianglesList.filter(t => t > 0);
    const avgTris = validTris.length > 0 ? validTris.reduce((a, b) => a + b, 0) / validTris.length : sceneTriangles;

    // Memory stats
    const mem = renderer ? renderer.info.memory : {};
    const programsCount = renderer?.info?.programs ? renderer.info.programs.length : 0;

    // Heap stats
    const heap = performance.memory ? {
      usedJSHeapSizeMB: +(performance.memory.usedJSHeapSize / 1048576).toFixed(2),
      totalJSHeapSizeMB: +(performance.memory.totalJSHeapSize / 1048576).toFixed(2),
      jsHeapSizeLimitMB: +(performance.memory.jsHeapSizeLimit / 1048576).toFixed(2)
    } : null;

    // Long tasks
    const longTasks = performance.getEntriesByType ? performance.getEntriesByType('longtask') : [];
    const totalLongTaskTime = longTasks.reduce((acc, t) => acc + t.duration, 0);

    return {
      frameCount: validFrames.length,
      avgFps: +avgFps.toFixed(1),
      fps1PercentLow: +fps1PercentLow.toFixed(1),
      avgFrameTimeMs: +avgDelta.toFixed(2),
      p99FrameTimeMs: +p99Delta.toFixed(2),
      maxFrameTimeMs: +maxDelta.toFixed(2),
      minFrameTimeMs: +minDelta.toFixed(2),
      frameTimeStdDev: +stdDev.toFixed(2),
      drawCallsPerFrame: Math.round(avgCalls),
      trianglesPerFrame: Math.round(avgTris),
      pointsPerFrame: scenePoints,
      linesPerFrame: sceneLines,
      geometriesInMemory: mem.geometries || 0,
      texturesInMemory: mem.textures || 0,
      programsCompiled: programsCount,
      heap,
      longTasksCount: longTasks.length,
      totalLongTaskDurationMs: +totalLongTaskTime.toFixed(1)
    };
  }, durationMs);
}

async function run() {
  console.log('=== Dhruva Setu Simulator: Comprehensive Baseline Performance Benchmark ===\n');

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: [
      '--disable-web-security',
      '--no-sandbox',
      '--use-gl=angle',
      '--use-angle=d3d11',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--enable-precise-memory-info'
    ]
  });

  // 1. DESKTOP BENCHMARK (1920x1080)
  console.log('--- 1. Measuring Desktop Baseline (1920x1080, DPR 1.0) ---');
  const desktopContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1
  });
  const desktopPage = await desktopContext.newPage();

  // Navigation Timing
  const navStart = Date.now();
  await desktopPage.goto('http://localhost:3000/?testMode=true', { waitUntil: 'domcontentloaded' });
  const dclTime = Date.now() - navStart;
  await desktopPage.waitForTimeout(2000); // Allow Initial Scene & Textures to settle

  const navTiming = await desktopPage.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    const fcp = paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0;
    return {
      domContentLoaded: nav ? +(nav.domContentLoadedEventEnd - nav.startTime).toFixed(1) : 0,
      loadEvent: nav ? +(nav.loadEventEnd - nav.startTime).toFixed(1) : 0,
      duration: nav ? +nav.duration.toFixed(1) : 0,
      firstContentfulPaint: +fcp.toFixed(1)
    };
  });

  console.log('Navigation & Load Timings:', navTiming);

  console.log('Measuring Desktop 60fps Stability & Memory for 5 seconds...');
  const desktopMetrics = await measureFpsAndRender(desktopPage, 5000);
  console.log('Desktop Metrics:', JSON.stringify(desktopMetrics, null, 2));

  // 2. REFERENCE SCREENSHOTS (EVERY VIEW / MODE / CAMERA ANGLE)
  console.log('\n--- 2. Capturing Baseline Reference Screenshots (11 Angles/Modes) ---');
  async function snap(name, delay = 2000) {
    await desktopPage.waitForTimeout(delay);
    const p = path.join(outDir, `${name}.png`);
    await desktopPage.screenshot({ path: p });
    console.log(`Saved screenshot: ${name}.png`);
  }

  // CAM 01
  await desktopPage.keyboard.press('Digit1');
  await snap('01_cam01_panoramic_vista');

  // CAM 02
  await desktopPage.keyboard.press('Digit2');
  await snap('02_cam02_spar_buoy');

  // CAM 03
  await desktopPage.keyboard.press('Digit3');
  await snap('03_cam03_antenna_solar_mast');

  // CAM 04
  await desktopPage.keyboard.press('Digit4');
  await snap('04_cam04_avionics_battery_rack');

  // Winch deploy for subsea views
  await desktopPage.evaluate(() => {
    if (window.__debug && window.__debug.setWinchDepth) window.__debug.setWinchDepth(18.0);
  });
  await desktopPage.waitForTimeout(1000);

  // CAM 05
  await desktopPage.keyboard.press('Digit5');
  await snap('05_cam05_winch_keel');

  // CAM 06
  await desktopPage.keyboard.press('Digit6');
  await snap('06_cam06_ctd_profiler');

  // CAM 08 (Benthic Seabed)
  await desktopPage.keyboard.press('Digit8');
  await snap('07_cam08_benthic_anchor');

  // CAM 07 (Seal Pod)
  await desktopPage.keyboard.press('Digit7');
  await snap('08_cam07_seal_pod');

  // Bharati Station View
  await desktopPage.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Bharati') || b.textContent.includes('Station'));
    if (btn) btn.click();
  });
  await snap('09_station_bharati', 2500);

  // Component Inspection Hover Mode
  await desktopPage.evaluate(() => {
    if (window.__debug && window.__debug.hoverPart) {
      window.__debug.hoverPart('ctd_sonde');
    }
  });
  await snap('11_component_inspection_hover', 1500);

  await desktopContext.close();

  // 3. MOBILE EMULATION BENCHMARK (390x844, DPR 2.0 / iPhone 14 profile)
  console.log('\n--- 3. Measuring Mobile Baseline Emulation (390x844, DPR 2.0) ---');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3000/?testMode=true', { waitUntil: 'domcontentloaded' });
  await mobilePage.waitForTimeout(3000);

  const mobileMetrics = await measureFpsAndRender(mobilePage, 5000);
  console.log('Mobile Metrics:', JSON.stringify(mobileMetrics, null, 2));

  // Mobile screenshot
  const mobSnapPath = path.join(outDir, '10_mobile_390x844_overview.png');
  await mobilePage.screenshot({ path: mobSnapPath });
  console.log(`Saved screenshot: 10_mobile_390x844_overview.png`);

  await mobileContext.close();
  await browser.close();

  // 4. BUNDLE SIZE INSPECTION
  console.log('\n--- 4. Bundle Size & Production Chunks Breakdown ---');
  const distDir = path.resolve('dist/assets');
  let bundleStats = [];
  if (fs.existsSync(distDir)) {
    const files = fs.readdirSync(distDir);
    for (const f of files) {
      const fp = path.join(distDir, f);
      const st = fs.statSync(fp);
      bundleStats.push({
        file: f,
        sizeKB: +(st.size / 1024).toFixed(2),
        type: f.endsWith('.js') ? 'JavaScript' : (f.endsWith('.css') ? 'CSS' : 'Asset')
      });
    }
  }

  const finalReport = {
    timestamp: new Date().toISOString(),
    navTiming,
    desktopMetrics,
    mobileMetrics,
    bundleStats
  };

  const reportPath = path.resolve('scripts/baseline_metrics.json');
  fs.writeFileSync(reportPath, JSON.stringify(finalReport, null, 2));
  console.log(`\nBaseline report written to ${reportPath}`);
}

run().catch(err => {
  console.error('Benchmark execution error:', err);
  process.exit(1);
});
