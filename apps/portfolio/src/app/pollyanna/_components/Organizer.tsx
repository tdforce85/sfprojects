"use client";

import { useEffect, useState } from "react";
import { drawAssignments, validateRoster } from "@/lib/pollyanna/draw";
import { encodePayload } from "@/lib/pollyanna/token";
import type { Family } from "@/lib/pollyanna/types";

interface LinkRow {
  giver: string;
  family: string;
  url: string;
}

const STORAGE_KEY = "pollyanna:roster:v1";

function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function newFamily(): Family {
  return { id: newId(), name: "", kids: [""] };
}

function isFamilyArray(value: unknown): value is Family[] {
  return (
    Array.isArray(value) &&
    value.every(
      (f) =>
        typeof f === "object" &&
        f !== null &&
        typeof (f as Family).id === "string" &&
        typeof (f as Family).name === "string" &&
        Array.isArray((f as Family).kids) &&
        (f as Family).kids.every((k) => typeof k === "string")
    )
  );
}

export function Organizer() {
  const [families, setFamilies] = useState<Family[]>([newFamily(), newFamily()]);
  const [budget, setBudget] = useState("What you're comfortable with");
  const [date, setDate] = useState("Christmas Eve");
  const [rows, setRows] = useState<LinkRow[] | null>(null);
  const [status, setStatus] = useState("");
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage after mount; reading it during render would
  // mismatch the statically prerendered HTML.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data: unknown = JSON.parse(raw);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (isFamilyArray(data) && data.length > 0) setFamilies(data);
      }
    } catch {
      // Storage unavailable or corrupt; start fresh.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(families));
    } catch {
      // Ignore storage failures.
    }
  }, [families, hydrated]);

  const validation = validateRoster(families);
  const counts = families.map(
    (f) => f.kids.filter((k) => k.trim().length > 0).length
  );
  const total = counts.reduce((a, b) => a + b, 0);

  function updateFamily(id: string, patch: Partial<Family>) {
    setFamilies((fs) => fs.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function updateKid(id: string, index: number, name: string) {
    setFamilies((fs) =>
      fs.map((f) =>
        f.id === id
          ? { ...f, kids: f.kids.map((k, i) => (i === index ? name : k)) }
          : f
      )
    );
  }

  function removeKid(id: string, index: number) {
    setFamilies((fs) =>
      fs.map((f) =>
        f.id === id ? { ...f, kids: f.kids.filter((_, i) => i !== index) } : f
      )
    );
  }

  function runDraw() {
    // Assignments are consumed here and never stored in state.
    const assignments = drawAssignments(families);
    const familyOfKid = new Map<string, string>();
    for (const f of families) {
      for (const k of f.kids) familyOfKid.set(k.trim(), f.name.trim());
    }
    setRows(
      assignments.map((a) => ({
        giver: a.giver,
        family: familyOfKid.get(a.giver) ?? "",
        url: `${window.location.origin}/pollyanna/reveal#${encodePayload({
          v: 1,
          g: a.giver,
          r: a.receiver,
          b: budget.trim(),
          d: date.trim(),
        })}`,
      }))
    );
    setStatus("Draw complete. Links are ready.");
  }

  function redraw() {
    if (
      window.confirm(
        "This replaces all links. Anyone who already got a link will have the wrong match."
      )
    ) {
      runDraw();
    }
  }

  async function copy(text: string, message: string) {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(message);
    } catch {
      setStatus("Copy failed. Use Download backup instead.");
    }
  }

  function allLinksText(list: LinkRow[]): string {
    return list.map((r) => `${r.giver}: ${r.url}`).join("\n");
  }

  function download(list: LinkRow[]) {
    const blob = new Blob([allLinksText(list) + "\n"], { type: "text/plain" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = "pollyanna-links.txt";
    a.click();
    URL.revokeObjectURL(href);
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <header className="text-center">
        <h1 className="pollyanna-heading text-4xl sm:text-5xl">Pollyanna 🎁</h1>
        <p className="mt-2 text-amber-100/80">
          Draw names for the kids. No self or sibling matches. You will not see
          who drew whom.
        </p>
      </header>

      <section className="pollyanna-card p-4 space-y-3" aria-labelledby="details">
        <h2 id="details" className="pollyanna-heading text-2xl">
          Event details
        </h2>
        <label className="block">
          <span className="text-sm">Budget</span>
          <input
            className="pollyanna-input mt-1"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm">Exchange date</span>
          <input
            className="pollyanna-input mt-1"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      </section>

      <section className="pollyanna-card p-4 space-y-4" aria-labelledby="families">
        <div className="flex items-baseline justify-between">
          <h2 id="families" className="pollyanna-heading text-2xl">
            Families
          </h2>
          <span className="text-sm text-amber-100/70">{total} kids total</span>
        </div>

        {families.map((f, fi) => (
          <div key={f.id} className="rounded-lg border border-amber-200/15 p-3 space-y-2">
            <div className="flex gap-2 items-end">
              <label className="flex-1">
                <span className="text-sm">Family {fi + 1} name</span>
                <input
                  className="pollyanna-input mt-1"
                  value={f.name}
                  onChange={(e) => updateFamily(f.id, { name: e.target.value })}
                />
              </label>
              <button
                type="button"
                className="pollyanna-btn pollyanna-btn-ghost"
                onClick={() => setFamilies((fs) => fs.filter((x) => x.id !== f.id))}
                aria-label={`Remove family ${f.name || fi + 1}`}
              >
                Remove
              </button>
            </div>
            <p className="text-xs text-amber-100/60">{counts[fi]} kids</p>
            {f.kids.map((k, ki) => (
              <div key={ki} className="flex gap-2">
                <input
                  className="pollyanna-input"
                  value={k}
                  aria-label={`Family ${fi + 1} kid ${ki + 1} name`}
                  onChange={(e) => updateKid(f.id, ki, e.target.value)}
                />
                <button
                  type="button"
                  className="pollyanna-btn pollyanna-btn-ghost"
                  onClick={() => removeKid(f.id, ki)}
                  aria-label={`Remove kid ${ki + 1} from family ${fi + 1}`}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              className="pollyanna-btn pollyanna-btn-alt"
              onClick={() => updateFamily(f.id, { kids: [...f.kids, ""] })}
            >
              + Add kid
            </button>
          </div>
        ))}

        <button
          type="button"
          className="pollyanna-btn pollyanna-btn-alt"
          onClick={() => setFamilies((fs) => [...fs, newFamily()])}
        >
          + Add family
        </button>
      </section>

      <section className="pollyanna-card p-4 space-y-3" aria-labelledby="draw">
        <h2 id="draw" className="pollyanna-heading text-2xl">
          Draw
        </h2>
        <div aria-live="polite">
          {validation.errors.length > 0 && (
            <ul className="list-disc pl-5 text-amber-300 text-sm space-y-1">
              {validation.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>
        {rows === null && (
          <button
            type="button"
            className="pollyanna-btn"
            disabled={!validation.ok}
            onClick={runDraw}
          >
            Draw names 🎲
          </button>
        )}
      </section>

      {rows !== null && (
        <section className="pollyanna-card p-4 space-y-3" aria-labelledby="results">
          <h2 id="results" className="pollyanna-heading text-2xl">
            Links
          </h2>
          <p className="text-amber-300 text-sm">
            Save these links now. If you lose them you&apos;ll need to redraw,
            which changes everyone&apos;s match.
          </p>
          <ul className="space-y-2">
            {rows.map((r) => (
              <li
                key={r.giver}
                className="flex items-center justify-between gap-2"
              >
                <span>
                  {r.giver}
                  {r.family ? ` (${r.family})` : ""}
                </span>
                <button
                  type="button"
                  className="pollyanna-btn pollyanna-btn-ghost"
                  onClick={() => copy(r.url, `Copied link for ${r.giver}.`)}
                >
                  Copy link
                </button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              className="pollyanna-btn pollyanna-btn-alt"
              onClick={() => copy(allLinksText(rows), "Copied all links.")}
            >
              Copy all
            </button>
            <button
              type="button"
              className="pollyanna-btn pollyanna-btn-alt"
              onClick={() => download(rows)}
            >
              Download backup (.txt)
            </button>
            <button type="button" className="pollyanna-btn" onClick={redraw}>
              Redraw
            </button>
          </div>
        </section>
      )}

      <div aria-live="polite" role="status" className="text-center text-sm text-amber-200 min-h-5">
        {status}
      </div>
    </main>
  );
}
