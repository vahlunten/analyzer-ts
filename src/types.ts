import { Cookie } from "playwright";
import { threadId } from "worker_threads";


export interface InputSchema {
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
   
    public responseStatus: number | null = null;
    public initial: ScrapedPage | null = null;
    public DOM: ScrapedPage | null = null;

    public xhrParsed: ParsedRequestResponse[] | null = null;
    public cookies: Cookie[] | null = null;
    public error: Error | null = null;
    
    public allWindowProperties: { [key: string]: any } | null= null;
    public windowFound:SearchResult[] = [];

    public scrapingFinished:boolean = false;

}
/**
 * Html document with each data source parse.
 */
export class ScrapedPage {
    public body: string | null = null;
    public jsonLDData: any | null = null;
    public schemaOrgData: any | null = null;
    public metadata: any | null = null;
    public windowProperties: any | null = null;
    public searchResults: SearchResults | null= null;
}

/**
 * OUTPUT.JSON 
 */
export class Output {
    public url: string;
    public keywords: NormalizedKeywordPair[];

    public scrapedData?: ScrapedData;
    public searchResults:SearchResults | null = null;

    public keywordConclusions?:KeywordConclusion[];

    
    public analysisStarted: Date | null = null;
    public analysisEnded: Date | null = null;

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
    public htmlFound:SearchResult[] = [];
    public jsonFound:SearchResult[] = [];
    public schemaFound:SearchResult[] = [];
    public metaFound:SearchResult[] = [];
    public windowFound:SearchResult[] = [];
    public xhrFound:XhrSearchResult[] = [];
}


export class SearchResult
 {
    public path:string;
    public pathShort: string | null;
    public keyword: NormalizedKeywordPair;
    public textFound: string;
    public source: DataSource[] = [];
    public score: number = 0;
    public textFoundValidation: string | null;

    constructor(path: string, keyword: NormalizedKeywordPair, textFound: string, source: DataSource, pathShort = "") {
        this.path = path;
        this.keyword = keyword;
        this.textFound = textFound;
        this.source.push(source);
        this.textFoundValidation = null;
        this.pathShort = pathShort;
    }
}
export class XhrSearchResult {
    public searchResults: SearchResult[] = [];
    public parsedRequestResponse: ParsedRequestResponse;
    constructor (searchResults: SearchResult[], parsedRequestResponserse: ParsedRequestResponse) {
        this.searchResults = searchResults;
        this.parsedRequestResponse  = parsedRequestResponserse;
    }
}

export enum DataSource {
    initial = 'initial',
    rendered = 'rendered',
    cheerio = 'cheerioCrawler'
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
}

export interface ParsedResponse {
    body: string;
    status: number;
    headers: { [key: string]: string };
}