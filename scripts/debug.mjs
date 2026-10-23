import { chromium } from 'playwright';

async function check() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message, err.stack));
  
  console.log('Navigating to http://localhost:3000/ ...');
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise(r => setTimeout(r, 4000));
  
  const deck = await page.$('.unified-deck-wrapper');
  console.log('Deck element found:', !!deck);
  if (deck) {
    const box = await deck.boundingBox();
    const visible = await deck.isVisible();
    console.log('Deck isVisible:', visible, 'boundingBox:', box);
    const classes = await page.evaluate(el => el.className, deck);
    console.log('Deck classes:', classes);
  } else {
    const root = await page.$eval('#root', el => el.innerHTML);
    console.log('Root innerHTML snippet:', root.slice(0, 1000));
  }
  await browser.close();
}

check().catch(console.error);
