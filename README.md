# a little bird

An illustrated, no-account note sender for [alittlebird.com](https://alittlebird.com), built with Next.js App Router and TypeScript. The supplied final homepage artwork is preserved in `design/reference/homepage-final.png` and rendered as separate decorative SVG layers around native, accessible form controls.

## Scope

- One to five recipients, each receiving a separate email; 1,000 Unicode code points of plain text.
- Resend delivery from `a little bird <chirp@alittlebird.com>`, with the complete note, optional home link, recipient opt-out, and reporting links.
- No accounts, replies, inbox, public message links, draft storage, advertising analytics, or message archive.
- Cloudflare Turnstile and atomic, persistent Upstash limits. Limits fail closed when the shared store is unavailable.
- No application persistence or logging of message bodies, raw IP addresses, or raw recipient lists. Providers may retain their own email and operational data. Sender anonymity is not guaranteed.

## Current release

The public website is published with **sending disabled**. Resend and Upstash are provisioned on their free plans. Delivery stays off until Turnstile, domain verification, provider permitted-use/recipient-consent requirements, and the full delivery checks are complete. A provider accepting an email does not guarantee delivery.

Resend's acceptable-use policy requires recipient opt-in. An arbitrary-recipient public service must resolve permitted use before enabling production sending; domain verification alone is insufficient. Do not bypass `PROVIDER_USE_APPROVED` or enable it merely because credentials exist.

## Develop and verify

Use Node.js 24.x in production and CI. `npm ci`, then `npm run dev` (port 8080). Copy `.env.example` to a local ignored environment file when needed. With default settings, the form displays an honest unavailable message and the API returns 503; there is no simulated delivery.

Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. With the development server running, run `npm run test:e2e`.

`tests/store.integration.test.ts` runs only with `RUN_STORE_INTEGRATION=true` and Redis credentials. It creates random `alb:verify:*` namespaces and deletes only its own disposable test keys. Never point tests at a production namespace. `scripts/visual-check.mjs` captures desktop, mobile, and narrow-phone screenshots.

## Configuration and rollout

See `.env.example`, `BUILD_INSTRUCTIONS.md`, `design/asset-manifest.md`, and `QA_REPORT.md`. Secrets belong in Vercel's Production environment. Keep Preview/Development delivery off and avoid attaching the production database to those environments.

Initialize the security markers once with explicit Redis credentials and namespace: `npm run security:init`. This preserves existing suppressions and never enables delivery. Both `SENDING_ENABLED=true` and the Redis `security:sending_enabled` marker must permit sending, and every prerequisite in `deliveryConfigured()` must pass. A sending pause must not disable recipient opt-out/report processing.

First use `MAIL_MODE=allowlist` and an explicitly consented test recipient allowlist. Verify received HTML/plain text, SPF/DKIM/DMARC results, privacy of recipient lists, suppression, signed webhooks, failure modes, and caps before switching to production. Never send a real test to invented addresses at other providers.

The existing GitHub repository and Vercel project are reused. `vercel.json` selects Next.js and the build/install commands. Preserve the previous implementation in Git history for rollback; rollback does not roll back the suppression database.
