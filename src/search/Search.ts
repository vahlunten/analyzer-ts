import { DataOrigin, NormalizedKeywordPair, SearchResult, ScrapedData, SearchResults, ParsedRequestResponse, XhrSearchResult } from "../types";
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
    const windowSearchResults = SearchJsonData([], scraped.allWindowProperties,keywords);
    searchResults.windowFound = windowSearchResults;

    return searchResults;
}

function searchHtml(initial: string, rendered: string, keywords: NormalizedKeywordPair[]): SearchResult[] {

    let domSearcher = new DOMSearch(initial, DataOrigin.initial);
    const initialSearchResults  = domSearcher.find(keywords);   

    domSearcher = new DOMSearch(rendered, DataOrigin.rendered);
    const domSearchResults  = domSearcher.find(keywords);   


    const filtered = removeDuplicates(initialSearchResults, domSearchResults);
    return filtered;
}

function SearchJsonData(initial: any, rendered: any, keywords: NormalizedKeywordPair[]): SearchResult[] {
    const jsonSearcher = new JsonSearcher();
    let searchResultsInitial = jsonSearcher.searchJson(initial, keywords, DataOrigin.initial);
    let searchResultsRendered = jsonSearcher.searchJson(rendered, keywords, DataOrigin.rendered);
    const filtered = removeDuplicates(searchResultsInitial, searchResultsRendered);
    return filtered;
}

// TODO: Use this inside XHR validation bump
export function searchXHR(xhrParsed: ParsedRequestResponse[], keywords: NormalizedKeywordPair[]):XhrSearchResult[] {
    let xhrFound: XhrSearchResult[] = [];

    xhrParsed?.forEach(xhr => {
        if (xhr.response.headers["content-type"] != null) {
            if (xhr.response.headers["content-type"].indexOf('json') != -1 && xhr.response.body?.length > 0) {

                const jsonSearcher = new JsonSearcher();
                const xhrSearchResult = (jsonSearcher.searchJson(JSON.parse(xhr.response.body), keywords, DataOrigin.xhr));
                if (xhrSearchResult.length > 0) {
                    xhrFound.push(new XhrSearchResult(xhrSearchResult, xhr));
                }
            }

            if (xhr.response.headers["content-type"].indexOf('html') != -1 && xhr.response.body?.length > 0) {
                const domSearcher = new DOMSearch(xhr.response.body, DataOrigin.xhr)
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

    const windowSearchResults = jsonSearcher.searchJson(keywords, windowFound, DataOrigin.rendered);
    return windowSearchResults;

}



// Filter duplicates obtained from initial response and those from loaded content.
// Only removes entries with matching selectors and matching text found value. 
export function removeDuplicates(initial: SearchResult[], dom: SearchResult[]): SearchResult[] {
    const filtered: SearchResult[] = [];

    for (const initialElement of initial) {
        let foudDuplicate = false;
        for (const domElement of dom) {
            if (initialElement.pathShort === domElement.pathShort) {
                // found duplicate selector
                if (initialElement.textFound === domElement.textFound) {
                    // found duplicate selector with matching text
                    const duplicateElement = {...initialElement};
                    duplicateElement.source = initialElement.source.concat(domElement.source);     
                    filtered.push(duplicateElement);
                    foudDuplicate = true;
                    break;
                    
                }
            } 

        }
        if (!foudDuplicate) {
            filtered.push(initialElement);
        }
    }

    for (const domElement of dom) {
        if (filtered.filter( filteredElement => { return filteredElement.pathShort === domElement.pathShort}).length == 0) {
            filtered.push(domElement);
        }
    }
    // console.log("Filtered length" + filtered.length);
    // dom.forEach(domElement => {
    //     if (filtered.filter(filteredValue => {return domElement.pathShort === filteredValue.pathShort}).length == 0) {
    //         filtered.push(domElement);
    //     }
    // });

    return filtered;
}

//my JPATH
// export function getValue(selector: string, json: any): any {
//     const tokens = selector.split('.');
//     if (condition) {
        
//     }
// }