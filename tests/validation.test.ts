import { describe, it, expect } from "vitest";
import { parseNote, characterCount, canonicalEmail } from "@/lib/validation";
const valid = {
  submissionId: "9d20ecad-baf0-461b-92cb-26bb1c5b1224",
  recipients: ["friend@example.com"],
  message: "hello",
  turnstileToken: "token",
};
describe("note validation", () => {
  it("limits Unicode code points without truncation", () => {
    expect(characterCount("🌿")).toBe(1);
    expect(parseNote({ ...valid, message: "🌿".repeat(1000) }).note).toBeTruthy();
    expect(parseNote({ ...valid, message: "a".repeat(1001) }).error).toBeTruthy();
  });
  it("normalizes only newlines and preserves whitespace", () => {
    expect(parseNote({ ...valid, message: "  <script>&\r\nworld\r " }).note?.message).toBe(
      "  <script>&\nworld\n ",
    );
  });
  it("rejects blank and control text", () => {
    for (const message of ["", " \n ", "x\0y"])
      expect(parseNote({ ...valid, message }).error).toBeTruthy();
  });
  it("deduplicates without rewriting aliases", () => {
    expect(
      parseNote({
        ...valid,
        recipients: [" Friend@example.com ", "friend@EXAMPLE.COM", "friend+tag@example.com"],
      }).note?.recipients,
    ).toHaveLength(2);
    expect(canonicalEmail(" Test+tag@EXAMPLE.com ")).toBe("test+tag@example.com");
  });
  it("rejects lists, headers, display names and excess recipients", () => {
    for (const email of [
      "a@example.com,b@example.com",
      "Name <a@example.com>",
      "a@example.com\r\nBcc:x@example.com",
    ])
      expect(parseNote({ ...valid, recipients: [email] }).error).toBeTruthy();
    expect(parseNote({ ...valid, recipients: Array(6).fill("a@example.com") }).error).toBeTruthy();
  });
  it("rejects unexpected fields", () =>
    expect(parseNote({ ...valid, from: "attacker@example.com" }).error).toBeTruthy());
});
