const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');
const fs = require('fs');
require('dotenv').config({ path: './cookies.env' });

(async () => {
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath || '/usr/bin/chromium-browser',
    headless: chromium.headless,
    defaultViewport: chromium.defaultViewport,
  });

  const page = await browser.newPage();

  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
  });

  await page.setCookie({
    name: 'li_at',
    value: process.env.LINKEDIN_COOKIE.split('=')[1].replace(';', ''),
    domain: '.linkedin.com',
    path: '/',
    httpOnly: true,
    secure: true,
  });

  const profileUrl = "https://www.linkedin.com/in/mat%C3%ADas-gonz%C3%A1lez-aa5b4091/";

  await page.goto(profileUrl, { timeout: 0, waitUntil: 'networkidle2' });
  await new Promise(resolve => setTimeout(resolve, 8000)); // ندي فرصة لتحميل الصفحة كاملة

  const peopleAlsoViewed = await page.evaluate(() => {
    const links = [];
    const elements = document.querySelectorAll('section a[href*="/in/"]');
    elements.forEach(el => {
      const name = el.innerText.trim();
      const href = el.href;
      if (name && href) {
        links.push({ name, url: href });
      }
    });
    return links;
  });

  fs.writeFileSync('peopleAlsoViewed.json', JSON.stringify(peopleAlsoViewed, null, 2));
  console.log("✅ Extracted", peopleAlsoViewed.length, "profiles.");

  await browser.close();
})();
