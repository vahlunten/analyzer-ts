import { KeywordConclusion, ScrapedDataClass } from "../scraper/ScrapedData";
import { SearchResult } from "../search/SearchResult";



export class Validator {

    public validate(scraped:ScrapedDataClass):Map<Number, KeywordConclusion> {
        let validatedData = new Map<Number, KeywordConclusion>();
        return validatedData;
    }


    public validateJson(searchResults: SearchResult[]) {

    }
}