import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PageShell } from "@/components/site/PageShell";

export const Route = createFileRoute("/block")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  head: () => ({
    meta: [
      { title: "block messages — a little bird" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BlockPage,
});

function BlockPage() {
  const { token } = Route.useSearch();
  const started = useRef(false);
  const [message, setMessage] = useState("hold on — asking the flock to skip this address.");
  const [undoToken, setUndoToken] = useState("");
  const [state, setState] = useState<"working" | "blocked" | "open" | "invalid">("working");

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!token) {
      setState("invalid");
      setMessage("this link has flown off. it may have expired.");
      return;
    }
    void fetch("/api/block", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, action: "block" }),
    })
      .then(async (response) => {
        const payload = (await response.json()) as {
          ok?: boolean;
          message?: string;
          undoToken?: string;
          state?: string;
        };
        if (!response.ok || !payload.ok) {
          setState("invalid");
          setMessage(payload.message || "this link has flown off. it may have expired.");
          return;
        }
        setState("blocked");
        setMessage(payload.message || "this address won't receive any more birds.");
        setUndoToken(payload.undoToken || "");
      })
      .catch(() => {
        setState("invalid");
        setMessage("our bird got a little lost. please try again.");
      });
  }, [token]);

  async function undo() {
    setState("working");
    const response = await fetch("/api/block", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: undoToken, action: "unblock" }),
    });
    const payload = (await response.json()) as { ok?: boolean; message?: string };
    if (!response.ok || !payload.ok) {
      setState("blocked");
      setMessage(payload.message || "our bird got a little lost. please try again.");
      return;
    }
    setState("open");
    setMessage(payload.message || "birds can visit this address again.");
  }

  return (
    <PageShell>
      <article className="mx-auto w-full max-w-xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-4xl text-balance text-ink" role="status">
          {message}
        </h1>
        {state === "blocked" && undoToken ? (
          <button
            type="button"
            onClick={() => void undo()}
            className="mt-8 inline-flex min-h-12 items-center border-2 border-paper bg-paper px-5 text-lg text-night"
          >
            changed your mind? allow messages again
          </button>
        ) : null}
      </article>
    </PageShell>
  );
}
