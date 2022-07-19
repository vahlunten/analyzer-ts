const Apify = require('apify');
const { playwright } = Apify.utils;

export class PlaywrightController {
    constructor() {

        console.log("Hello from playwright controller constructor.")
    }

    async openBrowser() {

        const browser = await Apify.launchPlaywright();
        const page = await browser.newPage();
        await playwright.gotoExtended(page, {
            url: 'https://example.com',
            method: 'GET',
        });
    }
}