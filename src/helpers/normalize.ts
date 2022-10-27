import * as htmlEntities from 'html-entities';

export function normalizeArray(keywords: string[]): {original: string, normalized: string}[] {

    const normalizedKeywords: {original: string, normalized: string}[] = [];
    keywords.forEach(keyword => {        
        normalizedKeywords.push(
            {
                original: keyword,
                normalized: normalizeString(keyword)
            }
        );
    });
    return normalizedKeywords;
}

export function normalizeString(keyword: string): string {
    let normalized = removeHTMLTags(keyword);
    normalized = replaceHTMLEntities(normalized);
    normalized = removeSpaces(normalized);
    normalized = convertCommasInNumbers(normalized)
    return normalized;
}

const removeHTMLTags = (text: string) => text.replace(/<[^>]*>?/g, '');
const replaceHTMLEntities = (text: string) => htmlEntities.decode(text);
const removeSpaces = (text: string) => text.replace(/\s/g, '');
const convertCommasInNumbers = (text: string) => text.replace(/(\d+),(\d+)/g, '$1.$2');

export interface NormalizedKeywordPair {
    original: string, 
    normalized: string
}