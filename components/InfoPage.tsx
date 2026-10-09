import Link from "next/link";
export function InfoPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="info-page">
      <Link className="back-link" href="/">
        ← a little bird
      </Link>
      <article>
        <h1>{title}</h1>
        {children}
      </article>
      <footer>
        <Link href="/">back to the tree</Link>
        <Link href="/privacy">privacy</Link>
      </footer>
    </main>
  );
}
