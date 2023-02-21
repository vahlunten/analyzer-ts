import { ScrapedPage } from "../types";
import cheerio from 'cheerio';
import { parseJsonLD } from "./json-ld";
import { parseMetadata } from "./meta";
import { parseSchemaOrgData } from "./schema-org";

// TODO: parse from the cheerio object

/**
 * Parses jsonld, metadata, schema.org data from html.
 * @param body Html string to be parsed
 * @returns Parsed data = scraped page. 
 */
export function parseHtml(body: string): ScrapedPage {

    // TODO: use this function inside a crawler to test the search results 
    // and create an example dataset
    const $ = cheerio.load(body);
    const out = new ScrapedPage();

    out.body = body;
    out.jsonLDData = parseJsonLD($);
    out.metadata = parseMetadata($);
    out.schemaOrgData = parseSchemaOrgData($);

    return out;
}