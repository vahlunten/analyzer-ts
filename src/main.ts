import Apify from 'apify';
import { normalizeArray } from './helpers/normalize';
import { PlaywrightScraper } from "./scraper/PlaywrightScraper";
import { InputSchema, Output } from "../src/types";
import { searchData } from './search/Search';
import { Validator } from './validation/Validator';
import { readFileSync } from "fs";

const { log } = Apify.utils;
/**
 * Actor's entry point. 
 */
Apify.main(async () => {

    // Structure of the input is defined in /src/INPUT_SCHEMA.json.
    const input = await Apify.getInput() as InputSchema;
    // copy frontent application to keyvalue store, this file is generated by project analyzer-ui, mentioned in the readme.
    // this works locally if the analyzer-ui project is placed in the same folder as analyzer-ts
    // on Apify platform, this file is copied during building in docker
    await Apify.setValue("DASHBOARD", readFileSync("./src/static/index.html"), { contentType: 'text/html; charset=utf-8' });
    log.info("INPUT", input);

    log.setLevel(log.LEVELS.DEBUG);
    log.info('===================================================================================================================');
    log.info('Welcome to the page analyzer!');
    log.info('URL: ' + input.url);
    log.info('KEYWORDS: ' + input.keywords);
    log.info('===================================================================================================================');

    const normalizedKeywords = normalizeArray(input.keywords);
    const scraper = new PlaywrightScraper(input.url, normalizedKeywords);

    const output = new Output(input.url, normalizedKeywords);
    output.analysisStarted = new Date();
    const validator = new Validator();

    // TODO: implement multiple retries 
    try {
        // get all the data
        const scrapedData = await scraper.scrapePage();

        // after the browser is closed, search the data 
        const searchResults = searchData(scrapedData, normalizedKeywords);

        // compare initial responses retrieved by the chromium broswer and cheerioCrawler 
        const validatedData = await validator.validate(input.url, normalizedKeywords, searchResults);

        // save the output
        output.scrapedData = scrapedData;
        output.searchResults = searchResults;
        output.keywordConclusions = validatedData;

    } catch (e: any) {

        // TODO: proper error handling
        log.error('Top lever error inside main:');
        log.error(e.message);
        console.error(e);
    }
    output.analysisEnded = new Date();
    await Apify.setValue("OUTPUT", JSON.stringify(output!, null, 2), { contentType: 'application/json; charset=utf-8' });

});
