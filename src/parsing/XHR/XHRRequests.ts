import { Request, Response, Route } from "playwright";
import { ParsedRequestResponse } from "../../types";
// import { HttpRequestMethod } from "../../helpers/HttpRequestMethod";

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

export async function onResponse(xhrParsed: ParsedRequestResponse[], response: Response) {
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

    // TODO: fix this workaround to prevent "No resource with given identifier found" exception
    try {
        responseBody = (await response.text()).toString();
    } catch (err) {
        console.log(err);
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
            headers: await response.request().allHeaders()
        },
        error: null
    };

}
