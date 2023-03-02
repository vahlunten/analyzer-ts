// TODO: input: selectors from the analysis
// TODO: output: example dataset?

import { CheerioCrawler, Dataset, EnqueueStrategy } from 'crawlee';
import { KeywordConclusion } from '../types';
import { parseHtml } from "../parsing/htmlParser";

type datasetSample = {
    path: string;
    expected: string;
    found: string;
}
export async function crawl(url: string, kwConclusions: KeywordConclusion[]): Promise<void> {
    // Create a CheerioCrawler
    const crawler = new CheerioCrawler({
        // Limits the crawler to only 10 requests (do not use if you want to crawl all links)
        maxRequestsPerCrawl: 20,
        // Function called for each URL
        async requestHandler({ request, enqueueLinks, log, $ }) {
            log.info(request.url);
            // Add some links from page to the crawler's RequestQueue
            await enqueueLinks(
                // {
                //     strategy: EnqueueStrategy.All
                // }
                // {
                //     globs: ['http?(s)://mall.cz/*/*'],
                // }
            );

            // const parsedContent = parseHtml(body.toString())
            for (const keyword of kwConclusions) {
                const selectorTest: datasetSample[] = [];
                for (const htmlSearchResult of keyword.SearchResults.htmlFound) {
                    // selectorTest.push({ path: htmlSearchResult.path, found: $(htmlSearchResult.path).text(), expected: htmlSearchResult.textFound });

                    const parsedHtml = parseHtml($.html());

                    const textFound = $(htmlSearchResult.pathShort).text();

                    if (true) {
                        await Dataset.pushData(
                            {
                                path: htmlSearchResult.pathShort,
                                found: textFound,
                                expected: htmlSearchResult.textFound,
                                url: request.url
                            }
                        );
                    }


                    // await Dataset.pushData(
                    //     // {
                    //     //     url: request.url,
                    //     //     html: body,
                    //     // }
                    //     {
                    //         path: "path",
                    //         found: "found",
                    //         expected: "expected"
                    //     }
                    // );
                }
            }


        },
    });
    await crawler.addRequests([
        // 'http://www.example.com/page-1',
        // 'http://www.example.com/page-2',
        // 'http://www.example.com/page-3',

        // 'https://www.alza.sk/logitech-mx-mini-mechanical-for-mac-pale-grey-us-intl-d7468950.htm?o=6',

        // 'https://www.alza.sk/hobby/netspa-montana-l-d5347102.htm'
        url
    ]);

    await crawler.addRequests([url]);
    await crawler.run();

    try {
        // a key-value store named "my-data" under the key "OUTPUT"
        // await Dataset.exportToCSV('selector-test', { toKVS: 'default' });
    } catch (e) {
        console.log(e);

    }
}