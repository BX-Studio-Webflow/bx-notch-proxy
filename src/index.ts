/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `pnpm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `pnpm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `pnpm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request, env): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;
		const publicOrigin = `${url.protocol}//${url.host}`;

		const { PAGES_URL } = env;
		const { WEBFLOW_URL } = env;

		if (!PAGES_URL || !WEBFLOW_URL) {
			return new Response('Missing env bindings: PAGES_URL or WEBFLOW_URL', { status: 500 });
		}

		const isRoot = path === '/';
		const targetOrigin = isRoot ? PAGES_URL : WEBFLOW_URL;
		const targetUrl = new URL(path + url.search, targetOrigin);

		const hopByHop = [
			'connection',
			'keep-alive',
			'proxy-authenticate',
			'proxy-authorization',
			'te',
			'trailer',
			'transfer-encoding',
			'upgrade',
		];

		const forwardHeaders = new Headers();
		for (const [k, v] of request.headers) {
			if (!hopByHop.includes(k.toLowerCase())) forwardHeaders.set(k, v);
		}
		forwardHeaders.set('host', targetUrl.hostname);

		const init: RequestInit = {
			method: request.method,
			headers: forwardHeaders,
			body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
			redirect: 'manual',
		};

		const upstream = await fetch(targetUrl.toString(), init);

		const resHeaders = new Headers(upstream.headers);
		resHeaders.set('x-proxy-origin', isRoot ? 'pages' : 'webflow');

		if (resHeaders.has('location')) {
			const loc = resHeaders.get('location')!;
			try {
				const locUrl = new URL(loc, targetOrigin);
				if (locUrl.origin === new URL(targetOrigin).origin) {
					const rewritten = locUrl.href.replace(new URL(targetOrigin).origin, publicOrigin);
					resHeaders.set('location', rewritten);
				}
			} catch (e) {
				// ignore invalid Location
			}
		}

		return new Response(upstream.body, {
			status: upstream.status,
			headers: resHeaders,
		});
	},
} satisfies ExportedHandler<Env>;
