import cheerio from 'cheerio';
import { log } from 'crawlee';
import { result } from 'lodash';
import { normalizeString } from '../helpers/normalize';
import { DataSource, NormalizedKeywordPair, SearchResult } from '../types';

export class DOMSearch {
    private $: cheerio.Root;
    private keywords: NormalizedKeywordPair[] = [];

    public constructor(html: string) {
        this.$ = cheerio.load(html);
        // init(this.$);

    }


    public find(keywords: NormalizedKeywordPair[]): SearchResult[]{

        this.keywords = keywords;

        const htmlSearchResults = this.searchElement(this.$("body"), 0, []);
        // htmlSearchResults.forEach(element => {
        //     console.log(element.path + ":    " + element.textFound);
        // });

        return htmlSearchResults;
    }

    searchElement(root: cheerio.Cheerio, depth:number, path:string[]): SearchResult[] {
    
        let searchResults:SearchResult[] = [];

        if (root.children().length > 0) {

            // console.log("Entering parent: " + this.$(root).get(0).tagName);

            root.children().each((index, element) => {

                const search = this.searchElement(this.$(element), depth + 1, [...path, `${this.$(root).get(0).tagName}:nth-child(${index + 1})`]); 
                search.forEach(element => {
                    searchResults.push(element);
                });
            });
        } else {
            // console.log("Found element with no children: " + root.text());
            const normalizedText = normalizeString(root.text())
            
            this.keywords.forEach(keyword => {
                if (normalizedText.indexOf(keyword.normalized) != -1) {
                    searchResults.push( new SearchResult(path.join(" > "), keyword, normalizedText, DataSource.initial));
                }
                // console.log("Selectoros:     " + finder(this.$(root).ch, {}));
            })
        }
        return searchResults;

    }

}