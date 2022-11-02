import { ScrapedDataClass } from "../scraper/ScrapedData";
import { SearchResult } from "./SearchResult";

export function searchData(scraped:ScrapedDataClass) {
    const fitlered = removeDuplicates([],[]);
} 


// Filter duplicates obtained from initial response and those from loaded content.
// Only removes entries with matching selectors and matching text found value. 
// TODO: Make this work and more efficient 
export function removeDuplicates(initial:SearchResult[], dom:SearchResult[]): SearchResult[] {
    const filtered:SearchResult[] = [];

    
    initial.map(value => {
        for (const domResult of dom) {
            if (domResult.path === value.path && domResult.textFound === value.textFound ) {
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