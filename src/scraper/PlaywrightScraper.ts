import { FingerprintGenerator } from 'fingerprint-generator';
import { FingerprintInjector } from 'fingerprint-injector';
import { Browser, BrowserContext, chromium, Page, Request, Response } from 'playwright';
import { ScrapedDataClass } from "../types";
import { interceptRequests, onResponse } from '../parsing/XHR/XHRRequests';

import cheerio from 'cheerio';
import Apify from 'apify';
import { NormalizedKeywordPair, ParsedRequestResponse } from '../types';
import { parseHtml } from '../parsing/htmlParser';


const { log } = Apify.utils;



export class PlaywrightScraper {

    requests: ParsedRequestResponse[] = [];
    scrapedData: ScrapedDataClass;

    url: string;
    keywords: NormalizedKeywordPair[];

    constructor(url: string, keywords: NormalizedKeywordPair[]) {
        log.debug("Hello from playwright controller constructor.");
        this.url = url;
        this.keywords = keywords;
        this.scrapedData = new ScrapedDataClass();
        
    }

    async scrapePage(useApifyProxy = true, generateFingeprint = false): Promise<ScrapedDataClass> {

        const browserContext = await this.openBrowser(useApifyProxy, generateFingeprint);
        const { responseStatus, initialResponseBody } = await this.openPage(this.url, browserContext);

        
        // scrape initial response
        this.scrapedData.responseStatus = responseStatus;
        // this.scrapedData.initialResponseBody = initialResponseBody;
        // this.parseInitialHtml(this.scrapedData.initialResponseBody);
        this.scrapedData.initial = parseHtml(initialResponseBody);
        this.scrapedData.xhrParsed = this.requests;
        return this.scrapedData;

    }

    
    
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
        const browser = await chromium.launch({
            headless: false,
            proxy: proxyConfiguration ?? undefined
        });
        const browserContext = this.createLaunchContext(browser, generateFingeprint);
        return browserContext;

    }
    async openPage(url: string, browserContext: BrowserContext): Promise<{ responseStatus: number, initialResponseBody: string }> {
        const page = await browserContext.newPage();

        this.hookEvents(page);
        const initialResponse = await page.goto(url, { waitUntil: 'networkidle' });
        const bodyBuffer = await initialResponse?.body();
        const responseBody = bodyBuffer?.toString() ?? '';;

        await Apify.setValue("initial", responseBody, { contentType: 'text/html; charset=utf-8' });
        // await page.pause();
        return { responseStatus: 200, initialResponseBody: responseBody };
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

    hookEvents(page: Page, saveBandwith: boolean = false) {
      
        if (saveBandwith) {
            page.route("**", (route, request) => interceptRequests(route, request, saveBandwith));
        }

        page.on("response", async (response: Response) => await onResponse(this.requests, response));
        

        page.on('domcontentloaded', (page: Page) => this.onDomContentLoaded(page));
    }

    async onDomContentLoaded(page:Page) {

        const domContent = await page.content();
        // this.scrapedData.domContent = domContent;
        this.scrapedData.cookies = await page.context().cookies();
        this.scrapedData.DOM = parseHtml(domContent);

        await Apify.setValue("domContent", domContent!, { contentType: 'text/html; charset=utf-8' });
        const ss = await page.screenshot();
        await Apify.setValue("screenshot", ss, { contentType:'image/jpeg'});



    }
}