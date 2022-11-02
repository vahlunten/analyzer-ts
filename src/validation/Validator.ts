import { KeywordConclusion, ScrapedDataClass } from "../scraper/ScrapedData";
import { SearchResult } from "../search/SearchResult";
import { RequestList, CheerioCrawler, log, LogLevel } from 'crawlee';
import { title } from "process";




export class Validator {

    public validate(scraped: ScrapedDataClass): Map<Number, KeywordConclusion> {
        let validatedData = new Map<Number, KeywordConclusion>();
        return validatedData;
    }


    public static async loadHtml() : Promise<string[]> {
        const data:string[] = [];
        // Use a helper function to simplify request list initialization.
        // State and sources are automatically persisted. This is a preferred usage.
        const requestList = await RequestList.open('my-request-list', [
            'http://www.example.com/page-1',
            { url: 'http://www.example.com/page-2', method: 'POST', userData: { foo: 'bar' } },
            { requestsFromUrl: 'http://www.example.com/my-url-list.txt', userData: { isFromUrl: true } },
        ]);
        const crawler = new CheerioCrawler({
            async requestHandler({ request, response, body, contentType, $ }) {

                // Do some data extraction from the page with Cheerio.
                data.push($("title").text());

                // Save the data to dataset.
                // await Dataset.pushData({
                //     url: request.url,
                //     html: body,
                //     data,
                // })

            },
        });

        await crawler.run([
            'http://www.example.com/page-1',
            'http://www.example.com/page-2',
        ]);
        return data;

    }
    public validateJson(searchResults: SearchResult[]): SearchResult[] {
        let validatedJson: SearchResult[] = [];

        return validatedJson;

    }
}