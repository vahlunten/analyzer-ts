import cheerio from 'cheerio';
// import { Cheerio } from 'cheerio';
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


    public find(keywords: NormalizedKeywordPair[]): SearchResult[] {

        this.keywords = keywords;

        const htmlSearchResults = this.searchElement(this.$.root(), 0,":root", []);
        // htmlSearchResults.forEach(element => {
        //     console.log(element.path + ":    " + element.textFound);
        // });

        return htmlSearchResults;
    }

    // traverseBack(root: cheerio.Cheerio, path: string[]): string {
    //     let newPath: string = "";

    //     const parents = this.$(root).parents().each((index, element) => {
    //         console.log("Parent: " + this.$(element).get(0).tagName);
    //         let id = this.$(element).attr("id");
    //         if (id != "") {
    //             if (id == "h1c") {
    //                 console.log("H1c found.")
    //             }
    //             // #h1c > h1:nth-child(1)
    //             let newPathArray: string[] = [];
    //             this.$(root).parentsUntil(`#${id}`).each((i, e) => { newPathArray.push(this.$(e).get(0).tagName) });
    //             newPath = [`#${id}`, " > ", this.$(element).get(0).tagName, ":", newPathArray.join(" > ")].join("");
    //             console.log("Id:" + id);
    //         }
    //         // console.log("Tagname" + this.$(element).);
    //         // console.log("Old path: " + path.join(" > "));
    //     });

    //     // parents.forEach(parent => {
    //     //     if (parent) {

    //     //     }
    //     //     depth++;
    //     //     console.log()
    //     // });
    //     return newPath;
    // }
    getUniqueSelector(el: cheerio.Cheerio): string {
        var el = el;
        var parents = el.parents();
        if (!parents[0]) {
            // Element doesn't have any parents
            return ':root';
        }
        var selector = this.getElementSelector(el);
        var i = 0;
        var elementSelector;

        if (selector[0] === '#' || selector[0] === '.' || selector === 'body') {
            return selector;
        }

        do {
            elementSelector = this.getElementSelector(this.$(parents[i]));
            selector = elementSelector + ' > ' + selector;
            i++;
        } while (i < parents.length - 1 ); // Stop before we reach the html element parent
        return selector;
    };

    getElementSelector(el: cheerio.Cheerio): string {
        if (el.attr('id')) {
            return '#' + el.attr('id');
        } else if(el.attr('class')) {
            // TODO: check unique class
            return '.' + el.attr('class');
        }else {
            var tagName = el.get(0).tagName;
            if (tagName === 'body') {
                return tagName;
            }
            if (el.siblings().length === 0) {
                return el.get(0).tagName;
            }
            if (el.index() === 0) {
                return el.get(0).tagName + ':first-child';
            }
            if (el.index() === el.siblings().length) {
                return el.get(0).tagName + ':last-child';
            }
            return el.get(0).tagName + ':nth-child(' + (el.index() + 1) + ')';
        }
    }

    searchElement(root: cheerio.Cheerio, depth: number, tagName:string, path: string[]): SearchResult[] {


        // if (this.$(root).attr("class") == "stcTitle") {
        //     console.log("mam ta");
        // }
        let searchResults: SearchResult[] = [];
        // console.log("Id: " + this.$(root).attr("id"));
        if (root.children().length > 0) {

            // console.log("Found parent with id: " + this.$(root).attr("id") + "and text: " + this.$(root).text());

            root.children().each((index, element) => {

                const search = this.searchElement(this.$(element), depth + 1, this.$(element).get(0).tagName, [...path,`:nth-child(${index + 1})`]);
                search.forEach(element => {
                    searchResults.push(element);
                });
            });
        } else {
            // console.log("Found element with no children: " + root.text() + "and class: " + this.$(root).attr("class") );
            const normalizedText = normalizeString(root.text())


            this.keywords.forEach(keyword => {
                if (normalizedText.indexOf(keyword.normalized) != -1) {
                    searchResults.push(new SearchResult(path.join(" > "), keyword, root.text(), DataSource.initial, this.getUniqueSelector(root)));
                    // console.log("----------");
                    // console.log("Root tagname: " + this.$(root).get(0).tagName);
                    // console.log("Old path: " + path.join(" > "));

                    
                    // // console.log();
                    // console.log("New path: " + this.getUniqueSelector(root) + " ; " + this.$(root).get(0).tagName);
                    // console.log("----------");
                    // // console.log(this.getUniqueSelector(root));
                }
                // console.log("Selectoros:     " + finder(this.$(root).ch, {}));
            })
        }
        return searchResults;

    }

}

// #h1c > h1:nth-child(1)
// html#rootHtml body.default.alza-sk.hobby div#body2.layout-1.cpg.lng-sk.alza-sk.hobby div#body2Inner div#body3Inner div#page.page1 div#content0c div#content0 div.detail-page.articleLab div#detailItem.canBuy.inStockAvailability div.title-cnt div.title-share div#h1c h1