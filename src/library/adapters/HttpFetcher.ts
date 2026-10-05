import type { Fetcher } from '../core/internal-interfaces';

export class HttpFetcher implements Fetcher {
    async fetch(url: string): Promise<Response> {
        return globalThis.fetch(url);
    }
}
