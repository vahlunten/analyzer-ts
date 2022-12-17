import * as _ from "lodash";
import { Page } from "playwright";

export async function scrapeWindowProperties(page: Page): Promise<{ [key: string]: any }> {
    return await page.evaluate(() => {
        function isNotImportant(property:any) {
            return property === null
                || property === ''
                || property === true
                || property === false
                || property == undefined;
        }

        const keys = Object.keys(window);
        let cache:any[] = [];

        const out: { [key: string]: any } = {}
        for (let index = 0; index < keys.length; index++) {
            const element = keys[index];
            // TODO: maybe cast window to { [key: string]: any }?
            // @ts-ignore
            const value = window[element];
            let parsedValue: any;

            try {
                // remove circular references and functions from variable content
                out[element] = JSON.parse(JSON.stringify(value, (key, value) => {
                    if (isNotImportant(value)) return undefined;
                    if (typeof value === typeof Function) {
                        return undefined;
                    }
                    if (typeof value === typeof Object && value !== null) {
                        if (cache.indexOf(value) !== -1) {
                            return undefined;
                        }
                        cache.push(value);
                    }
                    return value;
                }));
            } catch (err) {
                out[element] = err;
            }

        }
        return out;

    })
}