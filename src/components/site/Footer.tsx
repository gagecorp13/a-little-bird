import { Link } from "@tanstack/react-router";

const LINKS = [
  { to: "/how-it-works", label: "how it works" },
  { to: "/safety", label: "safety" },
  { to: "/about", label: "about" },
  { to: "/privacy", label: "privacy" },
  { to: "/terms", label: "terms" },
] as const;

export function Footer() {
  return (
    <footer className="mx-auto w-full max-w-6xl px-4 py-8 text-lg text-paper/80 sm:px-6">
      <p className="font-display text-xl text-paper">sometimes things are easier said anonymously.</p>
      <nav aria-label="footer" className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        {LINKS.map((link) => (
          <Link key={link.to} to={link.to} className="inline-flex min-h-11 items-center underline decoration-paper/40 underline-offset-4 hover:text-paper">
            {link.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
