import { log } from "crawlee";
import { Request, Response, Route } from "playwright";
import { ParsedRequestResponse } from "../types";


export async function parseResponse(response: Response, initialUrl: string): Promise<ParsedRequestResponse> {
    // console.log(response.request().url());
    let responseBody: string = "";

    // Redirects will throw "No resource with given identifier found" exception - not true
    // Options requests? 
    try {
        responseBody = (await response.text()).toString();
    } catch (err: any) {
        log.debug(err.message);
    }

    return {
        response: {
            body: responseBody,
            status: response.status(),
            headers: await response.allHeaders()
        },
        request: {
            url: response.request().url(),
            method: response.request().method(),
            headers: await response.request().allHeaders(),
            body: response.request().postData()
        },
        error: null,
        // TODO: check out matchBaseURl fro mthe opriginal page analyzer
        initial: response.url() === initialUrl ,
    }
}
