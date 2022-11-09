import Apify from 'apify';
import { normalizeArray } from './helpers/normalize';
import { PlaywrightScraper } from "./scraper/PlaywrightScraper";
import { InputSchema, ScrapedData, Output, SearchResult, DataSource } from "../src/types";
import { removeDuplicates, searchData } from './search/Search';
import { Validator } from './validation/Validator';

const { log } = Apify.utils;
/**
 * Actor's entry point. 
 */
Apify.main(async () => {
 
    // Structure of the input is defined in /src/INPUT_SCHEMA.json.
    const input = await Apify.getInput() as InputSchema;
    console.log(input);

    log.setLevel(log.LEVELS.DEBUG);
    log.info('===================================================================================================================');
    log.info('Welcome to the page analyzer!');
    log.info('URL: ' + input.url);
    log.info('KEYWORDS: ' + input.keywords);
    log.info('===================================================================================================================');

    const normalizedKeywords = normalizeArray(input.keywords);
    const scraper = new PlaywrightScraper(input.url, normalizedKeywords);

    const output = new Output(input.url, normalizedKeywords);
    const validator = new Validator();

    // TODO: implement multiple retries 
    try {
        const scrapedData = await scraper.scrapePage();
        const searchResults = searchData(scrapedData, normalizedKeywords);
        const validatedData = await validator.validate(input.url, normalizedKeywords, searchResults);

        output.scrapedData = scrapedData;
        output.searchResults = searchResults;
        output.keywordConclusions = validatedData;

    } catch (e: any) {

        // TODO: proper error handling
        log.error('Top lever error inside main:');
        log.error(e.message);

    }
    await Apify.setValue("OUTPUT", JSON.stringify(output!, null, 2), { contentType: 'application/json; charset=utf-8' });

});
