import { FingerprintGenerator } from 'fingerprint-generator';
import { FingerprintInjector } from 'fingerprint-injector';
import { Browser, BrowserContext, chromium, Page, Request, Response } from 'playwright';
import { logObject } from "../helpers/helperFunctions";
import { ScrapedData } from './ScrapedData';
import { interceptRequests, onResponse } from './XHR/XHRRequests';
import { parseJsonLD } from './parse/json-ld';
import { parseMetadata } from './parse/meta';
import { parseSchemaOrgData } from "./parse/schema-org";
import cheerio from 'cheerio';
import Apify from 'apify';


export class PlaywrightScraper {

    requests: Array<Request> = [];
    scrapedData: ScrapedData = {} as ScrapedData;

    constructor() {
        console.log("Hello from playwright controller constructor.")
    }

    async scrapePage(url: string, keywords: Array<String>, useApifyProxy = true, generateFingeprint = false): Promise<ScrapedData> {

        const browserContext = await this.openBrowser(useApifyProxy, generateFingeprint);
        const { responseStatus, initialResponseBody } = await this.openPage(url, browserContext);

        
        this.scrapedData.responseStatus = responseStatus;
        this.scrapedData.initialResponseBody = initialResponseBody;
        this.parseHtml(this.scrapedData.initialResponseBody);
        logObject(keywords);
        return this.scrapedData;

    }

    async parseHtml(html: string) {
        const $ = cheerio.load(html);
        this.scrapedData.jsonLDData = parseJsonLD($);
        this.scrapedData.metadata = parseMetadata($);
        parseSchemaOrgData($);
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

    hookEvents(page: Page, saveBandwith: boolean = true) {
      
        if (saveBandwith) {
            page.route("**", (route, request) => interceptRequests(route, request));
        }

        page.on("response", (response: Response) => onResponse(response));
        

        page.on('domcontentloaded', (page: Page) => this.onDomContentLoaded(page));
    }

    async onDomContentLoaded(page:Page) {
        this.scrapedData.domContent = await page.content();
        await Apify.setValue("domContent", this.scrapedData.domContent!, { contentType: 'text/html; charset=utf-8' });

    }
}