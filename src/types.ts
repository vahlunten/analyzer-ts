import { Cookie } from "playwright";
import { ProxyConfigurationOptions } from "apify";
export interface Input {
    // analyzed url 
    url: string;
    // an array of keyword strings
    keywords: string[];
    // proxy configuration
    proxyConfig: ProxyConfigurationOptions & { useApifyProxy?: boolean };
}

export interface RunDetails {
    started: string,
    success: boolean,
    url: string

}
/**
 * Representation of the keyword. 
 */
export interface NormalizedKeywordPair {
    // original keyword string
    original: string,
    // normalized keyword string
    normalized: string,
    // omdex of the keyword
    index: number
}


export class ScrapedData {

    // response status of the browsers initial request response
    responseStatus: number | null = null;
    // parsed initial response from chromium
    initial: ScrapedPage | null = null;
    // parsed inirial response from cheerioCrawler
    parsedCheerio: ScrapedPage | null = null;
    // parsed HTML rendered in the browser
    DOM: ScrapedPage | null = null;
    // window object cleared of circular dependencies and parsed
    allWindowProperties: { [key: string]: any } | null = null;
    // search results of keywords found in the window object
    windowFound: SearchResult[] = [];
    // all intercepted XHR requests parsed
    xhrParsed: ParsedRequestResponse[] | null = null;
    // cookies captured during the browser session 
    cookies: Cookie[] | null = null;
    // error if the parsing of the HTML document failed due to uncaught exception
    error: Error | null = null;
    // indicates whether the HTML document was sucessfully scraped and parsed
    scrapingFinished: boolean = false;
    navigated: boolean = false;
    initialLoaded: boolean = false;

}
/**
 * Scraped content of an HTML document. 
 */
export class ScrapedPage {
    // HTML document data
    body: string | null = null;
    // scraped and parsed JSON-LD data
    jsonLDData: any = null;
    // parsed schema.org -> microdata
    schemaOrgData: any = null;
    // parsed meta tags
    metadata: any = null;
}

/**
 * OUTPUT.JSON 
 */
export class Output {
    // analyzed url
    url: string = "";
    // analyzed keywords with normalized form 
    keywords: NormalizedKeywordPair[] = [];
    // HTML documents (initial response, rendered dom, cheerioCrawler response) 
    // scraped and parsed 
    scrapedData: ScrapedData | null = null;
    // search results from the initial response and rendered dom 
    // for all of the keywords merged in a single array
    // left here for the development purposes, theses search results 
    // get validated and assorted to the particular keyword in the
    // validation step and saved in the keywordConclusions field
    searchResults: SearchResults | null = null;
    // an array of the analysis results for each keyword
    keywordConclusions: KeywordConclusion[] = [];
    // xhr requests containing any of the kwyword are replicated using
    // got-scraping, attempts to replicate the calls are saved in the
    //  xhrValidated field
    xhrValidated: XhrValidation[] = [];

    // indicates whether the cheerioCrawler succeedeed to get the initial response
    cheerioCrawlerSuccess: boolean = false;
    analysisStarted: string | null = null;
    analysisEnded: string | null = null;
    // indicates whether the actor finished sucessfully
    actorSuccess: boolean = true;
    // error if the analyzer failed due to uncaught exception
    errorMessage: string | null = null;

    setInput(url: string, keywords: NormalizedKeywordPair[]) {
        this.url = url;
        this.keywords = keywords;
    }

}

/**
 * All the information found about the keyword. 
 */
export interface KeywordConclusion {
    // input keyword 
    Keyword: NormalizedKeywordPair;
    // search results of this keyword
    SearchResults: SearchResults;
    ValidatedXhr: XhrValidation[];
}

export class SearchResults {
    // all the ways the keyword can be scraped 
    canBeScrapedWith: DataOrigin[] = [];
    htmlFound: SearchResult[] = [];
    jsonFound: SearchResult[] = [];
    schemaFound: SearchResult[] = [];
    metaFound: SearchResult[] = [];
    windowFound: SearchResult[] = [];
    xhrFound: XhrSearchResult[] = [];
}

/**
 * 
 */
export class SearchResult {
    // JSONPath exoression or css selector
    path: string;
    // if the path is a selector, pathShort is a more robust 
    // selector, preferably containing class or id of a parent
    pathShort: string | null;
    // a keyword
    keyword: NormalizedKeywordPair;
    // text found for this keyword during the analysis on the element with:
    //   path for JSON objects
    //   pathShort for HTML 
    textFound: string;
    // text found with the long selector
    textFoundLong: string;
    // indicates origin of the data, where the keyword was found
    source: DataOrigin[] = [];
    // score of the path/selector
    score: number;
    // text found during the validation of this search result with path
    textFoundValidation: string | null;
    // text found during the validation of this search result with pathShort
    textFoundValidationShort: string | null;
    isValid: boolean;


    // TODO: add found in lists property
    constructor(path: string, keyword: NormalizedKeywordPair, textFound: string, source: DataOrigin, pathShort = "", textFoundValidationShort = "", textFoundLong = "", score = 0, isValid = false) {
        this.path = path;
        this.keyword = keyword;

        this.textFound = textFound;
        this.textFoundLong = textFoundLong;

        this.source.push(source);
        this.pathShort = pathShort;
        this.score = score;
        this.isValid = isValid;
        this.textFoundValidation = null;
        this.textFoundValidationShort = textFoundValidationShort
    }
}
export class XhrSearchResult {
    searchResults: SearchResult[] = [];
    parsedRequestResponse: ParsedRequestResponse;
    constructor(searchResults: SearchResult[], parsedRequestResponserse: ParsedRequestResponse, index:number) {
        this.searchResults = searchResults;
        this.parsedRequestResponse = parsedRequestResponserse;
        this.index = index;
    };
    index: number;
}

// 
export enum DataOrigin {
    // initial response of the chromium browser
    initial = 'initial',
    // render html document
    rendered = 'rendered',
    // initial response from the cheerioCrawler
    cheerio = 'cheerioCrawler',
    // xhr request made by chromium
    xhr = 'xhr',
    // got-scraping request
    got = 'got'
}

// type of selector
export enum DataSource {
    cssselector = "cssselector",
    jsonld = "jsonld",
    meta = "meta",
    microdata = "microdata",
    window = "window"


}
export interface ParsedRequestResponse {
    request: ParsedRequest;
    response: ParsedResponse;
    error: null | string;
    initial: boolean;
}
export interface ParsedRequest {
    url: string;
    method: string;
    headers: { [key: string]: string };
    body: string | null
}

export interface ParsedResponse {
    body: string;
    status: number;
    headers: { [key: string]: string };
}

export interface XhrValidation {
    callsMinimalHeaders: GotCall[],
    callsWithOriginalHeaders: GotCall[],
    callWithCookies: GotCall[],
    originalRequestResponse: ParsedRequestResponse,
    validationSuccess: boolean,
    lastCall: GotCall | null,
    xhrSearchResult: XhrSearchResult,
    index: number
}
export type GotCallType = "minimalHeaders" | "withouCookieHeaders" | "originalHeaders";
//     minimalHeaders = "minimalHeaders"
//     withoutCookieHeaders = "withouCookieHeaders",
//     originalHeaders = "originalHeaders"

// }
export interface GotCall {
    parsedRequestResponse: ParsedRequestResponse,
    searchResults: SearchResult[],
    callSuccess: true | false;
    isValid: true | false;
    keywordsFound: NormalizedKeywordPair[],
    callType: GotCallType
}
export interface CrawlerConfig {
    // keyword0 is saved at index 0 ins ui svelte-store 
    keywordSelectors: KeywordSelector[],
}

// when creating a configurtion from the ui, user will select multiple selectors for each keyword
// 
export interface KeywordSelector {
    keyword: NormalizedKeywordPair,
    selectors: SearchResults
}
