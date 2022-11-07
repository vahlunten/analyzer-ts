import { JsonSearcher } from "../src/search/JsonSearch";
import { normalizeArray } from "../src/helpers/normalize";
import { Validator } from "../src/validation/Validator";
import { removeDuplicates } from "../src/search/Search";
import { DataSource, SearchResult } from "../src/types";


describe('JsonSearch test', () => {
  test('should return 0 results', () => {

    const normalizedKeywords = normalizeArray(["pes", "macka"]);
    const searcher = new JsonSearcher();
    const searchResults = searcher.searchJson(testJson, normalizedKeywords, DataSource.initial);
    expect(searchResults).toStrictEqual([]);
  });

  test('should return 1 results', () => {

    const normalizedKeywords = normalizeArray(["value1"]);
    const searcher = new JsonSearcher();
    const searchResults = searcher.searchJson(testJson, normalizedKeywords, DataSource.initial);
    expect(searchResults?.length).toBe(1);
  });

});

//TODO: fix this 
describe("Search tests", () => { 
  test('Should return 0 results', () => {
    const filtered = removeDuplicates(searchResultInitial, searchResultInitial);
    for (const iterator of filtered) {
      console.log(iterator);
    }
    expect(filtered.length).toBe(3);
  });

})


// describe("Chereriocrawler test", () => {

//   test("Should get titles of example.org /1 /2", async () => {
//     const data = await Validator.loadHtml();   

//     expect(data).toHaveLength(2);

//   })
// })
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
  new SearchResult(["1"], {original: "5", normalized: "pes", index: 0}, "mackaText", DataSource.initial),
  new SearchResult(["2"], {original: "5", normalized: "pes", index: 1}, "mackaText", DataSource.initial),
  new SearchResult(["3"], {original: "5", normalized: "pes", index: 2}, "mackaText", DataSource.initial),
]

const searchResultDom:SearchResult[] = [
  new SearchResult(["1"], {original: "5", normalized: "pes", index: 0}, "", DataSource.rendered),
  new SearchResult(["2"], {original: "5", normalized: "pes", index: 1}, "mackaText", DataSource.rendered),
  new SearchResult(["3"], {original: "5", normalized: "pes", index: 2}, "mackaText", DataSource.rendered),
]