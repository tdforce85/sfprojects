"use client";

import { useState } from "react";

interface StepperProps {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  ariaLabel?: string;
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  step = 1,
  ariaLabel,
}: StepperProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const display = draft !== null ? draft : String(value);

  const dec = () => {
    setDraft(null);
    onChange(Math.max(min, +(value - step).toFixed(10)));
  };
  const inc = () => {
    setDraft(null);
    onChange(Math.min(max, +(value + step).toFixed(10)));
  };

  const commit = () => {
    if (draft === null) return;
    const raw = draft.replace(/,/g, "").trim();
    if (raw === "") {
      onChange(min);
    } else {
      const v = Number(raw);
      if (!Number.isNaN(v)) {
        onChange(Math.max(min, Math.min(max, v)));
      }
    }
    setDraft(null);
  };

  return (
    <div className="flex items-stretch w-full bg-slate-900 border border-slate-600 rounded-lg overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-colors">
      <button
        type="button"
        onClick={dec}
        aria-label="Decrement"
        className="w-9 bg-slate-600 text-slate-200 hover:bg-slate-500 hover:text-white transition-colors flex items-center justify-center text-base shrink-0"
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={display}
        aria-label={ariaLabel}
        onChange={(e) => {
          const next = e.target.value;
          setDraft(next);
          const raw = next.replace(/,/g, "").trim();
          if (raw === "") return;
          const v = Number(raw);
          if (!Number.isNaN(v) && v >= min && v <= max) {
            onChange(v);
          }
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className="flex-1 min-w-0 border-0 outline-none text-center font-mono text-sm text-slate-100 bg-transparent px-1.5 py-2.5"
      />
      <button
        type="button"
        onClick={inc}
        aria-label="Increment"
        className="w-9 bg-slate-600 text-slate-200 hover:bg-slate-500 hover:text-white transition-colors flex items-center justify-center text-base shrink-0"
      >
        +
      </button>
    </div>
  );
}
