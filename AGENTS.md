# a little bird

The user authorized replacing the previous generated TanStack scaffold with this Next.js application. BUILD_INSTRUCTIONS.md and design/reference/homepage-final.png define scope. Do not restore the previous generator-specific auth, telemetry, SMTP, AI moderation, database, branding injection, or service-worker features. Old generator files are not part of the running Next.js application.

Use strict TypeScript, Next.js App Router, and server-only provider modules. Never persist message bodies, raw IPs, or raw recipient lists. Keep sending disabled unless all provider credentials, shared controls, and recipient consent/provider-use prerequisites are satisfied. Do not log sensitive request/provider payloads.

Run npm run lint, npm run typecheck, npm test, npm run build, and browser verification before deployment. Preserve permanent suppressions across deploys. Development runs on port 8080; this is a Windows-compatible project, not a Grok sandbox.
