import { gotScraping, Method, Options, Response, CancelableRequest } from "got-scraping";
import { isEqual } from "lodash";
import Apify  from "apify";
import { DOMSearch } from "../search/DOMSearch";
import { JsonSearcher } from "../search/JsonSearch";
import { DataSource, GotCall, NormalizedKeywordPair, ParsedRequestResponse, SearchResult, XhrSearchResult, XhrValidation } from "../types";

const { log } = Apify.utils;


export async function validateAllXHR(xhrSearchResults: XhrSearchResult[], keywords: NormalizedKeywordPair[], proxyUrl = ''): Promise<XhrValidation[]> {

    let validatedXhr: XhrValidation[] = [];
    if (xhrSearchResults.length > 0) {

        try {
            for (const xhrFound of xhrSearchResults) {
                const val = await validateXHRRequest(xhrFound, keywords);
                validatedXhr.push(val);
            }

        }
        catch (err: any) {
            log.error(err);
            log.error(`Failed validation of XHR request: ${""}`);

        }
        validatedXhr.push();
    }

    return validatedXhr;

}

async function validateXHRRequest(xhr: XhrSearchResult, keywords: NormalizedKeywordPair[],): Promise<XhrValidation> {
    let calls: GotCall[] = [];


    const filteredHeaders: { [key: string]: string } = {};
    // Remove pseudo-headers
    Object.keys(xhr.parsedRequestResponse.request.headers).forEach(headerKey => {
        if (headerKey.indexOf(":") == -1) {
            filteredHeaders[headerKey] = xhr.parsedRequestResponse.request.headers[headerKey]
        }
    });
    for (let i = 0; i < 5; i++) {

        // TODO: Calls with cookies
        // TODO: Calls with minimal headers

        // Calls with original headers from Playwright
        const options: Options = new Options({
            headers: filteredHeaders,
            method: xhr.parsedRequestResponse.request.method as Method,
            body: xhr.parsedRequestResponse.request.body ?? undefined,
            url: xhr.parsedRequestResponse.request.url
        });
        calls.push(await validateGotCall(xhr, xhr.parsedRequestResponse.request.url, keywords, options));

    }



    return {
        originalRequestResponse: xhr.parsedRequestResponse,
        callsMinimalHeaders: [],
        callsWithOriginalHeaders: calls,
        callWithCookies: []
    }
}

async function validateGotCall(xhr: XhrSearchResult, url: string, keywords: NormalizedKeywordPair[], options: Options): Promise<GotCall> {
    const request = gotScraping(undefined, undefined, options);
    let response: Response<string>;
    let searchResults: SearchResult[] = [];
    let result: GotCall = {
        callSuccess: true,
        isValid: false,
        parsedRequestResponse: {
            request: {
                body: xhr.parsedRequestResponse.request.body,
                headers: options.headers as { [key: string]: string },
                method: xhr.parsedRequestResponse.request.method,
                url: xhr.parsedRequestResponse.request.url,
            },
            response: {
                body: "",
                status: 404,
                headers: {}
            },
            error: null
        },
        searchResults: []
    }
    try {

        response = (await request) as Response<string>;
        // console.log(response.body);

        if (response.statusCode == xhr.parsedRequestResponse.response.status) {
            // reponses are the same, we can proceed
            log.debug("Response with the same status received: " + response.statusCode);
            // TODO: check content type header and search html or json

            if (response.headers["content-type"]?.indexOf("json") != -1) {
                searchResults = (new JsonSearcher()).searchJson(JSON.parse(response.body), keywords, DataSource.xhr);
            } else if (response.headers["content-type"].indexOf("html") != 1) {
                searchResults = (new DOMSearch(response.body, DataSource.xhr)).find(keywords);
            }
            result.searchResults = searchResults;

            if (searchResults.length > 0) {
                // if the search results of the response body are the same as search results obtained during analysis
                if (isEqual(searchResults, xhr.searchResults)) {
                    log.debug("Validated xhr is valid.");
                    result.isValid = true;
                } else {
                    log.debug("Validated xhr is invalid.")
                }

            }
            result.parsedRequestResponse.response = {
                body: response.body,
                status: response.statusCode,
                headers: response.headers as {[key: string]:string}
            };
        } else {
            log.debug("Validation failed");
        }
    } catch (err: any) {
        result.callSuccess = false;
        result.isValid = false;
    }
    return result;
}
