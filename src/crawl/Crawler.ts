import { CheerioCrawler, Dataset, Dictionary, EnqueueStrategy, KeyValueStore, RequestQueue } from 'crawlee';
import { KeywordConclusion } from '../types';
import { parseHtml } from "../parsing/htmlParser";


type datasetSample = { [key: string]: string };
export async function crawl(url: string, kwConclusions: KeywordConclusion[]): Promise<void> {

    // KeyValueStore.setValue()
    // Create a CheerioCrawler
    const crawler = new CheerioCrawler({

        // useSessionPool: false,
        // Limits the crawler to only 10 requests (do not use if you want to crawl all links)
        maxRequestsPerCrawl: 20,
        // Function called for each URL
        async requestHandler({ request, enqueueLinks, log, $ }) {
            log.info(request.url);
            // Add some links from page to the crawler's RequestQueue
            await enqueueLinks();

            let sample: Dictionary<string> = {};
            for (const keyword of kwConclusions) {
                sample[keyword.Keyword.index.toString()] = ""
            }
            sample["url"] = request.url;

            // const parsedContent = parseHtml(body.toString())
            for (const keyword of kwConclusions) {
                // test first html selector for each keyword
                let bestPath = keyword.SearchResults.htmlFound.length > 0 ? keyword.SearchResults.htmlFound[0].pathShort : null;
                try {
                    sample[keyword.Keyword.index.toString()] = $(bestPath).text();
                } catch (e: any) {
                    log.debug("Cheerio request handler failed on $( " + bestPath + "): ");
                }

            }
            await Dataset.pushData(sample)

        },
    });
    // crawler.config.set('purgeOnStart', true);
    // await crawler.addRequests([
    //     // 'http://www.example.com/page-1',
    //     // 'http://www.example.com/page-2',
    //     // 'http://www.example.com/page-3',

    //     // 'https://www.alza.sk/logitech-mx-mini-mechanical-for-mac-pale-grey-us-intl-d7468950.htm?o=6',

    //     // 'https://www.alza.sk/hobby/netspa-montana-l-d5347102.htm'
    //     // url,
    //     "http://books.toscrape.com/catalogue/if-i-gave-you-gods-phone-number-searching-for-spirituality-in-america_564/index.html",
    //     "http://books.toscrape.com/catalogue/chasing-heaven-what-dying-taught-me-about-living_797/index.html"
    // ]);

    // await crawler.addRequests([url]);
    // await RequestQueue
    // Open the default request queue associated with the crawler run
    const queue = await RequestQueue.open();
    await queue.drop();
    await crawler.run([url]);


    try {
        // a key-value store named "my-data" under the key "OUTPUT"
        await Dataset.exportToCSV('selector-test', { toKVS: 'default' });
    } catch (e) {
        console.log(e);

    }
}