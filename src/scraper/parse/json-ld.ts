export function parseJsonLD($ : cheerio.Root): any[] {
    
    const result: object[] = [];
    $('script[type="application/ld+json"]').each((_, element) => {
        try {
            result.push(JSON.parse($(element).html() || '{}'));
            console.log($(element).html());
        } catch (err) {
            console.error(err);
        }
    });
    return result;
}