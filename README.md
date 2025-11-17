# Webflow ↔ WordPress Proxy

Cloudflare Worker that proxies selected routes (homepage + blog) to Webflow while sending the rest to WordPress. Useful when migrating a site gradually or when the marketing site lives in Webflow but the app/blog lives on WordPress.

## Prerequisites

- Node 20+
- `pnpm` (preferred package manager)
- `wrangler` CLI (auto-installed via devDependencies)
- Cloudflare account with Workers enabled

## Local Development

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Create `.dev.vars` in the project root (not in `src/`) with the target origins:
   ```
   WEBFLOW_URL=https://your-webflow-site.com/
   WORDPRESS_URL=https://your-wordpress-site.com/
   ```
   These must be absolute URLs including the protocol. The example file in the repo already points to the demo sites we use for local testing.
3. Run the Worker dev server:
   ```bash
   pnpm run dev
   ```
4. Hit `http://localhost:8787` (or the port Wrangler prints). Routes `/`, `/blog`, `/blog/*` proxy to Webflow; everything else goes to WordPress.

## Deployment

1. Ensure `wrangler.jsonc` has the correct `WEBFLOW_URL` / `WORDPRESS_URL` values for each environment or set them via Cloudflare dashboard.
2. Deploy:
   ```bash
   pnpm run deploy
   ```

`pnpm run build` runs a dry-run deploy, `pnpm run check` runs `tsc`, and `pnpm run lint` covers ESLint + Prettier. Use `pnpm run cf-typegen` whenever bindings change to refresh Worker env typings.

## Package Scripts

| Command | Description |
| --- | --- |
| `pnpm run dev` | Launches `wrangler dev` for local development with hot reload. |
| `pnpm start` | Alias of `pnpm run dev`. |
| `pnpm run deploy` | Publishes the Worker via `wrangler deploy`. |
| `pnpm run build` | Runs `wrangler deploy --dry-run` to validate the bundle without deploying. |
| `pnpm run test` | Executes the Vitest suite using the Cloudflare Workers pool. |
| `pnpm run lint` | Runs ESLint and Prettier in check mode over `src`. |
| `pnpm run lint:fix` | Same lint command but applies ESLint fixes and formats with Prettier. |
| `pnpm run check` | Type-checks with `tsc --noEmit`. |
| `pnpm run cf-typegen` | Generates Worker `Env` typings via `wrangler types`. |

