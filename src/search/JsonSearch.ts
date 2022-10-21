import { isArray, isObject } from "lodash";
import { normalizeArray, normalizeString, NormalizedKeywordPair } from "./normalize";
import { SearchResult } from "./SearchResult";


export class JsonSearcher {

    normalizedKeywordsPair: NormalizedKeywordPair[];

    constructor(keywords: string[]) {
        this.normalizedKeywordsPair = normalizeArray(keywords);
    }

    public searchJson(json: any): null | SearchResult[] {
        return this.searchSubtree(json, [], 0);
    }


    public searchSubtree(subtree: any, path: string[], depth: number = 0): null | SearchResult[] {

        let searchResults: SearchResult[] = [];

        if (!subtree) {
            return null;
        } else if (isObject(subtree)) {
            Object.entries(subtree).forEach(([key, value]) => {
                const keySearch = this.searchSubtree(value, [...path, `${key}`], depth + 1);
                if (keySearch) {
                    searchResults.concat(keySearch);
                }
            });
            return searchResults;
        } else if (isArray(subtree)) {
            subtree.forEach((value, index) => {
                const elementSearch = this.searchSubtree(value, [...path, `[${index}]`], depth + 1);
                if (elementSearch) {
                    searchResults.concat(elementSearch);
                }
            })
            return searchResults;
        } else {
            const text = subtree.toString();
            const textNormalized = normalizeString(text);
            this.normalizedKeywordsPair.forEach((keyword) => {
                if (textNormalized.indexOf(keyword.normalized) != -1) {
                    searchResults.push(new SearchResult(path, keyword, text));
                }
            });

            return searchResults;
            // TODO: Calculate scores

        }

    }

}