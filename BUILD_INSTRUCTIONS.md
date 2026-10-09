# alittlebird.com — BUILD_INSTRUCTIONS.md

Prepared for Codex on **October 8, 2026**. This is an implementation specification, not a claim that the site has already been built, tested, or deployed.

## 1. Purpose, authority, and known gaps

Build **a little bird**, an illustrated, anonymous-to-the-recipient email messaging website at `https://alittlebird.com`. A visitor enters one to five recipient email addresses and one plain-text message, completes any required anti-bot check, and sends without creating an account or providing a sender name or email. Each recipient receives an individual branded email containing the entire message, sent by **`a little bird <chirp@alittlebird.com>`** through Resend.

Use this priority order when implementing:

1. The explicit requirements and exclusions in this document, reflecting the user's latest request.
2. The **final homepage artwork**, originally supplied as `/mnt/data/image.png`, for visual composition, colors, lettering, forms, tree, and bird.
3. The recoverable written direction from the referenced conversation, **Website design fleshing**.
4. The implementation defaults below where the user has not made a choice.

**Verified artwork:** the user reattached the final image during this task. It has now been visually inspected and sampled. An unchanged copy is delivered beside this document as **[homepage-final.png](design/reference/homepage-final.png)**, 1448 × 1086 pixels, exactly 4:3. Its SHA-256 is `49a5ce45452f483ff0e37160c0a98ffd74d5244bf2709a939dd9b6eb575e5c4c`. Copy that file unchanged into `design/reference/homepage-final.png` in the implementation repository. The older `/mnt/data/image.png` path refers to the original ChatGPT environment and need not exist locally. Use the delivered reference rather than guessing from that missing path.

**Conversation limits:** several newer assistant messages were returned only as content-reference placeholders. The numbered “yes” answers cannot reconstruct missing questions. The current explicit request supplies the functional scope; do not invent additional decisions from those answers.

**Confirmed final tagline:** `some things are better left unsigned.` Preserve its lowercase lettering and final period. The image supersedes the older “for things said softly” suggestion.

**Provider compatibility is a production prerequisite:** Resend's current acceptable-use policy prohibits unsolicited mail and requires explicit recipient opt-in. An unrestricted anonymous service where a stranger can type any email address may conflict with that policy. Rate limiting, a sender checkbox, and later opt-out are not proof of prior recipient consent. Build and test the requested experience with mock delivery and consenting test recipients; keep public sending disabled until the owner establishes a compliant use case accepted by Resend. Do not silently add registration, recipient enrollment, or switch providers to evade this constraint. If the requested public model is not permitted, report that limitation and obtain a product decision before enabling it. This is a documented provider constraint, not a claim about a legal exemption. [Resend acceptable-use policy](https://resend.com/legal/acceptable-use)

## 2. Required scope and explicit exclusions

### Required

- One primary illustrated homepage faithful to the final flat artwork.
- No signup, login, sender account, required sender name, or sender email field.
- One message of at most **1,000 characters**, with an explicit counting rule below.
- Multiple recipients: **maximum five distinct addresses per submission** by default.
- Resend delivery from `chirp@alittlebird.com`, with separate envelopes for recipients.
- Branded HTML email and equivalent plain-text fallback; the full message is in both.
- An optional, quiet link back to `alittlebird.com`; opening the site is never required to read the message.
- No sender reply mechanism; clear wording that replies do not reach the sender.
- Free-tier Cloudflare Turnstile and persistent shared rate limits backed by Upstash Redis.
- Working recipient opt-out, abuse reporting, bounce/complaint suppression, and a sending kill switch.
- No application persistence of message content or recipient address lists.
- Minimal pseudonymous abuse-control metadata with explicit retention.
- Bird/envelope send animation, accessible on-page confirmation, and honest failure states.
- Responsive and accessible implementation using Next.js App Router and TypeScript.
- GitHub repository, Vercel deployment, secret configuration, authenticated email DNS, and meaningful verification.

### Do not build

No “read a message” navigation or route; no passcode, cache, deposited message, inbox, message archive, public message URL, thread, reply, delivery-status dashboard, read receipt, open tracking, click tracking, attachment upload, rich-text composer, AI rewriting/moderation service, scheduling, contact import, address book, paid tier, mobile app, marketing newsletter, analytics funnel, or admin dashboard. Remove any obsolete “read a message” lettering from the derived illustration while preserving the original reference file. Future deposited messages are expressly outside v1.

Security and privacy utility routes described below are part of the required abuse controls, not a message-reading feature. Do not add routes or controls for speculative future functionality.

## 3. Stack and repository shape

Use a currently supported stable Next.js release with App Router, React, strict TypeScript, and the Node.js runtime on Vercel. Resolve compatible versions from official documentation at implementation time, pin them through the lockfile, and record the actual Node and package versions in the README. Do not hardcode a remembered “latest” version. Use npm unless an existing repository requires another package manager.

Recommended minimal dependencies: `resend`, `@upstash/redis`, `zod`, `server-only`, a maintained IP parsing library, and the official/compatible webhook signature verifier. Use CSS or CSS Modules for this distinctive artwork; Tailwind is optional, not a design system. Use Vitest and Playwright for behavior and browser verification, plus axe for automated accessibility checks. Avoid a component library that changes the appearance or adds unused features.

Use Route Handlers with an explicit `POST` send endpoint; a Server Action is unnecessary for this specification. Make server modules impossible to import into the browser. Never put Resend, Redis, HMAC, or Turnstile secret keys in client code. App Router uses the normal Request/Response APIs in Route Handlers. [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)

Suggested organization (adapt names, preserve responsibilities):

```text
app/
  layout.tsx
  page.tsx
  globals.css
  privacy/page.tsx
  about/page.tsx                 # Only “what is this?” / “how it works” information
  opt-out/page.tsx               # Confirmation UI; never shows a message
  report/page.tsx                # Fixed-choice report UI; never shows a message
  api/send/route.ts
  api/opt-out/route.ts
  api/report/route.ts
  api/webhooks/resend/route.ts
components/
  IllustratedScene.tsx
  MessageForm.tsx
  RecipientFields.tsx
  SketchFrame.tsx
  BirdDelivery.tsx
  TurnstileChallenge.tsx
  SendStatus.tsx
lib/
  validation.ts                 # Pure shared parsing/counting; no secrets
  server/config.ts
  server/client-ip.ts
  server/identifiers.ts
  server/turnstile.ts
  server/rate-limits.ts
  server/submissions.ts
  server/suppression.ts
  server/control-tokens.ts
  server/send-email.ts
  server/webhooks.ts
  server/safe-logging.ts
emails/
  little-bird.tsx               # Or a small safely escaped HTML renderer
public/
  artwork/                     # Derived tree, bird, envelope, frames, wordmark
  fonts/                       # Licensed, self-hosted assets only
design/reference/homepage-final.png
design/measurements.md
design/asset-manifest.md
tests/unit/
tests/integration/
tests/e2e/
scripts/                       # Narrow maintenance/verification commands, no UI
.env.example
.gitignore
README.md
BUILD_INSTRUCTIONS.md
```

Prefer static rendering for the public informational content. Personalized forms, token responses, webhook responses, and send responses must never enter a shared cache. No database of messages, queue containing messages, or background job containing message content is allowed.

## 4. Reconstruct the final illustration faithfully

### 4.1 Inspect before drawing

The inspected artwork is a warm textured red-orange field with a large ivory tree, fine black bark hatching, sparse ivory leaves, and an off-center trunk rising beyond the top edge. Its thick right branch supports a tiny cream bird facing right. Two thin dark ropes suspend a crooked cream recipient sign; further ties connect a larger uneven message sheet and a smaller wooden “let it fly →” sign. A detailed black-and-cream tire swing hangs at left. Preserve the carved heart in the trunk, knots, sparse flowers/grass/rocks along the ground, and scattered falling leaves. “Orange tree” here means the illustrated orange-background tree scene; do not add fruit.

The supplied illustration is detailed pen-and-ink, not merely a few thin outline strokes. Preserve the dark bark/tire hatching and the muted paper texture. The message sheet contains a small sketched leaf in its lower-right corner; place it decoratively outside the editable text's usable area so entered text remains legible. The reference's gray placeholder lettering is low contrast and must become readable live placeholder text.

These approximate observed bounds provide a starting map, in pixels at 1448 × 1086. They are visual measurements, not precise tracing paths; refine against the image while producing assets.

| Feature | Approximate reference bounds / anchor |
| --- | --- |
| Wordmark “a little bird” | x 54–466, y 74–161; small `.com` near x 390–452, y 152–174 |
| Tagline | x 60–510, y 196–226 |
| Main trunk and spreading base | crown clipped by top; trunk around x 450–665 at midheight; roots spread approximately x 245–749 near y 1015 |
| Main right branch | joins trunk near (620, 300), rises toward (985, 184), runs beneath bird near (1170, 207) |
| Bird | x 1111–1208, y 111–204; feet on branch near (1165, 199) |
| Recipient label | x 815–1110, y 281–320 |
| Recipient sign | x 727–1250, y 305–439; right edge slightly higher |
| Message label | x 793–1151, y 459–502 |
| Message sheet | x 728–1301, y 485–731; gently rising top edge, uneven perimeter |
| Send placard | x 852–1128, y 741–851; hangs on two ties and tilts upward to right |
| Tire swing | rope attachment around (174, 360); tire approximately x 90–276, y 701–904 |
| Ground line | irregular grasses/flowers/rocks around y 966–1038 |
| Footer | baseline around y 1054; source includes a removed fourth link |

Color samples from texture-free-ish patches, for initial CSS only: red-orange approximately `#D24A16` (top-right sample) / `#D04B17` (left sample); cream paper approximately `#F7F1E3`; ivory tree approximately `#F7F0E1`. These are representative sampled pixels from a textured image, not a uniform palette. Preserve texture in assets and tune adjoining CSS backgrounds to avoid seams. Sample ink from a solid dark stroke, not a gray antialiased edge.

Inspect the actual reference at native resolution. Record its width, height, aspect ratio, dominant colors sampled away from antialiasing, positions of major branches, wordmark bounds, form bounds, labels, tilt angles, ropes/hinges, bird position, line weights, negative space, and all visible text in `design/measurements.md`. Record values both in reference pixels and as fractions of width/height. Record the image checksum and note any intentional functional/accessibility departures.

### 4.2 Asset strategy

Preserve the original image unchanged. Produce separate derived layers for the background, tree/branches, wordmark, bird, envelope, form-frame outlines, ropes/ties, button placard, and any existing secondary decoration. Prefer careful tracing of the supplied shapes into SVG, or transparent raster cutouts when that better preserves the original line quality. Retain uneven contours, sparse detail, crooked joins, paper angles, and irregular lettering. Do not replace the tree/bird with stock icons, a generated lookalike, smooth vector clip art, or a new art direction.

If extending hidden artwork is necessary to separate the bird or remove baked-in controls, reconstruct only the small missing areas in the same measured style. Keep added animation poses minimal and recognizable as the same bird. Record derived assets and font licenses in the asset manifest. Avoid generative recreation as the default because it can drift from the reference.

Do not implement the finished page as a screenshot with invisible hotspots. The tree can be illustration, but fields, labels, errors, counts, links, and button semantics must remain real HTML. Remove baked-in placeholder text or duplicate labels from the derived background before placing live equivalents. The animation needs an isolated bird; remove its static twin from the tree layer.

### 4.3 Layout and lettering

On desktop, use a reference-aspect-ratio scene container and normalized anchors for artwork. Use CSS grid and positioned wrappers to align real controls with the drawn frames. Keep the actual editing surfaces and hit targets rectangular, legible, and predictable; rotate/skew decorative frames independently when the source angle would impair typing or reading. Frame strokes and dangling ties must remain visible around focus rings and expanded content.

Use the extracted/traced wordmark for distinctive brand lettering, with one accessible “a little bird” heading/name. For functional labels, first identify a suitably licensed font matching the actual artwork, self-host a subset, and fine-tune letter spacing/size. If no close font exists, trace small decorative label lettering only with equivalent visible/live labeling where needed and document the accessibility tradeoff; never remove programmatic labels. User-entered text and lengthy help text must use a highly readable font, at least 16 CSS px for controls on mobile. Do not stretch an unrelated handwriting font to claim an exact match.

Create CSS variables from **measured** values, including background orange, paper, ink, primary line color, focus color, scene proportions, and anchor points. Do not invent supposedly exact hex values in advance. Where the original contrast is inadequate for functional text, preserve the artwork and minimally adapt the live control text/paper/focus colors to pass accessibility checks.

### 4.4 Visual acceptance

At the reference viewport, compare a browser screenshot side by side with the actual source and use a semi-transparent overlay/difference image. Check tree silhouette, branch endpoints, bird scale/position, wordmark, relative gaps, frame angles, rope attachments, orange field, and line texture. Assess image regions separately from antialiasing differences in text and the necessary removed feature. Avoid a fabricated universal pixel-difference threshold; annotate real deviations and correct visible composition errors. Include empty, populated, focus, error, loading, and confirmation screenshots. Never mark visual fidelity complete without the actual reference and inspection.

## 5. Homepage behavior and copy

Use the confirmed brand “a little bird” with small `.com` and tagline “some things are better left unsigned.” The table combines transcribed artwork text with unobtrusive functional additions required by this specification:

| Element | Copy / behavior |
| --- | --- |
| Recipient label | “who should hear this?” |
| First email placeholder | “someone@email.com” |
| Message label | “what would you like to say?” |
| Message placeholder | “psst...” |
| Send button | “let it fly” plus the reference's hand-drawn right arrow, decorative to assistive technology |
| Add-recipient control | “add another recipient” |
| Count | “0 / 1,000” with an accessible explanation |
| Small privacy explanation | “No name or account required. Your name and email aren't included.” |
| Normal completion title | “Off it goes.” |
| Normal completion detail | “Your request is complete. Delivery isn't guaranteed.” |
| Sending | “The bird is getting ready…” |
| Temporary service failure | “The bird needs a moment. Please try again later.” |
| Unknown dispatch outcome | “We couldn't confirm the result. A message may already be on its way. Please don't resend it immediately.” |

Keep required help/controls visually quiet. Do not introduce a conventional SaaS hero, feature cards, large menu, new slogan, testimonials, newsletter, or pop-up marketing.

Footer: preserve the illustrated treatment and the links `what is this?`, `how it works`, and `privacy`, with the reference's slim separators. Remove `read a message` and its trailing/adjacent separator from the derived artwork and navigation. Recenter the three-link group tastefully; do not keep a disabled teaser. The first two links may point to separate anchors on `/about` to avoid extra pages. Keep the tire swing decorative, with no invented hidden action.

### Recipient entry

Keep a single email field in the default composition. Add a small keyboard-accessible “add another recipient” control beside/below it, expanding into a maximum of five real `type="email"` inputs with individually named remove buttons. Do not squeeze five fields into the original narrow frame. The surrounding drawn note/frame should expand without overlapping the message area. A simple stack is preferable to an elaborate token-combobox.

Display “Up to 5 recipients. Each receives a separate email.” Use one address per field; clearly reject a pasted list with help explaining to add another recipient. Do not fetch contacts or verify mailbox existence in the browser. Display invalid-input feedback before sending; deduplicate server-side as well.

### Form state machine

Implement `editing → validating → sending → complete | partial | unknown | failed`, with a recoverable challenge-expired state. Disable repeat submission while a request is in flight, without trapping focus. Keep message and addresses only in component memory. No localStorage, sessionStorage, IndexedDB, service-worker cache, query string, URL fragment, or persistent draft. Do not log field values to the console.

On validation error, focus the first invalid control and associate its error text. On success, show inline confirmation in the same scene; no new page, modal-only acknowledgment, or confetti. Clear the message and addresses from application state on fully processed completion, and let the user return to the existing form with a modest “send another note” reset. The browser may retain form or process memory independently; do not promise secure memory erasure.

On partial/unknown outcome, retain the draft in memory for context and do not auto-resend the full submission. Explain that some mail may already have been accepted. Never reveal which address is suppressed, opted out, bounced, or complained. Do not show a fabricated delivered/read count.

## 6. Bird and envelope animation

Implement a brief state-driven animation using the isolated reference bird and a small envelope matching its line style. A suggested sequence after the server reports processed completion is: the bird leans toward a folded envelope, picks it up, lifts from the branch, and follows a gentle arc out of the scene over approximately 0.8–1.4 seconds. The confirmation appears immediately and does not wait for the animation to finish. Return/reset the bird only when composing another message or after a discreet settling transition.

During a pending request, allow a small restrained readiness motion if desired, but do not show successful flight before server confirmation. On an error, keep/return the bird to its perch; on unknown outcomes, show a neutral state. No perpetual flapping, ambient audio, flashing, or forced waiting. Never encode status only in the illustration.

Use transforms and opacity rather than animating large layout areas. Decorative SVG elements must not intercept input; mark them appropriately hidden from assistive technology. Respect `prefers-reduced-motion: reduce`: use a static bird and immediate confirmation without travel/rotation. Stop animation when the component unmounts and ensure sending remains functional if animation fails.

## 7. Responsive layout and accessibility

Preserve the illustration's composition at large widths while making the form usable at small widths. Use content-driven breakpoints, initially around 900px and 600px, then adjust by inspection. At narrow widths, keep the brand/tree/bird relationship but reflow recipient fields, textarea, challenge, button, status, and footer into normal document flow. Crop or simplify only decorative branch regions; do not scale the whole desktop UI down to unreadable text. Allow vertical scrolling rather than forcing everything into one screen.

Test at 320, 360, 390, 768, 1024, and 1440 CSS px, plus the actual source dimensions. Include short landscape viewports and mobile keyboards. Use `min-height` with modern viewport units and a fallback; never lock `height:100vh` with hidden overflow. Leave safe-area and touch padding. Five recipients, errors, 1,000 characters, and a visible Turnstile challenge must fit without collisions. A long unbroken message should wrap inside the textarea/email; use appropriate wrapping on displayed content.

Target WCAG 2.2 AA with manual verification:

- Logical landmarks, one main heading, real form labels, logical DOM/tab order, visible keyboard focus, and meaningful link/button names.
- Text contrast at least 4.5:1 for normal text and 3:1 for qualifying large text; do not treat non-logo handwriting as exempt. Control boundaries/focus indicators need adequate non-text contrast.
- At least 44px practical touch targets for primary actions; keep small illustrated marks inside larger actual buttons. Avoid crowded remove controls.
- Inline errors use text plus `aria-invalid` and `aria-describedby`; a concise status region uses `aria-live="polite"`. Avoid announcing the character counter on every keystroke.
- Test 200% text zoom and reflow at 400% browser zoom on a 1280px-wide desktop viewport (equivalent to roughly 320 CSS px). No horizontal scrolling for ordinary page content.
- Verify keyboard-only use, a screen reader, reduced motion, high contrast/forced colors, pasted Unicode, and focus after recipient removal.
- Native controls remain usable with delayed fonts or missing decorative assets. If JavaScript is unavailable, clearly state sending requires it; do not expose an unsecured fallback endpoint.
- Turnstile must fit, remain keyboard-accessible, and show an understandable recovery message when scripts are blocked. Never hide an interactive challenge under artwork.

Reference criteria: [WCAG text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [focus visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html), [status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html).

## 8. Input contract and normalization

Implement a strict schema; reject unknown fields, wrong types, excess items, and oversized strings. The server is authoritative. A suggested request is:

```ts
type SendRequest = {
  submissionId: string;       // crypto.randomUUID(), reused for this attempt only
  recipients: string[];      // 1–5 entries, one bare address each
  message: string;           // plain text only
  turnstileToken: string;
  website?: string;          // empty honeypot, not shown to normal users
};
```

### Message

Define “character” for v1 as a **Unicode code point** after normalizing CRLF/CR line endings to LF, using the same pure helper in client/server: conceptually `Array.from(normalizedMessage).length`. Most emoji count as one; joined emoji may count as several. Explain this in help if necessary. Do not rely solely on HTML `maxlength`, which counts UTF-16 code units differently. Validate pastes, composition events, and programmatic requests. Do not truncate silently.

Require 1–1,000 code points and at least one non-whitespace character. Preserve the user's visible leading/trailing spaces, line breaks, punctuation, and Unicode; trim only for the empty-content check. Allow LF and tabs; reject NUL and other inappropriate C0 controls rather than silently changing content. Do not normalize Unicode composition or rewrite the words. Render as plain text even if it looks like HTML/Markdown. Do not fetch URLs, generate previews, execute code, or convert user text into active HTML links. Some email clients may independently link recognizable URLs; do not promise that all clients will leave them inactive.

### Addresses

Trim outer whitespace. Accept a single bare mailbox address per input, not a display name, comma list, `mailto:` URL, or CR/LF/header content. Use a maintained validator and explicit reasonable length bounds (254 bytes overall; enforce mailbox/domain bounds). For v1, accept ASCII mailboxes/domains, including ordinary `+` aliases and punycode domains; return a clear error for unsupported internationalized mailbox syntax rather than silently rewriting it. Do not invent a simplistic regex as the only check or perform SMTP mailbox probing.

Preserve the trimmed address for delivery. For deduplication, rate limiting, and suppression, use a documented case-insensitive ASCII canonical form of the entire address. This intentionally groups rare case-sensitive mailbox variants for abuse protection while keeping the actual send spelling unchanged. Do not strip `+tags`, Gmail dots, or rewrite provider-specific aliases. Such aliases can bypass per-address limits; account-wide and per-IP budgets remain necessary. Reject more than five raw entries before any expensive work; deduplicate valid entries before calculating send costs. The UI should tell a sender when their own duplicate entries were combined.

### Request size and transport

Accept only `POST` JSON on `/api/send`, with a hard **16 KiB decoded body limit** enforced while reading, not only from `Content-Length`. Limit the Turnstile token to the provider's documented maximum of 2,048 characters. Reject malformed or compressed bodies unless their decoded size is safely bounded. HTTPS is mandatory in production. Return `Cache-Control: no-store`; never echo the message or token in responses.

## 9. API behavior and send sequence

### Routes

| Route | Purpose |
| --- | --- |
| `POST /api/send` | Validate and synchronously attempt delivery within a bounded request |
| `GET /opt-out` | Render a confirmation shell; no suppression mutation on GET |
| `POST /api/opt-out` | Validate a signed recipient-control token and persist suppression |
| `GET /report` | Render a report shell; no report or suppression on GET |
| `POST /api/report` | Validate report token, suppress recipient, record minimal report metadata |
| `POST /api/webhooks/resend` | Verify provider signature; process only relevant event metadata |

Use explicit Node runtime for crypto, Resend, Redis and webhook handlers. Keep a finite overall send deadline (for example 35 seconds) below the configured Vercel function duration (for example 60 seconds if supported by the chosen plan/runtime). Do not start unawaited email promises or rely on work continuing after the response. No content-bearing durable queue or cron retries.

### Ordered send pipeline

1. Check deployment mode, canonical allowed Origin, method/content type/body bound, trusted IP availability, and cheap shared request limits. Reject cross-origin form/script requests. A forged Origin from a non-browser is possible; it is an additional check, not authentication.
2. Parse the strict schema and normalized message/addresses. Never log the input. Handle a filled honeypot generically without sending; no theatrical success flight or content persistence is required for it.
3. Look up an existing submission by a secret-derived key of `submissionId`. If it exists, compare its payload HMAC and client-IP binding. Return its existing result or “in progress”; never create a second dispatch. A changed payload under the same ID returns a generic `409` conflict.
4. For a genuinely new submission, verify Turnstile server-side with a bounded timeout. Check success, expected hostname, and `action="send_message"`. Fail closed on outage/error.
5. In one atomic Redis operation, recheck submission absence and the kill switch; enforce IP/global budgets; determine private recipient/pair eligibility as detailed in section 10.4; reserve all applicable budgets; and create the submission record. Either all applicable reservations succeed or none do. No mail leaves before this succeeds.
6. Render safe HTML/text entirely in memory. Prepare deterministic per-recipient message identifiers/control links for this submission.
7. For each recipient, recheck suppression/kill switch immediately before dispatch, atomically claim its dispatch state, obtain the shared provider request-rate permit, and send one email with one `to` address. Each provider call has a timeout shorter than the remaining overall deadline. Await the result before proceeding; cap iteration at five.
8. Record only minimal accepted/definite-failure/unknown/skipped state and provider ID when returned. Never store the email payload or raw address. On confirmed provider `429`/outage, stop further dispatches and record remaining items as unattempted; do not hammer the service.
9. Return a non-sensitive aggregate result and clear the in-memory request references when done. The response must not reveal recipient suppression or complaint information. Never log provider response objects wholesale.

Suppression may race with a provider request already in progress. Once an opt-out is recorded, every later dispatch check must honor it; an email already handed off cannot reliably be recalled. State this limitation in opt-out help.

### Response semantics

| HTTP / code | Meaning and client action |
| --- | --- |
| `200 processed` | Every item is either accepted by the mail provider or privately suppressed; show generic completion, not “delivered to all” |
| `202 processing` | Same submission is still in flight; no second dispatch and no automatic new submission |
| `200 partial` | Some items were processed before a definite failure; generic partial message, no recipient statuses |
| `200 unknown` | A provider call timed out or completion could not be recorded; warn that mail may already have been sent |
| `400 invalid_request` | Input issue; safe field errors, without echoing field contents |
| `403 verification_required` | Invalid/missing/expired challenge or invalid origin; reset challenge as appropriate |
| `409 submission_conflict` | Same ID reused with another payload; require a deliberately new attempt |
| `413 request_too_large` | Body exceeds cap; no provider call |
| `429 try_later` | A rate/budget gate denied the request; generic explanation and coarse `Retry-After` |
| `503 unavailable` | Disabled mode, Redis outage, verification outage, or no safe dispatch possible; no fail-open fallback |

If no items were accepted and all failures are definitely pre-dispatch, an ordinary retry can be offered after the relevant wait. If any outcome is partial/unknown, never automatically retry the entire request. Recipient-level SMTP outcomes and opt-out status are private; use the same successful envelope for suppressed recipients and avoid obvious suppression timing shortcuts where practical. This reduces enumeration but does not constitute a mathematical anonymity guarantee.

## 10. Free-tier anti-bot and shared rate limiting

### 10.1 Turnstile

Use Cloudflare Turnstile **Managed** mode with its free plan, separate production/test configuration, and an allowlist of the exact deployment hostnames. It does not require moving DNS to Cloudflare or proxying Vercel through Cloudflare. Keep required provider branding. Load its official script directly, once; do not proxy/self-host it. Reserve sufficient space around the form for a challenge when required. [Turnstile plans](https://developers.cloudflare.com/turnstile/plans/), [client integration](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/)

POST verification to `https://challenges.cloudflare.com/turnstile/v0/siteverify` from the server with the secret and token. Tokens are single-use, valid for 300 seconds, and limited to 2,048 characters. Require the expected hostname and `send_message` action as well as `success`. A widget success callback alone does not authorize email. Omit optional `remoteip` to avoid an extra application transfer of the IP; Cloudflare still processes the browser's connection. Bound verification retries using one Siteverify `idempotency_key` per validation operation, separate from email idempotency. Expired/failed/completed form attempts need a reset/new token. Production must reject test keys and bypass settings. [Server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), [official testing keys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)

Add a simple honeypot excluded from the accessibility tree and normal keyboard flow. It supplements Turnstile and cannot replace it. Do not use an invasive device fingerprint, persistent tracking cookie, or minimum typing-time rule that blocks fast typists and assistive technology.

### 10.2 Authoritative shared store

Use one **claimed, persistent Upstash Redis database** for production, available to every Vercel instance/region. A process-local Map, memory cache, browser flag, file on the function filesystem, or independent regional counter is not authoritative. Set eviction **off**, because suppression keys must not disappear under memory pressure. Missing credentials, storage full, Redis timeout, or uncertain writes must stop new sends. Keep recipient opt-out available whenever the store can accept it. [Upstash durability](https://upstash.com/docs/redis/features/durability), [eviction behavior](https://upstash.com/docs/redis/features/eviction)

Use a carefully tested Lua script through `EVAL` for conditional multi-key reservations. A pipelined sequence of read/check/increment commands is not atomic. Validate arguments, key types, and every quota before mutations: Redis Lua atomicity prevents interleaving, but does not roll back writes already performed if a script later raises an error. Bound work to five recipients and small capped sets. Use a consistent server-side time source and unique opaque event IDs. [Upstash EVAL](https://upstash.com/docs/redis/sdks/ts/commands/scripts/eval)

### 10.3 Starting application caps

These are deliberate **application defaults**, not provider promises. Centralize them, enforce them server-side, and test their arithmetic under concurrency. Do not weaken them automatically when a user gets blocked.

| Dimension | Initial limit | Counted unit / implementation |
| --- | --- | --- |
| Recipient inputs | 5 | Raw entries must be ≤5; valid deduplicated recipients cost separately |
| Message | 1,000 code points | After line-ending normalization |
| Raw send attempts per IP bucket | 10/minute and 60/hour | All endpoint attempts, including malformed/challenge failures |
| New valid submissions per IP bucket | 1 per rolling minute; 3 per rolling hour | One whole submission |
| Recipient units per IP bucket | 10 per rolling 24 hours | A five-recipient attempt costs five |
| Same IP bucket → same recipient | 1 per rolling 24 hours | Prevent repetitive targeted sends |
| One recipient across all senders | 2 per rolling 24 hours | Mitigate distributed harassment |
| Whole service | 80 recipient units per rolling 24 hours | Headroom below the provider daily ceiling |
| Whole service | 2,000 recipient units per rolling 31 days | Conservative ceiling across any provider month ≤31 days |
| Calls to Resend from this app | At most 1 outbound request per second globally | A shared permit, not a timer local to one function |
| Pre-verification send traffic, whole service | 60 attempts/minute and 5,000/rolling 24 hours | Bound expensive app work; fail closed on exhaustion |

Use sliding/rolling windows (for example bounded sorted sets pruned within the atomic script) for limits labeled rolling. Do not label a fixed calendar bucket a rolling 24-hour limit. The conservative rolling 31-day budget avoids assuming Resend's monthly reset aligns with a calendar month. Increase limits only deliberately after checking actual provider/account capacity and abuse evidence. Lower them if other applications share the same accounts.

The early whole-service gate is a resource circuit breaker, not a guarantee against denial of service: even denied traffic reaches some infrastructure and may consume a Redis command. Supplement it with Vercel's included DDoS/firewall features, and use the kill switch during an attack. Do not promise unbounded free operation under hostile traffic. Vercel's currently documented WAF rate limiting is available across plans but has usage pricing and regional counter behavior; do not assume it is a free global replacement for this store. [Vercel Firewall](https://vercel.com/docs/vercel-firewall), [WAF rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting), [WAF pricing](https://vercel.com/docs/vercel-firewall/vercel-waf/usage-and-pricing)

### 10.4 Suppression and reservation semantics

Distinguish public/global/IP throttles from private recipient controls. IP/global exhaustion may return `429`. A recipient suppression or exhausted recipient/pair allowance must **privately skip that recipient** and receive the same outward result as an accepted item; do not return a recipient-specific limit or reveal the reason. The other eligible recipients may proceed. Perform eligibility evaluation and all reservations atomically before dispatch.

Charge IP/global recipient budgets for **all** validated deduplicated requested recipients, including private skips. Reserve recipient/pair delivery slots only for eligible recipients. This conservative accounting avoids a sender learning opt-out status through an obvious change in their own quota and bounds repeated probes. A request whose global/IP budget cannot cover the whole requested set sends nothing. Invalid input and failed Turnstile consume raw-attempt limits but never delivery budgets. Failed/uncertain dispatches retain reservations; do not refund uncertain sends or make repeated failure a free bypass.

Immediately before each provider call, atomically recheck the kill switch, suppression, dispatch ownership, and deadline. A shared short-lived permit (for example `SET ... NX PX 1100`, with bounded waiting and a request deadline) can serialize provider calls conservatively. Never wait indefinitely or create a persistent message queue. Account-wide provider traffic from other apps remains outside this gate; reserve headroom and honor provider `Retry-After` if rate-limited.

### 10.5 Trusted IPs and pseudonymous keys

On direct Vercel hosting, use the platform-set trusted forwarded IP header according to the current documentation, preferably `x-vercel-forwarded-for`, and validate its shape with a maintained parser. Do not accept an arbitrary client-supplied `x-real-ip`, the first item of an untrusted chain, or an IP in the request body. Test spoofed-header behavior on the deployed platform. If an additional proxy is introduced, explicitly redesign and verify the trusted chain before production; installing Turnstile alone does not require one. Missing/malformed trusted IP in production fails closed. [Vercel request headers](https://vercel.com/docs/headers/request-headers)

Normalize IPv4 and IPv4-mapped IPv6 consistently; bucket ordinary IPv6 at `/64` as an explicit abuse-control tradeoff. Derive keys with keyed HMAC-SHA-256, not plain SHA-256 or a raw IP. Use purpose-separated secrets/labels for IP identifiers, stable recipient identifiers, and submission integrity. Shared networks may share a quota; changing networks or aliases can evade an individual rule. The combination mitigates spam; it does not identify a person or guarantee prevention.

## 11. Idempotency, crashes, and partial sends

V1 should favor preventing accidental duplicates over aggressive automatic retry. Generate a cryptographically random `submissionId` in the browser when an attempt begins; keep that ID while its status is uncertain. Do not generate another ID on double-click, network timeout, or retrying a response lookup.

Store a 26-hour metadata-only submission record with: opaque operation ID, server creation time, state, IP HMAC binding, an HMAC fingerprint of the canonical message/recipient list, and at most five opaque recipient IDs/states/provider IDs. This fingerprint is derived message metadata, not a retrievable message copy; disclose it accurately. Do not store raw text, HTML, MIME, addresses, or the Turnstile token. Bind the fingerprint to exact normalized content and a deterministic recipient ordering, using an unambiguous serialization rather than concatenating unescaped strings.

After atomically reserving a new operation, only its owner may perform initial dispatch. Mark each item `dispatching` **before** the external call. Known accepted items never re-send. A lost connection, timeout, crashed owner, or failed post-send metadata write creates an **unknown** outcome. A duplicate HTTP request reads the current metadata; it must not take over and re-send `dispatching` items. Treat stale in-progress states after the deadline as unknown rather than starting a new send. No automatic replay across a process crash is required or permitted in this minimal v1.

Use deterministic per-recipient Resend idempotency keys as an additional guard, such as an HMAC of the operation and recipient key. They must contain no address/message/IP, and remain below the provider's length limit. Current Resend keys persist for 24 hours and require identical payloads. Do not automatically retry beyond that window, switch keys to escape a conflict, or interpret idempotency as a guarantee of exactly-once inbox delivery. [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys)

If a later implementation adds an immediate in-request network retry, it must be narrowly bounded and use the identical provider key and payload, including the same signed URLs and template version; keep all content in current request memory. It must not re-reserve quota. For v1 the simpler behavior is **no automatic provider retries**: classify uncertain results honestly and stop. A new deliberate message after a resolved failure is a new submission subject to ordinary limits.

Twenty-six-hour metadata retention is not a permanent replay ledger. After it expires the app cannot recognize an ancient ID without more storage. Do not expose a resumable-send feature, save client IDs for future sessions, or claim permanent exactly-once protection. The UI's only retry of the same ID is a short bounded status recovery while the page remains open; require a new challenge for any genuinely new send.

## 12. Permitted persistent data and retention

Application-controlled storage includes Redis, files, logs, telemetry, queues, traces, crash reports, caches, and browser storage. Treat all of them consistently.

| Data | Storage / retention | Purpose |
| --- | --- | --- |
| Message, generated HTML/text, raw recipients | Current browser/server request memory only | Validation and delivery |
| Raw sender IP | Current request memory only | Normalize and compute HMAC |
| IP and pair rolling-window events | Redis, maximum 24 hours plus a small cleanup margin | Abuse limits |
| Recipient rolling-window events | Redis, 24 hours plus cleanup margin | Recipient protection |
| Global budget events | Redis, up to 31 days plus cleanup margin; no IP/address | Free-tier service budget |
| Submission integrity/status metadata | Redis, 26 hours | Duplicate prevention and honest unknown state |
| Suppression recipient HMAC + key version + reason enum | Redis, **no expiry** | Continue honoring recipient opt-out/bounce/complaint |
| Report delivery reference + recipient HMAC + reason enum + date | Redis, at most 30 days | Minimal abuse review/deduplication |
| Verified webhook event IDs | Redis, at most 30 days | Replay-safe processing |
| Operational aggregate counts | Redis or minimal logs, at most 30 days if needed | Diagnose service health without content |
| Short-lived dispatch permits | Redis, seconds only | Bound concurrency/provider calls |

Do not retain a long-lived sender-recipient social graph. The short pair/submission windows are a disclosed abuse-control exception, not user history. Suppression has no automatic expiry because removing it would resume unwanted mail. Avoid high-cardinality keys created from unvalidated unbounded input. Test cleanup and storage growth.

Use stable, versioned recipient HMAC keys for suppression lookup. **Never rotate away the only key that can recognize existing opt-outs.** Since addresses are not retained, a stored hash cannot be rehashed offline into a new key. A migration must continue computing/checking retained key versions for incoming addresses, preserve old token verification keys, and keep existing suppression records. An IP-secret change resets IP counters; carry both key versions through the longest active window or pause sending through that window. Keep secrets backed up in the owner's secure credential system, not Git.

Use a dedicated Redis database or isolated namespace for production. Development/previews must not erase, migrate, expire, or share real suppressions. Do not run `FLUSHDB` as a deployment step. If disaster recovery loses suppression state, keep sending disabled until it is restored; rebuilding a blank database and sending immediately is unsafe.

## 13. Recipient opt-out and abuse reports

### 13.1 Signed recipient controls

Each delivered email must contain clearly readable **“Stop future emails”** and **“Report this message”** links. They require no account and never expose the sender. Use a small reviewed signing implementation (HMAC-SHA-256 with constant-time comparison, strict schema, URL-safe encoding, and bounded input) or a maintained library. Do not invent encryption; the payload contains pseudonymous metadata and is authenticated, not secret.

A token payload may contain `v`, `kid`, `purpose`, `recipientKeyVersion`, `recipientHmac`, an opaque delivery ID, and issue time. Report tokens also have a 30-day expiry. Opt-out tokens should remain usable long-term with versioned signing keys; they only authorize suppression, so expiring them would needlessly strand old recipients. Neither token contains the raw email, message text, sender IP, IP HMAC, or any sender-recoverable identity. Validate the exact purpose, key/version, format, timing where applicable, and signature before any lookup/write. Never accept a token plus a separate user-supplied target email.

Use links such as `https://alittlebird.com/opt-out#token=...` and `/report#token=...` for the visible browser flows. The fragment is not sent in the initial HTTP request or normal Referer. A small client component reads it into memory, promptly removes it with `history.replaceState`, and passes it in a POST body only after explicit confirmation. The page has no third-party scripts/assets or analytics. Test common email clients' link handling; forwarding the email also forwards this limited bearer capability. The capability can block/report that recipient's mail, not send mail or retrieve a message.

These action pages need `noindex`, `Referrer-Policy: no-referrer`, and `Cache-Control: no-store`. GET/link preview/prefetch **must not** mutate state. Guard against malformed/oversized tokens. No CAPTCHA, signup, or confirmation email is needed for a valid recipient capability. Apply separate modest flood limits that do not share exhausted send quotas; repeated valid opt-outs are idempotent and should still succeed.

### 13.2 Opt-out

Show a clear confirmation button: “Stop future emails from a little bird.” The POST writes a permanent recipient suppression before acknowledging. On store failure, show a retryable error and do not say the address was blocked. Future sends check the same canonical recipient/HMAC scheme. A repeated confirmation says the preference is already applied without leaking an address.

Suggested confirmation: “Future messages to this address are blocked. A message already being delivered may still arrive.” Send no further confirmation email. Do not expose public unsuppress/re-subscribe controls in v1. An operational request to undo a suppression requires verified recipient ownership and a deliberate owner procedure; no anonymous sender can override it.

### 13.3 Report

Offer a small fixed list such as unwanted message, harassment/threats, suspected scam, and other. No free-text field, attachment, or pasted original message is necessary. The button explicitly says **“Report and stop future emails”** so the automatic opt-out is clear. Persist the suppression and a minimal deduplicated report event atomically, then confirm. The report identifies only the opaque delivery reference and recipient HMAC, not the author. A valid old opt-out link remains usable after a report token expires.

The owner reviews aggregate report/bounce/complaint counts and provider health, using the operational runbook below. Do not email the report contents to the anonymous sender or create a public admin dashboard. Provider-held email may be accessible to authorized operators; do not advertise investigative capabilities or anonymity guarantees the system does not support.

### 13.4 Unsubscribe headers

The visible opt-out flow is required. Do not emit `List-Unsubscribe-Post: List-Unsubscribe=One-Click` while pointing at a GET-only page or a fragment URL: email clients need a real token-authenticated HTTPS POST endpoint for that protocol. If Resend's approved sending classification requires those headers, implement and test the documented one-click endpoint as part of the same opt-out feature: accept its specified form POST without cookie/login/CAPTCHA, authenticate the scoped token, perform only suppression, and keep GET non-mutating. Account for the token appearing in the endpoint URL and platform logs; it contains no raw address and grants suppression only. Otherwise omit these headers instead of falsely claiming standards-based one-click support. [Resend transactional unsubscribe guidance](https://resend.com/docs/dashboard/emails/add-unsubscribe-to-transactional-emails)

## 14. Resend email implementation

The browser sends only addresses, message, operation ID, and verification token. The server controls sender, subject, HTML, text, links, and all headers. Use one `resend.emails.send` call for each eligible recipient, each with exactly one `to` address. No shared To/CC lists, sender-address substitution, arbitrary Reply-To, or BCC workaround. A batch endpoint is unnecessary at this volume and would need its own partial-failure handling. [Resend Send Email API](https://resend.com/docs/api-reference/emails/send-email)

Fixed defaults:

```text
From: a little bird <chirp@alittlebird.com>
To: [one validated recipient]
Subject: A little bird has a message for you
Reply-To: omitted
```

The HTML should be a light, friendly adaptation of the site: a restrained orange accent, cream note area, dark readable message text, and the “a little bird” name. Use a compact email-safe table layout, inline styles, about 600px maximum width, system-font fallback, and generous line spacing. Email branding does not require reproducing the entire homepage. Avoid web fonts, SVG-dependent content, background-image-dependent text, forms, JavaScript, animation, and external tracking images. A text/CSS wordmark is acceptable for robust email rendering; the website still needs the faithful artwork.

Suggested structure:

1. Small brand header and neutral preheader that does not repeat sensitive message text in a notification preview.
2. “A little bird brought you a note.”
3. The **entire** safely escaped user message, preserving newlines and readable spacing.
4. “Sent through a little bird without a sender name or email. Replies will not reach the sender.”
5. Optional unobtrusive “Visit a little bird” link to the canonical homepage. No gated content or required visit.
6. Visible “Report this message”, “Stop future emails”, and “Privacy” links.

Generate a complete text alternative with the same message and control URLs. Use React's normal text escaping or a well-tested HTML encoder; never insert the message through `dangerouslySetInnerHTML`, a template triple-brace, Markdown parser, or a user-created URL attribute. Ensure `<script>`, `&`, quotes, emoji, long lines, leading spaces, and blank lines survive as text. Use presentation-safe newline rendering, not raw HTML injection. Keep recipients and message content out of the subject, preheader, tags, provider idempotency keys, and application log labels.

Explicitly turn **open tracking and click tracking off** in the Resend domain settings; do not rely on remembered defaults. No unique remote-image URL, tracking pixel, analytics parameter, share-email link, or read receipt. [Resend tracking settings](https://resend.com/docs/dashboard/domains/tracking)

No-replies means no product reply path and no relay back to an author. Email clients will still show a Reply button, and omitting Reply-To ordinarily points replies toward the fixed From address. The owner must configure `chirp@alittlebird.com` at the receiving-mail host as a non-conversational address, for example rejecting mail to that mailbox if supported, without breaking the domain's other mail. Do not build inbound Resend handling or automatic reply loops. Keep reply handling separate from the provider's bounce Return-Path.

Resend API acceptance means an attempted delivery, not inbox placement. A later delivered event means the recipient's server accepted the mail, not that a human read it. Do not tell the sender that anyone opened, read, or definitely received the note. [Resend event meanings](https://resend.com/docs/webhooks/event-types)

## 15. Verified webhooks and suppression updates

Create a single production webhook endpoint for relevant Resend bounce, complaint, failure/suppression events supported by the current API. Inspect current event schemas; do not guess event names or treat all soft/transient delivery failures as permanent bounces. Disable content/open/click collection features the app does not need.

Read the bounded raw body, verify the official signature using the endpoint secret and `svix-id`, `svix-timestamp`, `svix-signature`, then parse/use the payload. On Next.js Request, read headers using `request.headers.get(...)`. Use the current official SDK/verifier including timestamp tolerance; do not hand-roll a weak signature check. Invalid signatures cause no writes. This endpoint accepts provider traffic, so it must not require same-origin browser headers or a Turnstile challenge. [Webhook verification](https://resend.com/docs/webhooks/verify-webhooks-requests)

Process a complaint or definitive hard bounce by canonicalizing recipient addresses **in memory**, computing stable HMACs, and writing suppression. Retain only allowed metadata. Do not log/persist raw webhook payloads, MIME, subjects, or addresses even if the provider includes them. Repeated suppression writes are safe, and a later delivered event never clears an opt-out/complaint.

Atomically persist effects and deduplicate the verified event ID before returning success. If Redis is unavailable, return an appropriate retryable error instead of acknowledging lost protection. Events can arrive out of order, be delivered more than once, and be replayed; tests must cover all three. Keep suppression writes idempotent even after an event deduplication TTL expires. Provider suppression is an additional safeguard, not a substitute for the app's durable opt-out records. [Webhook retries/replays](https://resend.com/docs/webhooks/retries-and-replays), [Resend suppressions](https://resend.com/docs/dashboard/emails/email-suppressions)

## 16. Privacy, security headers, and logging

### Honest privacy language

“Anonymous” describes the absence of a sender name/account/email in the delivered message. It does **not** mean untraceable, encrypted end to end, inaccessible to providers, or safe from identification through the message's contents. Do not say “100% anonymous,” “no logs anywhere,” “we can never identify you,” or “messages are never stored.”

The privacy page should clearly explain:

- No signup or author identity is requested; recipient emails and text are processed to deliver a note.
- The application keeps no stored message copy and no user message history; in-memory processing and short-lived keyed integrity metadata still exist.
- Hashed/keyed IP and recipient identifiers are retained for the specific abuse-control periods in section 12; these are pseudonymous data, not a claim of irreversible anonymization.
- Resend receives and can retain recipients and email content. Its dashboard supports viewing sent HTML/plaintext; the currently advertised Free retention is 30 days. Hosting, anti-bot, database, and recipient mail providers also have their own processing/retention. Do not imply the app can force deletion from those systems or recipients' inboxes. [Resend email management](https://resend.com/docs/dashboard/emails/manage-emails), [plan retention](https://resend.com/pricing)
- Cloudflare handles the bot challenge; Vercel handles network requests; Upstash stores the limited security metadata.
- A recipient may infer authorship, forward the message, or share the control links. No replies reach the anonymous author.
- Opt-out suppresses later dispatches, with an explicit limitation for mail already submitted.

Use actual operational settings and retention in the final published policy. Add the real operator/contact information supplied by the owner where needed; never invent an address or a legal compliance guarantee. Avoid collecting analytics or nonessential cookies just to measure use. Inspect any actual cookies/provider storage and describe them accurately rather than promising none categorically.

### Logging allowlist

An acceptable event contains a random operational event ID, route category, coarse outcome enum, duration bucket, and aggregate count. Log neither normal request bodies nor complete error/provider objects. Ban message fragments, recipient lists/addresses, sender IP, request headers, token values, auth credentials, control URLs, payload fingerprints, and stack-local/request dumps. Do not tag events by a permanent sender ID. Configure production error handling to return fixed safe messages.

Disable session replay, request-body capture, email-content logging, verbose SDK debug modes, unnecessary analytics, and external log drains. Restrict provider dashboard access to the owner/team members who need it. Vercel may still retain infrastructure and runtime information under its own plan settings; minimal app logs do not imply no provider logs. [Vercel function logs](https://vercel.com/docs/functions/logs)

### Headers and browser protections

Set and test `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, a restrictive `Permissions-Policy` for unused camera/microphone/geolocation, and a CSP compatible with Next.js and Turnstile. Include `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, and `frame-ancestors 'none'`. Do not expose broad CORS on send/recipient controls; webhook access is authenticated by signature rather than Origin.

For the composer, prefer a correctly integrated per-response nonce CSP using the current Next.js mechanism, with dynamic rendering as required. Do not attach fresh nonces to cached static HTML. Simple informational pages may remain static under an appropriate policy. Cloudflare supports nonce/strict-dynamic integration or its documented allowlisted script/frame origin; test both actual challenge and failure paths. Do not add wildcard script origins or production `unsafe-eval` to quiet an error. [Next.js CSP](https://nextjs.org/docs/app/guides/content-security-policy), [Turnstile CSP](https://developers.cloudflare.com/turnstile/reference/content-security-policy/)

Never render recipient-control fragments server-side, prefetch token-bearing URLs, or leak them into metadata/Open Graph. Treat raw API bodies as sensitive even in local debugging. HTTPS must be verified; add HSTS subdomain/preload directives only after checking the entire domain's HTTPS readiness.

## 17. Environment variables and secrets

Create `.env.example` with placeholders and comments. Ignore all real `.env*` files except the example; never commit credentials, copied dashboard exports, raw logs, or production emails. Keep secret-bearing modules marked `server-only`.

| Variable | Exposure | Meaning |
| --- | --- | --- |
| `APP_ORIGIN` | Server config | Exact canonical origin, production `https://alittlebird.com` |
| `MAIL_MODE` | Server config | `mock`, `allowlist`, or `production`; default `mock` |
| `SENDING_ENABLED` | Server config | Default `false`; explicit deployment-level safety switch |
| `PROVIDER_USE_APPROVED` | Server config | Default `false`; enable only after permitted-use/recipient-consent requirements are resolved |
| `RESEND_API_KEY` | Secret | Restricted sending key, domain-scoped where supported |
| `RESEND_FROM` | Server config | Exactly `a little bird <chirp@alittlebird.com>`; validate allowlist |
| `RESEND_WEBHOOK_SECRET` | Secret | Endpoint signature verification secret |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public | The widget site key only |
| `TURNSTILE_SECRET_KEY` | Secret | Server Siteverify secret |
| `TURNSTILE_ALLOWED_HOSTNAMES` | Server config | Explicit comma-separated hostnames for this environment |
| `UPSTASH_REDIS_REST_URL` | Server config | REST endpoint for the dedicated store |
| `UPSTASH_REDIS_REST_TOKEN` | Secret | Minimum required Redis access credential |
| `REDIS_NAMESPACE` | Server config | Stable isolated namespace such as `alb:prod:v1` |
| `IP_HMAC_SECRET` | Secret | Independent random ≥32-byte secret for IP keys |
| `RECIPIENT_HMAC_KEYS` | Secret | Versioned mapping of retained recipient-HMAC keys |
| `RECIPIENT_HMAC_ACTIVE_KID` | Server config | Active recipient-key version |
| `SUBMISSION_HMAC_SECRET` | Secret | Independent secret for payload/operation fingerprints |
| `CONTROL_TOKEN_KEYS` | Secret | Versioned mapping of recipient-action signing keys |
| `CONTROL_TOKEN_ACTIVE_KID` | Server config | Current token-signing key version |
| `TEST_RECIPIENT_ALLOWLIST` | Sensitive server config | Only consenting test inboxes/provider test addresses for allowlist mode |
| `EMAIL_INCLUDE_SITE_LINK` | Server config | Default `true`; no sender-facing extra feature |

Keep numerical limits in a validated server-only configuration module, or add individually validated server environment overrides when operationally useful. Missing/malformed security configuration must disable sending. Public homepage rendering can still work without mail credentials in `mock`/disabled mode. Do not choose mock mode silently on a live enabled production send request; expose an honest “sending is not available yet” state.

Generate secrets with a cryptographically secure tool and move them directly into the owner's credential manager/Vercel secret fields. Use separate values for Development, Preview, and Production. Never paste secret values in a PR, this instructions file, or a progress message.

Next.js `NEXT_PUBLIC_` values are bundled for the browser at build time; only the Turnstile site key needs that prefix here. Changing it requires a new build. Do not expose server secrets through `next.config`, serialized props, or a debug endpoint. [Next.js environment variables](https://nextjs.org/docs/app/guides/environment-variables)

Scope Vercel values explicitly to Development, Preview, and Production; avoid production keys on untrusted branch/fork previews. Use the dashboard's current Secret type for keys and signing material. Environment changes apply to new deployments, so redeploy after changing them. A Redis runtime kill switch additionally allows immediate disable without waiting for redeployment. [Vercel environments](https://vercel.com/docs/environment-variables), [Secret variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables)

The runtime switch should use a small dedicated control record, initialized explicitly during provisioning (for example `security:initialized` and `security:sending_enabled`). Missing initialization must not look like a healthy empty store. This helps detect accidental database replacement, but is not a substitute for restoring suppressions after data loss. Both environment and runtime enablement must permit a send; either can stop it.

## 18. DNS, SPF, DKIM, DMARC, and no-reply handling

The user states **the domain is already live at Vercel**. Inspect its existing project and DNS before changing anything. Reuse the existing domain attachment and repository integration where appropriate. Do not create a competing production project, transfer nameservers, or replace existing mail records merely to follow a generic setup tutorial.

### Web domain

Keep `https://alittlebird.com` canonical. Inspect `www.alittlebird.com` and preserve/add its redirect only if that matches the existing setup. If DNS needs adjustment, copy the exact targets currently shown by the existing Vercel project; do not paste an old generic A/CNAME target. Confirm ownership, certificate readiness, redirect behavior, and mixed-content absence. Web A/CNAME records and mail MX/TXT/CNAME records have different purposes. [Vercel domain configuration](https://vercel.com/docs/domains/working-with-domains/add-a-domain)

### Sending domain

1. Add/inspect **`alittlebird.com`** in the intended Resend account, because the required visible From is `chirp@alittlebird.com`. A different visible sending subdomain is a product change, not a silent deliverability optimization.
2. Obtain the exact account/region-specific DNS instructions from Resend. Record host, type, value, priority where applicable, and TTL in the private operational setup notes. Never invent a DKIM key, SPF include, MX target, or DNS token.
3. Add all required DKIM records and Return-Path/SPF-related records. Depending on the current configuration, Resend may supply TXT/MX records or CNAME delegation; follow the dashboard rather than assuming one historical layout. Use DNS-only mode for verification CNAMEs if the DNS host offers proxying.
4. Preserve existing root-domain incoming mail MX. A Resend bounce MX under a Return-Path subdomain is not an instruction to route all incoming `@alittlebird.com` email through Resend.
5. Wait for verified status, then test real email authentication; a website resolving successfully does not verify email DNS.

Official setup: [Resend verified domains](https://resend.com/docs/dashboard/domains/introduction), [add a domain](https://resend.com/docs/add-a-domain), [custom Return-Path](https://resend.com/docs/dashboard/domains/custom-return-path).

### SPF and DKIM details

SPF authorizes servers for the SMTP envelope/Return-Path identity; it is not simply a label on the visible From. Avoid publishing multiple competing SPF TXT records at the same hostname. If the required hostname already has SPF, reconcile all legitimate senders rather than appending a second record. Do not overwrite the root SPF when Resend requires a different host. CNAME owners generally cannot also hold unrelated TXT/MX records; resolve a collision using the provider's supported configuration.

DKIM signs the email using the provided selector records. Verify the actual received message shows DKIM pass and an aligned signing domain. Do not remove existing selectors used by other senders. Confirm SPF pass as well, while recognizing DMARC needs alignment through at least one successful aligned mechanism, not merely any SPF/DKIM pass.

### DMARC

Inspect `_dmarc.alittlebird.com` first. Maintain a single DMARC policy record. If no policy exists, a conservative initial value for monitoring is:

```text
v=DMARC1; p=none;
```

This is monitoring, not enforcement. Add an aggregate-report `rua` only when the owner supplies a real authorized mailbox/report service; do not invent `dmarc@alittlebird.com`. Do not weaken an existing `quarantine`/`reject` policy just to launch. Review all legitimate domain senders and sample authentication reports/headers before moving a new policy toward enforcement. Verify alignment for the exact visible From used here. [Resend DMARC guide](https://resend.com/docs/dashboard/domains/dmarc)

Use DNS tools and received-message headers for evidence. Confirm From spelling, SPF/DKIM/DMARC results, envelope identity, correct To isolation, and absence of author metadata. Avoid publishing real received headers/addresses in a public repository.

### Replies

Resend outbound sending does not itself provide the desired receiving-mail policy for `chirp@alittlebird.com`. Inspect the existing mailbox/catch-all behavior, configure non-conversational handling without altering other addresses, and test a reply to an owner-controlled sample. There must be no routing back to an anonymous sender and no reply inbox in the application. Never use a fabricated Reply-To address as a substitute for this setup.

## 19. Free-tier feasibility and cost limits

Provider information below was checked on October 8, 2026; account dashboards and current terms must be rechecked at provisioning and launch. “Free-tier architecture” is a small-volume target, not a promise that hosting, domain renewals, mail, or abuse protection remain free forever.

| Provider | Observed free-plan facts | Implementation consequence |
| --- | --- | --- |
| Vercel | Hobby is for personal non-commercial use; included-resource limits apply | Verify eligibility and existing project plan; do not buy an upgrade silently |
| Resend | 3,000 emails/month, 100/day; 30-day provider retention | App caps are lower; tests and other account use consume headroom |
| Cloudflare Turnstile | Free plan currently includes unlimited challenges with widget/hostname limits | Use exact permitted hostnames and supported managed mode |
| Upstash Redis | Current pricing lists 256 MB and 500,000 commands/month | Measure real commands/traffic; reject sends on quota/storage failure |

Sources: [Vercel Hobby](https://vercel.com/docs/plans/hobby), [Resend pricing](https://resend.com/pricing), [Turnstile plans](https://developers.cloudflare.com/turnstile/plans/), [Upstash Redis pricing](https://upstash.com/pricing/redis).

Upstash's FAQ has also contained an older daily-request figure; use the actual provisioned plan/dashboard and current pricing, and record discrepancies instead of promising a stale limit. [Upstash FAQ](https://upstash.com/docs/redis/help/faq)

Resend's current documented default API rate is 10 requests/second per team; actual account headers/settings prevail. Its free daily email quota resets at 00:00 UTC. Monthly periods need not match an assumed calendar month, and sending/receiving activity elsewhere can use quota. The app's lower global request rate and rolling 31-day cap intentionally leave margin. Do not enable paid overages or create multiple accounts to bypass limits. [Resend usage limits](https://resend.com/docs/api-reference/rate-limit)

Before launch, measure Redis commands per successful send, rejection, report, and webhook. Model ordinary traffic and denied traffic separately. Keep room for opting out and processing complaints even when sending is exhausted. Provider traffic spikes can still exhaust free resources; operationally pause the composer while preserving recipient controls where possible. Check the existing account's billing/auto-upgrade settings and avoid enabling paid features without owner authorization.

## 20. Implementation sequence, GitHub, and Vercel deployment

### Phase A — inspect and scaffold

Inspect the existing repository/project, its instructions, framework, dependencies, working changes, domain mapping, and deployment branch before editing. The user has authorized publishing to GitHub and Vercel once the work is ready; do not request the same publication permission again. Resolve the correct repository/project identity if it is unknown. Preserve unrelated changes and existing domain services.

Copy the supplied image to the design reference path and verify its checksum. Scaffold/update Next.js App Router with TypeScript, the selected supported Node version, ESLint, test scripts, and a committed lockfile. Configure local `mock` mode and placeholders. Add `.gitignore` before creating local secrets. Do not run a static export: the API routes need server execution.

### Phase B — visual implementation

Measure/trace the reference, build the separated artwork, and implement real fields in their illustrated positions. Add only the necessary multi-recipient expansion, count, anti-bot area, help/errors, and inline confirmation. Remove the obsolete footer link. Validate source-viewport fidelity before polishing mobile reflow. Test long content, five recipients, and increased text sizes. Record licensed font/assets.

### Phase C — secure sending and recipient protection

Implement normalization, IP parsing/HMAC helpers, atomic gates/reservations, operation state, safe email rendering, Resend adapter, recipient capabilities, opt-out/report persistence, verified webhooks, and redacted logging. Keep public sending disabled. Implement mock outcomes for accepted, partial, timeout, suppression, quota, and storage errors. Make every mail call go through one tested server adapter.

### Phase D — CI and preview

Use a GitHub feature branch/PR when the existing workflow supports it. CI uses the committed Node version and `npm ci`, then lint, typecheck, unit/integration tests, production build, and relevant browser tests. Use current supported GitHub Actions and repository-required action pinning. Production secrets must not be available to untrusted pull requests. [GitHub Node build/test guidance](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs)

Connect the correct GitHub repository to the **existing** Vercel project, preserving its domain binding and intended production branch. Use Next.js detection and the correct root/build/output settings. Use preview deployments for visual/functional QA. Previews default to mock mode; narrowly allowlisted consenting inboxes may be used with isolated credentials/stores when needed. A public preview must not become an unprotected second email relay. [Vercel GitHub integration](https://vercel.com/docs/git/vercel-for-github)

### Phase E — configure accounts and production safely

Provision/verify the persistent store with eviction off and separate secrets; initialize runtime controls. Configure Turnstile production hostname/key and test hostname separately. Set Resend domain records, disable tracking, configure a restricted sending key and signed webhook. Populate Production variables only after confirming repository/project identity. Keep `SENDING_ENABLED=false` and runtime sending off through initial deployment.

Verify domain/TLS and protected API behavior on the deployment. Register the webhook against the canonical production URL and confirm signatures reach it despite any Vercel access/firewall configuration. Confirm opt-out/report pages are publicly usable without project login. Check provider policy compatibility from section 1 before enabling public mail; DNS verification and an API key do not establish that acceptance.

### Phase F — release and verify

Publish the reviewed commit through the existing production workflow. Preserve a known-good rollback commit/deployment and database compatibility. If mail prerequisites are incomplete, deploying the visual site with a clear unavailable-to-send state is acceptable, but report it as **mail disabled**, never as a fully working live service.

Once all launch criteria pass, enable sending deliberately, perform the small consented verification set below, and verify recipient controls immediately. Check provider and app counts against caps. Deliver the actual GitHub repository/commit or PR link, Vercel deployment URL, canonical domain, test summary, unresolved limitations, and operational instructions. Do not claim published work until the actual deployment succeeds.

## 21. Detailed verification and test plan

Use synthetic messages and controlled recipients. Most automated tests use mocked providers or an isolated test store. Never load test the real Resend API or spray messages to strangers. No real credentials/content in fixtures, snapshots, traces, or public CI artifacts.

### 21.1 Validation and rendering unit tests

| Test | Expected result |
| --- | --- |
| Empty and all-whitespace message | Rejected with useful field error |
| 1, 999, 1,000, 1,001 code points | First three valid; last rejected without truncation |
| Emoji, supplementary characters, combining marks, joined emoji | Client/server count agrees with documented code-point rule |
| CRLF/CR/LF and multiple blank lines | Normalized consistently and preserved in resulting text |
| `<script>`, `<img onerror>`, quotes, ampersands, Markdown links | Literal escaped message text; no executable markup |
| NUL/control characters | Rejected according to policy; normal tabs/newlines supported |
| One and five valid recipients; six entries | First two valid; six rejected before sending |
| Duplicate with case/outer-whitespace variants | One canonical recipient/cost; delivery spelling preserved |
| Display names, lists in one field, CR/LF, malformed and oversized emails | Clear rejection, no header injection |
| Plus aliases and provider-specific dots | Preserved; no undocumented rewriting |
| Oversized chunked JSON / false Content-Length | Actual read bound enforced, no send |
| Extra fields including `from`, `replyTo`, `subject`, `html` | Schema rejects them |
| Missing/malformed production secrets | Sending disabled; no secret printed |

### 21.2 Atomicity, privacy, and abuse integration tests

- Launch many concurrent requests against a real **test** Redis namespace, using at least two independent application instances/clients. Verify no limit overshoot and no partially reserved multi-recipient submission on global/IP denial.
- Test just before/after rolling-window boundaries with controlled time. A five-recipient operation costs five global/IP units. Failed/unknown operations are not refunded. Suppressed recipients remain indistinguishable outwardly.
- Verify recipient and pair protection across different IPs; private skips do not send or reveal why. Verify the same recipient spelling canonicalizes identically in send, webhook, token, and opt-out paths.
- Test normalized IPv4, IPv4-mapped IPv6, and multiple IPv6 addresses in one `/64`. On deployed Vercel, demonstrate that spoofed forwarded headers do not let a client pick a new bucket.
- Reject absent, expired, reused, wrong-host, wrong-action, oversized, and forged Turnstile tokens. No production test-key/bypass path. Rejection causes zero outbound mail.
- Stop Redis mid-request, simulate capacity/command-limit errors, and time out Turnstile. Sending must fail closed; previously accepted mail may require an unknown outcome. Never fall back to memory-only limits.
- Double-click and repeat the same submission ID; change payload under the same ID; crash after claim, after provider acceptance, and before result write. No automatic duplicate dispatch and honest unknown state.
- Simulate mixed accepted/failed recipients and provider 429; no automatic resend of accepted/unknown items, no exposed recipient outcome list, and no fabricated total success.
- Verify source-of-truth suppression survives a cold start, redeploy, expiry of ordinary quota keys, and old/current secret-version lookup. Confirm eviction remains disabled.
- Test global daily/31-day budgets, shared outbound rate permits, both kill switches, and missing store-initialization marker.
- Confirm production and preview namespaces, keys, and credentials cannot affect each other. Preview allowlist rejects any non-allowlisted address before provider dispatch.

### 21.3 Recipient controls and webhooks

- Scanner/prefetch GETs perform no opt-out/report mutation. Normal browser confirmation POST does.
- Tampered, malformed, wrong-purpose, wrong-key, and expired report tokens fail safely. Valid long-lived opt-out tokens still work. Raw addresses, author data, and message text are absent from token payloads.
- Repeated opt-out is idempotent; no confirmation email is sent. Subsequent sends are suppressed immediately, including across separate instances.
- Reporting records only the reason enum/reference/HMAC and performs the disclosed opt-out. Replaying a report does not multiply counts.
- No raw token appears in app logs, page metadata, analytics, or Referer. Visible action links survive Gmail/Outlook/Apple Mail link handling as actually tested.
- Invalid/missing webhook signature causes no effect. Verified duplicate, delayed, out-of-order, and replayed events are safe. A delivered event cannot unsuppress anyone.
- Webhook storage failure returns a retryable error; an acknowledged event has durable protection applied.
- If one-click headers are enabled, a real protocol-format POST works without login/cookie/CAPTCHA and GET remains harmless.

### 21.4 Browser and visual QA

Run Playwright through composing to five recipients, validation, challenge states, sending, completion, partial, unknown, failed, opt-out, and report. Use controlled test responses for deterministic results. Check browser console/network errors without recording sensitive request bodies.

Capture screenshots at 1448 × 1086 (the reference), 1440px wide, tablet, and 320/360/390px mobile widths. Include the expanded recipient list, longest permitted message, validation errors, challenge display, long translated/native browser error text where applicable, and an open mobile keyboard where feasible. Compare the tree, tire swing, heart, bird, branch, forms, wordmark, tagline, texture, bottom vegetation, and removed footer item with the source. Verify no cloned static bird remains beneath the animated one.

Use keyboard-only navigation, NVDA with a supported Windows browser, and VoiceOver/Safari when available. Run axe but do not treat it as proof of full conformance. Check readable labels/placeholders/counters, announced success/error, focus after field removal, 200% text size, 400% zoom/reflow, forced colors, and reduced motion. Every control remains usable with decorative layers disabled.

The sampled cream `#F7F1E3` against orange `#D24A16` is approximately **3.94:1**, below the 4.5:1 requirement for ordinary small text. Preserve the illustration while adjusting small live lettering/contrast locally (for example appropriate dark text, a subtle backing, or sufficiently larger qualifying text). Do not assume the source palette automatically passes. Test actual rendered foreground/background values and fine strokes.

### 21.5 Limited real delivery verification

After provider/account prerequisites, use Resend's current test addresses for accepted/bounced/complained/suppressed scenarios and a small number of consenting owner-controlled inboxes. Tests consume account quota. Current documented examples include `delivered@resend.dev`, `bounced@resend.dev`, `complained@resend.dev`, and `suppressed@resend.dev`; recheck supported behavior before use. [Resend test emails](https://resend.com/docs/dashboard/emails/send-test-emails)

Inspect delivered samples in Gmail, Outlook, and Apple Mail where available, including image blocking and dark mode. Confirm:

1. Exact sender address/display name and full subject; one recipient in To, no CC/BCC list disclosure.
2. Entire 1,000-character test message in HTML and text, with correct Unicode/newlines and no HTML execution.
3. Clear no-reply explanation, optional homepage link, visible report/opt-out/privacy links, and no requirement to visit the website to read.
4. SPF, DKIM, and DMARC alignment/pass in received headers; no sender IP or author identity added by this application.
5. Tracking disabled; no rewritten tracking links/pixel or unique external image request.
6. Opt-out and complaint/hard-bounce suppression works before another attempt, and no opt-out confirmation email is generated.
7. On-page completion claims only processed/attempted delivery. Bounce/delivery events do not create read receipts or sender-facing status history.

### 21.6 No-content-persistence audit

Send a unique synthetic sentinel text and known test recipient. Inspect **application-controlled** Redis keys/values, logs, traces, captured errors, generated responses, browser storage, caches, temporary files, and CI outputs. Neither raw message nor recipient address may appear outside the allowed transient send call. The short integrity HMAC/status and recipient HMAC are expected and documented. Separately confirm what Resend retains; finding the email in Resend is a provider-retention fact, not permission for the app to store it.

Keep test observations local/private if they contain addresses or headers. Save a sanitized QA report with test environment, exact commit, versions, passed checks, unavailable platforms, known failures, and evidence locations. Do not fabricate tests that could not be run.

## 22. Operational runbook and launch checklist

### Routine operation

Review aggregate app/provider send, bounce, complaint, report, quota, and webhook-failure counts. Check current provider acceptable-use thresholds in its dashboard/docs; small volumes make even one complaint significant. A manual response procedure is sufficient for v1; no extra admin UI or automated notification service is required.

During abuse or uncertain suppression state: turn the Redis runtime sending switch off immediately; leave opt-out/report/webhook routes functioning when possible; inspect only minimal necessary metadata and provider settings; apply available firewall rules; repair the cause; then verify controls before re-enabling. If Redis is inaccessible, the app already fails closed. The deployment-level `SENDING_ENABLED=false` provides a second stop after redeployment.

For rollback, restore the prior application deployment without clearing Redis, changing the suppression namespace, or dropping key versions. A prior deployment that cannot read current security metadata must not be re-enabled until compatibility is addressed. If a secret leaks, revoke/rotate it, preserve the ability to honor historical opt-outs, and verify all environments. Never paste a leaked value into an incident report.

### Production launch gates

- [ ] Correct existing GitHub/Vercel project and production domain identified; no unrelated service overwritten.
- [ ] Actual attached reference preserved; visual comparison completed; final tagline exact; obsolete reading feature removed.
- [ ] Functional caps, plain-text validation, recipient isolation, Turnstile, atomic shared limits, and closed failure paths tested.
- [ ] Application stores no message content, no raw recipient list, and no raw IP; TTLs and disclosure verified.
- [ ] Permanent suppressions survive redeploy/rotation; store initialized; eviction off; loss-recovery plan documented.
- [ ] Signed recipient controls, report-and-block flow, verified webhook effects, and replay handling work.
- [ ] Resend-approved permitted use established for the intended recipients; unresolved unsolicited-use conflict does not get hidden by deployment success.
- [ ] Exact From domain verified; SPF/DKIM/DMARC tested; no-reply mailbox behavior checked; tracking off.
- [ ] Free-plan eligibility/limits and existing account usage checked; no accidental paid feature enabled.
- [ ] Preview keys/stores isolated; secrets absent from repository and browser bundles; CSP/headers tested.
- [ ] Accessibility, responsive states, animation/reduced-motion, no-content-persistence audit, and controlled mail checks completed.
- [ ] Privacy/about copy reflects actual operation and provider retention; no guaranteed-anonymity claim.
- [ ] A known-good rollback and functioning immediate kill switch exist.
- [ ] Both sending enablement switches changed only after the above prerequisites pass.

## 23. Required implementation handoff

Deliver the working repository with cleanly scoped commits/PR, the final asset files and reference, documented local setup, complete placeholder `.env.example`, provider/DNS setup notes without secrets, tests, sanitized QA results, deployment instructions, and the operational runbook. Report the exact live URL and whether sending is actually enabled.

The website is complete only when the visual reference is faithfully implemented, all required functional/security paths are verified, and deployment status is accurately reported. If credentials, project access, DNS access, or provider permission prevent the last step, finish all independent work and name the specific unresolved item. Do not replace it with an extra product feature, a fake send confirmation, or a promise of future work.

This build specification and its adjacent reference image are the planning deliverables. The user subsequently confirmed that Codex should also build and deploy the website and may overwrite the existing alittlebird project. The authenticated account inspection identified `gagecorp13/a-little-bird` on GitHub and `a-little-bird` under Vercel's `littleshinyobjects` scope, currently mapped to `https://alittlebird.com`. Reuse these targets after inspecting their current configuration; publication is authorized.



## 24. Implementation and service setup record — October 9, 2026

This section records the implementation produced from the specification. It does not replace the verification and activation requirements above.

- Existing repository: https://github.com/gagecorp13/a-little-bird. Existing Vercel project: `a-little-bird` in `littleshinyobjects`, with alittlebird.com and www.alittlebird.com already attached.
- Next.js 16.4.0, React 19.3.0, strict TypeScript, pinned dependency versions and lockfile; production/CI Node.js 24.x. Development and initial local checks ran on Node 22.19.0; the Vercel production build supplies the target runtime check.
- Source artwork is reused unchanged through code-native SVG clipping/color-key filters. Exact wordmark, tree, swing, bird and board art come from the image. Native fields and responsive flow replace its baked-in controls. Editable text uses a licensed self-hosted handwriting approximation. CSS approximates the orange texture. See `design/asset-manifest.md` for the declared differences.
- Free Resend resource `alittlebird-email` and free Upstash Redis resource `alittlebird-security` were created and connected to Production only. Upstash automatic plan upgrade and eviction were explicitly disabled at provisioning; paid production extras were declined. The database responds and the initialization marker exists. Its sending marker remains `0`.
- Free managed Cloudflare Turnstile widget `alittlebird-production` was created for alittlebird.com, without pre-clearance. The real site and secret keys were transferred into Vercel; only the site key is public.
- Resend added exact DKIM and send-subdomain SPF/MX records through Vercel DNS. A DMARC TXT record was added at `_dmarc.alittlebird.com`: `v=DMARC1; p=none; adkim=r; aspf=r`. No reporting mailbox was invented. Receiving, open tracking, and click tracking are disabled. Domain verification was requested; check current status before activation.
- The signed Resend webhook is configured at `https://alittlebird.com/api/webhooks/resend` for bounced, complained, and suppressed events. No delivery test to a real recipient has been performed.
- `PROVIDER_USE_APPROVED=false` is an additional explicit server-only prerequisite; it represents resolution of permitted-use and recipient-consent requirements, not a substitute for that work. Keep it false until the requirements are actually satisfied. Resend provisioning/domain authentication does not authorize unsolicited recipient email.
- `SENDING_ENABLED=false` remains in Production. The disabled homepage is honest and the send API returns 503 without calling providers. The user authorized publishing this disabled release while setup proceeds.
- Completed checks include type checking, lint, production build, automated browser behavior and accessibility, three viewport screenshots, and 29 tests including actual concurrent Redis reservations. Further activation checks from sections 18–22 remain required, particularly genuine Turnstile challenge validation, received-email/header verification, signed webhook exercises, and production operational review.
- The Resend account also has another existing domain. Do not alter that domain or infer its usage. Free quotas and provider API limits can apply across the account; application budgets cannot reserve the other application's consumption. Preserve fail-closed/error behavior and check actual usage before enabling.
- `QA_REPORT.md` in the repository records release verification and remaining limits. Development-only lint dependencies currently have a reported `braces` denial-of-service advisory with no compatible published fix observed; production dependency audit reports no vulnerabilities. This is recorded rather than hidden by an incompatible downgrade.

The instructions remain deliberately more detailed than the initial disabled release. Do not interpret a checked disabled UI as proof that real delivery, all email clients, or every production failure mode has been exercised.

### Publication verification

The implemented website was published to **https://alittlebird.com** and pushed to the existing GitHub `main` branch. Vercel's production build succeeded on Node.js 24.x and GitHub CI passed. All four browser tests passed against the live domain. The disabled send endpoint returned 503, the excluded read route returned 404, and three viewport captures showed no horizontal overflow or console errors. SPF, DKIM, and DMARC records resolve publicly; Resend's verification remained pending at the latest check. Cloudflare Siteverify accepted the real secret and correctly rejected an invalid response; that is a configuration check, not a successful real visitor challenge. The canonical www redirect is included in the final build. Delivery remains disabled as explicitly authorized by the owner.
