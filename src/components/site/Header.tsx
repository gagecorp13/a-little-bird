import { Link } from "@tanstack/react-router";
import { BirdMark } from "./BirdLogo";

const LINKS = [
  { to: "/how-it-works", label: "how it works" },
  { to: "/safety", label: "safety" },
  { to: "/about", label: "about" },
] as const;

export function Header() {
  return (
    <header className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-4 sm:px-6">
      <Link to="/" className="flex items-center gap-2 rounded-md" aria-label="a little bird, home">
        <BirdMark className="h-10 w-12" />
        <span className="font-display text-xl tracking-tight text-ink">a little bird</span>
      </Link>
      <nav aria-label="primary" className="flex items-center gap-1 sm:gap-2">
        {LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="inline-flex min-h-11 items-center rounded-md px-2 text-sm text-ink/75 hover:text-ink sm:px-3"
            activeProps={{ className: "inline-flex min-h-11 items-center rounded-md px-2 text-sm text-ink sm:px-3" }}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
