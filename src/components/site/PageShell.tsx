import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-20 focus:bg-paper focus:px-3 focus:py-2 focus:text-night"
      >
        skip to content
      </a>
      <Header />
      <main id="content" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export function Prose({
  title,
  lede,
  children,
}: {
  title: string;
  lede?: string;
  children: ReactNode;
}) {
  return (
    <PageShell>
      <article className="ink-frame mx-auto w-full max-w-2xl px-5 py-8 sm:px-8 sm:py-12">
        <h1 className="font-display text-4xl text-ink">{title}</h1>
        {lede ? <p className="mt-4 text-lg text-pretty text-ink/80">{lede}</p> : null}
        <div className="mt-8 space-y-4 text-base leading-relaxed text-pretty text-ink/90 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-ink [&_a]:text-sky [&_a]:underline [&_a]:decoration-sky/30 [&_a]:underline-offset-4">
          {children}
        </div>
      </article>
    </PageShell>
  );
}
