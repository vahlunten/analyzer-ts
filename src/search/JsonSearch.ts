import { isArray, isObject } from "lodash";
import { normalizeString } from "../helpers/normalize";
import { DataOrigin, SearchResult, NormalizedKeywordPair } from "../types";


export class JsonSearcher {

    normalizedKeywordsPair: NormalizedKeywordPair[] = [];
    source?: DataOrigin;

    constructor() {

    }

    public searchJson(json: any, keywords: NormalizedKeywordPair[], source: DataOrigin): SearchResult[] {
        this.normalizedKeywordsPair = keywords;
        this.source = source;
        return this.searchSubtree(json, []);
    }

    public searchSubtree(subtree: any, path: string[]): SearchResult[] {

        let searchResults: SearchResult[] = [];

        if (!subtree) {
            return searchResults;
        } else if (isArray(subtree)) {
            subtree.forEach((value, index) => {
                const elementSearch = this.searchSubtree(value, [...path, `[${index}]`]);
                if (elementSearch) {
                    searchResults = searchResults.concat(elementSearch);
                }
            });
        } else if (isObject(subtree)) {
            Object.entries(subtree).forEach(([key, value]) => {
                const keySearch = this.searchSubtree(value, [...path, `${key}`]);
                if (keySearch) {
                    searchResults = searchResults.concat(keySearch);
                }
            });
        } else {
            const text = subtree.toString();
            const textNormalized = normalizeString(text);
            this.normalizedKeywordsPair.forEach((keyword) => {
                if (textNormalized.indexOf(keyword.normalized) != -1) {
                    searchResults.push(new SearchResult(path.join('.'), keyword, text, this.source!, path.join('.')));
                }
            });
            // TODO: Calculate scores
        }
        return searchResults;
    }

}

 