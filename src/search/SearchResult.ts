import { NormalizedKeywordPair } from "../helpers/normalize";

export class SearchResult
 {
    public path:string[];
    public keyword: NormalizedKeywordPair;
    public textFound: string;
    public source: DataSource;
    public score: number = 0;
    public textFoundValidation: string | null;

    constructor(path: string[], keyword: NormalizedKeywordPair, textFound: string, source: DataSource) {
        this.path = path;
        this.keyword = keyword;
        this.textFound = textFound;
        this.source = source;
        this.textFoundValidation = null;
    }
}

export enum DataSource {
    initial = 'initial',
    rendered = 'rendered',
    cheerio = 'cheerioCrawler'
}

