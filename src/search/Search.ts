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
    let jsonLdFound = jsonSearcher.searchJson(scraped.jsonLDData, keywords, DataSource.rendered);
    jsonLdFound = jsonLdFound.concat(jsonSearcher.searchJson(scraped.jsonLDDataInitial, keywords, DataSource.initial));
    searchResults.jsonFound = jsonLdFound;


    // TODO: search meta
    let metaFound = jsonSearcher.searchJson(scraped.metadata, keywords, DataSource.rendered);
    metaFound.concat(jsonSearcher.searchJson(scraped.metadataInitial, keywords, DataSource.initial)); 
    searchResults.metaFound = metaFound;
    // TODO: search html
    
    // TODO: search XHR
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