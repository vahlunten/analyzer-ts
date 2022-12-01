// import { CancelableRequest, gotScraping } from "got-scraping";
// import { JsonSearcher } from "../search/JsonSearch";
// import { DOMSearch } from "../search/DOMSearch";

// import { __ } from "lodash";
// import { NormalizedKeywordPair, ParsedRequestResponse, XhrSearchResult } from "../types";

// export async function validateAllXHR(xhrSearchResults: XhrSearchResult[], keyword: NormalizedKeywordPair, proxyUrl = '') {

//     let validatedXhr = [];
//     if (xhrSearchResults.length > 0) {

//         for (const xhrFound of xhrSearchResults) {

//             let retryObject = {
//                 originalRequest: { ...xhrFound },
//                 callsMinimalHeaders: null,
//                 callsPuppeteerHeaders: null,
//                 callsPuppeteerHeadersCookie: null,
//                 validationSuccess: false,
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