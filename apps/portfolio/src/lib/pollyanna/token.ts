import type { RevealPayload } from "./types";

// Obfuscation, not encryption: it keeps names from being readable at a glance.
// Links are built as `${origin}/pollyanna/reveal#${token}`. The token lives in
// the fragment so it is never sent to the server or written to logs.
// `next build` emits reveal.html (no trailingSlash), which Cloudflare Pages
// serves at /pollyanna/reveal without a redirect; the trailing-slash form would
// 308 and could drop the fragment in some clients.
const KEY = new TextEncoder().encode("pollyanna-v1");

function xor(bytes: Uint8Array): Uint8Array {
  return bytes.map((b, i) => b ^ KEY[i % KEY.length]);
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, "="));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function encodePayload(p: RevealPayload): string {
  return toBase64Url(xor(new TextEncoder().encode(JSON.stringify(p))));
}

export function decodePayload(token: string): RevealPayload | null {
  try {
    if (!/^[A-Za-z0-9_-]+$/.test(token)) return null;
    const json = new TextDecoder("utf-8", { fatal: true }).decode(
      xor(fromBase64Url(token))
    );
    const data: unknown = JSON.parse(json);
    if (typeof data !== "object" || data === null) return null;
    const o = data as Record<string, unknown>;
    if (
      o.v !== 1 ||
      typeof o.g !== "string" ||
      typeof o.r !== "string" ||
      typeof o.b !== "string" ||
      typeof o.d !== "string" ||
      o.g.length === 0 ||
      o.r.length === 0
    ) {
      return null;
    }
    return { v: 1, g: o.g, r: o.r, b: o.b, d: o.d };
  } catch {
    return null;
  }
}
