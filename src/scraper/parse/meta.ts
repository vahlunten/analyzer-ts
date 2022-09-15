export function parseMetadata($: cheerio.Root) {
    
    const result:any = {};
    $('meta').each((_, element) => {
        const $tag = $(element);
        const name = $tag.attr('name') || $tag.attr('property');
        if (name) {
            result[name] = $tag.attr('content');
        }
    });
    $('head title').each((_, element) => {
        result.title = $(element).text();
    });

    return result;
}


