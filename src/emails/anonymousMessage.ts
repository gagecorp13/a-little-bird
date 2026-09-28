import { escapeHtml } from "../lib/bird/escape.ts";

export function renderAnonymousMessageEmail(input: {
  message: string;
  blockUrl: string;
  reportUrl: string;
  aboutUrl: string;
  privacyUrl: string;
  termsUrl: string;
}): { html: string; text: string } {
  const safe = escapeHtml(input.message).replace(/\n/g, "<br />");
  const block = escapeHtml(input.blockUrl);
  const report = escapeHtml(input.reportUrl);
  const about = escapeHtml(input.aboutUrl);
  const privacy = escapeHtml(input.privacyUrl);
  const terms = escapeHtml(input.termsUrl);

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f3ecdf;color:#2c2824;font-family:Georgia,'Iowan Old Style',serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3ecdf;padding:28px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
            <tr>
              <td style="padding:0 0 16px;font-family:Georgia,serif;font-size:22px;letter-spacing:-0.02em;">
                a little bird
              </td>
            </tr>
            <tr>
              <td style="background:#fffaf3;border:1px solid #e6dccb;border-radius:18px;padding:28px 24px;">
                <p style="margin:0 0 18px;font-size:26px;line-height:1.25;font-family:Georgia,serif;">
                  psst... a little bird has something to tell you.
                </p>
                <div style="background:#f3ecdf;border-radius:12px;padding:18px 16px;font-family:'Segoe UI',sans-serif;font-size:17px;line-height:1.55;">
                  ${safe}
                </div>
                <p style="margin:18px 0 0;font-family:'Segoe UI',sans-serif;font-size:14px;line-height:1.5;color:#4a433c;">
                  This message was sent anonymously through a little bird. The sender's identity was not included with the message.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 4px 0;font-family:'Segoe UI',sans-serif;font-size:13px;line-height:1.6;color:#4a433c;">
                <a href="${about}" style="color:#2f5f7a;">What is a little bird?</a>
                &nbsp;·&nbsp;
                <a href="${block}" style="color:#2f5f7a;">Block future messages</a>
                &nbsp;·&nbsp;
                <a href="${report}" style="color:#2f5f7a;">Report this message</a>
                <br />
                <a href="${privacy}" style="color:#2f5f7a;">Privacy</a>
                &nbsp;·&nbsp;
                <a href="${terms}" style="color:#2f5f7a;">Terms</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    "psst... a little bird has something to tell you.",
    "",
    input.message,
    "",
    "This message was sent anonymously through a little bird. The sender's identity was not included with the message.",
    "",
    `What is a little bird? ${input.aboutUrl}`,
    `Block future messages ${input.blockUrl}`,
    `Report this message ${input.reportUrl}`,
    `Privacy ${input.privacyUrl}`,
    `Terms ${input.termsUrl}`,
  ].join("\n");

  return { html, text };
}
