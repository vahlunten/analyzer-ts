import { ScrapedPage } from "../types";
import cheerio from 'cheerio';
import { parseJsonLD } from "./json-ld";
import { parseMetadata } from "./meta";
import { parseSchemaOrgData } from "./schema-org";


export function parseHtml(body: string): ScrapedPage {

    const $ = cheerio.load(body);
    const out = new ScrapedPage();

    // out.body = body;
    out.jsonLDData = parseJsonLD($);
    out.metadata = parseMetadata($);
    out.schemaOrgData = parseSchemaOrgData($);
    // parse window

    return out;
}