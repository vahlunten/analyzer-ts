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

            // try {
            //     parsedValue = JSON.parse(JSON.stringify(value));
            // } catch (error) {
            //     out[element] = error;
            //     continue;
            // }
            // if (typeof value == typeof Function) {
            //     continue;
            // }

            // if (typeof value == typeof String) {
            //     // TODO: add cachign to fix circular dependencies
            //     // if (cache.indexOf(value) !== -1) {
            //     //     continue;
            //     // }
            //     // cache.push(value);
            //     console.log(value);
            // out[element] = parsedValue;
                
                
            // }
            // // @ts-ignore
            // console.log(value);
            // out[element] = typeof value == typeof Number? value : "23";
        }
        // keys.forEach(key => {
        //     // @ts-ignore
        //     // const value = window[key];
        //     console.log("mack");
        //     // if (typeof value == typeof Function) {
        //     //     return;
        //     // }

        //     // if (typeof value == typeof Object) {
        //     //     // TODO: add cachign to fix circular dependencies
        //     // }

        //     // out[key] = value;
        // })

        // @ts-ignore
        return out;

    })
}
export async function getWindowPropertyKeys(page: Page): Promise<string[]> {



    const windowPropertyKeys = await page.evaluate(() => Object.keys(window))


    // const allWindowProperties:{ [key: string]: any }= {};

    // const windowObject = window as { [key: string]: any };
    // _.each(keys, (key) => {
    //     console.log(key);
    //     allWindowProperties[key] = windowObject[key];
    // });

    return windowPropertyKeys;



    // const obj = await page.evaluate(() => {

    //     const windowAsAny = window as any;
    //     const windowObject: { [key: string]: any } = { macka: "pes" };


    //     // for (const [key, value] of Object.entries(window)) {
    //     //     console.log(`${key}: ${value}`);
    //     //     windowObject[key] = value;
    //     // }

    //     // for (const [key, value] of Object.entries(windowAsAny)) {
    //     //     console.log(`${key}: ${value}`);
    //     // }


    //     // Object.keys(windowAsAny).forEach(key => {
    //     //     const value = windowAsAny[key];

    //     //     // if (typeof value == typeof Function) {
    //     //     //     return;
    //     //     // }

    //     //     // if (typeof value == typeof Object) {
    //     //     //     // TODO: add cachign to fix circular dependencies
    //     //     // }

    //     //     windowObject[key] = value;



    //     // });
    //     return windowObject;
    // });
    // // await page.pause();
    // // const allWindowProperties:{ [key: string]: any }= {};


    // // _.each(keys, (key) => {
    // //     console.log(key);
    // //     allWindowProperties[key] = windowObject[key];
    // // });

    // return obj;
};


export function getWindowPropertiesValues(properties: string[]): string {


    return "macka";
} 