import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { PageShell } from "@/components/site/PageShell";
import { REPORT_CATEGORIES } from "@/lib/bird/copy";

export const Route = createFileRoute("/report")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  head: () => ({
    meta: [
      { title: "report a message — a little bird" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const { token } = Route.useSearch();
  const [category, setCategory] = useState<string>("harassment");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, category, note }),
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        setMessage(payload.message || "our bird got a little lost. please try again.");
        setPending(false);
        return;
      }
      setDone(true);
      setMessage(payload.message || "thanks for letting us know. we'll review it.");
    } catch {
      setMessage("our bird got a little lost. please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <PageShell>
      <article className="mx-auto w-full max-w-xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="font-display text-4xl text-ink">something wrong with this message?</h1>
        <p className="mt-3 text-pretty text-ink/75">
          Tell us the kind of problem. We won't show you who sent it — we don't have their name.
        </p>
        {!token ? (
          <p role="alert" className="mt-6 text-coral">
            this link has flown off. open the report link from the email.
          </p>
        ) : null}
        {done ? (
          <p role="status" className="mt-8 font-display text-2xl text-ink">
            {message}
          </p>
        ) : (
          <form onSubmit={(event) => void submit(event)} className="mt-8 space-y-4">
            <fieldset className="space-y-2" disabled={!token || pending}>
              <legend className="font-display text-lg text-ink">what happened?</legend>
              {REPORT_CATEGORIES.map(([id, label]) => (
                <label key={id} className="flex min-h-11 items-center gap-3 text-base">
                  <input
                    type="radio"
                    name="category"
                    value={id}
                    checked={category === id}
                    onChange={() => setCategory(id)}
                    className="size-4 accent-coral"
                  />
                  {label}
                </label>
              ))}
            </fieldset>
            <label className="block">
              <span className="font-display text-lg text-ink">anything else? optional</span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value.slice(0, 500))}
                rows={4}
                className="mt-2 w-full rounded-xl border border-ink/15 bg-paper px-3 py-3 text-base"
              />
            </label>
            {message ? (
              <p role="alert" className="text-sm text-coral">
                {message}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={!token || pending}
              className="inline-flex min-h-12 items-center rounded-full bg-ink px-5 text-paper disabled:opacity-60"
            >
              {pending ? "sending…" : "submit report"}
            </button>
          </form>
        )}
      </article>
    </PageShell>
  );
}
