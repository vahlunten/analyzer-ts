import { Cookie } from "playwright";
import { NormalizedKeywordPair } from "../helpers/normalize";
import { SearchResult } from "../search/SearchResult";
import { ParsedRequestResponse } from "./parsing/XHR/XHRRequests";

export class ScrapedDataClass {
   
    public initialResponseBody: string | null = null;
    public responseStatus: number | null = null;
    public domContent: string | null = null;

    public jsonLDData: any | null = null;
    public jsonLDDataInitial: any | null = null;

    public schemaOrgData: any | null = null;
    public schemaOrgDataInitial: any | null = null;

    public metadata: any | null = null;
    public metadataInitial: any | null = null;

    public windowProperties: any | null = null;
    public windowPropertiesInitial: any | null = null;

    public xhrParsed: ParsedRequestResponse[] | null = null;
    public cookies: Cookie[] | null = null;

    public searchResults:Map<Number, KeywordConclusion>[] = [];

}

export class Output {
    public url: string;
    public keywords: NormalizedKeywordPair[];

    public scrapedData?: ScrapedDataClass;
    public NormalizedKeywordPair?: NormalizedKeywordPair;

    constructor(url: string, keywords: NormalizedKeywordPair[]) {
        this.url = url;
        this.keywords = keywords;
    }
}


export class KeywordConclusion {
    public htmlFound:SearchResult[] = [];
    public jsonFound:SearchResult[] = [];
    public schemaFound:SearchResult[] = [];
    public metaFound:SearchResult[] = [];
    public windowFound:SearchResult[] = [];
    public xhrFound:SearchResult[] = [];

}