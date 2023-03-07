import { Actor, ProxyConfiguration, ProxyConfigurationOptions } from "apify";
import { ProxyConfiguration as CrawleeProxyConfiguration, log } from "crawlee";
import { Input } from "../types";

// create ProxyCOnfiguration based on input schema proxyConfig
// apify
export async function getApifyProxyConfiguration(input: Input): Promise<ProxyConfiguration | undefined> {
    let proxyConfiguration: ProxyConfiguration | undefined;

    try {

        if (input.proxyConfig.useApifyProxy) {
            log.info("Using Apify proxy.");
            if (process.env.APIFY_PROXY_PASSWORD) {
                proxyConfiguration = await Actor.createProxyConfiguration({ ...input.proxyConfig, password: process.env.APIFY_PROXY_PASSWORD });
                log.info("Sucessfully created proxy configuration using APIFY_PROXY_PASSWORD");

            } else {
                log.error("Apify proxy password not found.");
            }
        } else {
            proxyConfiguration = await Actor.createProxyConfiguration({ proxyUrls: input.proxyConfig?.proxyUrls })
            log.info("Sucessfully created proxy configuration using input.proxyUrls");
        }
        return proxyConfiguration;
    } catch (e: any) {
        log.error('Failed to create a proxy configuration.');
        log.error(e.message);
        log.debug("Actor will continue without proxy. ");
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

export async function getPlaywrightProxyConfiguration(input: Input): Promise<PlaywrightProxyConfiguration | undefined> {
    if (process.env.APIFY_PROXY_PASSWORD) {
        let proxyConfiguration = {
            server: "proxy.apify.com:8000",
            username: "auto",
            // groups-RESIDENTIAL
            // https://github.com/apify-projects/store-crawler-google-places/blob/master/.actor/INPUT_SCHEMA.json#L858
            password: process.env.APIFY_PROXY_PASSWORD
        }
        return proxyConfiguration;
    } else {
        // TODO: proxy url array for playwright? 
    }
    return undefined;
}
// create ProxyCOnfiguration based on input schema proxyConfig
// crawlee
export async function getCrawleeProxyConfiguration(apifyProxyConf: ProxyConfiguration | undefined, input: Input): Promise<CrawleeProxyConfiguration | undefined> {
    let proxyConf: CrawleeProxyConfiguration | undefined;

    try {
        if (input.proxyConfig.useApifyProxy) {
            if (apifyProxyConf) {
                proxyConf = new CrawleeProxyConfiguration({ proxyUrls: [await apifyProxyConf!.newUrl()] })
                return proxyConf;
            }
        } else {
            proxyConf = new CrawleeProxyConfiguration({ proxyUrls: input.proxyConfig.proxyUrls })
            return proxyConf;
        }
    } catch (e: any) {
        log.error('Failed to create CRAWLEE proxy configuration.');
        log.error(e.message);
        log.debug("Actor will continue without proxy. ");
    }
    return undefined;
}