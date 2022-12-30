import { isArray, isObject } from "lodash";
import { normalizeString } from "../helpers/normalize";
import { DataSource, SearchResult, NormalizedKeywordPair } from "../types";


export class JsonSearcher {

    normalizedKeywordsPair: NormalizedKeywordPair[] = [];
    source?: DataSource;

    constructor() {

    }

    public searchJson(json: any, keywords: NormalizedKeywordPair[], source: DataSource): SearchResult[] {
        this.normalizedKeywordsPair = keywords;
        this.source = source;
        return this.searchSubtree(json, [], 0);
    }

    public searchSubtree(subtree: any, path: string[], depth: number = 0): SearchResult[] {

        let searchResults: SearchResult[] = [];

        if (!subtree) {
            return searchResults;
        } else if (isArray(subtree)) {
            subtree.forEach((value, index) => {
                const elementSearch = this.searchSubtree(value, [...path, `[${index}]`], depth + 1);
                if (elementSearch) {
                    searchResults = searchResults.concat(elementSearch);
                }
            });
        } else if (isObject(subtree)) {
            Object.entries(subtree).forEach(([key, value]) => {
                const keySearch = this.searchSubtree(value, [...path, `${key}`], depth + 1);
                if (keySearch) {
                    searchResults = searchResults.concat(keySearch);
                }
            });
        } else {
            const text = subtree.toString();
            const textNormalized = normalizeString(text);
            this.normalizedKeywordsPair.forEach((keyword) => {
                if (textNormalized.indexOf(keyword.normalized) != -1) {
                    searchResults.push(new SearchResult(path.join('.'), keyword, text, this.source!));
                }
            });
            // TODO: Calculate scores
        }
        return searchResults;
    }

}

 