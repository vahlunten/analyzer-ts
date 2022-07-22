import { HttpRequestMethods } from "../helpers/HttpRequestMethods";
import { FingerprintGenerator } from 'fingerprint-generator';
import { FingerprintInjector } from 'fingerprint-injector';
import { Browser, BrowserContext, chromium, LaunchOptions } from 'playwright';

// const Apify = require('apify');
// const { playwright } = Apify.utils;

export class PlaywrightController {

    readonly DEFAULT_REQUEST_METHOD = HttpRequestMethods.GET;

    constructor() {

        console.log("Hello from playwright controller constructor.")
    }

    async openBrowser(useApifyProxy: boolean, generateFingeprint: boolean) {

        const browser = await chromium.launch({ headless: false });
        const browserContext = await this.createLaunchContext(browser, generateFingeprint);

        // const fingerprintGenerator = new FingerprintGenerator();
        // const fingerprintInjector = new FingerprintInjector();

        // const fingerprint = fingerprintGenerator.getFingerprint();
        // await fingerprintInjector.attachFingerprintToPlaywright(ctx, fingerprint);

        // ...and enjoy your undercover browser while using the browser context as usual!
        // const page = await ctx.newPage();
        // await page.goto("http://wayfair.com");
        // await page.pause();

        const page = await browserContext.newPage();
        await page.goto('http://www.amiunique.org');
        

    }

    async createLaunchContext(browser: Browser, generateFingerprint: boolean): Promise<BrowserContext> {

        const fingerprintGenerator = new FingerprintGenerator({
            devices: ['desktop']
        });

        const fingerprint = fingerprintGenerator.getFingerprint();
        const context = await browser.newContext({
            userAgent: fingerprint.fingerprint.navigator.userAgent,
            locale: fingerprint.fingerprint.navigator.language
        });

        if (generateFingerprint) {
            const fingerprintInjector = new FingerprintInjector();
            await fingerprintInjector.attachFingerprintToPlaywright(context, fingerprint);
        }

        return context;
    }
}