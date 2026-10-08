import { createFileRoute, Link } from "@tanstack/react-router";
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
      <section className="mx-auto w-full max-w-6xl px-2 sm:px-4">
        <h1 className="sr-only">a little bird</h1>
        <div className="relative">
          <img
            src="/tree.png"
            alt=""
            width={1200}
            height={700}
            className="h-auto w-full select-none"
          />
          <a
            href="#note"
            className="hang sign absolute hidden min-h-11 -rotate-1 items-center px-3 py-2 text-[clamp(1rem,2.1vw,1.65rem)] sm:inline-flex"
            style={{ position: "absolute", top: "24%", left: "58%" }}
          >
            send a message
          </a>
        </div>
        <div className="mt-1 flex flex-col items-center gap-3">
          <a href="#note" className="hang sign inline-flex min-h-12 items-center px-4 py-2 text-2xl sm:hidden">
            send a message
          </a>
          <Link to="/how-it-works" className="inline-flex min-h-11 items-center text-xl text-paper sm:text-2xl">
            | what is going on? |
          </Link>
        </div>
      </section>
      <section className="mx-auto w-full max-w-xl px-4 pt-6 pb-12 sm:px-6">
        <p className="text-center text-2xl text-pretty text-paper">
          send an anonymous note. a little bird will deliver it.
        </p>
        <MessageForm />
      </section>
    </PageShell>
  );
}
