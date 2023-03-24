import { CheerioCrawler, ProxyConfiguration, RequestQueue, log } from 'crawlee';
import { URL } from "url";

/**
 * 
 * @param robotsUrl URL to the ropbots.txt file.
 * @param urlsCount Number of sample urls to retrieve.
 * @param headers Headers to use for cheeriocrawler
 * @param proxyConf Crawlee proxy configuration
 * @returns Sample of 100 urls from the sitemap and hrefs iniside HTML documents found.
 */
export async function crawlSitemaps(robotsUrl: string, inputUrl:string, urlsCount:number = 150, headers: { [key: string]: string } = {}, proxyConf: ProxyConfiguration | undefined = undefined): Promise<string[]> {
    log.setLevel(log.LEVELS.INFO);

    
    let sampleURLS: string[] = [];
    const crawler = new CheerioCrawler({
        additionalMimeTypes: ["text/plain"],
        maxRequestsPerCrawl: 2 * urlsCount,
        // Function called for each URL
        async requestHandler({ response, request, body, enqueueLinks, log, $ }) {

            if (sampleURLS.length > urlsCount) {
             return;   
            }
            // log.info(request.url);
            // log.debug(request.url);
            // log.debug(body);
            // log.debug(response.headers);

            sampleURLS.push(request.url);

            let newUrls:string[] = [];
            let linkLimit = 10;

            // Starting point: robots.txt
            if (response.headers["content-type"]?.indexOf("plain") != -1) {
                log.debug("Plain text response received:" + request.url);
                const textBody = body.toString();
                // console.log(textBody);
                // split on newline
                const textBodySplit = textBody.split(/[\r\n]+/);
                for (const line of textBodySplit) {
                    // split on whitespace
                    const splitLine = line.split(/\s+/g);
                    if (splitLine.length == 2) {
                        if (splitLine[0].indexOf("Sitemap") != -1) {
                            log.info("Found Sitemap link: " + splitLine[1]);
                            newUrls.push(splitLine[1]);
                        } else {
                            log.info("Found robots.txt pair >>>>>>   " + splitLine[0] + " " + splitLine[1]);
                        }
                    }
                }
                log.debug("Enqueuing links containing sitemap at " + request.url +JSON.stringify(newUrls));
            // xml sitemaps
            } else if (response.headers["content-type"]?.indexOf("xml") != -1) {
                log.debug("XML response received:" + request.url);
                const locTags = $("loc");            
                
                locTags.each((index, element) => {
                    if (index < linkLimit) {
                        const locTagText = $(element).text();
                        // console.log(locTagText);
                        newUrls.push(locTagText)
                    }
                });

                log.debug("Enqueuing links from xml sitemap at "+ request.url +JSON.stringify(newUrls));
            // html documents
            } else if (response.headers["content-type"]?.indexOf("html") != -1) {
                log.debug("HTML response received:" + request.url);
                const aHrefs = $('a');
                log.debug("Found " + aHrefs.length + "<a></a> tags ");
                aHrefs.each((index, element) => {
                    // TODO: heuristics for selecteing "better links"
                    if (index < linkLimit) {
                        const url = $(element).attr("href");
                        if (url) {
                            newUrls.push(url);
                        }
                    }
                })

                log.debug("Enqueuing links from html document at "+ request.url +JSON.stringify(newUrls));
            } else {
                log.info("Sitemapcrawler: Unsupported content-type: ");
                log.info(JSON.stringify(response.headers));
            }

            let absoluteUrls: string[] = [];
            var regularExpressionForURL = /^https?:\/\//i;
            for (const hrefUrl of newUrls) {
                // if the url contains https? we consider it to be an absolute path
                if (regularExpressionForURL.test(hrefUrl)) {
                    absoluteUrls.push(hrefUrl);
                } else {
                    const abs = getAbsoluteUrl(hrefUrl, request.url);
                    if (abs) {
                        absoluteUrls.push(abs);
                    }
                }
            }
            await enqueueLinks({urls: absoluteUrls});


        },
        proxyConfiguration: proxyConf,

    });

    const queue = await RequestQueue.open();
    await queue.drop();
    try {
        await crawler.run([robotsUrl,inputUrl ]);
    } catch (e:any) {
        log.error(e.message);
    }
    return sampleURLS;
}

export function getAbsoluteUrl(path: string, url:string): string | undefined {
    let href:string;
    try {
        href = new URL(path, url).href;
        // log.debug('Converting from relative to albolute, path: ' + path + " and url: " + url+ " = " + href);
        

    } catch (e:any) {
        // log.error('Failed to create absolute linke from path: ' + path + " and url: " + url);
        return undefined;
    }
    return href;
}