import { InfoPage } from "@/components/InfoPage";
export const metadata = { title: "privacy — a little bird" };
export default function Page() {
  return (
    <InfoPage title="a little privacy.">
      <p>
        We don’t ask for an account, a sender name, or a sender email. The recipient gets your note
        from chirp@alittlebird.com, without that author information attached.
      </p>
      <h2>the words you send</h2>
      <p>
        The application processes your note and recipient addresses in memory to send them. It
        doesn’t keep a message archive, save drafts in browser storage, or create a public link to
        your message.
      </p>
      <p>
        Our email provider, Resend, receives the message and addresses to deliver it and may retain
        them. Its current free plan lists 30-day retention. Your recipient and their email provider
        may keep, forward, or share the message.
      </p>
      <h2>keeping unwanted mail away</h2>
      <p>
        We use keyed identifiers derived from connection IP addresses and recipient addresses to
        limit abuse. These are pseudonymous records, not a guarantee of anonymity. IP and recipient
        limits last about 24 hours; a short-lived submission fingerprint and status last 26 hours.
        Service-wide usage counts last up to 31 days.
      </p>
      <p>
        Recipient opt-out and permanent suppression identifiers remain until deliberately resolved,
        so an old preference isn’t forgotten. Minimal reports and webhook deduplication records last
        up to 30 days. Reports do not store the message text.
      </p>
      <h2>the services involved</h2>
      <p>
        Vercel hosts the website, Cloudflare Turnstile checks for bots, Upstash holds the limited
        abuse-control records, and Resend sends email. They may process or retain operational and
        network information under their own policies.
      </p>
      <p>
        We don’t add open tracking, click tracking, session replay, or advertising analytics. We
        don’t log message text, full recipient addresses, or raw IP addresses in our application
        logs. Providers may keep their own infrastructure logs.
      </p>
      <h2>your choices</h2>
      <p>
        Each email has a “Stop future emails” link that needs no account. Its confirmation blocks
        later dispatches; mail already being delivered may still arrive. “Report this message” lets
        you report and block future mail. No confirmation email is sent.
      </p>
      <p>
        Replies do not reach the author. Someone may infer who you are from what you write. This
        service does not offer guaranteed anonymity or end-to-end encrypted email.
      </p>
      <p className="small-print">
        Updated October 8, 2026. Sending is unavailable until the required delivery and protection
        services are configured.
      </p>
    </InfoPage>
  );
}
