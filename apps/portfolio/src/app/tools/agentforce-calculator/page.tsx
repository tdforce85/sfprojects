"use client";

import { useState } from "react";

const BASE_PRICE = 500;
const CREDITS_PER_PACK = 100_000;

interface Action {
  name: string;
  credits: number;
}

export default function AgentforceCalculator() {
  const [actions, setActions] = useState<Action[]>([
    { name: "New Action", credits: 20 },
  ]);
  const [rateCardCost, setRateCardCost] = useState(20);
  const [datasetSize, setDatasetSize] = useState(1000);
  const [interactionsPerMonth, setInteractionsPerMonth] = useState(1);
  const [devOverhead, setDevOverhead] = useState(15);
  const [costPerPack, setCostPerPack] = useState(BASE_PRICE);
  const [discount, setDiscount] = useState(0);

  const updateRateCard = (rate: number) => {
    setRateCardCost(rate);
    setActions((prev) => prev.map((a) => ({ ...a, credits: rate })));
  };

  const addAction = () => {
    setActions((prev) => [
      ...prev,
      { name: "New Action", credits: rateCardCost },
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
      <p className="text-slate-400 text-sm max-w-2xl mb-10 leading-relaxed">
        Agentforce flex credits are the currency that powers AI agent
        interactions in Salesforce. Each agent action consumes a configurable
        number of credits, and your total spend depends on dataset size,
        interaction frequency, and which actions your agents perform. Use this
        tool to size a credit pack purchase before going to contract.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Agent Actions */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4">Agent Actions</h2>

          <label className="block text-sm text-slate-400 mb-1">
            Cost Per Action
          </label>
          <input
            type="number"
            value={rateCardCost}
            min={0}
            onChange={(e) => updateRateCard(+e.target.value || 0)}
            className={inputClass + " mb-2"}
          />
          <a
            href="https://www.salesforce.com/agentforce/rates/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-sm underline block mb-4"
          >
            Agentforce Rate Card ↗
          </a>

          <table className="w-full text-sm mb-3">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="text-left pb-2 font-medium">Action Name</th>
                <th className="text-right pb-2 pr-2 font-medium">Credits</th>
                <th className="pb-2 w-6"></th>
              </tr>
            </thead>
            <tbody>
              {actions.map((action, i) => (
                <tr key={i} className="border-b border-slate-700/40">
                  <td className="py-1.5 pr-2">
                    <input
                      value={action.name}
                      onChange={(e) => updateActionName(i, e.target.value)}
                      className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      value={action.credits}
                      readOnly
                      className="w-20 bg-slate-900/50 border border-slate-700 rounded px-2 py-1 text-slate-500 text-sm text-right cursor-not-allowed"
                    />
                  </td>
                  <td className="py-1.5">
                    <button
                      onClick={() => removeAction(i)}
                      aria-label="Remove action"
                      className="text-slate-500 hover:text-red-400 transition-colors px-1 leading-none"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={addAction}
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors mb-4"
          >
            + Add Action
          </button>

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
            type="number"
            value={datasetSize}
            min={0}
            onChange={(e) => setDatasetSize(+e.target.value || 0)}
            className={inputClass + " mb-4"}
          />

          <label className="block text-sm text-slate-400 mb-1">
            Interactions per record per month
          </label>
          <input
            type="number"
            value={interactionsPerMonth}
            min={0}
            step={1}
            onChange={(e) => setInteractionsPerMonth(+e.target.value || 0)}
            className={inputClass + " mb-4"}
          />

          <label className="block text-sm text-slate-400 mb-1">
            Dev / sandbox overhead %
          </label>
          <input
            type="number"
            value={devOverhead}
            min={0}
            max={100}
            onChange={(e) => setDevOverhead(+e.target.value || 0)}
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
            type="number"
            value={costPerPack}
            min={0}
            step={0.01}
            onChange={(e) => syncFromPrice(+e.target.value || 0)}
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
              {discount > 0 && (
                <span className="text-green-400 ml-1">({discount}% off)</span>
              )}
            </div>
            <div className="text-2xl font-bold text-green-400">
              {fmtUSD(totalCost)}
            </div>
            {discount === 0 && (
              <div className="text-xs text-slate-500 mt-1">
                No discount applied
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
