import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const auditDir = path.resolve('scripts/shots/audit_phase2');
if (!fs.existsSync(auditDir)) fs.mkdirSync(auditDir, { recursive: true });

const viewports = [
  { id: 'VP-360x640', name: 'Galaxy S8 / Small Android', width: 360, height: 640, isMobile: true, dpr: 2 },
  { id: 'VP-390x844', name: 'iPhone 12/13/14 Portrait', width: 390, height: 844, isMobile: true, dpr: 3 },
  { id: 'VP-412x915', name: 'Pixel 7 / Android Large', width: 412, height: 915, isMobile: true, dpr: 2.625 },
  { id: 'VP-768x1024', name: 'iPad Portrait', width: 768, height: 1024, isMobile: true, dpr: 2 },
  { id: 'VP-1024x768', name: 'iPad Landscape', width: 1024, height: 768, isMobile: false, dpr: 2 },
  { id: 'VP-1366x768', name: 'Standard Laptop', width: 1366, height: 768, isMobile: false, dpr: 1 },
  { id: 'VP-1920x1080', name: 'Full HD Desktop', width: 1920, height: 1080, isMobile: false, dpr: 1 },
  { id: 'VP-844x390', name: 'iPhone Landscape', width: 844, height: 390, isMobile: true, dpr: 3 }
];

async function auditViewport(browser, vp) {
  console.log(`Auditing ${vp.id} (${vp.name}) [${vp.width}x${vp.height}]...`);
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.dpr,
    isMobile: vp.isMobile,
    hasTouch: vp.isMobile
  });

  const page = await context.newPage();
  await page.goto('http://localhost:3000/?testMode=true', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Take screenshot
  const shotPath = path.join(auditDir, `${vp.id}.png`);
  await page.screenshot({ path: shotPath });

  const auditData = await page.evaluate((vpInfo) => {
    const docWidth = document.documentElement.scrollWidth;
    const winWidth = window.innerWidth;
    const hasHorizontalOverflow = docWidth > winWidth + 1; // 1px threshold for fractional rounding

    // Find all interactive elements & check touch target sizes (<44px)
    const interactives = Array.from(document.querySelectorAll('button, a, input, select, [role="button"]'));
    const smallTouchTargets = [];

    interactives.forEach(el => {
      const rect = el.getBoundingClientRect();
      // Only check visible elements
      if (rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth) {
        if (rect.width < 44 || rect.height < 44) {
          const id = el.id || el.className || el.textContent.trim().slice(0, 15) || 'unnamed';
          smallTouchTargets.push({
            tag: el.tagName,
            id: String(id).slice(0, 30),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            text: el.textContent.trim().slice(0, 20)
          });
        }
      }
    });

    // Check tiny typography (< 12px)
    const allElements = Array.from(document.querySelectorAll('p, span, div, h1, h2, h3, h4, button, label'));
    const tinyTexts = [];
    allElements.forEach(el => {
      if (el.children.length === 0 && el.textContent.trim().length > 0) {
        const style = window.getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize);
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && fontSize < 11.5) {
          tinyTexts.push({
            text: el.textContent.trim().slice(0, 25),
            fontSize: Math.round(fontSize * 10) / 10,
            parent: el.parentElement?.className || el.parentElement?.id || 'unknown'
          });
        }
      }
    });

    // Check overlapping fixed / absolute UI panels
    const panels = [
      { name: 'TopBar', el: document.querySelector('.top-bar-container, .top-bar, nav') },
      { name: 'ControlDeck', el: document.querySelector('.unified-deck-wrapper, .unified-control-deck, #unified-control-deck') },
      { name: 'DriftHUD', el: document.querySelector('#current-drift-hud') },
      { name: 'PartInspector', el: document.querySelector('#part-inspector-container, .part-inspector-container') }
    ].filter(p => p.el !== null);

    const panelOverlaps = [];
    for (let i = 0; i < panels.length; i++) {
      for (let j = i + 1; j < panels.length; j++) {
        const rA = panels[i].el.getBoundingClientRect();
        const rB = panels[j].el.getBoundingClientRect();
        const isOverlap = !(rA.right < rB.left || rA.left > rB.right || rA.bottom < rB.top || rA.top > rB.bottom);
        if (isOverlap && rA.width > 0 && rB.width > 0) {
          panelOverlaps.push({
            panelA: panels[i].name,
            panelB: panels[j].name
          });
        }
      }
    }

    // Check 3D Canvas obstruction ratio
    const controlDeckRect = document.querySelector('.unified-deck-wrapper, .unified-control-deck, #unified-control-deck')?.getBoundingClientRect();
    const controlDeckHeight = controlDeckRect ? controlDeckRect.height : 0;
    const viewportCoverage = Math.round((controlDeckHeight / window.innerHeight) * 100);

    return {
      viewport: vpInfo,
      docWidth,
      winWidth,
      hasHorizontalOverflow,
      overflowDelta: docWidth - winWidth,
      smallTouchTargetsCount: smallTouchTargets.length,
      sampleSmallTargets: smallTouchTargets.slice(0, 8),
      tinyTextsCount: tinyTexts.length,
      sampleTinyTexts: tinyTexts.slice(0, 6),
      panelOverlaps,
      controlDeckCoveragePercent: viewportCoverage
    };
  }, vp);

  await context.close();
  return auditData;
}

async function run() {
  console.log('=== Dhruva Setu Simulator: Comprehensive Phase 2 UI/UX Audit ===\n');

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-web-security']
  });

  const allAudits = [];
  for (const vp of viewports) {
    const res = await auditViewport(browser, vp);
    allAudits.push(res);
  }

  await browser.close();

  fs.writeFileSync('scripts/ui_audit_results.json', JSON.stringify(allAudits, null, 2));
  console.log('\nAudit complete! Saved to scripts/ui_audit_results.json');
}

run().catch(console.error);
