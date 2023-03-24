import { CheerioCrawler, Dataset, Dictionary, EnqueueStrategy, KeyValueStore, RequestQueue, URL_NO_COMMAS_REGEX } from 'crawlee';
import { KeywordConclusion } from '../types';


type datasetSample = { [key: string]: string };

export async function crawl(url: string,sampleUrls:string[], kwConclusion: KeywordConclusion[]): Promise<void> {
    const crawler = new CheerioCrawler({
        // Function called for each URL
        async requestHandler({ response, request, enqueueLinks, log, $ }) {
            log.info(request.url);
            log.info($("#h1c > h1:nth-child(1)").text());
            


        },
    });
   
    const queue = await RequestQueue.open();
    await queue.drop();
    await crawler.run([url, ...sampleUrls]);


    try {
        // a key-value store named "my-data" under the key "OUTPUT"
        await Dataset.exportToCSV('selector-test', { toKVS: 'default' });
    } catch (e) {
        console.log(e);

    }
}