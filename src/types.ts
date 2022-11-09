import { Cookie } from "playwright";


export interface InputSchema {
    url: string;
    keywords: string[];
}

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
    

}

export class ScrapedPage {
    public body: string | null = null;
    public jsonLDData: any | null = null;
    public schemaOrgData: any | null = null;
    public metadata: any | null = null;
    public windowProperties: any | null = null;
    public searchResults: SearchResults | null= null;
}

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
    public xhrFound:SearchResult[] = [];
}


export class SearchResult
 {
    public path:string;
    public keyword: NormalizedKeywordPair;
    public textFound: string;
    public source: DataSource[] = [];
    public score: number = 0;
    public textFoundValidation: string | null;

    constructor(path: string, keyword: NormalizedKeywordPair, textFound: string, source: DataSource) {
        this.path = path;
        this.keyword = keyword;
        this.textFound = textFound;
        this.source.push(source);
        this.textFoundValidation = null;
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
    url: String;
    method: string;
    headers: { [key: string]: string };
}

export interface ParsedResponse {
    body: string;
    status: number;
    headers: { [key: string]: string };
}