import { JsonSearcher } from "../src/search/JsonSearch";
import { normalizeArray } from "../src/search/normalize";

describe('JsonSearch test', () => {
  test('should return 0 results', () => {

    const normalizedKeywords = normalizeArray(["pes", "macka"]);
    const searcher = new JsonSearcher();
    const searchResults = searcher.searchJson(testJson, normalizedKeywords);
    expect(searchResults).toStrictEqual([]);
  });

  test('should return 1 results', () => {

    const normalizedKeywords = normalizeArray(["value1"]);
    const searcher = new JsonSearcher();
    const searchResults = searcher.searchJson(testJson, normalizedKeywords);
    expect(searchResults?.length).toBe(1);
  });

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