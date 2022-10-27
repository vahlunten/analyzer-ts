import { NormalizedKeywordPair } from "../helpers/normalize";

export class SearchResult {
    public path:string[];
    public keyword: NormalizedKeywordPair;
    public textFound: string;

    constructor(path: string[], keyword: NormalizedKeywordPair, textFound: string) {
        this.path = path;
        this.keyword = keyword;
        this.textFound = textFound;
    }

}