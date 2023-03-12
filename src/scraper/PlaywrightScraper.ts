import { FingerprintGenerator } from 'fingerprint-generator';
import { FingerprintInjector } from 'fingerprint-injector';
import { Browser, BrowserContext, chromium, Page, Response, Route } from 'playwright';
import playwright from 'playwright';

import { parseResponse } from '../parsing/XHRRequests';
import { parseHtml } from '../parsing/htmlParser';
import { ScrapedData, NormalizedKeywordPair, ParsedRequestResponse } from '../types';
import { scrapeWindowProperties } from "../parsing/window-properties";
import { KeyValueStore, log } from '@crawlee/core';
import { prettyPrint } from "html";
import { Request } from "playwright";
import { Actor } from 'apify';
import { PlaywrightProxyConfiguration } from '../helpers/proxy';



export class PlaywrightScraper {

    initialResponse: ParsedRequestResponse | null = null;
    requests: ParsedRequestResponse[] = [];
    // scrapedData: ScrapedData;
    url: string;
    keywords: NormalizedKeywordPair[];
    browserContext: BrowserContext | undefined;
    // store: KeyValueStore;

    constructor(url: string, keywords: NormalizedKeywordPair[]) {
        this.url = url;
        this.keywords = keywords;
        // this.scrapedData = new ScrapedData();
        // this.store = store;

    }
    // TODO: JSDoc
    /**
     * Open the browser, open new tab, navigate to the page and scrape and parse all the necessary data from the analyzed web page
     * @param generateFingeprint If true, custom fingerprint will be generated. Some values of chromium/playwright fingerprint are overridden by default.  
     * @returns 
     */
    async scrapePage(proxyConf: PlaywrightProxyConfiguration | undefined, generateFingeprint = true): Promise<ScrapedData> {

        // opens browser and a new tab 
        this.browserContext = await this.openBrowser(proxyConf, generateFingeprint);

        // navigates to the analyzed url 
        const { page, responseStatus, initialResponseBody, initialLoaded, navigated } = await this.openPage(this.url, this.browserContext);

        let scrapedData = new ScrapedData();
        let domContent: string = "";
        scrapedData.responseStatus = responseStatus;
        scrapedData.navigated = navigated;
        scrapedData.initialLoaded = initialLoaded;

        if (initialLoaded) {
            try {
                domContent = await page.content();
                scrapedData.DOM = parseHtml(domContent);
                // save the rendered HTML document
                await KeyValueStore.setValue("rendered", prettyPrint(domContent, { indent_size: 3 }), { contentType: 'text/html; charset=utf-8' });

            } catch (e: any) {
                log.error("Failed to get page.content()");
                log.error(e);
            }
            try {
                scrapedData.cookies = await page.context().cookies();
            } catch (e: any) {
                log.error("Failed to get page.context().cookies()");
                log.error(e);
            }
            try {
                const screenshot = await page.screenshot();
                await KeyValueStore.setValue("screenshot", screenshot, { contentType: 'image/jpeg' });
            } catch (e: any) {
                log.error("Failed to get a screenshot.");
                log.error(e);
            }
            try {
                // this will execute javascript **in the browser** and parse window properties
                const windowObject = await scrapeWindowProperties(page);
                scrapedData.allWindowProperties = windowObject;
            } catch (e: any) {
                log.error("Failed to scrape window object.");
                log.error(e);
            }
            try {
                // scrape and parse html, jsonld, schema, metadata
                scrapedData.initial = parseHtml(initialResponseBody);
            } catch (e: any) {
                log.error("Failed to parse the initial response.");
                log.error(e);
                scrapedData.scrapingFinished = false;
            }
            try {
                // scrape and parse html, jsonld, schema, metadata
                scrapedData.DOM = parseHtml(domContent);
            } catch (e: any) {
                log.error("Failed to parse the rendered document.");
                log.error(e);
                scrapedData.scrapingFinished = false;
            }
            
            // xhr requests are parsed  on "response" event and added to this.request object
            scrapedData.xhrParsed = this.requests;
            scrapedData.scrapingFinished = true;
        }
        return scrapedData;

    }

    async close() {
        log.info('===================================================================================================================');
        log.info('Closing the browser');
        log.info('===================================================================================================================');
        await this.browserContext?.close();
    }
    /**
     * 
     * @param useApifyProxy If true, actor will try to use Apify proxy.
     * @param generateFingeprint If true, custom fingerprint will be generated. Some values of chromium/playwright fingerprint are overridden by default.  
     * @returns 
     */
    async openBrowser(proxyConf: PlaywrightProxyConfiguration | undefined, generateFingeprint: boolean): Promise<BrowserContext> {
        // open chromium browser
        const browser = await chromium.launch({
            headless: false,
            proxy: proxyConf,
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
    async openPage(url: string, browserContext: BrowserContext): Promise<{ page: Page, responseStatus: number, initialResponseBody: string, initialLoaded: boolean, navigated: boolean }> {
        // open new tab
        const page = await browserContext.newPage();
        // register hooks to intercept requests and capture their responses
        this.hookEvents(page);

        let initialResponse: Response | null = null;
        let responseBody: string = "";
        let responseStatus: number = 0;
        let initialLoaded = false;
        let navigated = false;

        for (let i = 0; i < 5; i++) {
            try {
                log.info(`Navigation to ${url}, attempt number: ${i}.`)
                initialResponse = await page.goto(url);
                if (initialResponse) {
                    initialLoaded = true;
                    log.info(`Initial response of ${url}, successfully retrieved.`);
                    break;
                }
            } catch (e: any) {
                log.error("Page.goto failed.")
                log.error(e);
                // reset the captured requests
                this.requests = [];
            }

        }
        if (initialLoaded) {
            try {
                // console.log(JSON.stringify(await initialResponse?.body()));            
                // networkidle - navigate to the page and wait until no new network requests are made for 500 ms
                await page.waitForLoadState("networkidle", { timeout: 30000 });
                await page.waitForTimeout(6000);
                navigated = true;

            } catch (e: any) {
                navigated = false;
                if (e instanceof playwright.errors.TimeoutError) {
                    log.error("Navigation timed out.");
                    log.error(e.message);
                    if (initialResponse) {
                        log.error("Navigation timed out but the response of the initial request was successfully received, actor will continue but some data might be missing.");
                    }
                } else {
                    log.error("Error during navigation.");
                    log.error(e.message);

                }
            }
            responseBody = (await initialResponse?.body())?.toString() ?? '';
            responseStatus = (await initialResponse?.status() ?? 0);

            // save the value of initial response
            await KeyValueStore.setValue("initial", prettyPrint(responseBody, { indent_size: 3 }), { contentType: 'text/html; charset=utf-8' });
        } else {

        }

        return { page: page, responseStatus: responseStatus, initialResponseBody: responseBody, initialLoaded, navigated };
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
                "windows",
                "macos",
                "linux"
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
            page.route("**", (route, request) => this.interceptRequests(route, request, saveBandwith));
        }

        page.on("response", async (response: Response) => await this.onResponse(this.requests, response, this.url));
        page.on("request", request => this.onRequest(this.url, request));
        page.on("pageerror", (e: Error) => {
            log.error("Page error: ");
            log.error(e.message);
        });
        page.on("crash", (page: Page) => {
            log.debug("Crash error: ");
        });
    }

    interceptRequests(route: Route, request: Request, saveBandwith: boolean) {
        const IGNORED_EXTENSIONS = [".css", ".png", ".jpg", ".jpeg", ".svg", ".gif"];

        if (saveBandwith) {
            const ignore = IGNORED_EXTENSIONS.reduce((ignored, extension) => {
                if (ignored) return ignored;
                return request.url().endsWith(extension);
            }, false);

            if (ignore) {
                route.abort();
                return;
            }
        }

        route.continue();
    }
    async onRequest(initialUrl: string, request: Request) {
        // log.debug(request.url());
        if (request.url() === initialUrl) {
            log.debug("On initial request.");

        }

        // log.debug(request.postData());
    }

    async onResponse(xhrParsed: ParsedRequestResponse[], response: Response, url: string) {

        // console.log(response.url())
        // if reponse is NOT a redirect, parse its content
        // new request will be issued
        if (!(response.status() >= 300 && response.status() <= 399)) {
            const parsed = await parseResponse(response, url);
            xhrParsed.push(parsed);
            // console.log(parsed);
            // console.log(parsed.response.body)
        }

    }

    // async getContent(page: Page) {
    //     const domContent = await page.content();
    //     this.scrapedData.cookies = await page.context().cookies();
    //     this.scrapedData.DOM = parseHtml(domContent);

    //     // save the rendered HTML document
    //     await KeyValueStore.setValue("rendered", prettyPrint(domContent, { indent_size: 3 }), { contentType: 'text/html; charset=utf-8' });
    //     // await this.store.setValue("rendered", prettyPrint(domContent!, { indent_size: 3 }), { contentType: 'text/html; charset=utf-8' });

    //     // screenshot wll be displayed in the actor's UI on Apify platform. 
    //     // it's good for quick visual check, whether the analysis was sucessful
    //     // often, we can get blocked by for example cloudflare bot protection
    //     // it is easy for a human to visually tell, wether the page was navigated sucessfully
    //     const screenshot = await page.screenshot();
    //     await KeyValueStore.setValue("screenshot", screenshot, { contentType: 'image/jpeg' });
    //     // await this.store.setValue("screenshot", screenshot, { contentType: 'image/jpeg' });


    //     // this will execute javascript **in the browser** and parse window properties
    //     const windowObject = await scrapeWindowProperties(page);
    //     this.scrapedData.allWindowProperties = windowObject;

    //     // await page.pause();
    //     this.scrapedData.scrapingFinished = true;
    // }



}


