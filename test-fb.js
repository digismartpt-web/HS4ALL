const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    page.on('requestfailed', request => {
        console.log(`[FAILED] ${request.url()} - ${request.failure()?.errorText}`);
    });

    page.on('response', response => {
        if (!response.ok()) {
            console.log(`[HTTP ${response.status()}] ${response.url()}`);
        }
    });

    try {
        console.log("Navigating to http://localhost:3000 ...");
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });

        await new Promise(r => setTimeout(r, 6000));
    } catch (e) {
        console.error("Puppeteer error:", e);
    } finally {
        await browser.close();
    }
})();
