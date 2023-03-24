import { ScrapedPage } from "../types";
import cheerio from 'cheerio';
import { parseJsonLD } from "./json-ld";
import { parseMetadata } from "./meta";
import { parseSchemaOrgData } from "./schema-org";
import { prettyPrint } from "html";

// TODO: parse from the cheerio object

/**
 * Parses jsonld, metadata, schema.org data from html.
 * @param body Html string to be parsed
 * @returns Parsed data = scraped page. 
 */
export function parseHtml(body: string): ScrapedPage {
    
    const $ = cheerio.load(body);
    const out = new ScrapedPage();

    out.body = prettyPrint(body, { indent_size: 3 });
    out.jsonLDData = parseJsonLD($);
    out.metadata = parseMetadata($);
    out.schemaOrgData = parseSchemaOrgData($);

    return out;
}