# Page analyzer
Web page analyzer performs an analysis of a website. It will search the content of the website for each keyword and output all the possible ways a keyword data can be scraped. 

# When to use page analyzer
Page analyzer can be used as a first step in a web scraper developement. It's goal is to automate the process of analyzing a website manually using tools like browsers developer tools or Postman to:
1. Analyze the structure of the website
2. Find the CSS selectors of HTML elements containing a keyword
3. Find a keywords in additional sources that might not be visible on the screen like JSON+LD, metadata, schema.org data
4. Observe and replicate XHR requests that might contain the data a user wants to scrape 


# Input
The input consists of:
1. <strong>URL</strong> of a website to be analyzed.
2. <strong>Keywords</strong> - an array of strings the analyzer will try to find in the source code of the website.

Input can be set using the visual input UI through Apify console, or using INPUT.json file inside the actors default key-value store.
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
    // proxy configuration
    "proxyConfig": {
        "useApifyProxy": true
    }
}
```


# Output

Output of this actor is saved in Apify key-value store of the particular actor run.

Results of the analysis are can be observed by opening the __DASHBOARD.html__ file.

Analyzer also saves other files containing additional analysis data. To learn more about them, please read [how analyzer works.](./docs/analysis.md)
