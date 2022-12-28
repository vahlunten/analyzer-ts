import { copyFile } from "fs";

export function copyOutput() {
    
        // File destination.txt will be created or overwritten by default.
        copyFile('./storage/key_value_stores/default/OUTPUT.json', '../analyzer-ui/public/OUTPUT', (err) => {
            if (err) console.log("Failed to copy OUTPUT.json");
            console.log('OUTPUT.json sucessfully copied to /analyzer-ui/public');
        });
        copyFile('./storage/key_value_stores/default/screenshot.jpeg', '../analyzer-ui/public/screenshot', (err) => {
            if (err) console.log("Failed to copy screenshot.jpeg");
            console.log('Screenshot.jped sucessfully copied to /analyzer-ui/public');
        });
        copyFile('./storage/key_value_stores/default/INPUT.json', '../analyzer-ui/public/INPUT', (err) => {
            if (err) console.log("Failed to copy INPUT.json");
            console.log('INPUT.json sucessfully copied to /analyzer-ui/public');
        });


        copyFile('./storage/key_value_stores/default/initial.html', '../analyzer-ui/public/initial', (err) => {
            if (err) console.log("Failed to copy initial.html");
            console.log('initial.html sucessfully copied to /analyzer-ui/public');
        });
        copyFile('./storage/key_value_stores/default/rendered.html', '../analyzer-ui/public/rendered', (err) => {
            if (err) console.log("Failed to copy rendered.html");
            console.log('rendered.html sucessfully copied to /analyzer-ui/public');
        });
        copyFile('./storage/key_value_stores/default/cheerioCrawlerInitial.html', '../analyzer-ui/public/cheerioCrawlerInitial', (err) => {
            if (err) console.log("Failed to copy cheerioCrawlerInitial.html");
            console.log('cheerioCrawlerInitial.html sucessfully copied to /analyzer-ui/public');
        });
        copyFile('./storage/key_value_stores/default/xhrValidation.json', '../analyzer-ui/public/xhrValidation', (err) => {
            if (err) console.log("Failed to copy xhrValidation.json");
            console.log('xhrValidation.json sucessfully copied to /analyzer-ui/public');
        });
}