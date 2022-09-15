export interface ScrapedData {
    url: null | string;
    initialResponseBody: null | string;
    responseStatus: null | number;
    jsonLDData: any[],
    metadata: any,
    schemaOrgData: any,
    domContent: string
    // jsonLDData: Array<any>;
    // schemaOrgData: Array<any>;
    // windowPropertiesData: Array<[string, string]>,

     
    

};

export interface DataSource {
    data: any[],
    dataFound: SearchResult[],

}

export interface SearchResult {
    keyword: string,
    path: string,
    data: string,
}