import { log } from "crawlee";
import { Request, Response, Route } from "playwright";
import { ParsedRequestResponse } from "../../types";

const IGNORED_EXTENSIONS = [".css", ".png", ".jpg", ".jpeg", ".svg", ".gif"];

export function interceptRequests(route: Route, request: Request, saveBandwith: boolean) {

    if (saveBandwith) {
        const ignore = IGNORED_EXTENSIONS.reduce((ignored, extension) => {
            if (ignored) return ignored;
            return request.url().endsWith(extension);
        }, false);

        if (ignore) {
            route.abort();
            return;
        }
    }

    route.continue();
}

export async function onResponse(xhrParsed: ParsedRequestResponse[], response: Response, url: string) {
    // do not save the initial repsonse as it is saved in the PlaywrightScraper
    if (response.url() === url) {
        return;
    }
    // console.log(response.url())

    // if reponse is NOT a redirect, parse its content
    // new request will be issued
    if (!(response.status() >= 300 && response.status() <= 399)) {
        const parsed = await parseResponse(response);
        xhrParsed.push(parsed);
        // console.log(parsed);
        // console.log(parsed.response.body)
    }
}


async function parseResponse(response: Response): Promise<ParsedRequestResponse> {
    // console.log(response.request().url());
    let responseBody: string = "";

    // Redirects will throw "No resource with given identifier found" exception
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
        error: null
    }
}
