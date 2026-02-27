const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    page.on('console', msg => console.log('Log:', msg.text()));

    try {
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });

        const testResult = await page.evaluate(() => {
            const hasSimple = !!window.simpleSoundManager;
            const hasMain = !!window.soundManager;

            // Try injecting
            if (hasMain) {
                window.soundManager.injectCustomAudio('test-sound', 'data:audio/mp3;base64,1234');
            }
            if (hasSimple) {
                window.updateSimpleSoundManager('test-sound', 'data:audio/mp3;base64,1234');
            }

            return {
                hasSimple,
                hasMain,
                mainInjected: hasMain && !!window.soundManager.sounds['test-sound'],
                simpleInjected: hasSimple && !!window.simpleSoundManager.sounds['test-sound']
            };
        });

        console.log("Injection Test Results:", testResult);
    } catch (e) {
        console.error("Test failed", e);
    } finally {
        await browser.close();
    }
})();
