import { DataSource, NormalizedKeywordPair, SearchResult, ScrapedData, SearchResults } from "../types";
import { JsonSearcher } from "./JsonSearch";

export function searchData(scraped: ScrapedData, keywords: NormalizedKeywordPair[]): SearchResults {

    const searchResults: SearchResults = new SearchResults();

    // search JsonLD
    searchResults.jsonFound = SearchJsonData(scraped.initial?.jsonLDData, scraped.DOM?.jsonLDData, keywords);
    // search meta
    searchResults.metaFound = SearchJsonData(scraped.initial?.metadata, scraped.DOM?.metadata, keywords);
    // Search XHR
    let xhrFound: SearchResult[] = [];
    const jsonSearcher = new JsonSearcher();

    scraped.xhrParsed?.forEach(xhr => {
        if (xhr.response.headers["content-type"]?.indexOf('json') != -1 && xhr.response.body?.length > 0) {
            xhrFound = xhrFound.concat(jsonSearcher.searchJson(JSON.parse(xhr.response.body), keywords, DataSource.initial));
        }
    });
    searchResults.xhrFound = xhrFound;


    // TODO: search html
    // TODO: search window
    // TODO: search schema

    return searchResults;
}


export function SearchJsonData(initial: any, rendered: any, keywords: NormalizedKeywordPair[]): SearchResult[] {
    const jsonSearcher = new JsonSearcher();
    let searchResultsInitial = jsonSearcher.searchJson(initial, keywords, DataSource.initial);
    let searchResultsRendered = jsonSearcher.searchJson(rendered, keywords, DataSource.rendered);
    const filtered = removeDuplicates(searchResultsInitial, searchResultsRendered);
    return filtered;
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