# Files saved into the key-value store
Actor also saves some additional files with futher information, useful mainly for developers. 
1. __OUTPUT.json__: Most of the analysis results are stored in this file.
2. __DASHBOARD.html__. Visual interface for displaying the analysis results.
3. __initial.html__. Initial response retrieved by the chromium browser.
4. __rendered.html__. Htlm of a website rendered inside chromium browser. 
5. __cheerioCrawlerInitial.html__. Initial response retrieved by the CheerioCrawler. 
6. __INPUT__. Actors input. 
7. __screenshot.jpeg__. Screenshot of a loaded website. 
8. __xhrValidation.json__. Additional details about XHR validation. 

# The analysis steps: 
1. Analyzer opens the chromium browser and navigates to the website.
2. It searches the initial response of a website and fully rendered DOM.
3. XHR requests are intercepted and searched for the keywords as well.
4. These search results are then validated against the initial response retrieved by CheerioCrawler.
5. XHR request containing the keywords are then replicated using __got-scraping__ library with different sets of headers. 


# Planned features
* Generating a web scraper code or page function to be used with the generic APify crawlers
