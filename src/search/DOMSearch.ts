import cheerio from 'cheerio';
import { NormalizedKeywordPair, SearchResult } from '../types';

export class DOMSearch {
    private $: cheerio.Root;
    private keywords: NormalizedKeywordPair[] = [];

    public constructor(html: string) {
        this.$ = cheerio.load(html);
    }


    public find(keywords: NormalizedKeywordPair[]) {

        this.keywords = keywords;
        const result: SearchResult[] = [];

        let $body = this.$('body');
        if (!$body.length) $body = this.$.root();

        const cheerioElements = $body.children().each((index, element) =>
        {            
            console.log(this.$(element).text());
            this.searchElement("", this.$(element));            
        });

        // return result;
    }
    searchElement(tagName: string, root: cheerio.Cheerio){
        
        let $body = root;

        $body.children().each((index, element) =>
        {            
            console.log(this.$(element));
            this.searchElement("", this.$(element));            
        });
    }
}