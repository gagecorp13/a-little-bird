import { renderAnonymousMessageEmail } from "../../emails/anonymousMessage.ts";

export type EmailSendInput = {
  to: string;
  message: string;
  blockUrl: string;
  reportUrl: string;
  aboutUrl: string;
  privacyUrl: string;
  termsUrl: string;
};

export type EmailSendResult =
  | { ok: true; mode: "accepted"; providerId: string | null }
  | { ok: true; mode: "preview"; providerId: null }
  | { ok: false; mode: "failed" };

type SendOptions = {
  apiKey?: string | null;
  from?: string;
  replyTo?: string;
  fetchImpl?: typeof fetch;
};

export async function sendAnonymousMessage(
  input: EmailSendInput,
  options: SendOptions = {},
): Promise<EmailSendResult> {
  const apiKey =
    options.apiKey === undefined ? process.env.RESEND_API_KEY?.trim() || null : options.apiKey;
  if (!apiKey) return { ok: true, mode: "preview", providerId: null };

  const rendered = renderAnonymousMessageEmail(input);
  const from =
    options.from ??
    (process.env.EMAIL_FROM?.trim() || "a little bird <bird@alittlebird.com>");
  const replyTo =
    options.replyTo ?? (process.env.EMAIL_REPLY_TO?.trim() || "noreply@alittlebird.com");
  const fetchImpl = options.fetchImpl ?? fetch;

  try {
    const response = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        reply_to: replyTo,
        subject: "a little bird told us something...",
        html: rendered.html,
        text: rendered.text,
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return { ok: false, mode: "failed" };
    const payload = (await response.json()) as { id?: unknown };
    const providerId = typeof payload.id === "string" ? payload.id : null;
    return { ok: true, mode: "accepted", providerId };
  } catch {
    return { ok: false, mode: "failed" };
  }
}
