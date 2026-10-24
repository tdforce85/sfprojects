import { describe, expect, it } from "vitest";
import { decodePayload, encodePayload } from "./token";
import type { RevealPayload } from "./types";

function payload(g: string, r: string): RevealPayload {
  return { v: 1, g, r, b: "$20", d: "Christmas Eve" };
}

describe("token", () => {
  it.each([
    ["O'Brien", "Zoë"],
    ["Mary Kate", "🎄"],
  ])("round-trips %s -> %s", (g, r) => {
    const p = payload(g, r);
    expect(decodePayload(encodePayload(p))).toEqual(p);
  });

  it("is URL-safe and hides plaintext names", () => {
    const token = encodePayload(payload("Mary Kate", "O'Brien"));
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token).not.toContain("Mary");
    expect(token).not.toContain("O'Brien");
    expect(token).not.toContain("Kate");
  });

  it("returns null for bad input", () => {
    const b64 = (s: string) => btoa(s).replace(/=+$/, "");
    expect(decodePayload("")).toBeNull();
    expect(decodePayload("!!not base64!!")).toBeNull();
    expect(decodePayload("a8Zq")).toBeNull();
    expect(decodePayload(b64("hello world"))).toBeNull();
    expect(decodePayload(encodePayload({ ...payload("A", "B"), v: 2 } as unknown as RevealPayload))).toBeNull();
    const missing = { v: 1, g: "A", b: "", d: "" };
    expect(decodePayload(encodePayload(missing as unknown as RevealPayload))).toBeNull();
  });
});
