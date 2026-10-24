"use client";

import { useState, useSyncExternalStore } from "react";
import { decodePayload } from "@/lib/pollyanna/token";
import type { RevealPayload } from "@/lib/pollyanna/types";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

function getHash(): string | null {
  return window.location.hash.slice(1);
}

// Null on the server and during hydration, so the prerendered HTML matches.
function getServerHash(): string | null {
  return null;
}

const CONFETTI_COLORS = ["#b91c1c", "#15803d", "#fcd34d", "#f8fafc", "#f97316"];

const CONFETTI = Array.from({ length: 28 }, (_, i) => {
  const angle = (i / 28) * Math.PI * 2;
  const dist = 90 + (i % 5) * 28;
  return {
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    dx: Math.round(Math.cos(angle) * dist),
    dy: Math.round(Math.sin(angle) * dist - 40),
    rot: (i * 47) % 360,
    delay: (i % 6) * 0.04,
  };
});

function Present({ lidOff }: { lidOff: boolean }) {
  return (
    <svg viewBox="0 0 200 200" className="w-56 h-56 sm:w-72 sm:h-72" aria-hidden="true">
      <rect x="30" y="90" width="140" height="95" rx="6" fill="#b91c1c" />
      <rect x="92" y="90" width="16" height="95" fill="#fcd34d" />
      <g className={lidOff ? "pollyanna-lid-off" : undefined}>
        <rect x="22" y="64" width="156" height="30" rx="6" fill="#dc2626" />
        <rect x="92" y="64" width="16" height="30" fill="#fcd34d" />
        <path d="M100 64 C70 20 40 40 70 62 Z" fill="#fcd34d" />
        <path d="M100 64 C130 20 160 40 130 62 Z" fill="#fcd34d" />
        <circle cx="100" cy="62" r="9" fill="#f59e0b" />
      </g>
    </svg>
  );
}

function Gift({ payload }: { payload: RevealPayload }) {
  const [opened, setOpened] = useState(false);

  return (
    <div className="relative flex flex-col items-center gap-6 text-center">
      <h1 className="pollyanna-heading text-4xl sm:text-5xl">
        Hi {payload.g}! 🎄
      </h1>

      {!opened ? (
        <button
          type="button"
          onClick={() => setOpened(true)}
          aria-label={`Tap to unwrap your Pollyanna gift, ${payload.g}`}
          className="pollyanna-wiggle rounded-2xl p-2"
        >
          <Present lidOff={false} />
          <span className="block text-xl text-amber-200 mt-2">Tap to unwrap</span>
        </button>
      ) : (
        <>
          <div className="relative">
            <Present lidOff />
            <div aria-hidden="true">
              {CONFETTI.map((c, i) => (
                <span
                  key={i}
                  className="pollyanna-confetti"
                  style={
                    {
                      background: c.color,
                      animationDelay: `${c.delay}s`,
                      "--dx": `${c.dx}px`,
                      "--dy": `${c.dy}px`,
                      "--rot": `${c.rot}deg`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
          </div>
          <div
            className="pollyanna-card pollyanna-pop p-6 w-full max-w-sm space-y-2"
            role="status"
          >
            <p className="text-amber-100/80">You&apos;re getting a gift for</p>
            <p className="pollyanna-heading text-5xl break-words">{payload.r}</p>
            <p>Budget: {payload.b}</p>
            <p>Exchange: {payload.d}</p>
            <p className="text-sm text-amber-100/70 pt-2">
              Shh… it&apos;s a secret! 🤫
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export function Reveal() {
  const hash = useSyncExternalStore(subscribe, getHash, getServerHash);

  let body: React.ReactNode;
  if (hash === null) {
    body = <p className="text-xl text-amber-200">🎁 Wrapping things up…</p>;
  } else {
    const payload = decodePayload(hash);
    body = payload ? (
      <Gift key={hash} payload={payload} />
    ) : (
      <p className="text-lg max-w-sm text-center">
        This link looks broken. Ask the grown-up who sent it for a new one.
      </p>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      {body}
    </main>
  );
}
