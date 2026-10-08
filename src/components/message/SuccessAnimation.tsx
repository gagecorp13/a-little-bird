import { BirdInFlight } from "@/components/site/BirdLogo";

export function SuccessAnimation({
  delivery,
  onAgain,
}: {
  delivery: "accepted" | "preview";
  onAgain: () => void;
}) {
  const accepted = delivery === "accepted";
  return (
    <div className="enter-up" role="status">
      <div className="relative mb-2 h-24 overflow-hidden" aria-hidden="true">
        <div className="bird-flight absolute top-2 left-0">
          <BirdInFlight className="h-16 w-24" />
        </div>
      </div>
      <h2 className="font-display text-3xl text-ink">your bird is on its way.</h2>
      <p className="mt-3 text-pretty text-base leading-relaxed text-ink/80">
        {accepted
          ? "we handed your note off for delivery without including your identity."
          : "mail isn't connected in this preview, so nothing was emailed. your identity still isn't attached to the note."}
      </p>
      <p className="mt-2 text-sm text-ink/60">
        {accepted
          ? "your message has been sent for delivery. that means the mail service accepted it — not that the inbox has opened it yet."
          : "when email delivery is connected, the same send goes out without your name."}
      </p>
      <button
        type="button"
        onClick={onAgain}
        className="sign mt-6 inline-flex min-h-12 items-center px-5 text-2xl"
      >
        send another
      </button>
    </div>
  );
}
