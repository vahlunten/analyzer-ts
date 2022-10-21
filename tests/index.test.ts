import {  JsonSearcher } from "../src/search/JsonSearch";

describe('Testing lookup for a dog.', () => {
  test('should return 2 results', () => {
   
    const searcher = new JsonSearcher(["pes", "macka"]);
    const searchResults = searcher.searchSubtree(testJson, [], 0);
    searchResults?.forEach(element => {
      console.log(element.path);
    });
  });
});

const exanpleJson = {
  parent: {
    child: "Child value"
  },
  differentParent: {
    differentChild: "Different child value"
  }
}

const testJson ={
  parent0: "macka",
  parent1: "pes",
  parent2: {
    child0: "child 0 text",
    child1: "child 1 text",
    child2: "papagaj"
  },
  parent3: ["mackaa", "pesoo"]
}