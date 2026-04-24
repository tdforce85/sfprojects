"use client";

import { useState } from "react";

const BASE_PRICE = 500;
const CREDITS_PER_PACK = 100_000;
const STANDARD_CREDITS = 20;
const VOICE_CREDITS = 30;

type ActionType = "standard" | "voice" | "custom";

interface Action {
  name: string;
  type: ActionType;
  credits: number;
}

const TYPE_HELP: Record<ActionType, string> = {
  standard:
    "Most agent actions: query records, create/update records, run flows, search knowledge, call Apex, send emails, execute prompts",
  voice:
    "Actions during Agentforce Voice calls. Higher credit cost due to speech-to-text and text-to-speech processing. Note: orgs choose either Voice Actions or Voice Minutes metering — they cannot be combined",
  custom:
    "Enter a custom credit value for negotiated rates or future action types",
};

function creditsForType(type: ActionType, sandbox: boolean): number {
  if (type === "standard") return sandbox ? 16 : STANDARD_CREDITS;
  if (type === "voice") return sandbox ? 24 : VOICE_CREDITS;
  return 0;
}

export default function AgentforceCalculator() {
  const [isSandbox, setIsSandbox] = useState(false);
  const [actions, setActions] = useState<Action[]>([
    { name: "New Action", type: "standard", credits: STANDARD_CREDITS },
  ]);
  const [datasetSize, setDatasetSize] = useState(1000);
  const [interactionsPerMonth, setInteractionsPerMonth] = useState(1);
  const [devOverhead, setDevOverhead] = useState(15);
  const [costPerPack, setCostPerPack] = useState(BASE_PRICE);
  const [discount, setDiscount] = useState(0);

  const toggleSandbox = (sandbox: boolean) => {
    setIsSandbox(sandbox);
    setActions((prev) =>
      prev.map((a) =>
        a.type === "custom"
          ? a
          : { ...a, credits: creditsForType(a.type, sandbox) }
      )
    );
  };

  const addAction = () => {
    setActions((prev) => [
      ...prev,
      {
        name: "New Action",
        type: "standard",
        credits: creditsForType("standard", isSandbox),
      },
    ]);
  };

  const removeAction = (i: number) => {
    setActions((prev) => prev.filter((_, idx) => idx !== i));
  };

  const updateActionName = (i: number, name: string) => {
    setActions((prev) =>
      prev.map((a, idx) => (idx === i ? { ...a, name } : a))
    );
  };

  const updateActionType = (i: number, type: ActionType) => {
    setActions((prev) =>
      prev.map((a, idx) => {
        if (idx !== i) return a;
        const credits =
          type === "custom" ? a.credits : creditsForType(type, isSandbox);
        return { ...a, type, credits };
      })
    );
  };

  const updateActionCredits = (i: number, credits: number) => {
    setActions((prev) =>
      prev.map((a, idx) => (idx === i ? { ...a, credits } : a))
    );
  };

  const syncFromDiscount = (d: number) => {
    setDiscount(d);
    setCostPerPack(+(BASE_PRICE * (1 - d / 100)).toFixed(2));
  };

  const syncFromPrice = (price: number) => {
    const maxDiscountPrice = BASE_PRICE * 0.25;
    if (price < maxDiscountPrice) {
      setDiscount(75);
      setCostPerPack(maxDiscountPrice);
    } else if (price > BASE_PRICE) {
      setDiscount(0);
      setCostPerPack(BASE_PRICE);
    } else {
      setDiscount(Math.max(0, Math.round((1 - price / BASE_PRICE) * 100)));
      setCostPerPack(price);
    }
  };

  const creditsPerInteraction = actions.reduce(
    (s, a) => s + (a.credits || 0),
    0
  );
  const monthly = datasetSize * interactionsPerMonth * creditsPerInteraction;
  const annual = monthly * 12;
  const devCredits = Math.round((annual * devOverhead) / 100);
  const totalCredits = annual + devCredits;
  const packs = totalCredits / CREDITS_PER_PACK;
  const effectivePrice = Math.max(costPerPack, BASE_PRICE * 0.25);
  const totalCost = packs * effectivePrice;
  const listCost = packs * BASE_PRICE;
  const atMaxDiscount = discount >= 75;

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  const fmtUSD = (n: number) =>
    n.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });

  const inputClass =
    "w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold mb-2">
        Agentforce Flex Credit Calculator
      </h1>
      <p className="text-slate-400 mb-4 text-lg">
        Estimate annual Salesforce Agentforce flex credit cost for any use case
      </p>
      <p className="text-slate-400 text-sm max-w-2xl mb-6 leading-relaxed">
        Agentforce flex credits are the currency that powers AI agent
        interactions in Salesforce. Each agent action consumes a configurable
        number of credits, and your total spend depends on dataset size,
        interaction frequency, and which actions your agents perform. Use this
        tool to size a credit pack purchase before going to contract.
      </p>

      {/* Production / Sandbox toggle */}
      <div className="flex items-center gap-3 mb-8 flex-wrap">
        <span className="text-sm font-medium text-slate-300">Environment:</span>
        <div className="flex rounded-lg overflow-hidden border border-slate-600">
          <button
            onClick={() => toggleSandbox(false)}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${
              !isSandbox
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            Production
          </button>
          <button
            onClick={() => toggleSandbox(true)}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${
              isSandbox
                ? "bg-amber-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            Sandbox
          </button>
        </div>
        {isSandbox && (
          <span className="text-xs text-amber-400">
            Sandbox mode: 80% credit multiplier active (standard: 16 cr, voice:
            24 cr)
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Agent Actions */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4">Agent Actions</h2>

          <a
            href="https://www.salesforce.com/agentforce/rates/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-sm underline block mb-4"
          >
            Agentforce Rate Card ↗
          </a>

          <div className="space-y-3 mb-3">
            {actions.map((action, i) => (
              <div
                key={i}
                className="border border-slate-700/60 rounded-lg p-3 space-y-2"
              >
                <div className="flex items-start gap-2">
                  <input
                    value={action.name}
                    onChange={(e) => updateActionName(i, e.target.value)}
                    placeholder="e.g. Look up account"
                    className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => removeAction(i)}
                    aria-label="Remove action"
                    className="text-slate-500 hover:text-red-400 transition-colors px-1 leading-none mt-1 shrink-0"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={action.type}
                    onChange={(e) =>
                      updateActionType(i, e.target.value as ActionType)
                    }
                    className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="standard">Standard Action</option>
                    <option value="voice">Voice Action</option>
                    <option value="custom">Custom</option>
                  </select>
                  <input
                    type="number"
                    value={action.credits}
                    readOnly={action.type !== "custom"}
                    onChange={(e) =>
                      action.type === "custom" &&
                      updateActionCredits(i, parseInt(e.target.value) || 0)
                    }
                    className={`w-16 border rounded px-2 py-1 text-sm text-right ${
                      action.type === "custom"
                        ? "bg-slate-900 border-slate-600 text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        : "bg-slate-900/50 border-slate-700 text-slate-400 cursor-not-allowed"
                    }`}
                  />
                  <span className="text-xs text-slate-500 shrink-0">cr</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {TYPE_HELP[action.type]}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={addAction}
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors mb-3 block"
          >
            + Add Action
          </button>

          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Each action in your agent&apos;s topic configuration consumes
            credits independently. An agent that queries a record, searches
            knowledge, and sends an email = 3 standard actions = 60 credits per
            interaction.
          </p>

          <div className="text-sm text-slate-300 border-t border-slate-700 pt-3">
            Credits per interaction:{" "}
            <span className="font-bold text-blue-400">
              {creditsPerInteraction}
            </span>
          </div>
        </div>

        {/* Monthly Usage */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4">Monthly Usage Estimate</h2>

          <label className="block text-sm text-slate-400 mb-1">
            Dataset size (total records)
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={datasetSize}
            onChange={(e) => setDatasetSize(parseInt(e.target.value) || 0)}
            className={inputClass + " mb-4"}
          />

          <label className="block text-sm text-slate-400 mb-1">
            Interactions per record per month
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={interactionsPerMonth}
            onChange={(e) =>
              setInteractionsPerMonth(parseInt(e.target.value) || 0)
            }
            className={inputClass + " mb-4"}
          />

          <label className="block text-sm text-slate-400 mb-1">
            Dev / sandbox overhead %
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={devOverhead}
            onChange={(e) => setDevOverhead(parseInt(e.target.value) || 0)}
            className={inputClass}
          />
        </div>

        {/* Pricing */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4">Pricing</h2>

          <label className="block text-sm text-slate-400 mb-1">
            Credits per pack
          </label>
          <input
            type="number"
            value={CREDITS_PER_PACK}
            disabled
            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 mb-4 text-slate-500 cursor-not-allowed"
          />

          <label className="block text-sm text-slate-400 mb-1">
            List price per pack ($)
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={costPerPack}
            onChange={(e) => syncFromPrice(parseFloat(e.target.value) || 0)}
            className={inputClass + " mb-4"}
          />

          <label className="block text-sm text-slate-400 mb-1">
            Volume discount:{" "}
            <span className="text-slate-100 font-medium">{discount}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={75}
            value={discount}
            onChange={(e) => syncFromDiscount(+e.target.value)}
            className="w-full accent-blue-500"
          />
          {atMaxDiscount && (
            <p className="text-amber-400 text-xs mt-2">
              Maximum 75% discount applied. Contact Salesforce for pricing
              beyond this level.
            </p>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-xl font-semibold mb-6">Annual Estimate</h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div>
            <div className="text-xs text-slate-400 mb-1 uppercase tracking-wide">
              Monthly credits
            </div>
            <div className="text-2xl font-bold">{fmt(monthly)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1 uppercase tracking-wide">
              Annual (prod)
            </div>
            <div className="text-2xl font-bold">{fmt(annual)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1 uppercase tracking-wide">
              Dev overhead ({devOverhead}%)
            </div>
            <div className="text-2xl font-bold">+{fmt(devCredits)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1 uppercase tracking-wide">
              Total credits
            </div>
            <div className="text-2xl font-bold text-blue-400">
              {fmt(totalCredits)}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <div className="text-xs text-slate-400 mb-1 uppercase tracking-wide">
              Credit packs needed
            </div>
            <div className="text-2xl font-bold">{packs.toFixed(2)}</div>
          </div>
          {discount > 0 ? (
            <>
              <div>
                <div className="text-xs text-slate-400 mb-1 uppercase tracking-wide">
                  List cost
                </div>
                <div className="text-2xl font-bold text-slate-500 line-through">
                  {fmtUSD(listCost)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1 uppercase tracking-wide">
                  Discounted cost
                  <span className="text-green-400 ml-1">({discount}% off)</span>
                </div>
                <div className="text-2xl font-bold text-green-400">
                  {fmtUSD(totalCost)}
                </div>
              </div>
            </>
          ) : (
            <div className="sm:col-span-2">
              <div className="text-xs text-slate-400 mb-1 uppercase tracking-wide">
                Estimated annual cost
              </div>
              <div className="text-2xl font-bold text-green-400">
                {fmtUSD(totalCost)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
