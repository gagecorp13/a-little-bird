import { MAX_MESSAGE_LENGTH } from "@/lib/bird/validate";

export function CharacterCounter({ value }: { value: string }) {
  const count = [...value].length;
  const over = count > MAX_MESSAGE_LENGTH;
  return (
    <p
      className={`text-right text-sm tabular-nums ${over ? "text-coral" : "text-ink/55"}`}
      aria-live="polite"
    >
      {count.toLocaleString("en-US")} / {MAX_MESSAGE_LENGTH.toLocaleString("en-US")}
    </p>
  );
}
