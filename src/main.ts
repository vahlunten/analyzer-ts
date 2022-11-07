import Apify from 'apify';
import { normalizeArray } from './helpers/normalize';
import { PlaywrightScraper } from "./scraper/PlaywrightScraper";
import { Output, ScrapedDataClass } from './scraper/ScrapedData';
import { searchData } from './search/Search';
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
        const searchResults = searchData(scrapedData, normalizedKeywords);
        const validator = new Validator();
        const validatedData = await validator.validate(url, normalizedKeywords, searchResults);     
           
        output.scrapedData = scrapedData;
        output.searchResults = searchResults;
        output.keywordConclusions = Array.from(validatedData.values());

        // logObject(scrapedData);
        // search
        // validate

    } catch (e: any) {
        log.error('Top lever error inside main' + e.message);
    }
    await Apify.setValue("OUTPUT", JSON.stringify(output!, null, 2), { contentType: 'application/json; charset=utf-8' });   

});
