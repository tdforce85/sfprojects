"use client";

import { useRef, useState } from "react";
import { AGENTFORCE_PRICING, MAX_DISCOUNT_PRICE } from "@/lib/pricing";

const STANDARD_CREDITS = 20;
const VOICE_CREDITS = 30;

type ActionType = "standard" | "voice" | "custom";

interface Action {
  id: string;
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

function creditsForType(type: ActionType): number {
  if (type === "standard") return STANDARD_CREDITS;
  if (type === "voice") return VOICE_CREDITS;
  return 0;
}

export default function AgentforceCalculator() {
  const [actions, setActions] = useState<Action[]>([
    { id: "initial", name: "New Action", type: "standard", credits: STANDARD_CREDITS },
  ]);
  const [datasetSize, setDatasetSize] = useState(1000);
  const [interactionsPerMonth, setInteractionsPerMonth] = useState(1);
  const [devOverhead, setDevOverhead] = useState(15);
  const [costPerPack, setCostPerPack] = useState<number>(
    AGENTFORCE_PRICING.basePricePerPack
  );
  const [discount, setDiscount] = useState(0);
  const nextIdRef = useRef(1);

  const addAction = () => {
    setActions((prev) => [
      ...prev,
      {
        id: `a${nextIdRef.current++}`,
        name: "New Action",
        type: "standard",
        credits: creditsForType("standard"),
      },
    ]);
  };

  const removeAction = (id: string) => {
    setActions((prev) => prev.filter((a) => a.id !== id));
  };

  const updateActionName = (id: string, name: string) => {
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, name } : a))
    );
  };

  const updateActionType = (id: string, type: ActionType) => {
    setActions((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const credits = type === "custom" ? a.credits : creditsForType(type);
        return { ...a, type, credits };
      })
    );
  };

  const updateActionCredits = (id: string, credits: number) => {
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, credits } : a))
    );
  };

  const syncFromDiscount = (d: number) => {
    setDiscount(d);
    setCostPerPack(
      +(AGENTFORCE_PRICING.basePricePerPack * (1 - d / 100)).toFixed(2)
    );
  };

  const syncFromPrice = (price: number) => {
    if (price < MAX_DISCOUNT_PRICE) {
      setDiscount(AGENTFORCE_PRICING.maxDiscountPercent);
      setCostPerPack(MAX_DISCOUNT_PRICE);
    } else if (price > AGENTFORCE_PRICING.basePricePerPack) {
      setDiscount(0);
      setCostPerPack(AGENTFORCE_PRICING.basePricePerPack);
    } else {
      setDiscount(
        Math.max(
          0,
          Math.round((1 - price / AGENTFORCE_PRICING.basePricePerPack) * 100)
        )
      );
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
  const packs = totalCredits / AGENTFORCE_PRICING.creditsPerPack;
  const effectivePrice = Math.max(costPerPack, MAX_DISCOUNT_PRICE);
  const totalCost = packs * effectivePrice;
  const listCost = packs * AGENTFORCE_PRICING.basePricePerPack;
  const atMaxDiscount = discount >= AGENTFORCE_PRICING.maxDiscountPercent;

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
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Agent Actions */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4">Agent Actions</h2>

          <a
            href={AGENTFORCE_PRICING.rateCardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-sm underline block mb-4"
          >
            Agentforce Rate Card ↗
          </a>

          <div className="space-y-3 mb-3">
            {actions.map((action) => (
              <div
                key={action.id}
                className="border border-slate-700/60 rounded-lg p-3 space-y-2"
              >
                <div className="flex items-start gap-2">
                  <input
                    aria-label="Action name"
                    value={action.name}
                    onChange={(e) => updateActionName(action.id, e.target.value)}
                    placeholder="e.g. Look up account"
                    className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => removeAction(action.id)}
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
                      updateActionType(action.id, e.target.value as ActionType)
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
                      updateActionCredits(action.id, parseInt(e.target.value) || 0)
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

          <label
            htmlFor="dataset-size"
            className="block text-sm text-slate-400 mb-1"
          >
            Dataset size (total records)
          </label>
          <input
            id="dataset-size"
            type="text"
            inputMode="numeric"
            value={datasetSize}
            onChange={(e) => setDatasetSize(parseInt(e.target.value) || 0)}
            className={inputClass + " mb-4"}
          />

          <label
            htmlFor="interactions-per-month"
            className="block text-sm text-slate-400 mb-1"
          >
            Interactions per record per month
          </label>
          <input
            id="interactions-per-month"
            type="text"
            inputMode="numeric"
            value={interactionsPerMonth}
            onChange={(e) =>
              setInteractionsPerMonth(parseInt(e.target.value) || 0)
            }
            className={inputClass + " mb-4"}
          />

          <label
            htmlFor="dev-overhead"
            className="block text-sm text-slate-400 mb-1"
          >
            Dev / sandbox overhead %
          </label>
          <input
            id="dev-overhead"
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

          <label
            htmlFor="credits-per-pack"
            className="block text-sm text-slate-400 mb-1"
          >
            Credits per pack
          </label>
          <input
            id="credits-per-pack"
            type="number"
            value={AGENTFORCE_PRICING.creditsPerPack}
            disabled
            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 mb-4 text-slate-500 cursor-not-allowed"
          />

          <label
            htmlFor="cost-per-pack"
            className="block text-sm text-slate-400 mb-1"
          >
            List price per pack ($)
          </label>
          <input
            id="cost-per-pack"
            type="text"
            inputMode="decimal"
            value={costPerPack}
            onChange={(e) => syncFromPrice(parseFloat(e.target.value) || 0)}
            className={inputClass + " mb-4"}
          />

          <label
            htmlFor="volume-discount"
            className="block text-sm text-slate-400 mb-1"
          >
            Volume discount:{" "}
            <span className="text-slate-100 font-medium">{discount}%</span>
          </label>
          <input
            id="volume-discount"
            type="range"
            min={0}
            max={AGENTFORCE_PRICING.maxDiscountPercent}
            value={discount}
            onChange={(e) => syncFromDiscount(+e.target.value)}
            className="w-full accent-blue-500"
          />
          {atMaxDiscount && (
            <p className="text-amber-400 text-xs mt-2">
              Maximum {AGENTFORCE_PRICING.maxDiscountPercent}% discount applied.
              Contact Salesforce for pricing beyond this level.
            </p>
          )}
        </div>
      </div>

    </div>
  );
}
