import { Actor, ProxyConfiguration, ProxyConfigurationOptions } from "apify";
import { ProxyConfiguration as CrawleeProxyConfiguration, log, ProxyInfo } from "crawlee";

// create ProxyCOnfiguration based on input schema proxyConfig
// apify
export async function getApifyProxyConfiguration(proxyConfig: ProxyConfigurationOptions & { useApifyProxy?: boolean }): Promise<ProxyConfiguration | undefined> {
    let proxyConfiguration: ProxyConfiguration | undefined;

    try {
        if (proxyConfig.useApifyProxy) {
            log.info("Creating proxy configuration using Apify proxy.");
            if (process.env.APIFY_PROXY_PASSWORD) {
                proxyConfiguration = await Actor.createProxyConfiguration(
                    {
                        groups: proxyConfig.apifyProxyGroups,
                        countryCode: proxyConfig.apifyProxyCountry,
                        password: process.env.APIFY_PROXY_PASSWORD
                    }
                );
                log.info("Sucessfully created proxy configuration using APIFY_PROXY_PASSWORD.");

            } else {
                log.error("Apify proxy password not found.");
                log.info("Apify proxy configuration will be undefined.")
            }
        } else if (proxyConfig.proxyUrls?.length){
            log.info("Creating proxy configurationfrom the list of proxy urls.");
            proxyConfiguration = await Actor.createProxyConfiguration({ proxyUrls: proxyConfig.proxyUrls })
            log.info("Sucessfully created proxy configuration using input.proxyConfig.proxyUrls");
        } else {
            log.info("Apify proxy configuration will be undefined.")

        }
        return proxyConfiguration;
    } catch (e: any) {
        log.error('Failed to create Apify proxy configuration.');
        log.error(e.message);
        log.info("Actor will continue without proxy. ");
    }
    return undefined;
}


// playwrights version of proxy configuration
export interface PlaywrightProxyConfiguration {
    server: string;
    bypass?: string | undefined;
    username?: string | undefined;
    password?: string | undefined;
};

export async function getPlaywrightProxyConfiguration(proxyUrl: string | undefined): Promise<PlaywrightProxyConfiguration | undefined> {
    let proxyConf: PlaywrightProxyConfiguration | undefined;

    try {
        if (proxyUrl) {
            const matched = proxyUrl.match("^(https?:\/\/)(.*?):(.*)@(.*)");
            const protocol = matched?.[1];
            const username = matched?.[2];
            const password = matched?.[3];
            const server = matched?.[4];
            // if (matched) {
            //     for (let i = 0; i < matched.length; i++) {
            //         const element = matched[i];
            //         log.debug(i + ": " + element);
            //     }
            // }
            proxyConf = {
                server: protocol! + server!,
                username: username!,
                password: password
            }
            log.info("Sucessfully created Playwright proxy configuration.")
            // log.debug("PW proxy conf: " + JSON.stringify(proxyConf));
            return proxyConf;

        } else {
            log.info("Proxy url is empty. Playwright will not use proxy.")
        }
    } catch (e: any) {
        log.error("Failed to create playwright proxy configuration.")
    }

    return undefined;
}
// create ProxyCOnfiguration based on input schema proxyConfig
// crawlee
export async function getCrawleeProxyConfiguration(apifyProxyConf: ProxyConfiguration | undefined, proxyConfig: ProxyConfigurationOptions & { useApifyProxy?: boolean }): Promise<CrawleeProxyConfiguration | undefined> {
    let proxyConf: CrawleeProxyConfiguration | undefined;

    try {
        if (proxyConfig.useApifyProxy) {
            if (apifyProxyConf) {
                proxyConf = new CrawleeProxyConfiguration({ proxyUrls: [await apifyProxyConf!.newUrl()] })
                log.info("Sucessfully created crawlee proxy cinfiguration using apifyProxyConfiguation.newUrl.")
            } else {
                log.info("Failed to create crawlee proxy conf. Cheerocrawler will not use proxy. ");

            }
        } else if (proxyConfig.proxyUrls?.length){
            proxyConf = new CrawleeProxyConfiguration({ proxyUrls: proxyConfig.proxyUrls })
            log.debug("Sucessfully created crawlee proxy configuration using an array of proxy url.");
            return proxyConf;
        } else {
            log.info("CheerioCrawler will not use proxy.")

        }
    } catch (e: any) {
        log.error('Failed to create CRAWLEE proxy configuration.');
        log.error(e.message);
        log.debug("Cheeriocrawler will NOT use a proxy server. ");
        return undefined;
    }
    return proxyConf;
}