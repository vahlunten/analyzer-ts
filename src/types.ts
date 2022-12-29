import { Cookie } from "playwright";

export interface Input {
    url: string;
    keywords: string[];
}
/**
 * 
 */
export interface NormalizedKeywordPair {
    original: string, 
    normalized: string,
    index: number    
}


export class ScrapedData {
   
    responseStatus: number | null = null;
    initial: ScrapedPage | null = null;
    DOM: ScrapedPage | null = null;

    xhrParsed: ParsedRequestResponse[] | null = null;
    cookies: Cookie[] | null = null;
    error: Error | null = null;
    
    allWindowProperties: { [key: string]: any } | null= null;
    windowFound:SearchResult[] = [];

    scrapingFinished:boolean = false;

}
/**
 * Scraped content of HTML document. 
 */
export class ScrapedPage {
    body: string | null = null;
    jsonLDData: any | null = null;
    schemaOrgData: any | null = null;
    metadata: any | null = null;
    windowProperties: any | null = null;
    searchResults: SearchResults | null= null;
}

/**
 * OUTPUT.JSON 
 */
export class Output {
    url: string;
    keywords: NormalizedKeywordPair[];

    scrapedData?: ScrapedData;
    searchResults:SearchResults | null = null;

    keywordConclusions?:KeywordConclusion[];

    xhrValidated: XhrValidation[] = [];

    
    analysisStarted: string | null = null;
    analysisEnded: string | null = null;

    actorSuccess: boolean = true;
    errorMessage: string | null = null;

    constructor(url: string, keywords: NormalizedKeywordPair[]) {
        this.url = url;
        this.keywords = keywords;
    }
}


export interface KeywordConclusion {
    SearchResults:SearchResults;
    Keyword:NormalizedKeywordPair;
}

export class SearchResults {
    htmlFound:SearchResult[] = [];
    jsonFound:SearchResult[] = [];
    schemaFound:SearchResult[] = [];
    metaFound:SearchResult[] = [];
    windowFound:SearchResult[] = [];
    xhrFound:XhrSearchResult[] = [];
}


export class SearchResult
 {
    path:string;
    pathShort: string | null;
    keyword: NormalizedKeywordPair;
    textFound: string;
    textFoundShort: string;
    source: DataSource[] = [];
    score: number;
    textFoundValidation: string | null;
    textFoundValidationShort: string | null;
    isValid: boolean;


    constructor(path: string, keyword: NormalizedKeywordPair, textFound: string, source: DataSource, pathShort = "", textFoundValidationShort="", textFoundShort = "", score = 0, isValid = false) {
        this.path = path;
        this.keyword = keyword;
        // text found in i

        this.textFound = textFound;
        this.textFoundShort = textFoundShort;

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
    constructor (searchResults: SearchResult[], parsedRequestResponserse: ParsedRequestResponse) {
        this.searchResults = searchResults;
        this.parsedRequestResponse  = parsedRequestResponserse;
    }
}

export enum DataSource {
    initial = 'initial',
    rendered = 'rendered',
    cheerio = 'cheerioCrawler',
    got = 'got',
    xhr = 'xhr'
}

export interface ParsedRequestResponse {
    request: ParsedRequest;
    response: ParsedResponse;
    error: null | string;
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
    validationSuccess: boolean
}
export interface GotCall {
    parsedRequestResponse: ParsedRequestResponse, 
    searchResults: SearchResult[],
    callSuccess: true | false;
    isValid: true | false;
}

export type ResourceType = "initial"| "browser" | "xhr" | "window";