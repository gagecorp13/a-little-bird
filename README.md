# a little bird

sometimes things are easier said anonymously.

Send a short note to an email address. The recipient sees the words, not the sender. There are no accounts.

This repository is a TanStack Start app (React, TypeScript, Tailwind) prepared for Vercel. The live product domain is [alittlebird.com](https://alittlebird.com).

## What a visitor does

1. Open the site.
2. Enter a recipient email and a note (1,000 characters).
3. Preview it.
4. Send. A second button is the one that actually sends.

The sender is not asked for a name or email. "Anonymous" means their identity is not included with the message. It does not mean the service is untraceable.

## Local development

```bash
npm install
npm run dev
```

The dev server listens on port 8080. With no `DATABASE_URL`, the app uses embedded Postgres and applies `migrations/` on startup. With no `RESEND_API_KEY`, a send is accepted in preview mode and no email is transmitted. The success screen says so.

```bash
npm test
npm run typecheck
npm run build
```

## Environment variables

Documented in [`.env.example`](.env.example). Set them in the host, not in a committed file.

| Variable | Required | Purpose |
| --- | --- | --- |
| `APP_SECRET` | Production | Pepper for hashes and HMAC tokens. Long random string. |
| `APP_URL` | Production | Public origin for links inside emails, e.g. `https://alittlebird.com`. |
| `SMTP_USER` | To send real mail | Full Purelymail address, e.g. `bird@alittlebird.com`. |
| `SMTP_PASS` | To send real mail | That mailbox's password, or an app password if two-factor is on. |
| `SMTP_HOST` | Optional | Defaults to `smtp.purelymail.com`. |
| `SMTP_PORT` | Optional | Defaults to `465` (SSL). |
| `EMAIL_FROM` | Recommended | Default `a little bird <bird@alittlebird.com>`. Must be that mailbox or an alias. |
| `EMAIL_REPLY_TO` | Recommended | Default `noreply@alittlebird.com`. Replies do not reach the sender. |
| `RESEND_API_KEY` | Optional fallback | Used only when SMTP is unset. |
| `RESEND_WEBHOOK_SECRET` | Recommended | Svix signing secret for `POST /api/email/webhook`. |
| `TURNSTILE_SECRET_KEY` | Recommended | Cloudflare Turnstile secret. Verified on the server. |
| `VITE_TURNSTILE_SITE_KEY` | With Turnstile | Public site key. The only email-protection value that may use a `VITE_` prefix. |
| `DATABASE_URL` | Injected on deploy | Postgres connection string. Do not hardcode it. |

`XAI_API_KEY`, when the host injects it, adds one short safety classification on send. Heuristics still run if it is absent. The note text is sent for that check; the recipient address is not.

Never expose `SMTP_PASS`, `RESEND_API_KEY`, `APP_SECRET`, `TURNSTILE_SECRET_KEY`, `DATABASE_URL`, or webhook secrets to the browser.

## Email

Sending lives in `src/lib/email/sendAnonymousMessage.server.ts`. Production mail goes out through Purelymail SMTP (`smtp.purelymail.com:465`). Resend remains a fallback when SMTP is unset.

- From name: **a little bird**
- Suggested from address: `bird@alittlebird.com`
- Reply-To: `noreply@alittlebird.com`
- Subject: `a little bird told us something...`
- Each message includes signed links to block future notes and to report the message.

The provider's acceptance is stored only as a status on the response. The app does not claim the recipient opened the email. Message text and raw addresses are not written to the database.

## Database

`migrations/0002_bird.sql` creates:

- `blocked_recipients` — hash of the address, until they undo the block
- `send_events` — hashed signals and a message fingerprint, deleted after about 48 hours
- `reports` — category and optional note, deleted after about 90 days
- `product_counters` — aggregate totals only

Preview uses embedded Postgres. Deploy applies the same files to Neon when `DATABASE_URL` is present (`npm run build` runs migrations).

## Abuse controls

- Rate limits across more than one hashed signal (about 5 an hour, 20 a day, plus a short rest between sends)
- Honeypot and timing check; Turnstile when both keys are set
- Duplicate note to the same address inside 30 minutes
- Block list checked before send. The sender is not told that a block is the reason.
- Local checks for threats, exploitation, scams, personal data, and HTML markup
- Optional model check when `XAI_API_KEY` is set
- Signed, expiring report and block tokens, compared with a timing-safe HMAC check

Friendly errors stay in the site's voice. Internal rules are not printed in the UI.

## Deploy to Vercel

1. Create a GitHub repository.
2. Push this project to GitHub.
3. Import the repository into Vercel.
4. Configure the environment variables above.
5. Confirm the database is provisioned (`DATABASE_URL`).
6. Configure Resend (or replace the email module) and verify the sending domain.
7. Add `alittlebird.com` in Vercel and at the registrar.
8. Point DNS at Vercel as the dashboard instructs.
9. Add SPF for the sending provider.
10. Add DKIM records from the provider.
11. Add a DMARC record (`p=none` while you watch, then tighten).
12. Set `RESEND_WEBHOOK_SECRET` and point Resend webhooks at `https://alittlebird.com/api/email/webhook`.
13. Deploy production.
14. Send a real note to an inbox you control.
15. Open the report link and submit a category.
16. Open the block link, confirm the address stops receiving notes, then undo it if you want mail again.
17. Send quickly enough to see the rest message.
18. Check the layout on a phone.

### DNS sketch

Use the exact records Resend and Vercel give you. The shape is usually:

- `A` / `CNAME` for `alittlebird.com` and `www` → Vercel
- `TXT` SPF on the sending subdomain including Resend
- `CNAME` or `TXT` DKIM keys from Resend
- `TXT` `_dmarc.alittlebird.com` → `v=DMARC1; p=none; rua=mailto:dmarc@alittlebird.com`

Do not invent record values. Copy them from the provider after the domain is verified.

## Manual smoke test

- Invalid email shows: hmm... that doesn't look like somewhere our bird can fly.
- Empty note shows: the bird needs something to say.
- Confirm step appears before anything is sent. "make a change" returns to the form.
- A normal note reaches the success state. Without a mail key, the copy says nothing was emailed.
- With a mail key, the copy says the note was sent for delivery, not that it was opened.
- `<script>` in a note is refused.
- A second identical note within half an hour is refused.
- Report and block links with a bad token fail gently.
- Keyboard: tab through the form, see a focus ring, submit with Enter.
- Phone width: no sideways scroll, buttons easy to tap.

## Routes

| Path | Purpose |
| --- | --- |
| `/` | Write and send |
| `/how-it-works` | Three steps |
| `/safety` | What anonymity does and does not mean |
| `/about` | Why the site exists |
| `/privacy` | What is processed and for how long |
| `/terms` | Prohibited uses |
| `/report` | Report form (signed token) |
| `/block` | One-click block, with undo |
| `POST /api/messages` | Validate, protect, send |
| `POST /api/report` | Store a report category |
| `POST /api/block` | Block or undo |
| `POST /api/events` | Aggregate counters only |
| `POST /api/email/webhook` | Signed bounce and complaint intake |
