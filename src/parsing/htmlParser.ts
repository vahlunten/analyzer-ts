import { ScrapedPage } from "../types";
import cheerio from 'cheerio';
import { parseJsonLD } from "./json-ld";
import { parseMetadata } from "./meta";
import { parseSchemaOrgData } from "./schema-org";
import { prettyPrint } from "html";
import { log } from "crawlee";

// TODO: parse from the cheerio object

/**
 * Parses jsonld, metadata, schema.org data from html.
 * @param body Html string to be parsed
 * @returns Parsed data = scraped page. 
 */
export function parseHtml(body: string): ScrapedPage {
    
    const $ = cheerio.load(body);
    const out = new ScrapedPage();

    try {
        out.body = prettyPrint(body, { indent_size: 3 });
    } catch(e:any) {
        log.error(e);
    }

    out.jsonLDData = parseJsonLD($);
    out.metadata = parseMetadata($);
    out.schemaOrgData = parseSchemaOrgData($);

    return out;
}