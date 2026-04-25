"use client";

import { useRef, useState } from "react";
import {
  ACTION_TYPE_CREDITS,
  AGENTFORCE_PRICING,
  buildSummary,
  compute,
  downloadSummary,
  type Action,
  type ActionType,
} from "@/lib/pricing";
import { Stepper } from "./_components/Stepper";
import { FmtNumInput } from "./_components/FmtNumInput";

export default function AgentforceCalculator() {
  const [actions, setActions] = useState<Action[]>([
    {
      id: "initial",
      type: "standard",
      label: "New Action",
      credits: ACTION_TYPE_CREDITS.standard,
    },
  ]);
  const [datasetSize, setDatasetSize] = useState(1000);
  const [interactionsPerMonth, setInteractionsPerMonth] = useState(1);
  const [overheadPct, setOverheadPct] = useState(15);
  const [discountPct, setDiscountPct] = useState(0);
  const [notice, setNotice] = useState<"" | "copied" | "saved">("");
  const nextIdRef = useRef(1);

  const effectivePrice = +(
    AGENTFORCE_PRICING.basePricePerPack *
    (1 - discountPct / 100)
  ).toFixed(2);

  const handlePriceChange = (price: number) => {
    const pct = Math.max(
      0,
      Math.min(
        AGENTFORCE_PRICING.maxDiscountPercent,
        +((1 - price / AGENTFORCE_PRICING.basePricePerPack) * 100).toFixed(1)
      )
    );
    setDiscountPct(pct);
  };

  const addAction = () =>
    setActions((prev) => [
      ...prev,
      {
        id: `a${nextIdRef.current++}`,
        type: "standard",
        label: "New Action",
        credits: ACTION_TYPE_CREDITS.standard,
      },
    ]);

  const removeAction = (id: string) =>
    setActions((prev) => prev.filter((a) => a.id !== id));

  const setActionType = (id: string, type: ActionType) =>
    setActions((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, type, credits: ACTION_TYPE_CREDITS[type] } : a
      )
    );

  const setActionLabel = (id: string, label: string) =>
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, label } : a))
    );

  const r = compute({
    actions,
    datasetSize,
    interactionsPerMonth,
    overheadPct,
    pricePerPack: effectivePrice,
  });

  const summaryParams = {
    datasetSize,
    interactionsPerMonth,
    overheadPct,
    pricePerPack: effectivePrice,
    discountPct,
  };

  const flashNotice = (kind: "copied" | "saved") => {
    setNotice(kind);
    setTimeout(() => setNotice(""), 2500);
  };

  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildSummary(actions, summaryParams, r));
      flashNotice("copied");
    } catch {
      // clipboard unavailable — silent
    }
  };

  const doDownload = () => {
    downloadSummary(buildSummary(actions, summaryParams, r));
    flashNotice("saved");
  };

  const fmt = (n: number) => Math.round(n).toLocaleString();
  const fmtD = (n: number) =>
    n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const fmtUSD = (n: number) => "$" + Math.round(n).toLocaleString();

  const atMaxDiscount = discountPct >= AGENTFORCE_PRICING.maxDiscountPercent;

  const expBtn =
    "px-3.5 py-2 rounded-md bg-slate-700 border border-slate-600 text-slate-400 text-xs font-medium hover:bg-slate-600 hover:text-slate-100 transition-colors whitespace-nowrap";
  const expBtnLit =
    "px-3.5 py-2 rounded-md bg-green-400/10 border border-green-400/40 text-green-400 text-xs font-medium whitespace-nowrap";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-semibold mb-2">
        Agentforce Flex Credit Calculator
      </h1>
      <p className="text-slate-400 mb-4 text-base">
        Estimate annual Salesforce Agentforce flex credit cost for any use case
      </p>
      <p className="text-slate-400 text-sm max-w-2xl mb-10 leading-relaxed">
        Agentforce flex credits are the currency that powers AI agent
        interactions in Salesforce. Each agent action consumes a configurable
        number of credits, and your total spend depends on dataset size,
        interaction frequency, and which actions your agents perform. Use this
        tool to size a credit pack purchase before going to contract.
      </p>

      <div className="flex items-center gap-2 mb-8 px-4 py-2.5 rounded-lg bg-amber-950/40 border border-amber-800/50 text-amber-300/80 text-sm">
        🔨 Completion: <code className="font-mono">NaN%</code> — this tool is still figuring itself out, much like the rest of us.
      </div>

      {/* Results */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 sm:p-7 mb-5">
        <div className="flex items-start justify-between gap-5 flex-wrap mb-5">
          <div>
            <div className="text-[10px] font-semibold tracking-widest uppercase text-slate-400 mb-2">
              Estimated Annual Cost
            </div>
            <div className="font-mono text-4xl sm:text-5xl font-medium text-green-400 leading-none tracking-tight">
              {fmtUSD(r.cost)}
            </div>
            <div className="text-xs text-slate-400 mt-2">
              {r.cpi} credits per interaction · {fmtD(r.packs)} packs needed (
              {r.packsRounded} to purchase)
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={doCopy}
              className={notice === "copied" ? expBtnLit : expBtn}
            >
              {notice === "copied" ? "✓ Copied" : "Copy summary"}
            </button>
            <button
              type="button"
              onClick={doDownload}
              className={notice === "saved" ? expBtnLit : expBtn}
            >
              {notice === "saved" ? "✓ Saved" : "Download .txt"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border-t border-slate-700 pt-5">
          {[
            { label: "Monthly Credits", val: fmt(r.monthly) },
            { label: "Annual Credits", val: fmt(r.annualProd) },
            {
              label: `Dev Overhead (${overheadPct}%)`,
              val: "+" + fmt(r.overhead),
            },
            { label: "Total Credits", val: fmt(r.total) },
            {
              label: "Total Credits Bought",
              val: fmt(r.totalBought),
              accent: true,
            },
          ].map(({ label, val, accent }, i, arr) => (
            <div
              key={label}
              className={`pr-5 ${
                i < arr.length - 1
                  ? "lg:border-r lg:border-slate-700"
                  : ""
              }`}
            >
              <div className="text-[10px] font-semibold tracking-wider uppercase text-slate-500 mb-1.5">
                {label}
              </div>
              <div
                className={`font-mono text-lg font-medium ${
                  accent ? "text-blue-400" : "text-slate-100"
                }`}
              >
                {val}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Agent Actions */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-sm font-semibold mb-4">Agent Actions</h2>

          <div className="divide-y divide-slate-700">
            {actions.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-2 py-2.5 first:pt-0 last:pb-0"
              >
                <span
                  className={`font-mono text-[11px] font-medium px-2 py-0.5 rounded shrink-0 ${
                    a.type === "voice"
                      ? "bg-violet-400/15 text-violet-300"
                      : "bg-blue-400/15 text-blue-400"
                  }`}
                >
                  {a.credits}cr
                </span>
                <select
                  aria-label="Action type"
                  value={a.type}
                  onChange={(e) =>
                    setActionType(a.id, e.target.value as ActionType)
                  }
                  className="w-[110px] shrink-0 bg-slate-900 border border-slate-600 rounded-md px-2.5 py-2 text-[13px] text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="standard">Standard</option>
                  <option value="voice">Voice</option>
                </select>
                <input
                  aria-label="Action label"
                  value={a.label}
                  onChange={(e) => setActionLabel(a.id, e.target.value)}
                  placeholder="Label"
                  className="flex-1 min-w-0 bg-slate-900 border border-slate-600 rounded-md px-2.5 py-2 text-[13px] text-slate-100 focus:outline-none focus:border-blue-500"
                />
                {actions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAction(a.id)}
                    aria-label="Remove action"
                    className="text-slate-500 hover:text-red-400 text-lg leading-none px-1 shrink-0 transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addAction}
            className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-xs font-medium mt-3 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
              <path d="M6 1a.75.75 0 0 1 .75.75v3.5h3.5a.75.75 0 0 1 0 1.5h-3.5v3.5a.75.75 0 0 1-1.5 0v-3.5h-3.5a.75.75 0 0 1 0-1.5h3.5v-3.5A.75.75 0 0 1 6 1z" />
            </svg>
            Add action
          </button>

          <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
            Each action in your agent&apos;s topic configuration consumes
            credits independently. An agent that queries a record, searches
            knowledge, and sends an email = 3 standard actions = 60 credits per
            interaction.{" "}
            <a
              href={AGENTFORCE_PRICING.rateCardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              See the Agentforce rate card ↗
            </a>
          </p>
        </div>

        {/* Monthly Usage */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-sm font-semibold mb-4">Monthly Usage Estimate</h2>

          <div className="divide-y divide-slate-700">
            <div className="py-2.5 first:pt-0">
              <div className="text-xs text-slate-400 mb-1.5">
                Dataset size (total records)
              </div>
              <FmtNumInput
                value={datasetSize}
                onChange={setDatasetSize}
                min={0}
                ariaLabel="Dataset size"
              />
            </div>

            <div className="py-2.5">
              <div className="text-xs text-slate-400 mb-1.5">
                Interactions per record per month
              </div>
              <Stepper
                value={interactionsPerMonth}
                onChange={setInteractionsPerMonth}
                min={0}
                step={1}
                ariaLabel="Interactions per month"
              />
            </div>

            <div className="py-2.5 last:pb-0">
              <div className="text-xs text-slate-400 mb-1.5">
                Dev / sandbox overhead %
              </div>
              <Stepper
                value={overheadPct}
                onChange={setOverheadPct}
                min={0}
                step={1}
                ariaLabel="Dev overhead percent"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-sm font-semibold mb-4">Pricing</h2>

          <div className="divide-y divide-slate-700">
            <div className="py-2.5 first:pt-0">
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-xs text-slate-400">Credits per pack</span>
                <span className="text-[11px] text-slate-500">locked</span>
              </div>
              <div className="flex items-stretch w-full bg-slate-900 border border-slate-600 rounded-lg overflow-hidden opacity-50">
                <input
                  type="text"
                  value={AGENTFORCE_PRICING.creditsPerPack.toLocaleString()}
                  readOnly
                  aria-label="Credits per pack (locked)"
                  className="flex-1 min-w-0 border-0 outline-none font-mono text-sm text-slate-100 bg-transparent px-3.5 py-2.5 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="py-2.5">
              <div className="text-xs text-slate-400 mb-1.5">
                List price per pack ($)
              </div>
              <Stepper
                value={effectivePrice}
                onChange={handlePriceChange}
                min={125}
                max={500}
                step={1}
                ariaLabel="List price per pack"
              />
            </div>

            <div className="py-2.5 last:pb-0">
              <div className="text-xs text-slate-400 mb-1.5">
                Volume discount %
              </div>
              <Stepper
                value={discountPct}
                onChange={setDiscountPct}
                min={0}
                max={AGENTFORCE_PRICING.maxDiscountPercent}
                step={1}
                ariaLabel="Volume discount percent"
              />
              {atMaxDiscount && (
                <p className="text-amber-400 text-[11px] mt-2">
                  Maximum {AGENTFORCE_PRICING.maxDiscountPercent}% discount
                  applied. If you think you&apos;re getting more, teach me your
                  negotiating magic.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 text-center mt-5">
        Estimate only · Does not include platform licensing or overage fees
      </p>
    </div>
  );
}
