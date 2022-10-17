import { Cookie } from "playwright";
import { ParsedRequestResponse } from "../parsing/XHR/XHRRequests";

export class ScrapedDataClass {
    public url: string;
    public keywords: string[];

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

    public xhrParsed: ParsedRequestResponse[] | null = null;
    public cookies: Cookie[] | null = null;




    public constructor(url: string, keywords: string[]) {
        this.url = url;
        this.keywords = keywords;
    }


}
// export interface DataSource {
//     data: any[],
//     dataFound: SearchResult[],

// }

// export interface SearchResult {
//     keyword: string,
//     path: string,
//     data: string,
// }