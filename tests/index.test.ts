import { JsonSearcher } from "../src/search/JsonSearch";
import { normalizeArray } from "../src/helpers/normalize";
import { DataSource } from "../src/search/SearchResult";

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