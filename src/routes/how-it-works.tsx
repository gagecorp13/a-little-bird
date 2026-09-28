import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";

const STEPS = [
  {
    n: "1",
    title: "write your note",
    body: "Say the thing plainly. Compliments, apologies, thanks, a sentence you've been holding. One thousand characters is the whole flight.",
  },
  {
    n: "2",
    title: "tell us where to send it",
    body: "An email address is enough. You don't make an account, and you don't leave your name.",
  },
  {
    n: "3",
    title: "the bird delivers it without including your identity",
    body: "The person gets the note and nothing that names you. They can block future notes or report one that shouldn't have been sent.",
  },
];

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "how it works — a little bird" },
      {
        name: "description",
        content: "Write a note, tell us where to send it, and a little bird delivers it without your identity.",
      },
    ],
    links: [{ rel: "canonical", href: "https://alittlebird.com/how-it-works" }],
  }),
  component: HowItWorks,
});

function HowItWorks() {
  return (
    <PageShell>
      <article className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="font-display text-4xl text-ink">how it works</h1>
        <p className="mt-4 text-lg text-pretty text-ink/80">
          have something to say? let a little bird deliver it.
        </p>
        <ol className="mt-8 space-y-6">
          {STEPS.map((step) => (
            <li key={step.n} className="stationery rounded-2xl border border-ink/10 px-5 py-5">
              <p className="font-display text-sm text-coral">step {step.n}</p>
              <h2 className="mt-1 font-display text-2xl text-ink">{step.title}</h2>
              <p className="mt-2 text-pretty leading-relaxed text-ink/85">{step.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-ink/80">
          Your identity isn't included with the message. That is not the same as a promise that no one could ever investigate abuse.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex min-h-12 items-center rounded-full bg-coral px-5 text-paper"
        >
          write a note
        </Link>
      </article>
    </PageShell>
  );
}
