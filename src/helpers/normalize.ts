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
    normalized = removeSpaces(normalized);
    normalized = convertCommasInNumbers(normalized);
    return normalized;
}

const removeHTMLTags = (text: string) => text.replace(/<[^>]*>?/g, '');
const replaceHTMLEntities = (text: string) => htmlEntities.decode(text);
const removeSpaces = (text: string) => text.replace(/\s/g, '');
const convertCommasInNumbers = (text: string) => text.replace(/(\d+),(\d+)/g, '$1.$2');