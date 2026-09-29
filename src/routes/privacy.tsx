import { createFileRoute } from "@tanstack/react-router";
import { Prose } from "@/components/site/PageShell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "privacy — a little bird" },
      {
        name: "description",
        content: "What a little bird processes, what it keeps, and what it does not promise.",
      },
    ],
    links: [{ rel: "canonical", href: "https://alittlebird.com/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <Prose
      title="privacy"
      lede="Plain language for a small service. Last updated September 26, 2026."
    >
      <p>
        a little bird lets someone send a short note to an email address without putting the sender's identity in that email. This policy describes what the service actually does. It does not promise that a message is impossible to trace.
      </p>
      <h2>what you can send without an account</h2>
      <p>
        You do not create an account. We do not ask for your name, your email, or a phone number. The recipient address and the note are what you type.
      </p>
      <h2>recipient email addresses</h2>
      <p>
        We use the address to hand the note to our email provider. On our own systems we store a one-way hash of the address, not the address itself, so we can honor blocks and spot repeated sends. A hash is not the address, but it is still tied to that address for as long as we keep it.
      </p>
      <p>
        We do not tell anyone whether an address has received notes before, whether it is blocked, or whether it belongs to a real inbox.
      </p>
      <h2>the message itself</h2>
      <p>
        The note is checked for abuse and, if allowed, placed in the outgoing email. We do not keep a copy of the message text on our servers after that attempt. The email provider receives the text in order to deliver it and keeps it under their own policy.
      </p>
      <p>
        We also store a fingerprint of the note (another one-way hash) for about 30 minutes so the same note is not fired at the same address over and over. The fingerprint is not the note.
      </p>
      <h2>technical and security data</h2>
      <p>
        To rate-limit sending we hash a network address, a coarse browser signal, and a random key stored in your browser. Those hashes sit in send records for about 48 hours, then we delete them. We do not keep the raw network address in the database.
      </p>
      <p>
        If bot protection is configured, Cloudflare Turnstile may process a short-lived challenge token. Their handling of that check is described in Cloudflare's own policy.
      </p>
      <h2>reports and blocks</h2>
      <p>
        A block stores the recipient hash until that person uses the undo link. A report stores the category you pick and an optional note you write, for up to 90 days, so we can review abuse. Reports do not include the sender's identity, because we never collected it.
      </p>
      <h2>product counters</h2>
      <p>
        We count homepage views, sends started, sends completed, and sends failed. Those counters are totals. They do not include message text or email addresses.
      </p>
      <h2>who else processes data</h2>
      <p>
        Email is sent through the mail host for this domain, which receives the recipient address, the note, and delivery metadata. Hosting and the database are provided by our infrastructure host. If an AI safety check is enabled, the note text (not the recipient address) may be sent to xAI for a yes-or-no abuse decision and is not stored by us afterward.
      </p>
      <h2>legal requests</h2>
      <p>
        We may disclose information we actually have if the law requires it. Because we do not ask who you are, that disclosure cannot include a sender profile we never created. Hashed technical records, reports, and whatever the email provider retains may still exist for a limited time.
      </p>
      <h2>deletion</h2>
      <p>
        Send records are removed after about 48 hours. Reports are removed after about 90 days. Blocks stay until undone. You can ask questions at privacy@alittlebird.com. If you want notes to an address to stop, use the block link in a message you received.
      </p>
      <h2>children</h2>
      <p>
        The service is not for children, and sexual content involving minors is forbidden and refused.
      </p>
    </Prose>
  );
}
