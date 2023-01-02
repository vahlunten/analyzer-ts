import { KeywordConclusion, ScrapedData, NormalizedKeywordPair, ScrapedPage, SearchResults, SearchResult, XhrValidation } from "../types";
import { KeyValueStore, log, Request } from '@crawlee/core';
import { JSONPath } from "jsonpath-plus";
import { parseHtml } from "../parsing/htmlParser";
import { validateAllXHR } from "./XhrValidation";
import { CheerioCrawler, createCheerioRouter } from "crawlee";
import { Actor } from "apify";
import cheerio from "cheerio";
// import {  } from "@frontend/scripts";


export class Validator {

    private $: any;;
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
    public async validate(url: string, keywords: NormalizedKeywordPair[], searchResults: SearchResults): Promise<{ conclusion: KeywordConclusion[], xhrValidated: XhrValidation[], cheerioCrawlerSuccess: boolean}> {
        let validatedData: KeywordConclusion[];
        let xhrValidated: XhrValidation[] = [];
        // load initial html
        const cheerioCrawlerLoaded = await this.loadHtml(url);

        // if we failed to load initial response of
        if (cheerioCrawlerLoaded == false) {
            // fill keyword conclusion with unvalidated data
            validatedData = this.createConclusion(searchResults, [], keywords);
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

            // Validate microdata
            const schemaOrgValidated = this.validateJsonSearchResults(this.parsedCheerio.schemaOrgData, searchResults.schemaFound);
            validatedSearchResults.schemaFound = schemaOrgValidated;

            // copy window properties
            validatedSearchResults.windowFound = searchResults.windowFound;

            // validate XHR requests    
            xhrValidated = await validateAllXHR(searchResults.xhrFound, keywords);
            await KeyValueStore.setValue("xhrValidation", JSON.stringify(xhrValidated, null, 2), { contentType: 'application/json; charset=utf-8' });

            validatedData = this.createConclusion(validatedSearchResults, xhrValidated, keywords);
        }


        return { conclusion: validatedData, xhrValidated: xhrValidated, cheerioCrawlerSuccess: cheerioCrawlerLoaded};

    }

    /**
     * Search results from each data source obtained during analysis are all contained in the single array. 
     * This method will group search results form all of the data sources afor every keyword. 
     * @param searchResults 
     * @param keywords 
     * @returns 
     */
    public createConclusion(searchResults: SearchResults, xhrValidated: XhrValidation[], keywords: NormalizedKeywordPair[]): KeywordConclusion[] {

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
        for (const searchResult of searchResults.schemaFound) {
            conclusion.get(searchResult.keyword.index)?.SearchResults.schemaFound.push(searchResult);
        }
        for (const searchResult of searchResults.windowFound) {
            conclusion.get(searchResult.keyword.index)?.SearchResults.windowFound.push(searchResult);
        }
        return Array.from(conclusion.values());
    }

    /**
     * 
     * @param url Function will load initial response of analysed url and store it in validator.body
     * @returns 
     */
    public async loadHtml(url: string): Promise<boolean> {
        log.info("CheerioCrawler: loading input");

                // console.log("apify proxy passwod: " + process.env.APIFY_PROXY_PASSWORD)

        let proxyConfiguration;
        if (process.env.APIFY_PROXY_PASSWORD) {
            proxyConfiguration = await Actor.createProxyConfiguration({
                useApifyProxy: true
            });
        }
        const router = createCheerioRouter();
        // TODO: Ask Lukas about error handler
        router.addDefaultHandler(async ({ request, response, body, $, log }) => {

            // TODO: wtf?
            this.$ = cheerio.load($.html());
            // console.log(this.$.html());
            this.$body = $("body").get(0);
            this.body = body.toString();
            log.info("CheerioCrawler response receiver sucessfully with responseStatus: " + response.statusCode);
            await KeyValueStore.setValue("cheerioCrawlerInitial", this.body, { contentType: 'text/html; charset=utf-8' });



        });


        const crawler = new CheerioCrawler({
            proxyConfiguration: proxyConfiguration ?? undefined,
            requestHandler: router,
            requestHandlerTimeoutSecs: 30,
            maxRequestRetries: 10,

            
        });

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


        if (this.$ != null) {
            searchResult.forEach(searchResult => {
                const textFound = this.$!(searchResult.path).text();
                // TODO : check if .get(0)
                const textFoundValidationShort =  this.$!(searchResult.pathShort).text();


                // firefox selector
                // body > main:nth-child(2) > table:nth-child(2) > tbody:nth-child(1) > tr:nth-child(7) > td:nth-child(2) > code:nth-child(1)
                // chromium selector
                // body > main > table > tbody > tr:nth-child(7) > td > code


                // const cheerios = this.$!(searchResult.pathShort);
                // let textFound;
                // if (cheerios) {
                //     //this.$(this.getUniqueSelector(root)).text()
                //     textFound = this.$!(searchResult.path).text()
                //     cheerios.get().forEach(element => {
                //         console.log("Cheerio length: " + cheerios.length +" "+ element.text());

                //     });
                // }
                const validatedSearchResult = searchResult;
                validatedSearchResult.textFoundValidation = textFound;
                validatedSearchResult.score = textFound == searchResult.textFound ? searchResult.score : searchResult.score + 10000;
                validatedSearchResult.isValid = textFound === searchResult.textFound;
                validatedSearchResult.textFoundValidationShort = textFoundValidationShort;
                validatedHtml.push(validatedSearchResult)

            })
        };
        return validatedHtml.sort((a, b) => a.score - b.score);

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
                const textFoundValidation = JSONPath({ path: "$." + jsonSearchResult.path, json: source });
                const validatedSearchResult = jsonSearchResult;
                validatedSearchResult.textFoundValidation = textFoundValidation.length > 0? textFoundValidation[0] : null;
                validatedSearchResult.textFoundValidationShort = textFoundValidation.length > 0? textFoundValidation[0] : null;

                // console.log("Validation text:" + validatedSearchResult.textFoundValidation);
                // console.log("Analysis text:" + jsonSearchResult.textFound);

                validatedSearchResult.isValid = validatedSearchResult.textFoundValidation === jsonSearchResult.textFound;
                validatedJson.push(validatedSearchResult);
            } catch (e) {
                console.error(e);
            }
        }

        return validatedJson;

    }
}