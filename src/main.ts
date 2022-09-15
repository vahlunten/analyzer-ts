// This is the main Node.js source code file of your actor.
// An actor is a program that takes an input and produces an output.

// For more information, see https://sdk.apify.com/
import Apify from 'apify';
import { logObject } from './helpers/helperFunctions';
import { PlaywrightScraper } from "./scraper/PlaywrightScraper";
import { ScrapedData } from './scraper/ScrapedData';

interface InputSchema {
    url: string;
    keywords: string[];
}

Apify.main(async () => {
    console.log('Loading input')
    // Structure of input is defined in INPUT_SCHEMA.json.
    const input = await Apify.getInput() as InputSchema;

    const url = input.url;
    const keywords = input.keywords;
    const controller = new PlaywrightScraper();
    // await controller.scrapePage('http://amiunique.org', ['hello', 'world']);

    let scrapedData: ScrapedData;
    try{
        scrapedData = await controller.scrapePage(url, keywords);
        // logObject(scrapedData);
        await Apify.setValue('OUTPUT', { foo: 'bar' });
    } catch (e: any) {
        console.log('Tope lever error inside main' + e.message);
    }


   await Apify.setValue("OUTPUT", JSON.stringify(scrapedData!, null, 2), { contentType: 'application/json; charset=utf-8' });

});
