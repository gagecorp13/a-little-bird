# Release verification — October 9, 2026

## Release scope

Illustrated Next.js replacement of the previous generated application. Sending remains disabled in both the Production environment and the shared Redis marker. This report covers the disabled release, tested primitives, and completed service provisioning; it is not a claim that real email delivery is ready.

## Completed verification

- Type checking and ESLint pass.
- Next.js production build passes; pinned Next.js 16.4.0 and React 19.3.0. Vercel uses Node.js 24.x.
- 22 validation, privacy, email escaping, token authentication, and send-route tests pass. They exercise retries, recipient isolation, wrong origins, bot-check failure, network uncertainty, post-dispatch storage failure, and fail-closed behavior.
- Seven additional tests pass against the provisioned Upstash database, in disposable isolated namespaces: concurrent IP and global quota reservation, initialization/kill switch, stable submission charging, suppression before dispatch, pair limits, TTL preservation, and exclusive dispatch claims. Only each test's own keys are deleted.
- Four browser tests pass: recipient rows and character count, narrow-screen reflow, recipient-link GET safety and disabled API, and an automated WCAG A/AA accessibility scan. Automated scanning does not establish complete accessibility conformance.
- Desktop 1448 × 1086, phone 390 × 844, and narrow phone 320 × 740 were inspected. No horizontal overflow or browser console errors were observed. The source tree, bird, swing, wordmark, and paper outlines remain recognizable and faithful. Editable handwriting and background texture are approximations recorded in the asset manifest.
- Production dependency audit reports zero vulnerabilities. The full development audit reports five linked findings from `braces` through Next's lint toolchain (GHSA-vfj7-8cjw-p6xm). No compatible published fix was observed; the suggested major downgrade is inappropriate. Revisit when a fixed dependency becomes available. These packages do not run in the production application.

## Provisioned services

- Resend free resource `alittlebird-email`, connected to Production. The required DKIM, send-subdomain SPF TXT and feedback MX records were added by the Vercel integration. Open/click tracking and receiving are disabled. Domain verification was requested and was pending at the last setup check.
- DMARC monitor policy exists at `_dmarc.alittlebird.com`, without an invented report mailbox. Verify actual received-message alignment before tightening policy.
- Signed bounce/complaint/suppression webhook configured for the new endpoint. Its signing secret is in Vercel.
- Upstash free resource `alittlebird-security`, connected to Production, with eviction and automatic paid upgrade explicitly disabled during provisioning. Shared database connectivity and initialization are verified. Production sending marker is `0`.
- Cloudflare free managed widget `alittlebird-production` restricts use to alittlebird.com. Pre-clearance is off. Public site key and secret are in the corresponding Vercel settings.
- Independent HMAC/signing keys and required settings are stored in Vercel; no credentials are committed. Production resources are not attached to Preview/Development.

## Required before enabling delivery

## Published deployment checks

The production deployment is live at https://alittlebird.com. Vercel's Node.js 24.x build succeeded and GitHub CI passed. All four browser tests passed against the actual live domain; desktop/mobile/narrow-phone capture reported no console errors or horizontal overflow. The disabled send API returned 503, recipient action links remained inert on GET, and the excluded read route returned 404. Production responses include the privacy/security headers and no-store policy. The www host redirects to the canonical origin so browser form requests use the configured origin.

## Required before enabling delivery

Resolve Resend's permitted-use/recipient-opt-in requirements for this service, then complete domain verification and least-privilege API-key review. Exercise real Turnstile success, expiry, replay, wrong-host/action and provider failures. Use an explicit consenting allowlist for actual delivery tests; inspect received plain text/HTML and SPF/DKIM/DMARC results. Exercise opt-out/report persistence and authenticated complaint/permanent-bounce webhooks end to end, including replay and Redis failure. Verify reduced motion, keyboard/screen-reader interaction, email-client fragment links, and safety under deployment concurrency.

No real recipient email has been sent during this release. Public sending stays disabled until the prerequisites and tests are complete. See BUILD_INSTRUCTIONS.md for the detailed activation checklist and rollback procedure.
