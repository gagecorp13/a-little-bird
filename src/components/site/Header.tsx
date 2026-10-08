import { Link } from "@tanstack/react-router";

const LINKS = [
  { to: "/how-it-works", label: "how it works" },
  { to: "/safety", label: "safety" },
  { to: "/about", label: "about" },
] as const;

export function Header() {
  return (
    <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
      <Link to="/" className="rounded-md font-display text-2xl text-paper" aria-label="a little bird, home">
        a little bird
      </Link>
      <nav aria-label="primary" className="flex items-center gap-1 sm:gap-2">
        {LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="inline-flex min-h-11 items-center px-2 text-lg text-paper/80 hover:text-paper sm:px-3"
            activeProps={{ className: "inline-flex min-h-11 items-center px-2 text-lg text-paper sm:px-3" }}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
