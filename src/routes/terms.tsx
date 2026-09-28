import { createFileRoute } from "@tanstack/react-router";
import { Prose } from "@/components/site/PageShell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "terms — a little bird" },
      {
        name: "description",
        content: "Rules for sending a note with a little bird.",
      },
    ],
    links: [{ rel: "canonical", href: "https://alittlebird.com/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <Prose title="terms" lede="By sending a note, you agree to these rules. Last updated September 26, 2026.">
      <p>
        a little bird is a way to deliver a short plain-text note to an email address without including your identity in that email. You are responsible for what you write.
      </p>
      <h2>do not send</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>harassment, bullying, or targeted cruelty</li>
        <li>threats or encouragement of violence</li>
        <li>hate or discrimination</li>
        <li>sexual exploitation, including anything sexual involving a minor</li>
        <li>impersonation meant to deceive</li>
        <li>fraud, scams, or requests for money, gift cards, or passwords</li>
        <li>spam or bulk sending</li>
        <li>someone else's private information, including addresses, government IDs, or account credentials</li>
        <li>illegal content</li>
        <li>attempts to evade rate limits, blocks, or safety checks</li>
      </ul>
      <h2>what we may do</h2>
      <p>
        We may refuse a note, rate-limit you, honor a recipient's block, review reports, and stop operating the service. We do not promise delivery, and acceptance by an email provider is not a promise that the message reached an inbox.
      </p>
      <h2>no replies</h2>
      <p>
        Recipients cannot reply to you through this service. A reply to the message goes to a no-reply address, not to the sender.
      </p>
      <h2>contact</h2>
      <p>
        Questions about these rules: abuse@alittlebird.com. Privacy questions: privacy@alittlebird.com.
      </p>
    </Prose>
  );
}
