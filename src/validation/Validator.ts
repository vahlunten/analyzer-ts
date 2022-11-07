import { KeywordConclusion, ScrapedDataClass, SearchResults } from "../scraper/ScrapedData";
import { SearchResult } from "../search/SearchResult";
import { RequestList, CheerioCrawler, log, LogLevel, CheerioCrawlerOptions, Configuration } from 'crawlee';
import { NormalizedKeywordPair } from "../helpers/normalize";
import { parseJsonLD } from "../scraper/parsing/json-ld";
import { JSONPath } from "jsonpath-plus";
import { parseSchemaOrgData } from "../scraper/parsing/schema-org";




export class Validator {

    private $: cheerio.Root | null = null;
    private body: string | null = null;


    // public pes$: cheerio.Root | null = null;
    public async validate(url: string, keywords: NormalizedKeywordPair[], searchResults: SearchResults): Promise<Map<Number, KeywordConclusion>> {
        // let validatedData = new Map<Number, KeywordConclusion>();

        if (await this.loadHtml(url) == false) {
            // fill keyword conclusion with unvalidated data
        }


        const validatedSearchResults = new SearchResults();

        // VALIDATE JSON-ld
        const jsonValidated = this.validateJsonSearchResults(parseJsonLD(this.$!), searchResults.jsonFound );
        validatedSearchResults.jsonFound = jsonValidated;
        // Validate metadata
        const metaValidated = this.validateJsonSearchResults(parseSchemaOrgData(this.$!), searchResults.metaFound);
        validatedSearchResults.metaFound = metaValidated;

        const validatedData = await this.createConclusion(validatedSearchResults, keywords);
        return validatedData;
    }

    public async createConclusion(searchResults: SearchResults, keywords: NormalizedKeywordPair[]): Promise<Map<Number, KeywordConclusion>> {

        const conclusion = new Map<Number, KeywordConclusion>();

        for (const keyword of keywords) {
            conclusion.set(keyword.index, { Keyword: keyword, SearchResults: new SearchResults() });
        }
        for (const searchResult of searchResults.jsonFound) {
            conclusion.get(searchResult.keyword.index)?.SearchResults.jsonFound.push(searchResult);
        }
        for (const searchResult of searchResults.metaFound) {
            conclusion.get(searchResult.keyword.index)?.SearchResults.metaFound.push(searchResult);
        }
        return conclusion;
    }

    public async loadHtml(url: string): Promise<boolean> {
        // Use a helper function to simplify request list initialization.
        // State and sources are automatically persisted. This is a preferred usage.
        // const requestList = await RequestList.open('my-request-list', [
        //     'http://www.example.com/page-1',
        //     { url: 'http://www.example.com/page-2', method: 'POST', userData: { foo: 'bar' } },
        //     { requestsFromUrl: 'http://www.example.com/my-url-list.txt', userData: { isFromUrl: true } },
        // ]);

        // // Get the global configuration
        // const config = Configuration.getGlobalConfig();
        // config.set();
        const options: CheerioCrawlerOptions = {
            async errorHandler({ request }) {
                log.info(`Request ${request.url} failed 15 times. Data found can not be validated.`);

            },
            requestHandler: async ({ request, response, body, contentType, $ }) => {
                this.$ = $;
                this.body = body.toString();
                log.info("CheerioCrawler response receiver sucessfully with responseStatus: " + response.statusCode);

            },
            maxRequestRetries: 10,

        }

        const crawler = new CheerioCrawler(options);

        await crawler.run([
            url
        ]);

        if (this.body) {
            return true;
        } else {
            return false;
        }

    }
    public validateJsonSearchResults(source: any, searchResults: SearchResult[]): SearchResult[] {
        let validatedJson: SearchResult[] = [];

        // const cheerioJsonParsed = parseJsonLD(this.$!);

        for (const jsonSearchResult of searchResults) {

            const textFoundValidation = JSONPath({ path: jsonSearchResult.path.join('.'), json: source });
            const validatedSearchResult = jsonSearchResult;
            validatedSearchResult.textFoundValidation = textFoundValidation.length ? textFoundValidation[0] : null;
            validatedJson.push(validatedSearchResult);
        }

        return validatedJson;

    }
}