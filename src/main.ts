// This is the main Node.js source code file of your actor.
// An actor is a program that takes an input and produces an output.

// For more information, see https://sdk.apify.com/
import Apify from 'apify';
import { logObject } from './helpers/helperFunctions';
import { PlaywrightScraper } from "./scraper/PlaywrightScraper";
import { ScrapedDataClass } from './scraper/ScrapedData';
import { JsonSearcher } from './search/JsonSearch';

const { log } = Apify.utils;


interface InputSchema {
    url: string;
    keywords: string[];
}

Apify.main(async () => {

    // Structure of input is defined in INPUT_SCHEMA.json.
    //     const input = await Apify.getInput() as InputSchema;

    //     const url = input.url;
    //     const keywords = input.keywords;

    //     log.setLevel(log.LEVELS.DEBUG);
    //     log.info('Welcome to the page analyzer!');
    //     log.info('URL: ', {url: url});
    //     log.info('KEYWORDS: ', {keywords: keywords});

    //     const controller = new PlaywrightScraper(url, keywords);
    //     // await controller.scrapePage('http://amiunique.org', ['hello', 'world']);

    //     let scrapedData: ScrapedDataClass;
    //     try{
    //         scrapedData = await controller.scrapePage();
    //         // logObject(scrapedData);

    //         // parse data
    //         // search
    //         // validate

    //         await Apify.setValue('OUTPUT', { foo: 'bar' });
    //     } catch (e: any) {
    //         console.log('Tope lever error inside main' + e.message);
    //     }


    //    await Apify.setValue("OUTPUT", JSON.stringify(scrapedData!, null, 2), { contentType: 'application/json; charset=utf-8' });

    const testJson = {
        parent0: "macka",
        parent1: "pes",
        parent2: {
            child0: "child 0 text",
            child1: "child 1 text",
            child2: "papagaj"
        },
        parent3: ["mackaa", "pesoo"]
    }
    const searcher = new JsonSearcher(["pes", "macka"]);
    const searchResults = searcher.searchJson(testJson);
    searchResults?.forEach(element => {
        console.log(element.path);
    });


});
