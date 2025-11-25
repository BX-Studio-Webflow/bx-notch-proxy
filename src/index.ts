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

		// Define webflow routes priorities
		const WEBFLOW_ROUTES = [
			'/', // landing page
			'/blog', // blog index
			'/blog/', // normalized
		];

		const path = url.pathname;

		// Check if Webflow route
		const isWebflow = WEBFLOW_ROUTES.includes(path) || path.startsWith('/blog/');

		const target = isWebflow ? env.WEBFLOW_URL : env.OTHER_URL;

		// Build the new proxied URL
		const newURL = `${path}${url.search}`;

		console.log({ newURL, target, env: { OTHER_URL: env.OTHER_URL, WEBFLOW_URL: env.WEBFLOW_URL } });

		const targetURL = new URL(newURL, target);

		// Clone headers, strip hop-by-hop headers
		const newHeaders = new Headers(request.headers);
		newHeaders.set('host', targetURL.hostname);

		const response = await fetch(targetURL, {
			method: request.method,
			headers: newHeaders,
			body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
			redirect: 'follow',
		});

		// Ensure correct CORS, security & caching
		const resHeaders = new Headers(response.headers);
		resHeaders.set('x-proxy-origin', isWebflow ? 'webflow' : 'wordpress');

		return new Response(response.body, {
			status: response.status,
			headers: resHeaders,
		});
	},
} satisfies ExportedHandler<Env>;
