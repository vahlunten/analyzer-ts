import { ScrapedPage } from "../types";
import cheerio from 'cheerio';
import { parseJsonLD } from "./json-ld";
import { parseMetadata } from "./meta";
import { parseSchemaOrgData } from "./schema-org";

/**
 * Parses jsonld, metadata, schema.org data from html.
 * @param body Html string to be parsed
 * @returns Parsed data = scraped page. 
 */
export function parseHtml(body: string): ScrapedPage {

    const $ = cheerio.load(body);
    const out = new ScrapedPage();

    out.body = body;
    out.jsonLDData = parseJsonLD($);
    out.metadata = parseMetadata($);
    // TODO: Fix schema parsing
    out.schemaOrgData = parseSchemaOrgData($);

    return out;
}