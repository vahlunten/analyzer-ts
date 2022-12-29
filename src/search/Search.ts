import log from "@apify/log";
import { DataSource, NormalizedKeywordPair, SearchResult, ScrapedData, SearchResults, ParsedRequestResponse, XhrSearchResult } from "../types";
import { DOMSearch } from "./DOMSearch";

import { JsonSearcher } from "./JsonSearch";

export function searchData(scraped: ScrapedData, keywords: NormalizedKeywordPair[]): SearchResults {

    const searchResults: SearchResults = new SearchResults();


    // search html
    searchResults.htmlFound = searchHtml(scraped.initial?.body!, scraped.DOM?.body!, keywords); 
    // search schema
    searchResults.schemaFound = SearchJsonData(scraped.initial?.schemaOrgData, scraped.DOM?.schemaOrgData, keywords);
    // search JsonLD
    searchResults.jsonFound = SearchJsonData(scraped.initial?.jsonLDData, scraped.DOM?.jsonLDData, keywords);
    // search meta
    searchResults.metaFound = SearchJsonData(scraped.initial?.metadata, scraped.DOM?.metadata, keywords);
    // search xhr
    const xhrFound = searchXHR(scraped.xhrParsed!, keywords);
    searchResults.xhrFound = xhrFound;
    // search window
    const windowSearchResults = searchWIndowObject(scraped.windowFound, keywords);
    searchResults.windowFound = windowSearchResults;

    return searchResults;
}

function searchHtml(initial: string, rendered: string, keywords: NormalizedKeywordPair[]): SearchResult[] {

    let domSearcher = new DOMSearch(initial, DataSource.initial);
    const initialSearchResults  = domSearcher.find(keywords);   

    domSearcher = new DOMSearch(rendered, DataSource.rendered);
    const domSearchResults  = domSearcher.find(keywords);   


    const filtered = removeDuplicates(initialSearchResults, domSearchResults);
    return filtered;
}

function SearchJsonData(initial: any, rendered: any, keywords: NormalizedKeywordPair[]): SearchResult[] {
    const jsonSearcher = new JsonSearcher();
    let searchResultsInitial = jsonSearcher.searchJson(initial, keywords, DataSource.initial);
    let searchResultsRendered = jsonSearcher.searchJson(rendered, keywords, DataSource.rendered);
    const filtered = removeDuplicates(searchResultsInitial, searchResultsRendered);
    return filtered;
}

// TODO: Use this inside XHR validation 
export function searchXHR(xhrParsed: ParsedRequestResponse[], keywords: NormalizedKeywordPair[]):XhrSearchResult[] {
    let xhrFound: XhrSearchResult[] = [];

    xhrParsed?.forEach(xhr => {
        if (xhr.response.headers["content-type"] != null) {
            if (xhr.response.headers["content-type"].indexOf('json') != -1 && xhr.response.body?.length > 0) {

                const jsonSearcher = new JsonSearcher();
                const xhrSearchResult = (jsonSearcher.searchJson(JSON.parse(xhr.response.body), keywords, DataSource.xhr));
                if (xhrSearchResult.length > 0) {
                    xhrFound.push(new XhrSearchResult(xhrSearchResult, xhr));
                }
            }

            if (xhr.response.headers["content-type"].indexOf('html') != -1 && xhr.response.body?.length > 0) {
                const domSearcher = new DOMSearch(xhr.response.body, DataSource.xhr)
                const xhrSearchResult = (domSearcher.find(keywords));
                if (xhrSearchResult.length > 0) {
                    xhrFound.push(new XhrSearchResult(xhrSearchResult, xhr));
                }
            }
        }
       
    });
    return xhrFound;
}

function searchWIndowObject(windowFound: any, keywords: NormalizedKeywordPair[]): SearchResult[] {
    const jsonSearcher = new JsonSearcher();

    const windowSearchResults = jsonSearcher.searchJson(keywords, windowFound, DataSource.rendered);
    return windowSearchResults;

}



// Filter duplicates obtained from initial response and those from loaded content.
// Only removes entries with matching selectors and matching text found value. 
// TODO: Make this work and more efficient 
export function removeDuplicates(initial: SearchResult[], dom: SearchResult[]): SearchResult[] {
    const filtered: SearchResult[] = initial.concat(dom);
    // const filtered: SearchResult[] = [];

    // initial.map(value => {

    //     let duplicate = false;
    //     for (const domResult of dom) {
    //         if (domResult.path === value.path) {
    //             duplicate = true;
    //             // paths and text values are the same, we want to store one entry with both data sources set
    //             if (domResult.textFound === value.textFound) {
    //                 const copy = value;
    //                 // value already has "initial" data source set
    //                 value.source.push(DataSource.rendered);
    //                 filtered.push(copy);
    //             } else {
    //                 filtered.push(value);
    //                 filtered.push(domResult);
    //             }
    //             break;
    //         }

    //     }
    //     if(!duplicate) {
    //         filtered.push(value);
    //     }


    // });

    // dom.map(domValue => {
    //     let duplicate = false;
    //     for (const filteredValue of filtered) {
    //         if (domValue.path == filteredValue.path) {
    //             duplicate = true;
    //             break;
    //         }

    //     }

    //     if(!duplicate) {
    //         filtered.push(domValue);
    //     }
    // })

    return filtered;
}
