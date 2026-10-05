import { readFile } from 'node:fs/promises';
import type { Fetcher } from '../core/internal-interfaces';

const MOCK_SERVER_ORIGIN = 'http://localhost:6153';

export class LocalFetcher implements Fetcher {
	async fetch(url: string): Promise<Response> {
		if (!url.startsWith(MOCK_SERVER_ORIGIN)) {
			throw new Error(`Mock fetcher only supports ${MOCK_SERVER_ORIGIN}`);
		}
		const { pathname } = new URL(url);
		const file = await readFile(new URL(`../../../www${pathname}`, import.meta.url));
		return new Response(file);
	}
}
