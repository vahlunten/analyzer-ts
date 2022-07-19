"use strict";
// This is the main Node.js source code file of your actor.
// An actor is a program that takes an input and produces an output.
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
// For more information, see https://sdk.apify.com/
const apify_1 = tslib_1.__importDefault(require("apify"));
const controller_1 = require("./browser/controller");
apify_1.default.main(async () => {
    console.log('Loading input');
    // Structure of input is defined in INPUT_SCHEMA.json.
    const input = await apify_1.default.getInput();
    console.log('First number: ', input.firstNumber);
    console.log('Second number: ', input.secondNumber);
    // 👉 Complete the code so that result is
    // the sum of firstNumber and secondNumber.
    // 👇👇👇👇👇👇👇👇👇👇
    const result = null;
    // 👆👆👆👆👆👆👆👆👆👆
    console.log('The result is: ', input.firstNumber + input.secondNumber);
    const controller = new controller_1.PlaywrightController();
    await controller.openBrowser();
    // Structure of output is defined in .actor/actor.json
    await apify_1.default.pushData({
        firstNumber: input.firstNumber,
        secondNumber: input.secondNumber,
        sum: result,
    });
});
//# sourceMappingURL=main.js.map