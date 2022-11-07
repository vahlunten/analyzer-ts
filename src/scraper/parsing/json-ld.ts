export function parseJsonLD($ : cheerio.Root): {"data": any[]} {
    
    const result: object[] = [];
    $('script[type="application/ld+json"]').each((_, element) => {
        try {
            result.push(JSON.parse($(element).html() || '{}'));
        } catch (err) {
            console.error(err);
        }
    });
    return {data: result};
}