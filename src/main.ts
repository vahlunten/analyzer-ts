import { getCUrrentDate as getCurrentDate, normalizeArray } from './helpers/normalize';
import { PlaywrightScraper } from "./scraper/PlaywrightScraper";
import { Input, Output, ScrapedData, SearchResults } from "../src/types";
import { searchData } from './search/Search';
import { Validator } from './validation/Validator';
import { readFileSync } from "fs";
import { KeyValueStore, log } from '@crawlee/core';
import { Actor, ProxyConfiguration } from 'apify';
import { ProxyConfiguration as ProxyConfigurationCrawlee } from "crawlee";
import { getPlaywrightProxyConfiguration, getApifyProxyConfiguration, PlaywrightProxyConfiguration, getCrawleeProxyConfiguration } from './helpers/proxy';
import { createDiff } from './helpers/diff';
import { crawlSitemaps } from './crawl/Sitemap';
import { crawl } from './crawl/Crawler';


export async function analyze(storageDir: string = ""): Promise<void> {
    Actor.init();
    log.setLevel(log.LEVELS.DEBUG);
    let input: Input;
    const output = new Output();
    output.analysisStarted = getCurrentDate();

    let proxyConfigurationApify: ProxyConfiguration | undefined;
    let proxyConfigurationPlaywright: PlaywrightProxyConfiguration | undefined;
    let proxyConfigurationCrawlee: ProxyConfigurationCrawlee | undefined;

    let proxyUrl: string | undefined;

    try {
        // try to load the INPUT.json from default kvs
        try {
            input = await KeyValueStore.getInput() as Input;
            if (input == null) {
                throw new Error("Input is null.")
            }
            log.debug("Input: ");
            log.debug(JSON.stringify(input));

        } catch (e: any) {
            log.error("Failed to parse the input.");
            log.error(e.message);
            output.actorSuccess = false;
            throw e;
        }

        // create proxy configuration
        if (input.proxyConfig) {

            proxyConfigurationApify = await getApifyProxyConfiguration(input.proxyConfig);
            proxyUrl = await proxyConfigurationApify?.newUrl();

            proxyConfigurationPlaywright = await getPlaywrightProxyConfiguration(proxyUrl);
            proxyConfigurationCrawlee = await getCrawleeProxyConfiguration(proxyConfigurationApify, input.proxyConfig);

        } else {
            log.info("Proxy configuration is indefined, actor will not use any proxy servers.")
        }

        log.info('===================================================================================================================');
        log.info('URL: ' + input.url);
        log.info('KEYWORDS: ' + input.keywords);
        log.info('===================================================================================================================');


        const normalizedKeywords = normalizeArray(input.keywords);
        output.setInput(input.url, normalizedKeywords);

        // navigate to the website
        let scraper: PlaywrightScraper;
        let scrapedData: ScrapedData;
        let searchResults: SearchResults;
        let scrapingFailed: boolean = false;

        try {
            scraper = new PlaywrightScraper(input.url, normalizedKeywords);
            scrapedData = await scraper.scrapePage(proxyConfigurationPlaywright, true);
            if (scrapedData.scrapingFinished) {
                if (!scrapedData.navigated) {
                    log.error("Navigation failed.");
                    log.error("The actor will try to continue, some data might be missing. ")
                } else {
                    log.info("Playwright sucessfully navigated to the website and scraped the website.")
                }
            } else {
                scrapingFailed = true;
            }
            await scraper.close();
        } catch (e: any) {
            log.error("Unhandled exception during scraping.");
            log.error(e);
            scrapingFailed = false;
            output.actorSuccess = false;
            throw e;
        }


        if (!scrapingFailed) {
            // after the data is loaded and parsed we can search for keywords 
            searchResults = searchData(scrapedData!, normalizedKeywords);

            // generate deff initial response -> rendered document
            await createDiff(scrapedData!.initial?.body!, scrapedData!.DOM?.body!);

            // close the browser
            // scraper.close();

            // retrieve initial response with the CheerioCrawler and validate the search results
            const validator = new Validator(proxyUrl);
            const validatedData = await validator.validate(input.url, normalizedKeywords, searchResults);

            // save the output
            output.scrapedData = scrapedData!;
            output.searchResults = searchResults;
            output.keywordConclusions = validatedData.conclusion;
            output.xhrValidated = validatedData.xhrValidated;
            output.cheerioCrawlerSuccess = validatedData.cheerioCrawlerSuccess;
            output.scrapedData.parsedCheerio = validatedData.parsedCheerio;

            try {
                // TODO: delete other redundant properties from the OUTPUT.json
                output.scrapedData!.initial!.body = null;
                output.scrapedData!.DOM!.body = null;
                output.scrapedData!.xhrParsed = null;
            } catch (e: any) {
                log.error(e);
            }

            // let urls:string[] = [];
            // try {
            //     // TODO: proxyCOnf parameter, headers parameter
            //     urls = await crawlSitemaps(new URL("/robots.txt", input.url).href, input.url);
            //     log.debug(JSON.stringify(urls));


            // } catch (e:any) {
            //     log.error("Crawling the sitemap failed.")
            //     log.error(e);
            // }



            // try {
            //     if (urls.length) {
            //         await crawl(input.url, urls, []);
            //     }
            // } catch(e:any) {

            // }
        } else {
            log.error("Failed to scrape the website using Playwright. ");
            output.actorSuccess = false;
        }


    } catch (e: any) {
        log.error('Top lever error inside main:');
        log.error(e);
        console.error(e);
        output.actorSuccess = false;
        output.errorMessage = e.message;
    } finally {

        output.analysisEnded = getCurrentDate();

        await KeyValueStore.setValue("OUTPUT", JSON.stringify(output!, null, 2), { contentType: 'application/json; charset=utf-8' });
        // await store!.setValue("OUTPUT", JSON.stringify(output!, null, 2), { contentType: 'application/json; charset=utf-8' });

        // Copy frontend application to keyvalue store, this file is generated by project analyzer-ui, mentioned in the readme.
        // On the Apify platform, this file is copied during actor's build in docker.
        await KeyValueStore.setValue("DASHBOARD", readFileSync("./src/static/index.html"), { contentType: 'text/html; charset=utf-8' });
        // await store!.setValue("DASHBOARD", readFileSync("./src/static/index.html"), { contentType: 'text/html; charset=utf-8' });
    }

    Actor.exit({ exitCode: output.actorSuccess ? 0 : 1 });
}

(async () => {
   await analyze("../storage/key_value_stores/");    
})();
