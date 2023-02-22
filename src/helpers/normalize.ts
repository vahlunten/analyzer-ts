import * as htmlEntities from 'html-entities';
import { NormalizedKeywordPair } from '../types';

export function normalizeArray(keywords: string[]): NormalizedKeywordPair[] {

    const normalizedKeywords: NormalizedKeywordPair[] = [];
    keywords.forEach((keyword, index) => {        
        normalizedKeywords.push(
            {
                original: keyword,
                normalized: normalizeString(keyword),
                index: index
            }
        );
    });
    return normalizedKeywords;
}

export function normalizeString(keyword: string): string {
    let normalized = removeHTMLTags(keyword);
    normalized = replaceHTMLEntities(normalized);
    normalized = removeWhitespace(normalized);
    normalized = convertCommasInNumbers(normalized);
    return normalized.toLowerCase();
}

export function getCUrrentDate(): string {
    return new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
}
// "<b>  Foo is 1,23 &nbsp;x better than bar </b>"
const removeHTMLTags = (text: string) => text.replace(/<[^>]*>?/g, '');
// "  Foo is 1,23&nbsp;x better than bar "
const replaceHTMLEntities = (text: string) => htmlEntities.decode(text);
// "  Foo is 1,23 x better than bar "
const removeWhitespace = (text: string) => text.replace(/\s/g, '');
// "Foois1,23xbetterthanbar"
const convertCommasInNumbers = (text: string) => text.replace(/(\d+),(\d+)/g, '$1.$2');
// "Foois1.23xbetterthanbar"

// "foois1.23xbetterthanbar"