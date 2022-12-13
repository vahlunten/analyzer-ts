# Page analyzer
Web page analyzer performs an analysis on the input website. It will search the content of the website for each keyword and output all the possible ways a keyword data can be scraped. 


## Intended users
This actor has been developed mainly for two categories of the users: 
1. Analysts and non-deverlopers that would like to get an insight on how the web page can be scraped. The output of the analysis can give a great clue of how difficult it is to scraped the website or how many resources will be needed.
2. Developers that are developing web scrapers. Data from the analysis can be directly used for scraping purposes.   

## Website url
Url of a website to be analyzed.

## Keywords
Keywords are strings that analyzer will search for in given website. 

## Input

Input can be set using JSON or the visual input UI through Apify console. 
```javascript
{
    // url of a  website to be analyzed
    "url": "http://example.com",
    // array of strings too look for on the website, we will refer to those string as "keywords"
    "keywords": [
        "About us",
        // numbers are also passed as strings
        "125"
        ],
}
```
## How to use
1. Add the analyzer actor to your Apify console. 
2. Enter url of a website to be analysed. 
3. Add keywords to be searched for. It is recommended to directly copy the text from the website. 
4. Run the actor. 
5. View the analysis results by opening __DASHBOARD.html__ file inside the key-value storage. 

## Output

Output of this actor is saved in Apify key-value store of the particular actor run.

Results of the analysis are saved in the __OUTPUT.json__ file and can be viewed by opening the __DASHBOARD.html__ file.

## Files stored in key-value store
Actor also saves some additional files with futher information, useful mainly for developers. 
1. __OUTPUT.json__: Most of the analysis results are stored in this file.
2. __DASHBOARD.html__. Visual analysis results explorer.
3. __initial.html__. Initial response retrieved by the chromium browser.
4. __dom-content.html__. Htlm of a website rendered inside chromium browser. 
5. __initial-cheerio.html__. Initial response retrieved by the CheerioCrawler. 
6. __INPUT__. Actors input. 
7. __screenshot.jpeg__. Screenshot of a loaded website. 
8. __xhr.json__. Additional details about XHR validation. 

## How analyzer works

The goal of this actor is to find out the optimal way to scrape the website. It tries to find a way to scrape a website without using a browser to minimize the resources needed for scraping. 


Analyzer uses a Playwright library to control the chromium browser. It navigates to the website and scans all the sources for the input keywords.

### The analysis steps: 
1. Analyzer opens the chromium browser and navigates to the website.
2. It searches the initial response of a website and fully rendered DOM.
3. XHR requests are intercepted and searched for the keywords.
4. These search results are then validated against the initial response retrieved by CheerioCrawler.
5. XHR request containing the keywords are then replicated using __got-scraping__ library with different sets of headers. 


## Planned features
* flexible formatting of numbers & strings (4,400 <=> 4000)
* testing different proxy configurations (datacenter -> residential)
* generation of scraper/crawler code
* custom clicks

<!-- # Getting started with Apify actors

The `README.md` file documents what your actor does and how to use it,
which is then displayed in the Console or Apify Store. It's always a good
idea to write a `README.md`. In a few months, not even you
will remember all the details about the actor.

You can use [Markdown](https://www.markdownguide.org/cheat-sheet)
language for rich formatting.

## Documentation reference

- [Apify SDK](https://sdk.apify.com/)
- [Apify Actor documentation](https://docs.apify.com/actor)
- [Apify CLI](https://docs.apify.com/cli)

## Writing a README

See our tutorial on [writing READMEs for your actors](https://help.apify.com/en/articles/2912548-how-to-write-great-readme-for-your-actors) if you need more inspiration. -->
