export function MessagePreview({ email, message }: { email: string; message: string }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-ink/60">to</p>
        <p className="mt-1 break-all text-base text-ink">{email}</p>
      </div>
      <div>
        <p className="text-sm text-ink/60">message</p>
        <p className="mt-1 max-h-48 overflow-y-auto whitespace-pre-wrap break-words rounded-md border-2 border-paper bg-paper px-3 py-3 text-lg leading-relaxed text-night">
          {message}
        </p>
      </div>
    </div>
  );
}
