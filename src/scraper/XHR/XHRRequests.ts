import { Request, Response, Route } from "playwright";
import { HttpRequestMethod } from "../../helpers/HttpRequestMethod";

const IGNORED_EXTENSIONS = [".png", ".jpg",".jpeg", ".svg", ".gif"];

export function interceptRequests(route: Route, request: Request) { 
    console.log(request.url());

      const ignore = IGNORED_EXTENSIONS.reduce((ignored, extension) => {
        if (ignored) return ignored;
        return request.url().endsWith(extension);
      }, false);

      if (ignore) {
        route.abort();
        return;
      }
    
    route.continue();
}

export function onResponse(response: Response) {
    console.log(response);

}


// interface Request {
//   url: String;
//   method: HttpRequestMethod;
// }

// interface Response {
//   body: string;
// }
