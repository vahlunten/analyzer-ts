import { log } from "crawlee";
import { analyze } from "../src/main";
import { readFileSync } from "fs";

import { CustomConsole, LogType, LogMessage } from '@jest/console';

function simpleFormatter(type: LogType, message: LogMessage): string {
    const TITLE_INDENT = '    ';
    const CONSOLE_INDENT = TITLE_INDENT + '  ';

    return message
        .split(/\n/)
        .map(line => CONSOLE_INDENT + line)
        .join('\n');
}

global.console = new CustomConsole(process.stdout, process.stderr, simpleFormatter);

jest.setTimeout(500000);
log.setLevel(log.LEVELS.DEBUG);
// test('Should return sensible urls to', async () => {

//     const url = "http://alza.sk"
//     const sampleUrls = await crawlSitemaps(new URL("/robots.txt", url).href, url);
//     console.log(JSON.stringify(sampleUrls));
//     // for (const url of sampleUrls) {
//     //     // console.log(url);

//     // }
// });

// test("should analyze books", async () =>  {
//     const input = readFileSync("./src/static/example_inputs/INPUT_XHR.json").toString();
//     console.log(input);
//     await analyze(input);
// });

test("should fail bacause of an invalid input", async () =>  {
    const input = readFileSync("./src/static/example_inputs/INPUT_XHR.json").toString();
    console.log(input);
    await analyze(input);
});