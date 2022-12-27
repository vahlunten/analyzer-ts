import { FingerprintGenerator } from 'fingerprint-generator';
import { FingerprintInjector } from 'fingerprint-injector';
import { Browser, BrowserContext, chromium, Page, Response } from 'playwright';
import { interceptRequests, onResponse } from '../parsing/XHR/XHRRequests';
import { parseHtml } from '../parsing/htmlParser';
import { ScrapedData, NormalizedKeywordPair, ParsedRequestResponse } from '../types';
import { scrapeWindowProperties } from "../parsing/window-properties";

import Apify from 'apify';
import { writeFileSync } from 'fs';
const { log } = Apify.utils;


export class PlaywrightScraper {

    requests: ParsedRequestResponse[] = [];
    scrapedData: ScrapedData;
    url: string;
    keywords: NormalizedKeywordPair[];

    constructor(url: string, keywords: NormalizedKeywordPair[]) {
        this.url = url;
        this.keywords = keywords;
        this.scrapedData = new ScrapedData();

    }
    /**
     * Open the browser, open new tab, navigate to the page and scrape and parse all the necessary data from the analyzed web page
     * @param useApifyProxy If true, actor will try to use Apify proxy.
     * @param generateFingeprint If true, custom fingerprint will be generated. Some values of chromium/playwright fingerprint are overridden by default.  
     * @returns 
     */
    async scrapePage(useApifyProxy = true, generateFingeprint = true): Promise<ScrapedData> {

        // opens browser and a new tab 
        const browserContext = await this.openBrowser(useApifyProxy, generateFingeprint);

        // navigates to the analyzed url 
        const { responseStatus, initialResponseBody } = await this.openPage(this.url, browserContext);
        this.scrapedData.responseStatus = responseStatus;


        // scrape and parse html, jsonld, schema, metadata
        // window properties are scraped on "domContentLoaded" event
        this.scrapedData.initial = parseHtml(initialResponseBody);

        // xhr requests are parsed  on "response" event and added to this.request object
        this.scrapedData.xhrParsed = this.requests;
        return this.scrapedData;

    }

    /**
     * 
     * @param useApifyProxy If true, actor will try to use Apify proxy.
     * @param generateFingeprint If true, custom fingerprint will be generated. Some values of chromium/playwright fingerprint are overridden by default.  
     * @returns 
     */
    async openBrowser(useApifyProxy: boolean, generateFingeprint: boolean): Promise<BrowserContext> {

        let proxyConfiguration = null;
        if (useApifyProxy) {
            if (process.env.APIFY_PROXY_PASSWORD) {
                proxyConfiguration = {
                    server: 'http://proxy.apify.com:8000',
                    username: 'auto',
                    password: process.env.APIFY_PROXY_PASSWORD
                }
            }
        }
        // open chromium browser
        const browser = await chromium.launch({
            headless: false,
            proxy: proxyConfiguration ?? undefined,
            devtools: true

        });

        // open new tab
        const browserContext = this.createLaunchContext(browser, generateFingeprint);
        return browserContext;

    }
    /**
     * Navigates to the input url.
     * @param url 
     * @param browserContext Browser context is equivalent of a browser tab.
     * @returns Initial response and initial response status. 
     */
    async openPage(url: string, browserContext: BrowserContext): Promise<{ responseStatus: number, initialResponseBody: string }> {
        // open new tab
        const page = await browserContext.newPage();
        // register hooks to intercept requests and capture their responses
        this.hookEvents(page);

        // navigate to the page and wait until no new network requests are made for 500 ms
        const initialResponse = await page.goto(url, { waitUntil: 'networkidle', timeout: 50000 });
        const bodyBuffer = await initialResponse?.body();
        const responseBody = bodyBuffer?.toString() ?? '';
        await page.waitForTimeout(10000);
        await this.getContent(page);
        // save the value of initial response
        // TODO: handle redirects
        await Apify.setValue("initial", responseBody, { contentType: 'text/html; charset=utf-8' });
        return { responseStatus: initialResponse!.status(), initialResponseBody: responseBody };
    }

    /**
     *  This function is equivalent of opening a new tab. 
     * @param browser Browser reference. 
     * @param generateFingerprint If true, custom fingerprint will be generated. Some values of chromium/playwright fingerprint are overridden by default.  
     * @returns Reference to the newly created tab.
     */
    async createLaunchContext(browser: Browser, generateFingerprint: boolean): Promise<BrowserContext> {

        const fingerprintGenerator = new FingerprintGenerator({
            browsers: [
                "chrome",
                "safari",
                "firefox",
                "edge"
            ],
            devices: [
                "desktop"
            ],
            operatingSystems: [
                "windows"
            ]
        });

        const fingerprint = fingerprintGenerator.getFingerprint();
        const headers = fingerprint.headers as { [key: string]: string };
        Object.keys(headers).forEach(h => { console.log(`Header: ${h}, value: ${headers[h]}`) });

        const context = await browser.newContext({
            userAgent: fingerprint.fingerprint.navigator.userAgent,
            locale: fingerprint.fingerprint.navigator.language,
            viewport: fingerprint.fingerprint.screen
        });

        if (generateFingerprint) {
            const fingerprintInjector = new FingerprintInjector();
            await fingerprintInjector.attachFingerprintToPlaywright(context, fingerprint);
        }

        return context;
    }
    /**
     * 
     * @param page Controller of a newly created tab.
     * @param saveBandwith If true, actor will intercept and abort the requests for resources like images and css. 
     */
    hookEvents(page: Page, saveBandwith: boolean = false) {

        if (saveBandwith) {
            page.route("**", (route, request) => interceptRequests(route, request, saveBandwith));
        }

        page.on("response", async (response: Response) => await onResponse(this.requests, response));

        // page.on('domcontentloaded', (page: Page) => this.onDomContentLoaded(page));
    }




    async getContent(page: Page) {
        const domContent = await page.content();
        this.scrapedData.cookies = await page.context().cookies();
        this.scrapedData.DOM = parseHtml(domContent);

        await Apify.setValue("rendered", domContent!, { contentType: 'text/html; charset=utf-8' });

        // screenshot wll be displayed in the actor's UI on Apify platform. 
        // it is good for quick visual check, whether the analysis was sucessful
        // often, we can get blocked by for example cloudflare bot protection
        // it is easy for a human to visually tell, wether the page was navigated sucessfully
        const screenshot = await page.screenshot();
        await Apify.setValue("screenshot", screenshot, { contentType: 'image/jpeg' });

        // this will execute javascript **in the browser** and parse window properties
        const windowObject = await scrapeWindowProperties(page);
        this.scrapedData.allWindowProperties = windowObject;

        // await page.pause();
        this.scrapedData.scrapingFinished = true;
    }
}