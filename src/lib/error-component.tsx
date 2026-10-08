import type { ErrorComponentProps } from "@tanstack/react-router";

const FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return FALLBACK_MESSAGE;
}

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-field px-6 text-center text-paper">
      <p className="font-display text-2xl text-balance">our bird got a little lost.</p>
      <p className="max-w-md text-sm break-words text-ink/70">{errorMessage(error)}</p>
    </main>
  );
}
