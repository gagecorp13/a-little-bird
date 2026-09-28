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
    <footer className="mx-auto w-full max-w-5xl px-4 py-8 text-sm text-ink/70 sm:px-6">
      <p className="font-display text-base text-ink">sometimes things are easier said anonymously.</p>
      <nav aria-label="footer" className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        {LINKS.map((link) => (
          <Link key={link.to} to={link.to} className="inline-flex min-h-11 items-center underline decoration-ink/20 underline-offset-4 hover:text-ink">
            {link.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
