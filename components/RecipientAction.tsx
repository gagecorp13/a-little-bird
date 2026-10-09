"use client";
import { useEffect, useState, useRef } from "react";
export function RecipientAction({ purpose }: { purpose: "opt-out" | "report" }) {
  const [token, setToken] = useState(""),
    [loaded, setLoaded] = useState(false),
    [state, setState] = useState("editing"),
    [reason, setReason] = useState("unwanted"),
    [error, setError] = useState("");
  const read = useRef(false);
  useEffect(() => {
    if (read.current) return;
    read.current = true;
    const t = new URLSearchParams(window.location.hash.slice(1)).get("token") || "";
    window.history.replaceState(null, "", window.location.pathname);
    queueMicrotask(() => {
      setToken(t);
      setLoaded(true);
    });
  }, []);
  async function confirm() {
    if (!token) return;
    setState("sending");
    setError("");
    try {
      const r = await fetch("/api/" + purpose, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...(purpose === "report" ? { reason } : {}) }),
        signal: AbortSignal.timeout(10000),
      });
      const data = await r.json();
      if (!r.ok)
        throw new Error(data.message || "We couldn't save that preference. Please try again.");
      setState("complete");
      setToken("");
    } catch (e) {
      setState("editing");
      setError(e instanceof Error ? e.message : "Please try again.");
    }
  }
  if (state === "complete")
    return (
      <div role="status">
        <h2>All taken care of.</h2>
        <p>
          Future messages to this address are blocked. A message already being delivered may still
          arrive.
        </p>
        {purpose === "report" && <p>Your report was recorded.</p>}
      </div>
    );
  return (
    <>
      <p>
        {purpose === "report"
          ? "Report this note and stop future messages to your address. You don’t need to copy the message here."
          : "Stop future messages from a little bird to the address this email was sent to. No account needed."}
      </p>
      {loaded && !token ? (
        <p role="status">
          Open the {purpose === "report" ? "report" : "stop-emails"} link in your original email to
          continue.
        </p>
      ) : (
        <>
          {purpose === "report" && (
            <label className="reason-label">
              Reason
              <select value={reason} onChange={(e) => setReason(e.target.value)}>
                <option value="unwanted">Unwanted message</option>
                <option value="harassment">Harassment or threats</option>
                <option value="scam">Suspected scam</option>
                <option value="other">Other</option>
              </select>
            </label>
          )}
          <button
            className="plain-button"
            onClick={confirm}
            disabled={!token || state === "sending"}
          >
            {state === "sending"
              ? "saving…"
              : purpose === "report"
                ? "Report and stop future emails"
                : "Stop future emails"}
          </button>
        </>
      )}
      <p role="status">{error}</p>
    </>
  );
}
