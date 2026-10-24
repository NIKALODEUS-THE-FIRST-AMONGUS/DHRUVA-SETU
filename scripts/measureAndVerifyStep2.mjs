import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const baseDir = path.resolve('scripts/shots/baseline_step0');
const optDir = path.resolve('scripts/shots/optimized_step1');
const diffDir = path.resolve('scripts/shots/diff_step2');

[optDir, diffDir].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

async function measureFpsAndRender(page, durationMs = 5000) {
  return await page.evaluate(async (ms) => {
    const canvas = document.querySelector('canvas');
    let renderer = window.__renderer || window.__debug?.renderer || null;
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
              break;
            }
            hook = hook.next;
          }
        }
        if (renderer) break;
        cur = cur.return;
      }
    }

    const frameTimes = [];
    const callsList = [];
    const trianglesList = [];
    let lastTime = performance.now();

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

    const validFrames = frameTimes.slice(5);
    const sorted = [...validFrames].sort((a, b) => a - b);
    const avgDelta = validFrames.reduce((a, b) => a + b, 0) / validFrames.length;
    const avgFps = 1000 / avgDelta;

    const p99Index = Math.floor(sorted.length * 0.99);
    const p99Delta = sorted[p99Index] || sorted[sorted.length - 1];
    const fps1PercentLow = 1000 / p99Delta;

    const maxDelta = sorted[sorted.length - 1];
    const minDelta = sorted[0];

    const variance = validFrames.reduce((acc, v) => acc + Math.pow(v - avgDelta, 2), 0) / validFrames.length;
    const stdDev = Math.sqrt(variance);

    const validCalls = callsList.filter(c => c > 0);
    const avgCalls = validCalls.length > 0 ? validCalls.reduce((a, b) => a + b, 0) / validCalls.length : sceneCalls;
    const validTris = trianglesList.filter(t => t > 0);
    const avgTris = validTris.length > 0 ? validTris.reduce((a, b) => a + b, 0) / validTris.length : sceneTriangles;

    const mem = renderer ? renderer.info.memory : {};
    const programsCount = renderer?.info?.programs ? renderer.info.programs.length : 0;

    const heap = performance.memory ? {
      usedJSHeapSizeMB: +(performance.memory.usedJSHeapSize / 1048576).toFixed(2),
      totalJSHeapSizeMB: +(performance.memory.totalJSHeapSize / 1048576).toFixed(2),
      jsHeapSizeLimitMB: +(performance.memory.jsHeapSizeLimit / 1048576).toFixed(2)
    } : null;

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
  console.log('=== Dhruva Setu Simulator: Phase 1 Step 2 Verification Benchmark ===\n');

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
  console.log('--- 1. Measuring Optimized Desktop Performance (1920x1080, DPR 1.0) ---');
  const desktopContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1
  });
  const desktopPage = await desktopContext.newPage();

  const navStart = Date.now();
  await desktopPage.goto('http://localhost:3000/?testMode=true', { waitUntil: 'domcontentloaded' });
  const dclTime = Date.now() - navStart;
  await desktopPage.waitForTimeout(2000);

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
  console.log('Optimized Desktop Metrics:', JSON.stringify(desktopMetrics, null, 2));

  // 2. CAPTURE AFTER SCREENSHOTS (11 ANGLES/MODES)
  console.log('\n--- 2. Capturing Optimized Screenshots for Pixel Comparison ---');
  async function snap(name, delay = 2000) {
    await desktopPage.waitForTimeout(delay);
    const p = path.join(optDir, `${name}.png`);
    await desktopPage.screenshot({ path: p });
    console.log(`Saved screenshot: ${name}.png`);
  }

  // Freeze time during angle capture to ensure deterministic wave/sun matching
  await desktopPage.evaluate(() => {
    if (window.__debug && window.__debug.freezeTime) window.__debug.freezeTime(12.0);
  });

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

  // 3. NUMERICAL PHYSICS CONSISTENCY CHECK
  console.log('\n--- 3. Numerical Physics Consistency Check ---');
  await desktopPage.evaluate(() => {
    if (window.__debug && window.__debug.unfreezeTime) window.__debug.unfreezeTime();
    if (window.__debug && window.__debug.setSeed) window.__debug.setSeed(26065);
    if (window.__debug && window.__debug.setWinchDepth) window.__debug.setWinchDepth(25.0);
  });

  // Run simulation deterministically for 3 seconds
  await desktopPage.waitForTimeout(3000);

  const physicsTelemetry = await desktopPage.evaluate(() => {
    if (window.__debug && window.__debug.getPositions) return window.__debug.getPositions();
    const canvas = document.querySelector('canvas');
    if (!canvas) return null;
    const parent = canvas.parentElement;
    const fiberKey = Object.keys(parent).find(k => k.startsWith('__reactFiber'));
    let cur = parent[fiberKey];
    let buoy = null;
    let ctd = null;
    while (cur) {
      if (cur.memoizedState) {
        let hook = cur.memoizedState;
        while (hook) {
          if (hook.memoizedState && hook.memoizedState.current) {
            if (hook.memoizedState.current.buoy) buoy = hook.memoizedState.current.buoy;
            if (hook.memoizedState.current.ctd) ctd = hook.memoizedState.current.ctd;
          }
          hook = hook.next;
        }
      }
      if (buoy && ctd) break;
      cur = cur.return;
    }

    if (!buoy || !ctd) return null;
    return {
      buoyPosition: {
        x: +buoy.buoyRoot.position.x.toFixed(4),
        y: +buoy.buoyRoot.position.y.toFixed(4),
        z: +buoy.buoyRoot.position.z.toFixed(4)
      },
      buoyRotation: {
        pitchRad: +buoy.buoyRoot.rotation.x.toFixed(4),
        rollRad: +buoy.buoyRoot.rotation.z.toFixed(4),
        yawRad: +buoy.buoyRoot.rotation.y.toFixed(4)
      },
      ctdDepthMeters: +Math.abs(ctd.sondeGroup.position.y).toFixed(3),
      ctdPosition: {
        x: +ctd.sondeGroup.position.x.toFixed(4),
        y: +ctd.sondeGroup.position.y.toFixed(4),
        z: +ctd.sondeGroup.position.z.toFixed(4)
      }
    };
  });
  console.log('Physics Telemetry:', JSON.stringify(physicsTelemetry, null, 2));

  await desktopContext.close();

  // 4. MOBILE EMULATION BENCHMARK (390x844, DPR 2.0)
  console.log('\n--- 4. Measuring Optimized Mobile Emulation (390x844, DPR 2.0) ---');
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
  console.log('Optimized Mobile Metrics:', JSON.stringify(mobileMetrics, null, 2));

  // Mobile screenshot
  const mobSnapPath = path.join(optDir, '10_mobile_390x844_overview.png');
  await mobilePage.screenshot({ path: mobSnapPath });
  console.log(`Saved screenshot: 10_mobile_390x844_overview.png`);

  await mobileContext.close();

  // 5. PIXEL DIFF CALCULATOR
  console.log('\n--- 5. Computing Exact Pixel Diff % per View vs Baseline ---');
  const diffPage = await browser.newPage();
  const diffResults = {};

  const shotNames = [
    '01_cam01_panoramic_vista',
    '02_cam02_spar_buoy',
    '03_cam03_antenna_solar_mast',
    '04_cam04_avionics_battery_rack',
    '05_cam05_winch_keel',
    '06_cam06_ctd_profiler',
    '07_cam08_benthic_anchor',
    '08_cam07_seal_pod',
    '09_station_bharati',
    '10_mobile_390x844_overview',
    '11_component_inspection_hover'
  ];

  for (const name of shotNames) {
    const baseFile = path.join(baseDir, `${name}.png`);
    const optFile = path.join(optDir, `${name}.png`);
    if (fs.existsSync(baseFile) && fs.existsSync(optFile)) {
      const baseB64 = fs.readFileSync(baseFile).toString('base64');
      const optB64 = fs.readFileSync(optFile).toString('base64');

      const comparison = await diffPage.evaluate(async ({ b64A, b64B }) => {
        function loadImage(src) {
          return new Promise(res => {
            const img = new Image();
            img.onload = () => res(img);
            img.src = 'data:image/png;base64,' + src;
          });
        }
        const imgA = await loadImage(b64A);
        const imgB = await loadImage(b64B);

        const w = imgA.width;
        const h = imgA.height;
        const canvasA = document.createElement('canvas');
        canvasA.width = w; canvasA.height = h;
        const ctxA = canvasA.getContext('2d');
        ctxA.drawImage(imgA, 0, 0);
        const dataA = ctxA.getImageData(0, 0, w, h).data;

        const canvasB = document.createElement('canvas');
        canvasB.width = w; canvasB.height = h;
        const ctxB = canvasB.getContext('2d');
        ctxB.drawImage(imgB, 0, 0);
        const dataB = ctxB.getImageData(0, 0, w, h).data;

        let diffPixels = 0;
        const totalPixels = w * h;
        let sumSquaredError = 0;

        for (let i = 0; i < dataA.length; i += 4) {
          const dr = Math.abs(dataA[i] - dataB[i]);
          const dg = Math.abs(dataA[i + 1] - dataB[i + 1]);
          const db = Math.abs(dataA[i + 2] - dataB[i + 2]);
          const maxDelta = Math.max(dr, dg, db);
          // Threshold of 3 to ignore subpixel rasterization jitter
          if (maxDelta > 3) {
            diffPixels++;
          }
          sumSquaredError += (dr * dr + dg * dg + db * db) / 3;
        }

        const mse = sumSquaredError / totalPixels;
        const psnr = mse > 0 ? 10 * Math.log10((255 * 255) / mse) : 99.0;
        const diffPercent = (diffPixels / totalPixels) * 100;

        return {
          totalPixels,
          diffPixels,
          diffPercent: +diffPercent.toFixed(2),
          psnr: +psnr.toFixed(1),
          mse: +mse.toFixed(2)
        };
      }, { b64A: baseB64, b64B: optB64 });

      diffResults[name] = comparison;
      console.log(`View ${name}: Diff = ${comparison.diffPercent}%, PSNR = ${comparison.psnr} dB`);
    }
  }

  await browser.close();

  // Save all benchmark data
  const finalSummary = {
    timestamp: new Date().toISOString(),
    desktop: {
      navigation: navTiming,
      metrics: desktopMetrics
    },
    mobile: {
      metrics: mobileMetrics
    },
    physics: physicsTelemetry,
    diffResults
  };

  fs.writeFileSync('scripts/optimized_metrics.json', JSON.stringify(finalSummary, null, 2));
  console.log('\nAll optimized metrics saved to scripts/optimized_metrics.json!');
}

run().catch(console.error);
