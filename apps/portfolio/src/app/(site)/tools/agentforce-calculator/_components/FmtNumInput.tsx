"use client";

import { useState } from "react";

interface FmtNumInputProps {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  ariaLabel?: string;
}

export function FmtNumInput({
  value,
  onChange,
  min = 0,
  ariaLabel,
}: FmtNumInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex items-stretch w-full bg-slate-900 border border-slate-600 rounded-lg overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-colors">
      <input
        type="text"
        inputMode="numeric"
        value={focused ? String(value) : value.toLocaleString()}
        aria-label={ariaLabel}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          const v = Number(e.target.value.replace(/,/g, ""));
          if (!Number.isNaN(v) && v >= min) onChange(v);
        }}
        className="flex-1 min-w-0 border-0 outline-none font-mono text-sm text-slate-100 bg-transparent px-3.5 py-2.5"
      />
    </div>
  );
}
