import { isArray, isObject } from "lodash";
import { normalizeArray, normalizeString, NormalizedKeywordPair as KeywordNormalizedPair } from "../helpers/normalize";
import { SearchResult } from "./SearchResult";


export class JsonSearcher {

    normalizedKeywordsPair: KeywordNormalizedPair[] = [];

    constructor() {
       
    }

    public searchJson(json: any, keywords: KeywordNormalizedPair[]): null | SearchResult[] {
        this.normalizedKeywordsPair = keywords;
        return this.searchSubtree(json, [], 0);
    }

    public searchSubtree(subtree: any, path: string[], depth: number = 0): null | SearchResult[] {

        let searchResults: SearchResult[] = [];

        if (!subtree) {
            return null;
        } else if (isArray(subtree)) {
            subtree.forEach((value, index) => {
                const elementSearch = this.searchSubtree(value, [...path, `[${index}]`], depth + 1);
                if (elementSearch) {
                    searchResults = searchResults.concat(elementSearch);
                }
            })
            // return searchResults;
        } else if (isObject(subtree)) {
            Object.entries(subtree).forEach(([key, value]) => {
                const keySearch = this.searchSubtree(value, [...path, `${key}`], depth + 1);
                if (keySearch) {
                    searchResults = searchResults.concat(keySearch);
                }
            });
            // return searchResults;
        } else {
            const text = subtree.toString();
            const textNormalized = normalizeString(text);
            this.normalizedKeywordsPair.forEach((keyword) => {
                if (textNormalized.indexOf(keyword.normalized) != -1) {
                    searchResults.push(new SearchResult(path, keyword, text));
                }
            });
            // TODO: Calculate scores
        }
        return searchResults;
    }

}