import cheerio from 'cheerio';
import { normalizeString } from '../helpers/normalize';
import { DataSource, NormalizedKeywordPair, SearchResult } from '../types';

export class DOMSearch {
    private $: cheerio.Root;
    private keywords: NormalizedKeywordPair[] = [];
    private source: DataSource;

    public constructor(html: string, source: DataSource) {
        this.$ = cheerio.load(html);
        this.source = source;
    }


    public find(keywords: NormalizedKeywordPair[]): SearchResult[] {
        // console.log(this.$.html());

        this.keywords = keywords;

        const htmlSearchResults = this.searchElement(this.$(":root"), 0, ":root", []);
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
    isUniqueAndMatching(selector: string, text: string) {
        const elements = this.$(selector);
        if (elements.length == 1) {
            return true;
        }
        return false;
    }
    // TODO: Ask Lukas about CSS selector generation 
    getUniqueSelector(el: cheerio.Cheerio): string {
        var parents = el.parents();
        if (!parents[0]) {
            // Element doesn't have any parents
            return ':root';
        }
        const elementSelector = this.getElementSelector(el);

        if (elementSelector[0] === '#' || elementSelector[0] === '.') {
            return elementSelector;
        }

        let parentSelector: string;
        let result: string = elementSelector;

        for (let i = 0; i < parents.length; i++) {
            const parent = this.$(parents[i]);
            parentSelector = this.getElementSelector(parent);
            result = parentSelector + " > " + result;
            if (this.isUniqueAndMatching(result, "")) {
                break;
            }

        }

        return result;
    };

    getElementSelector(el: cheerio.Cheerio): string {

        if (el.attr('id')) {
            const idSelector = '#' + el.attr('id');
            if (this.isUniqueAndMatching(idSelector, this.$(idSelector).text())) {
                return idSelector;
            }
        }
        if (el.attr('class')) {
            // TODO: check unique class
            const classSelector = '.' + el.attr('class');
            if (this.isUniqueAndMatching(classSelector, this.$(classSelector).text())) {
                return classSelector;
            }
        }
        var tagName = el.get(0).tagName;

        if (el.siblings().length === 0) {
            return tagName;
        }
        if (el.index() === 0) {
            return tagName + ':first-child';
        }
        if (el.index() === el.siblings().length) {
            return tagName + ':last-child';
        }
        return tagName + ':nth-child(' + (el.index() + 1) + ')';

    }


    searchElement(root: cheerio.Cheerio, depth: number, tagName: string, path: string[]): SearchResult[] {
        // console.log("  ".repeat(depth), this.$(root).attr("class"));
        // if (this.$(root).attr("id") == "iframe") {
        //     console.log("found the iframe thingy");
        //     console.log(root.html());
        // }


        // if (this.$(root).attr("class") == "stcTitle") {
        //     console.log("mam ta");
        // }
        let searchResults: SearchResult[] = [];
        // console.log("Id: " + this.$(root).attr("id"));

        const textttt = this.$(root).first().contents().filter(function(index, element) {
            return element.type === 'text';
        }).text();
        if (textttt) {
            const text = root.text();
            const normalizedText = normalizeString(textttt)
            this.keywords.forEach(keyword => {
                if (normalizedText.indexOf(keyword.normalized) != -1) {
                    // console.log("------TEXT NOT IN A ROOT ELEMENT----");
                    // console.log("Root tagname: " + this.$(root).get(0).tagName);
                    const longPath = path.join(" > ");
                    const longPathText = this.$(longPath).text();
                    const shortPath = this.getUniqueSelector(root);
                    const shortPathText = this.$(shortPath).text();

                    // console.log("Long path: " + longPath);
                    // console.log("Short path: " + shortPath);
                    // console.log("Root text: " + root.text());
                    // console.log("Clean text:" +textttt);

                    // console.log("Long path text: " + longPathText);
                    // console.log("Short path text: " + shortPathText);
                    // constructor(path: string, keyword: NormalizedKeywordPair, textFound: string, source: DataSource, pathShort = "", textFoundValidationShort="", textFoundShort = "", score = 0, isValid = false) {

                    searchResults.push(new SearchResult(longPath, keyword, text, this.source, shortPath, "", shortPathText, this.getScore(keyword.normalized, text, "")));

                }
            });
        }
        if (root.children().length > 0) {

            // console.log("Found parent with class: " + this.$(root).attr("class") + "and text: " + this.$(root).text());
            if (root.attr("class") == "availability-row__delivery--redesign") {
                // console.log("gotcha");
                // root.attr("class");
                // console.log("Text: " + root.text());
                // console.log("html: " + root.html());

                // console.log("Children count : " + root.children().length);
            }
            root.children().each((index, element) => {

                const search = this.searchElement(this.$(element), depth + 1, this.$(element).get(0).tagName, [...path, `${this.$(element).get(0).tagName}:nth-child(${index + 1})`]);
                search.forEach(element => {
                    searchResults.push(element);
                });
            });
        } else {
            // console.log("Found element with no children: " + root.text() + "and class: " + this.$(root).attr("class") );


            const text = root.text();
            const normalizedText = normalizeString(text)


            this.keywords.forEach(keyword => {
                if (normalizedText.indexOf(keyword.normalized) != -1) {
                    // console.log("----------");
                    // console.log("Root tagname: " + this.$(root).get(0).tagName);
                    const longPath = path.join(" > ");
                    const longPathText = this.$(longPath).text();
                    const shortPath = this.getUniqueSelector(root);
                    const shortPathText = this.$(shortPath).text();

                    // console.log("Long path: " + longPath);
                    // console.log("Short path: " + shortPath);
                    // console.log("Root text: " + root.text());
                    // console.log("Long path text: " + longPathText);
                    // console.log("Short path text: " + shortPathText);
                    // constructor(path: string, keyword: NormalizedKeywordPair, textFound: string, source: DataSource, pathShort = "", textFoundValidationShort="", textFoundShort = "", score = 0, isValid = false) {

                    searchResults.push(new SearchResult(longPath, keyword, text, this.source, shortPath, "", shortPathText, this.getScore(keyword.normalized, text, "")));


                }
                // console.log("Selectoros:     " + finder(this.$(root).ch, {}));
            })
        }
        return searchResults;

    }

    // TODO: more sophisticated scoring system 
    getScore(keywordNormalized: string, textNormalized: string, selector: string): number {
        const score = textNormalized.length - keywordNormalized.length;
        // console.log(score + selector.length);
        return score;
    }

}
