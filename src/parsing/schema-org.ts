function extractValue($elem:cheerio.Cheerio) {
    return $elem.attr('content')
        || $elem.text()
        || $elem.attr('src')
        || $elem.attr('href')
        || null;
}

function extractItemScope($: cheerio.Root, $itemScope: cheerio.Cheerio) {
    const item:any= {
        _type: $itemScope.attr('itemtype'),
    };
    let count = 0;
    // iterate itemprops not nested in another itemscope
    $itemScope
        .find('[itemprop]')
        .filter((_, element) => {
            const $itemProp = $(element);
            const $parents = $itemProp.parents('[itemscope]');
            return $($parents[0]).is($itemScope);
        }).each((_, element) => {
            const $itemProp = $(element);
            let value = $itemProp.is('[itemscope]')
                ? extractItemScope($, $itemProp)
                : extractValue($itemProp);
            if (typeof value === 'string') {
                value = value.trim();
            }
            const propName = $itemProp.attr('itemprop');
            if (Array.isArray(item[propName!])) {
                item[propName!].push(value);
            } else if (typeof item[propName!] !== 'undefined') {
                item[propName!] = [item[propName!], value];
            } else {
                item[propName!] = value;
            }
            count++;
        });
    // special case - output at least something
    if (count === 0) {
        item._value = extractValue($itemScope);
    }
    return item;
}

export function parseSchemaOrgData($: cheerio.Root) {
    const result: any[]= [];
    $('[itemscope]').filter((_, element) => {
        return $(element).parents('[itemscope]').length === 0;
    }).each((_, element) => {
        result.push(extractItemScope($, $(element)));
        result.push($(element));
    });

    // remove circular references
    const cleanResult = cleanData(result);

    // logObject(result);
    return cleanData(cleanResult);

}

function cleanData(data: any) {
    let cache:any = [];
    const result = JSON.parse(JSON.stringify(data, (_, value) => {
        if (typeof value === 'function') {
            return 'function';
        }
        if (typeof value === 'object' && value !== null) {
            if (cache.indexOf(value) !== -1) {
                return null;
            }
            cache.push(value);
        }
        return value;
    }));
    cache = null; // clean memory
    return result;
};
