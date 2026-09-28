import { createFileRoute, Link } from "@tanstack/react-router";
import { Prose } from "@/components/site/PageShell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "about — a little bird" },
      {
        name: "description",
        content: "Sometimes there's something you want someone to know. A little bird will carry it.",
      },
    ],
    links: [{ rel: "canonical", href: "https://alittlebird.com/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <Prose title="about">
      <p>
        sometimes there's something you want someone to know, but saying it yourself feels impossible. that's where a little bird comes in.
      </p>
      <p>
        It is a tiny postal service for one note at a time. No profiles, no feed, no reply thread. You write. We carry the words. The person on the other side sees the note, not you.
      </p>
      <p>
        We made it for the compliment that stalls, the apology that feels too heavy to start, and the thank-you that never quite gets sent. It should take less than a minute, and it should feel like paper, not a control panel.
      </p>
      <p>
        Kindness is the point. Cruelty is not a clever use of the same door. If a note shouldn't have landed, the recipient can report it or tell the bird to stop visiting.
      </p>
      <p>
        <Link to="/">send a little note</Link>
      </p>
    </Prose>
  );
}
