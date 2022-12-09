import { gotScraping, Method, Options, Response, CancelableRequest } from "got-scraping";
// import { JsonSearcher } from "../search/JsonSearch";
// import { DOMSearch } from "../search/DOMSearch";
// import {got, Options } from "got";

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
                searchResults = (new JsonSearcher()).searchJson(JSON.parse(response.body), keywords, DataSource.initial);
            } else if (response.headers["content-type"].indexOf("html") != 1) {
                searchResults = (new DOMSearch(response.body)).find(keywords);
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

// export async function validateAllXHR(xhrSearchResults: XhrSearchResult[], keywords: NormalizedKeywordPair[], proxyUrl = '') {

//     let validatedXhr = [];
//     if (xhrSearchResults.length > 0) {


//         for (const xhrFound of xhrSearchResults) {
//             }
//             try {


//                 //first try to call request with minimum necessary headers
//                 const minimalHeaders = {};
//                 minimalHeaders["referer"] = xhrFound.request.headers["referer"];

//                 // minimalHeaders["user-agent"] = xhrFound.request.headers["user-agent"];

//                 let requestObject = {
//                     url: xhrFound.request.url,
//                     method: xhrFound.request.method
//                 };

//                 // TODO: Proxy
//                 if (proxyUrl.length) {
//                     requestObject.proxyUrl = proxyUrl;
//                     // console.log(`Proxy url: ${proxyUrl}`);
//                 }
//                 //copy request body and content type
//                 if (xhrFound.request.postData != null) {
//                     requestObject.body = xhrFound.request.postData;
//                     minimalHeaders["content-type"] = xhrFound.request.headers["content-type"];
//                 }

//                 let result = await validateXHRRequest({ ...requestObject, headers: minimalHeaders }, searchFor, xhrFound);
//                 retryObject.callsMinimalHeaders = result.requestCalls;
//                 if (result.validationSuccess) {
//                     retryObject.validationSuccess = true;
//                     validatedXhr.push(retryObject);
//                     continue;
//                 }


//                 //use all headers from puppeteer session, these dont contain cookies
//                 const puppeteerHeaders = xhrFound.request.headers;
//                 result = await validateXHRRequest({ ...requestObject, headers: puppeteerHeaders }, searchFor, xhrFound);
//                 retryObject.callsPuppeteerHeaders = result.requestCalls;
//                 if (result.validationSuccess) {
//                     retryObject.validationSuccess = true;
//                     validatedXhr.push(retryObject);
//                     continue;
//                 }

//                 //use all headers from puppeteer session, also add all cookies retrieved from puppeteer calling page.cookies();
//                 const cookieString = allCookies.map((cookie) => {
//                     return `${cookie.name}=${cookie.value}`;
//                 }).join("; ");

//                 result = await validateXHRRequest({ ...requestObject, headers: { ...puppeteerHeaders, cookie: cookieString } }, searchFor, xhrFound);
//                 retryObject.callsPuppeteerHeadersCookie = result.requestCalls;
//                 if (result.validationSuccess) {
//                     retryObject.validationSuccess = true;
//                     validatedXhr.push(retryObject);
//                     continue;
//                 }

//                 // console.log(retryObject);

//             }
//             catch (err) {
//                 console.log(err.message);
//                 console.log(`Failed validation of XHR request: ${xhrFound.request.url}`);
//                 return null;
//             }
//             validatedXhr.push(retryObject);
//         }


//     }

//     return validatedXhr;
// }
// async function validateXHRRequest(requestResponse: ParsedRequestResponse, keywords:NormalizedKeywordPair[]) {
//     const retryCount = 5;
//     let validationSuccess = false;
//     const requestCalls = [];
//     for (let i = 0; i < retryCount; i++) {

//         let response:Response;
//         let error = null;
//         try {
//             response = await gotScraping(requestResponse.request.url, { timeout: { response: 3000 }});
//         } catch (err) {
//             console.error(err);
//         }
//         const validationResult = validateGotResponse(requestResponse, response, keywords);

//         requestCalls.push(validationResult);

//         if (validationResult.validationSuccess) {
//             // validation was sucessful, we dont need to call the request with the same headers again
//             validationSuccess = validationResult.validationSuccess;
//             break;
//         }

//     }

//     return { requestCalls, validationSuccess };

// }
// function validateGotResponse(requestObject: ParsedRequestResponse, gotResponse:CancelableRequest<Response>, keyword:NormalizedKeywordPair[]) {

//     let requestValidationEntry = {
//         request: requestObject,
//         response: null,
//         // headers merged from manualy filled headers and headers generated by gotscraping
//         gotHeaders: null,
//         searchResults: null,
//         validationSuccess: false,
//         error: null
//     }


//     if (error == null) {

//         requestValidationEntry.response = {
//             status: gotResponse.statusCode,
//             body: gotResponse.body,
//             headers: gotResponse.headers,

//         };
//         requestValidationEntry.gotHeaders = gotResponse.request.options.headers;


//         if (xhrFound.request.responseStatus == gotResponse.statusCode) {
//             //TODO: how to deal with other content-types?
//             let searchResults = [];
//             if (gotResponse.headers['content-type'].indexOf('json') != -1) {
//                 const responseBodyJson = JSON.parse(gotResponse.body);
//                 const treeSearcher = new TreeSearcher();
//                 searchResults = treeSearcher.find(responseBodyJson, searchFor);


//             } else if (gotResponse.headers['content-type'].indexOf('html') != -1) {
//                 const domSearcher = new DOMSearcher({ html: gotResponse.body });
//                 searchResults = domSearcher.find(searchFor);
//             }
//             requestValidationEntry.searchResults = searchResults;

//             if (_.isEqual(searchResults, xhrFound.searchResults)) {
//                 // if reponse status and search results are the same, we consider request as sucessfully validated
//                 requestValidationEntry.validationSuccess = true;
//             }


//         }
//     } else {
//         requestValidationEntry.error = error;
//     }


//     return requestValidationEntry;
// }