// This is the main Node.js source code file of your actor.
// An actor is a program that takes an input and produces an output.

// For more information, see https://sdk.apify.com/
import Apify from 'apify';
import { logObject } from './helpers/helperFunctions';
import { normalizeArray } from './helpers/normalize';
import { PlaywrightScraper } from "./scraper/PlaywrightScraper";
import { Output, ScrapedDataClass } from './scraper/ScrapedData';
import { JsonSearcher } from './search/JsonSearch';
import { searchData } from './search/Search';
import { DataSource, SearchResult } from './search/SearchResult';
import { Validator } from './validation/Validator';

const { log } = Apify.utils;


interface InputSchema {
    url: string;
    keywords: string[];
}
Apify.main(async () => {

    // Structure of input is defined in INPUT_SCHEMA.json.
    const input = await Apify.getInput() as InputSchema;

    const url = input.url;
    const keywords = input.keywords;

    log.setLevel(log.LEVELS.DEBUG);
    log.info('Welcome to the page analyzer!');
    log.info('URL: ', { url: url });
    log.info('KEYWORDS: ', { keywords: keywords });

    const normalizedKeywords = normalizeArray(keywords);
    const scraper = new PlaywrightScraper(url, normalizedKeywords);

    let output = new Output(url, normalizedKeywords);
    let scrapedData: ScrapedDataClass;
    try {
        scrapedData = await scraper.scrapePage();
        const dataFound = searchData(scrapedData, normalizedKeywords, DataSource.initial);
        const validator = new Validator();
        const validatedData = await validator.validate(url, normalizedKeywords, dataFound);        
        output.scrapedData = scrapedData;
        output.keywordConclusions = Array.from(validatedData.values());

        // logObject(scrapedData);
        // search
        // validate

    } catch (e: any) {
        log.error('Top lever error inside main' + e.message);
    }


    await Apify.setValue("OUTPUT", JSON.stringify(output!, null, 2), { contentType: 'application/json; charset=utf-8' });
    

});
