import "server-only";
import { appOrigin } from "./config";
export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    public safeMessage: string,
  ) {
    super(code);
  }
}
export function json(data: unknown, status = 200, extra: Record<string, string> = {}) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", ...extra } });
}
export function checkOrigin(request: Request) {
  if (request.headers.get("origin") !== appOrigin())
    throw new HttpError(403, "verification_required", "Please send from a little bird's website.");
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none")
    throw new HttpError(403, "verification_required", "Please send from a little bird's website.");
}
export async function readBody(request: Request, max = 16384) {
  if (
    request.headers.has("content-encoding") &&
    request.headers.get("content-encoding") !== "identity"
  )
    throw new HttpError(415, "invalid_request", "Unsupported request format.");
  if (Number(request.headers.get("content-length") || 0) > max)
    throw new HttpError(413, "request_too_large", "That request is too large.");
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > max) {
      await reader.cancel();
      throw new HttpError(413, "request_too_large", "That request is too large.");
    }
    chunks.push(value);
  }
  const all = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    all.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(all);
}
export async function readJson(request: Request) {
  if (!/^application\/json(?:;|$)/i.test(request.headers.get("content-type") || ""))
    throw new HttpError(415, "invalid_request", "Please use the message form.");
  try {
    return JSON.parse(await readBody(request));
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(400, "invalid_request", "We couldn't read that request.");
  }
}
export function safeFailure(error: unknown) {
  if (error instanceof HttpError)
    return json(
      { code: error.code, message: error.safeMessage },
      error.status,
      error.status === 429 ? { "Retry-After": "60" } : {},
    );
  return json(
    { code: "unavailable", message: "The bird needs a moment. Please try again later." },
    503,
  );
}
