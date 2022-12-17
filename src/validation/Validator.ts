import { KeywordConclusion, ScrapedData, NormalizedKeywordPair, ScrapedPage, SearchResults, SearchResult, XhrValidation } from "../types";
import { RequestList, CheerioCrawler, log, LogLevel, CheerioCrawlerOptions, Configuration } from 'crawlee';
import { JSONPath } from "jsonpath-plus";
import { parseHtml } from "../parsing/htmlParser";
import { validateAllXHR } from "./XhrValidation";
import Apify from "apify";
// import {  } from "@frontend/scripts";


export class Validator {

    private $: cheerio.Root | null = null;
    private body: string | null = null;
    private $body: cheerio.Cheerio | null = null;
    public parsedCheerio: ScrapedPage | null = null;

    /**
     * Compare searchresults from analysis with search results from the browser session and search results of initial response loaded by cheerioCrawler.
     * This funtion will also validate XHR requests.
     * @param url 
     * @param keywords 
     * @param searchResults 
     * @returns 
     */
    public async validate(url: string, keywords: NormalizedKeywordPair[], searchResults: SearchResults): Promise<KeywordConclusion[]> {
        let validatedData: KeywordConclusion[];

        // if we failed to load initial response of
        if (await this.loadHtml(url) == false) {
            // fill keyword conclusion with unvalidated data
            validatedData = await this.createConclusion(searchResults,[], keywords);
        } else {

            const validatedSearchResults = new SearchResults();
            this.parsedCheerio = parseHtml(this.body!);

            //validate html
            const htmlValidated = this.validateHtmlSearchResults(searchResults.htmlFound);
            validatedSearchResults.htmlFound = htmlValidated;

            // VALIDATE JSON-ld
            const jsonValidated = this.validateJsonSearchResults(this.parsedCheerio.jsonLDData, searchResults.jsonFound);
            validatedSearchResults.jsonFound = jsonValidated;

            // Validate metadata
            const metaValidated = this.validateJsonSearchResults(this.parsedCheerio.metadata, searchResults.metaFound);
            validatedSearchResults.metaFound = metaValidated;

            // TODO: validate schama.org data
            const schemaOrgValidated = this.validateJsonSearchResults(this.parsedCheerio.schemaOrgData, searchResults.schemaFound);
            validatedSearchResults.schemaFound = schemaOrgValidated;

            // validate XHR requests    
            const xhrValidated = await validateAllXHR(searchResults.xhrFound, keywords);
            await Apify.setValue("XHR", JSON.stringify(xhrValidated, null, 2), { contentType: 'application/json; charset=utf-8' });

            validatedData = await this.createConclusion(validatedSearchResults, xhrValidated, keywords);
        }


        return validatedData;

    }

    /**
     * Search results from each data source obtained during analysis are all contained in the single array. 
     * This method will group search results form all of the data sources afor every keyword. 
     * @param searchResults 
     * @param keywords 
     * @returns 
     */
    public async createConclusion(searchResults: SearchResults,xhrValidated: XhrValidation[], keywords: NormalizedKeywordPair[]): Promise<KeywordConclusion[]> {

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
        for (const searchResult of searchResults.htmlFound) {
            conclusion.get(searchResult.keyword.index)?.SearchResults.htmlFound.push(searchResult);
        }
        return Array.from(conclusion.values());
    }

    /**
     * 
     * @param url Function will load initial response of analysed url and store it in validator.body
     * @returns 
     */
    public async loadHtml(url: string): Promise<boolean> {
        const options: CheerioCrawlerOptions = {
            async errorHandler({ request }) {
                log.info(`Request ${request.url} failed 15 times. Data found can not be validated.`);

            },
            requestHandler: async ({ request, response, body, contentType, $ }) => {
                this.$ = $;
                this.$body = $("body").get(0);
                this.body = body.toString();
                log.info("CheerioCrawler response receiver sucessfully with responseStatus: " + response.statusCode);
                await Apify.setValue("cheerioInitial", this.body, { contentType: 'text/html; charset=utf-8' });


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

    public validateHtmlSearchResults(searchResult: SearchResult[]): SearchResult[] {
        let validatedHtml: SearchResult[] = [];


        if (this.$body != null) {
            searchResult.forEach(searchResult => {
                const textFound = this.$!(searchResult.path).text();
                const validatedSearchResult = searchResult;
                validatedSearchResult.textFoundValidation = textFound;
                validatedSearchResult.score = textFound == searchResult.textFound ? searchResult.score : searchResult.score + 10000 ;
                validatedSearchResult.isValid = textFound == searchResult.textFound;
                validatedHtml.push(validatedSearchResult)

            })
        };
        return validatedHtml.sort((a, b) => a.score - b.score );
        
    }


    /**
     * This function will take parsed initial response data and use selectors obtained by analysis to retrieve data from this initial response.  
     * @param source  Data source object parsed from cheerio crawler's initial response. 
     * @param searchResults Search results obtained during **analysis**.
     * @returns Copy of original search results along with values retrieved from cheeriocrawler's initial response. 
     */
    public validateJsonSearchResults(source: any, searchResults: SearchResult[]): SearchResult[] {
        let validatedJson: SearchResult[] = [];

        // const cheerioJsonParsed = parseJsonLD(this.$!);

        for (const jsonSearchResult of searchResults) {

            try {
                // TODO: implement own JPath or try to disable @type matching 
                const textFoundValidation = JSONPath({ path: jsonSearchResult.path, json: source });
                const validatedSearchResult = jsonSearchResult;
                validatedSearchResult.textFoundValidation = textFoundValidation.length ? textFoundValidation[0] : null;
                validatedJson.push(validatedSearchResult);
            } catch (e) {
                console.error(e);
            }
        }

        return validatedJson;

    }
}