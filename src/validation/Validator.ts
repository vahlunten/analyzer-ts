import { KeywordConclusion, ScrapedData, NormalizedKeywordPair, ScrapedPage, SearchResults, SearchResult, XhrValidation, DataOrigin } from "../types";
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
     * Compares the search results from the analysis and the browser session and compare with the results of initial response loaded by cheerioCrawler.
     * This funtion will also validate XHR requests.
     * @param url 
     * @param keywords 
     * @param searchResults 
     * @returns 
     */
    public async validate(url: string, keywords: NormalizedKeywordPair[], searchResults: SearchResults): Promise<{ conclusion: KeywordConclusion[], xhrValidated: XhrValidation[], cheerioCrawlerSuccess: boolean, parsedCheerio: ScrapedPage | null}> {
        let validatedData: KeywordConclusion[];
        let xhrValidated: XhrValidation[] = [];
        // load initial html with a simple HTTP client
        const cheerioCrawlerLoaded = await this.loadHtml(url);
        // validate XHR requests    
        xhrValidated = await validateAllXHR(searchResults.xhrFound, keywords);
        await KeyValueStore.setValue("xhrValidation", JSON.stringify(xhrValidated, null, 2), { contentType: 'application/json; charset=utf-8' });


        // if we failed to load the initial response by cheerioCrawler, there is nothing to validate against
        if (cheerioCrawlerLoaded == false) {

            // assign each search result to the correct keyword
            validatedData = this.createConclusion(searchResults, xhrValidated, keywords);

        } else {

            const validatedSearchResults = new SearchResults();
            // parse the initial response the same way as during the analysis
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

            // assign each search result to the correct keyword
            validatedData = this.createConclusion(validatedSearchResults, xhrValidated, keywords);
        }


        return { conclusion: validatedData, xhrValidated: xhrValidated, cheerioCrawlerSuccess: cheerioCrawlerLoaded, parsedCheerio: this.parsedCheerio};

    }

    /**
     * Search results from each data source (html, json+ld...) obtained during the analysis are all contained in a single array. 
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
            const keywordConclusion = conclusion.get(searchResult.keyword.index);
            keywordConclusion?.SearchResults.jsonFound.push(searchResult);
            keywordConclusion!.SearchResults.canBeScrapedWith = this.mergeSources(keywordConclusion?.SearchResults.canBeScrapedWith!, searchResult.source)
        }
        for (const searchResult of searchResults.metaFound) {
            const keywordConclusion = conclusion.get(searchResult.keyword.index);
            keywordConclusion?.SearchResults.metaFound.push(searchResult);
            keywordConclusion!.SearchResults.canBeScrapedWith = this.mergeSources(keywordConclusion?.SearchResults.canBeScrapedWith!, searchResult.source)

        }
        for (const searchResult of searchResults.htmlFound) {
            const keywordConclusion = conclusion.get(searchResult.keyword.index);
            keywordConclusion?.SearchResults.htmlFound.push(searchResult);
            keywordConclusion!.SearchResults.canBeScrapedWith = this.mergeSources(keywordConclusion?.SearchResults.canBeScrapedWith!, searchResult.source)
        }
        for (const searchResult of searchResults.schemaFound) {
            const keywordConclusion = conclusion.get(searchResult.keyword.index);
            keywordConclusion?.SearchResults.schemaFound.push(searchResult);
            keywordConclusion!.SearchResults.canBeScrapedWith = this.mergeSources(keywordConclusion?.SearchResults.canBeScrapedWith!, searchResult.source)
        }
        for (const searchResult of searchResults.windowFound) {
            const keywordConclusion = conclusion.get(searchResult.keyword.index);
            keywordConclusion?.SearchResults.windowFound.push(searchResult);
            keywordConclusion!.SearchResults.canBeScrapedWith = this.mergeSources(keywordConclusion?.SearchResults.canBeScrapedWith!, searchResult.source)            
        }

        for (const xhr of xhrValidated) {
            for (const call of xhr.callWithCookies) {
                for (const kw of call.keywordsFound) {
                    const keywordConclusion = conclusion.get(kw.index);
                    // keywordConclusion?.SearchResults.xhrFound.push(xhrValidated);
                    keywordConclusion!.SearchResults.canBeScrapedWith = this.mergeSources(keywordConclusion?.SearchResults.canBeScrapedWith!, [DataOrigin.got]);
                }
            }
        }

        return Array.from(conclusion.values());
    }

    mergeSources(oldData: DataOrigin[], newDataSoure: DataOrigin[]) {
        const newSources: DataOrigin[] = [...oldData];
        for (const source of newDataSoure) {
            if (!oldData.includes(source)) {
                newSources.push(source);
            }
        }
        return newSources;
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

            this.$ = cheerio.load($.html());
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
            // failedRequestHandler: 

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
                const textFoundValidationShort = this.$!(searchResult.pathShort).text();


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
                if (textFound === searchResult.textFound) {
                    validatedSearchResult.isValid = true;
                    validatedSearchResult.source.push(DataOrigin.cheerio);
                }
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
                validatedSearchResult.textFoundValidation = textFoundValidation.length > 0 ? textFoundValidation[0] : null;
                validatedSearchResult.textFoundValidationShort = textFoundValidation.length > 0 ? textFoundValidation[0] : null;

                // console.log("Validation text:" + validatedSearchResult.textFoundValidation);
                // console.log("Analysis text:" + jsonSearchResult.textFound);

                if (validatedSearchResult.textFoundValidation === jsonSearchResult.textFound) {
                    validatedSearchResult.isValid = true;
                    validatedSearchResult.source.push(DataOrigin.cheerio);
                }
                
                validatedJson.push(validatedSearchResult);

                // TODO: unify error messages styles
                // TODO: improve error handling
            } catch (e) {
                console.error(e);
            }
        }

        return validatedJson;

    }
}