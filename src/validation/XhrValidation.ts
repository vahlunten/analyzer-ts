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
    let callsWithMinimal: GotCall[] = [];
    let callsWithOriginalHeaders: GotCall[] = [];
    let callsWithOriginalCookie: GotCall[] = [];


    const filteredHeaders: { [key: string]: string } = {};

    // Remove pseudo-headers
    Object.keys(xhr.parsedRequestResponse.request.headers).forEach(headerKey => {
        if (headerKey.indexOf(":") == -1) {
            filteredHeaders[headerKey] = xhr.parsedRequestResponse.request.headers[headerKey]
        }
    });

    const options: Options = new Options({
        method: xhr.parsedRequestResponse.request.method as Method,
        body: xhr.parsedRequestResponse.request.body ?? undefined,
        url: xhr.parsedRequestResponse.request.url
    });

    let succeeded = false; 

    // calls with minimal headers
    // TODO: prepare minimal headers
    const minimalHeaders: { [key: string]: string } = {};
    options.headers = minimalHeaders;
    // trying every request multiple times to avoid false negatives due to proxy limitations
    for (let i = 0; i < 5; i++) {
        
        const callValidation = await validateGotCall(xhr, keywords, options);
        callsWithMinimal.push(callValidation);

        if (callValidation.isValid) {
            succeeded = true;
            break;
        }
    }


    // calls with original headers from chromium without a cookie
    // only execute if we failed to validate request with less headers
    if (!succeeded) {
        const originalHeadersWithoutCookie: { [key: string]: string } = {};
        options.headers = originalHeadersWithoutCookie;

        for (let i = 0; i < 5; i++) {
        
            const callValidation = await validateGotCall(xhr, keywords, options);
            callsWithOriginalHeaders.push(callValidation);
    
            if (callValidation.isValid) {
                succeeded = true;
                break;
            }
        }
                
    }
    // calls with original headers including a cookie
    if (!succeeded) {
        const originalHeaders: { [key: string]: string } = {};    
        options.headers = originalHeaders;

        for (let i = 0; i < 5; i++) {
        
            const callValidation = await validateGotCall(xhr, keywords, options);
            callsWithOriginalCookie.push(callValidation);
    
            if (callValidation.isValid) {
                succeeded = true;
                break;
            }
        }
                
    }    

    return {
        originalRequestResponse: xhr.parsedRequestResponse,
        callsMinimalHeaders: callsWithMinimal,
        callsWithOriginalHeaders: callsWithOriginalHeaders,
        callWithCookies: callsWithOriginalCookie,
        validationSuccess: succeeded
    }
}

async function validateGotCall(xhr: XhrSearchResult, keywords: NormalizedKeywordPair[], options: Options): Promise<GotCall> {
    const request = gotScraping(undefined, undefined, options, );
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
                status: -1,
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
