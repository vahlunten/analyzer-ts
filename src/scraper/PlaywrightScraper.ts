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
import { PlaywrightProxyConfiguration } from '../helpers/proxy';


/**
 * 
 */
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
                // await page.pause();
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
                await page.keyboard.down('End');
                await page.waitForTimeout(3000);
                await page.keyboard.down('End');
                await page.waitForTimeout(2000);
                await page.keyboard.down('End');
                await page.keyboard.down('End');


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
                "chrome"
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


        const myHeaders = "{ Host: www.nike.com\
        User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/112.0\
        Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8\
        Accept-Language: en-US,en;q=0.5\
        Accept-Encoding: gzip, deflate, br\
        Connection: keep-alive\
        Cookie: geoloc=cc=CZ,rc=,tp=vhigh,tz=GMT+1,la=50.08,lo=14.47; AnalysisUserId=23.212.110.38.232751678891750749; AMCV_F0935E09512D2C270A490D4D%40AdobeOrg=1994364360%7CMCMID%7C48700746154929839239221523371047308448%7CMCAID%7CNONE%7CvVersion%7C3.4.0; _abck=BCA5992F21126A1632298863AD6D4D60~-1~YAAQt27UF/OjCeWGAQAARRGr8QngAbmlmO9b4cNVDU3gL9pWuFKXU6X0e2BA8tsLnnyRv4Py/bTQFYGgqQkEve4XXCnmtdi/HgwPwVwEbPc6VeY6Og5MRw4J6yDYOBvjZi4QNidMcVMQruy0tn2PK5mGkHd5PS67ic0ESFH0eTC7Z9ZL8MkklEfxBkT4ru4KRqAEmdM0YzRvhZrH2Tc3IFL0EGEBOqZdmfILrPMO5Uf0lODebWh5rWCgagojvK47ctlLxmkXtsrib7nwIlOOVUwtRDMdr+CUazvDpUqXrkMJ9SkSCdr7y2EF9B1A8PHaNgfQdjAN2yf/v9FFD4omv7TM0mYoK8m0cSbbGmICjU4atVoEZNYEP/Q1tcq+2ZP9a6TUzVuo8CxEep0e7Nh5a3MF2l5Xl4+M+ZO+ModoJTs9dn4/L5l4MZFOvrZNy5kwVODw8e+ExI12SkDZfz7+/KOFfyeEKWcotzPR7hf2Ed8nCsRCLvKrGT6yrzQ09HdvjcmOheojaeOupqZSeqZfDWdeiNS8KGh2~-1~-1~-1; forterToken=3a9f8d791f774825906513eca72c7d07_1679091751842_798_UDF9_13ck; CONSUMERCHOICE=cz/cs_cz; NIKE_COMMERCE_COUNTRY=CZ; NIKE_COMMERCE_LANG_LOCALE=cs_CZ; anonymousId=980C27645E7E086BB6A4CF2A537BA6ED; ppd=upcoming|snkrs>upcoming; ni_c=PERF=0|1PA=0|BEAD=0; ak_bmsc=4468208F74B05EFC9C5F48430CE52209~000000000000000000000000000000~YAAQBG7UF/d3EuaGAQAApSSM8RNlYtpT3r+/fVlkk3p4LtKxXisuOJlBox+jUUFIJp3Qv5KSN+BP9+cL9hTh5n5W6gl9Rl0NOLS9P+2LHIt0sjgtvy+dI74Vl8DU73fYUBML9HeRmNbSf8WmPcRXyrLmmfFhtz7UQm9ciZQT/T/la7GBOdM4CQl2f8xVxMOcTaSL/TLu7bCY+yDB+iiaWLib9mFcHEpkQ5mYfF29QmsbhczjkKHu6OgJWEW2424SxojFX4JOB5LhjcGNQ9vLLcbKuaOHTzRT1QuWLUBlmRAeI9wKAnJ6Tht8udWu/aa9xBoFLZnOpVD+hjlOG2PoMsYwGNo73nj8D/7pp+LAOkmk57aWPcYoDVaEBA2rc2/BgNTYG9shxKE=; AKA_A2=A; bm_sz=B653B30E74EBE0F9A665D95149EA1613~YAAQPG7UF66cAueGAQAA5dqq8RM/X0TPQo3NSlEJ2+f+QNmPwusR4Ot+emAr1cB5oaltlZvbXmenKjx0lxOX40rU7ml6VIizqdL4T4/CVdARQrNN8rB3Aef/OvhQBuxaVMjCgrSJydvQ977Sm0TB7b7yMef2N5Wk8+RJLvB9wqBtO0zjeIhuqbyllCKh5peChVF2iYpmH2ltDpCZFsm3Bfody8MxEx0SdAY28vqaNr50nHWi8NuLdMrvtX8yWbJ1w+0M/1/+K+XIfkyjni04PJtnzjKKgQY4WnSXOeDPAMHONSkrGsgBTi9K9qeKeq1DzvkFnQyo5AxMISG5P6TqdHhtqsuwKpYZFQgljkF1uXnRy2aRcsNBdEsjWCna7nvM8O4i+1o4R0YjF1SPWaOJ0vzI6LNb+2TejnTYW/WNHIQabWNap3eCr7IajA==~4535603~3491376; audience_segmentation_performed=true; bm_mi=B08CA4D8BB2217179D90119A59403C79~YAAQPG7UF6ycAueGAQAA5dqq8RNrTKzmUQpX4mU5id9IrIIwFaq81s0NO/OfdN+GBAcpUBlZVjKMJLdxdW5wA33+K2JKeGYYzgrIloyW8ktEmyNF1DmwSUWTCKoeqsSQ/f5MTr9h1NMDKdm9R0fc7u2Uvg798/TWGFv2p/DHgkhCSeiQipW2DvubMWlQ3wA3p2plMzXl3kYbA8Pey4kgLPZEkQX0rGwqSuMYky7hfGboWeVUoNj47/VZoQyErCbNQ+GzjUmxKJycwNv7YPyXhj9nzxjVKwrljtrUS8gP0ITdctwY/CPM58DibpNswEI8s52eeM8=~1; bm_sv=D8DF0402A0FB2171B839628A8898F11A~YAAQt27UF/SjCeWGAQAARRGr8ROat0IjQMnT7sGr6wMSenychotHg/oNKMf4cZJ/trxswzNt3FqT2kqO7yfighFSn3f0+uYOehGjWFewetyaU9lpjH026AqQ9wQEmkpzAlYL6oY7XbnZ0cf/2D/yxlMN/YUqnDTYlVcTK6GJLGmgmY0m5MfeqJaf5nmE0hVbOxq/S3sqttJtVlAo1UgiQ9oAi7vc2Lz+hPynXbdZHBak78sRuG4I/svhDoSpPSE=~1; sq=0\
        Upgrade-Insecure-Requests: 1\
        Sec-Fetch-Dest: document\
        Sec-Fetch-Mode: navigate\
        Sec-Fetch-Site: none\
        Sec-Fetch-User: ?1\
        TE: trailers";



        const headers = fingerprint.headers as { [key: string]: string };
        Object.keys(headers).forEach(h => { console.log(`Header: ${h}, value: ${headers[h]}`) });

        const context = await browser.newContext({
            userAgent: fingerprint.fingerprint.navigator.userAgent,
            locale: fingerprint.fingerprint.navigator.language,
            viewport:{width: 2560, height: 1440} ,
            ignoreHTTPSErrors: true
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

    interceptRequests(route: Route, request: Request, saveBandwith: boolean = false) {
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
            log.debug(JSON.stringify(request.headers()));
        }
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

}


