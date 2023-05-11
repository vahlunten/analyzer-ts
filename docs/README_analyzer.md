# Developers documentation


## The analysis steps: 
1. **Navigation:** Analyzer opens the chromium browser using a [Playwright](https://playwright.dev/docs/intro) library and navigates to the website. It then waits until the [networkIdle](https://playwright.dev/docs/navigations#custom-wait) event is fired - until no new network requests are made for 500 ms or until the timeout of 30000ms is exceeded, analyzer will then continue to the next step. During the waiting phase, the analyzer itercepts all of the XHR requests (and captures the response in order to be searched for the keywords) along with all of the data necessary to be able to replicate them later in the process (if they contain some data the user would like to scrape). 
2. **Parsing**: It parses the data of the initial response of a website and fully rendered DOM. The data of both documents is parsed into the instance of a ScrapedPage object described below.
3. **Searching for the keywords**: Gathered and parsed data from the DOM and the initial response retrieved by the Chromium are searched in order to find the keywords. 
4. **Validation**:
    + Initial response is retrieved by [CheerioCrawler](https://crawlee.dev/api/cheerio-crawler/class/CheerioCrawler) in order to discover, whether it is possible to obtain the initial response using a simple HTTP client containing the same data as when using a browser. 
    + XHR request containing the keywords are then replicated using __got-scraping__ library with a different sets of headers. 

## Output of the analyzer - files saved into the key-value store
Actor also saves some additional files with futher information, useful mainly for developers. 
1. __OUTPUT.json__: Most of the analysis results are stored in this file along with all of the examined data sources parsed.
2. __DASHBOARD.html__. Visual interface for displaying the analysis results.
3. __initial.html__. Initial response retrieved by the chromium browser.
4. __rendered.html__. Final form of the htlm of a website rendered inside chromium browser. 
5. __cheerioCrawlerInitial.html__. Initial response retrieved by the CheerioCrawler. 
6. __INPUT__. Actors input. 
7. __screenshot.jpeg__. Screenshot of a loaded website. 
8. __xhrValidation.json__. Additional details about XHR validation.




## XHR requests validation
Analyzer monitors the traffic between the server and a client. Each incoming response is captured by subscribing to the **page.on("response")** event. The **onResponse** function parses the request and saves it in order to be searched for the keywords later. 
```javascript
{
    page.on("response", async (response: Response) => await this.onResponse(this.requests, response, this.url));
}
```
If the response contains any of the keywords the analyzer will try to replicate the request with a different set of headers in the following order:
* **Minimal headers** - these are:
    * referer - if it was present in the original request,
    * content-type - if the request is a POST
* **Original headers without a cookie** - original headers with the cookie header deleted
* **Original headers** - complete headers of the original request

Requests are retried 5 times for the each set of headers. The request is considered successfully replicated if the response status and response body are identical.  

## Structure of the OUTPUT.json file
**Output class** Output class represents 
```javascript
{
    // OUTPUT.json is a serialized instance of an Output class
    class Output {
    // analyzed url
    url: string = "";
    // analyzed keywords with normalized form 
    keywords: NormalizedKeywordPair[] = [];
    // scrapedData field contains all of the data gathered during the analysis 
    scrapedData: ScrapedData | null = null;
    // search results from the initial response and rendered dom 
    // for all of the keywords merged in a single array
    // this field is left here for the development purposes, theses search results 
    // get validated and assorted to the particular keyword in the
    // validation step and are saved in the keywordConclusions field
    searchResults: SearchResults | null = null;
    // Keyword conclusion contains all of the data found about a particular keyword
    keywordConclusions: KeywordConclusion[] = [];
    // xhr requests containing any of the keywords are replicated using
    // got-scraping, attempts to replicate the calls are saved in the
    //  xhrValidated field
    xhrValidated: XhrValidation[] = [];
    // indicates whether the cheerioCrawler succeedeed to retrieve the initial response
    cheerioCrawlerSuccess: boolean = false;

    // timestamp - start of the analysis
    analysisStarted: string | null = null;
    // timestamp - the end of the analysis
    analysisEnded: string | null = null;

    // indicates whether the actor finished sucessfully
    actorSuccess: boolean = true;
    // incase the analyzer fails due to an uncaught exception, the error message will be stored as string in
    // this field
    errorMessage: string | null = null;    
}
```
**ScrapedData class**
Scraped data class is used to store all data obtained from the website during the analysis. 
```javascript
{
    // ScrapedData class holds all of the data retrieved and parsed  
    class ScrapedData {
    // response status of the browsers initial request response
    responseStatus: number | null = null;
    // parsed initial response from the chromium browser
    initial: ScrapedPage | null = null;
    // parsed inirial response from cheerioCrawler
    parsedCheerio: ScrapedPage | null = null;
    // parsed HTML rendered in the browser
    DOM: ScrapedPage | null = null;
    // window object cleared of circular dependencies and parsed
    allWindowProperties: { [key: string]: any } | null = null;
    // search results of keywords found in the window object
    windowFound: SearchResult[] = [];
    // all intercepted XHR requests parsed
    xhrParsed: ParsedRequestResponse[] | null = null;
    // cookies captured during the browser session 
    cookies: Cookie[] | null = null;
    // error if the parsing of the HTML document failed due to uncaught exception
    error: Error | null = null;
    // indicates whether the HTML document was sucessfully scraped and parsed
    scrapingFinished: boolean = false;
    navigated: boolean = false;
    initialLoaded: boolean = false;


}
```
**ScrapedPage class** is used to store parsed data 
```javascript
{
    class ScrapedPage {
        // HTML document data
        body: string | null = null;
        // scraped and parsed JSON-LD data
        jsonLDData: any = null;
        // parsed schema.org -> microdata
        schemaOrgData: any = null;
        // parsed meta tags
        metadata: any = null;
    }
}
```