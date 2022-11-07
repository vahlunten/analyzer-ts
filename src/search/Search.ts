import { NormalizedKeywordPair } from "../helpers/normalize";
import { ScrapedDataClass, SearchResults } from "../scraper/ScrapedData";
import { JsonSearcher } from "./JsonSearch";
import { DataSource, SearchResult } from "./SearchResult";

export function searchData(scraped: ScrapedDataClass, keywords: NormalizedKeywordPair[]): SearchResults {
    const fitlered = removeDuplicates([], []);

    // every 
    const searchResults: SearchResults = new SearchResults();
    const jsonSearcher = new JsonSearcher();


    // merge search results, possible duplicates will be removed later
    let jsonLdFound = jsonSearcher.searchJson(scraped.initial?.jsonLDData, keywords, DataSource.initial);
    jsonLdFound = jsonLdFound.concat(jsonSearcher.searchJson(scraped.DOM?.jsonLDData, keywords, DataSource.rendered));
    searchResults.jsonFound = jsonLdFound;


    // TODO: search meta
    let metaFound = jsonSearcher.searchJson(scraped.initial?.metadata, keywords, DataSource.initial);
    metaFound = metaFound.concat(jsonSearcher.searchJson(scraped.DOM?.metadata, keywords, DataSource.rendered)); 
    searchResults.metaFound = metaFound;
    // TODO: search html
    
    // TODO: search XHR

    let xhrFound: SearchResult[] = [];
    scraped.xhrParsed?.forEach( xhr => {
        if (xhr.response.headers["content-type"]?.indexOf('json') != -1 && xhr.response.body?.length > 0) {
            xhrFound = xhrFound.concat(jsonSearcher.searchJson(JSON.parse(xhr.response.body), keywords, DataSource.initial));
        }
    });
    searchResults.xhrFound = xhrFound;



    // TODO: search window
    // TODO: search schema

    return searchResults;
}




// Filter duplicates obtained from initial response and those from loaded content.
// Only removes entries with matching selectors and matching text found value. 
// TODO: Make this work and more efficient 
export function removeDuplicates(initial: SearchResult[], dom: SearchResult[]): SearchResult[] {
    const filtered: SearchResult[] = [];


    initial.map(value => {
        for (const domResult of dom) {
            if (domResult.path === value.path && domResult.textFound === value.textFound) {
                filtered.push(value);
            }
        }
    });

    dom.map(domValue => {
        for (const filteredValue of filtered) {
            if (domValue.path === filteredValue.path && domValue.textFound != filteredValue.textFound) {
                filtered.push(filteredValue);
            }

        }
    })

    return filtered;
}