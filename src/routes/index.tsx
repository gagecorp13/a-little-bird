import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { MessageForm } from "@/components/message/MessageForm";
import { PageShell } from "@/components/site/PageShell";
import { track } from "@/lib/bird/track";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "a little bird — send an anonymous note" }],
    links: [{ rel: "canonical", href: "https://alittlebird.com/" }],
  }),
  component: Home,
});

function Home() {
  useEffect(() => {
    track("homepage_viewed");
  }, []);

  return (
    <PageShell>
      <section className="mx-auto w-full max-w-3xl px-4 pt-4 pb-10 sm:px-6 sm:pt-8">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl">
            have something to say?
          </h1>
          <p className="mt-3 text-lg text-pretty text-ink/80">
            send an anonymous note. a little bird will deliver it.
          </p>
        </div>
        <MessageForm />
      </section>
    </PageShell>
  );
}
