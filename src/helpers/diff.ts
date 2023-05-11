import { KeyValueStore, log } from "crawlee";
import { createTwoFilesPatch } from 'diff';
import { html, parse } from "diff2html";


export async function createDiff(initial: string, rendered: string): Promise<void> {

    try {
        const difdiff = createTwoFilesPatch("", "", initial, rendered, "Initial response", "Rendered document");
        const diffJson = parse(difdiff);
        const diffHtml = html(diffJson, { outputFormat: 'side-by-side', drawFileList: false });
        await KeyValueStore.setValue("diff", diffHtml, { contentType: 'application/html; charset=utf-8' });

    } catch (e: any) {
        log.debug("Failed to create the diff of initial response and rendered document:");
        console.log(e.message);
    }
}