import { JsonSearcher } from "../src/search/JsonSearch";
import { normalizeArray } from "../src/helpers/normalize";
import { Validator } from "../src/validation/Validator";
import { removeDuplicates } from "../src/search/Search";
import { DataSource, SearchResult } from "../src/types";
import { DOMSearch } from "../src/search/DOMSearch";
import { readFileSync } from "fs";
import  __  from "lodash";


// describe('JsonSearch test', () => {
//   test('should return 0 results', () => {

//     const normalizedKeywords = normalizeArray(["pes", "macka"]);
//     const searcher = new JsonSearcher();
//     const searchResults = searcher.searchJson(testJson, normalizedKeywords, DataSource.initial);
//     expect(searchResults).toStrictEqual([]);
//   });

//   test('should return 1 results', () => {

//     const normalizedKeywords = normalizeArray(["value1"]);
//     const searcher = new JsonSearcher();
//     const searchResults = searcher.searchJson(testJson, normalizedKeywords, DataSource.initial);
//     expect(searchResults?.length).toBe(1);
//   });

// });

describe('Html search test', () => {
  test('', () => {
    const normalizedKeywords = normalizeArray(["NetSpa MONTANA L"]);

    const initialHtml = readFileSync("apify_storage/key_value_stores/default/cheerioInitial.html");
    const initialSearcher = new DOMSearch(initialHtml.toString(), DataSource.initial);
    const initialSearchResults = initialSearcher.find(normalizedKeywords)





    const cheerioHtml = readFileSync("apify_storage/key_value_stores/default/cheerioInitial.html");
    const cheerioSearcher = new DOMSearch(cheerioHtml.toString(), DataSource.initial);
    const cheerioSearchResults = cheerioSearcher.find(normalizedKeywords)


    
    for (let i = 0; i < initialSearchResults.length; i++) {
      const element = initialSearchResults[i];
      const elementCheerio = cheerioSearchResults[i];

      console.log(element.textFound);
      console.log(elementCheerio.textFound);
      
    }
    expect(__.isEqual(initialSearchResults.length,cheerioSearchResults.length)).toBe(true);
  });

  // test('should return 1 results', () => {

  //   const normalizedKeywords = normalizeArray(["value1"]);
  //   const searcher = new JsonSearcher();
  //   const searchResults = searcher.searchJson(testJson, normalizedKeywords, DataSource.initial);
  //   expect(searchResults?.length).toBe(1);
  // });

});

const testJson = {
  object: {
    objectChild: {
      name: ""
    }

  },
  array: [
    "value1",
    "value2",
  ],
  emptyArray: [],
  emptyObject: {},
  
}    


const searchResultInitial:SearchResult[] = [
  new SearchResult("1", {original: "5", normalized: "pes", index: 0}, "mackaText", DataSource.initial),
  new SearchResult("2", {original: "5", normalized: "pes", index: 1}, "mackaText", DataSource.initial),
  new SearchResult("3", {original: "5", normalized: "pes", index: 2}, "mackaText", DataSource.initial),
]

const searchResultDom:SearchResult[] = [
  new SearchResult("1", {original: "5", normalized: "pes", index: 0}, "", DataSource.rendered),
  new SearchResult("2", {original: "5", normalized: "pes", index: 1}, "mackaText", DataSource.rendered),
  new SearchResult("3", {original: "5", normalized: "pes", index: 2}, "mackaTextyyyyyyy", DataSource.rendered),
  new SearchResult("4", {original: "5", normalized: "pes", index: 2}, "mackaTextyyyyyyy", DataSource.rendered),

]


