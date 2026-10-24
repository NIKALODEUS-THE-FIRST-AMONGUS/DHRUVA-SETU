import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/?testMode=true', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const res = await page.evaluate(() => {
    // Traverse React fiber from canvas parent
    const canvas = document.querySelector('canvas');
    if (!canvas) return { error: 'No canvas found' };
    const parent = canvas.parentElement;
    const fiberKey = Object.keys(parent).find(k => k.startsWith('__reactFiber'));
    if (!fiberKey) return { error: 'No fiber key on parent' };
    let cur = parent[fiberKey];
    let foundRenderer = null;
    while (cur) {
      if (cur.memoizedState) {
        // check hooks linked list
        let hook = cur.memoizedState;
        while (hook) {
          if (hook.memoizedState && hook.memoizedState.current && hook.memoizedState.current.renderer) {
            foundRenderer = hook.memoizedState.current.renderer;
            break;
          }
          hook = hook.next;
        }
      }
      if (foundRenderer) break;
      cur = cur.return;
    }

    if (foundRenderer) {
      return {
        memory: foundRenderer.info.memory,
        render: foundRenderer.info.render,
        programs: foundRenderer.info.programs ? foundRenderer.info.programs.length : null
      };
    }
    return { error: 'Renderer not found in fiber' };
  });

  console.log('FIBER RESULT:', res);
  await browser.close();
}

test().catch(console.error);
