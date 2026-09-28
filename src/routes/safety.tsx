import { createFileRoute, Link } from "@tanstack/react-router";
import { Prose } from "@/components/site/PageShell";

export const Route = createFileRoute("/safety")({
  head: () => ({
    meta: [
      { title: "safety — a little bird" },
      {
        name: "description",
        content: "How a little bird treats anonymity, reports, blocks, and abuse.",
      },
    ],
    links: [{ rel: "canonical", href: "https://alittlebird.com/safety" }],
  }),
  component: SafetyPage,
});

function SafetyPage() {
  return (
    <Prose
      title="safety"
      lede="Anonymous to the person reading the note. Not a place to hide harm."
    >
      <h2>what the recipient sees</h2>
      <p>
        The email shows the message and says it came through a little bird. It does not include your name, your email, or a way to reply to you. "Anonymous" here means your identity isn't included with the message.
      </p>
      <p>
        We still process a small amount of technical information so we can slow down spam, investigate reports, and meet legal duties. We do not claim the service is untraceable.
      </p>
      <h2>abuse isn't tolerated</h2>
      <p>
        Threats, harassment, hate, sexual exploitation, scams, spam, and sharing someone's private information are not allowed. Automated checks can refuse a note before it is sent. Those checks are not perfect, and they are not something to try to sneak past.
      </p>
      <h2>messages can be reported</h2>
      <p>
        Every note includes a report link. The recipient does not need an account. We review the category they choose. We do not tell them who sent the note, because we never asked.
      </p>
      <h2>recipients can block future messages</h2>
      <p>
        A signed link in the email stops further notes to that address. Blocking is about the address, not a public list, and the sender is not told that a specific person blocked them.
      </p>
      <h2>if you are in danger</h2>
      <p>
        This site cannot dispatch help. If someone is threatening you, contact local emergency services. You can also report the note so we can stop more of them.
      </p>
      <p>
        <Link to="/terms">read the rules</Link>
      </p>
    </Prose>
  );
}
