import { getCUrrentDate as getCurrentDate, normalizeArray } from './helpers/normalize';
import { PlaywrightScraper } from "./scraper/PlaywrightScraper";
import { Input, Output, ScrapedData, SearchResults } from "../src/types";
import { searchData } from './search/Search';
import { Validator } from './validation/Validator';
import { readFileSync } from "fs";
import { KeyValueStore, log } from '@crawlee/core';
import { Actor, ProxyConfiguration, ProxyConfigurationOptions, ProxyInfo } from 'apify';
import { ProxyConfiguration as ProxyConfigurationCrawlee } from "crawlee";
import { getPlaywrightProxyConfiguration, getApifyProxyConfiguration, PlaywrightProxyConfiguration, getCrawleeProxyConfiguration } from './helpers/proxy';
import { createDiff } from './helpers/diff';
/*
 * Actor's entry point. 
 */
(async () => {
    Actor.init();
    log.setLevel(log.LEVELS.DEBUG);

    let input: Input;
    const output = new Output();
    output.analysisStarted = getCurrentDate();

    let proxyConfigurationApify: ProxyConfiguration | undefined;
    let proxyConfigurationPlaywright: PlaywrightProxyConfiguration | undefined;
    let proxyConfigurationCrawlee: ProxyConfigurationCrawlee | undefined;

    let proxyInfo: ProxyInfo | undefined;
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
            proxyInfo = await proxyConfigurationApify?.newProxyInfo();
            proxyUrl = await proxyConfigurationApify?.newUrl();

            proxyConfigurationPlaywright = await getPlaywrightProxyConfiguration(proxyUrl);
            proxyConfigurationCrawlee = await getCrawleeProxyConfiguration(proxyConfigurationApify, input.proxyConfig);


            // if (input.proxyConfig.useApifyProxy) {
            //     proxyConfigurationPlaywright = await getPlaywrightProxyConfiguration(proxyUrl);
            // } else if(input.proxyConfig.proxyUrls?.length) {
            //     // initialize from the list of urls 
            //     log.debug(JSON.stringify(input.proxyConfig.proxyUrls))

            //     proxyConfigurationPlaywright = await getPlaywrightProxyConfiguration(proxyUrl);

            // }

        } else {
            log.info("Actor will not use any proxy servers.")
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
        let navigated: boolean = true;

        try {
            scraper = new PlaywrightScraper(input.url, normalizedKeywords);
            scrapedData = await scraper.scrapePage(proxyConfigurationPlaywright, true);
        } catch (e: any) {
            log.error("Failed to navigate and scrape the website? ");
            log.error(e);
            navigated = false;
        }


        if (navigated) {
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
            } catch (e: any) {
                log.error(e);
            }
        } else {
            log.error("Failed to navigate to the website using Playwright");
        }



        // TODO: create and run the crawler
        // await crawl(input.url, output.keywordConclusions);

        // error for testing purposes
        // throw new Error("Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.")


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
})();
