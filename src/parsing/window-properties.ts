import * as _ from "lodash";
import { Page } from "playwright";


export async function getWindowObject(page: Page): Promise<{ [key: string]: any }>

{
    return await page.evaluate(() => { 


        const keys =  Object.keys(window);

        // const out:{ [key: string]: any } = {}

        keys.forEach(key => {
            // @ts-ignore
            const value = window[key];
            console.log(value.toString());
            // if (typeof value == typeof Function) {
            //     return;
            // }

            // if (typeof value == typeof Object) {
            //     // TODO: add cachign to fix circular dependencies
            // }

            // out[key] = value;
        })
        // @ts-ignore
        const pes = {pes: keys}
        return pes;

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