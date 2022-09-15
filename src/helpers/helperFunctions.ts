import { inspect } from "util";

export function logObject(obj: any) {
    console.log(inspect(obj, {showHidden: false, depth: null, colors: true}))
}