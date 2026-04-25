export const AGENTFORCE_PRICING = {
  basePricePerPack: 500,
  creditsPerPack: 100_000,
  maxDiscountPercent: 75,
  rateCardUrl: "https://www.salesforce.com/agentforce/rates/",
} as const;

export const ACTION_TYPE_CREDITS = {
  standard: 20,
  voice: 30,
} as const;

export type ActionType = keyof typeof ACTION_TYPE_CREDITS;

export interface Action {
  id: string;
  type: ActionType;
  label: string;
  credits: number;
}

export interface CalcParams {
  actions: Action[];
  datasetSize: number;
  interactionsPerMonth: number;
  overheadPct: number;
  pricePerPack: number;
}

export interface CalcResult {
  cpi: number;
  monthly: number;
  annualProd: number;
  overhead: number;
  total: number;
  packs: number;
  packsRounded: number;
  totalBought: number;
  cost: number;
}

export function compute(p: CalcParams): CalcResult {
  const cpi = p.actions.reduce((s, a) => s + (Number(a.credits) || 0), 0);
  const monthly = p.datasetSize * p.interactionsPerMonth * cpi;
  const annualProd = monthly * 12;
  const overhead = annualProd * (p.overheadPct / 100);
  const total = annualProd + overhead;
  const packs =
    AGENTFORCE_PRICING.creditsPerPack > 0
      ? total / AGENTFORCE_PRICING.creditsPerPack
      : 0;
  const packsRounded = Math.ceil(packs);
  const totalBought = packsRounded * AGENTFORCE_PRICING.creditsPerPack;
  const cost = packsRounded * p.pricePerPack;
  return { cpi, monthly, annualProd, overhead, total, packs, packsRounded, totalBought, cost };
}

const fmt = (n: number) => Math.round(n).toLocaleString();
const fmtD = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtUSD = (n: number) => "$" + Math.round(n).toLocaleString();

export interface SummaryParams {
  datasetSize: number;
  interactionsPerMonth: number;
  overheadPct: number;
  pricePerPack: number;
  discountPct: number;
}

export function buildSummary(
  actions: Action[],
  p: SummaryParams,
  r: CalcResult
): string {
  return [
    "AGENTFORCE FLEX CREDIT ESTIMATE",
    "=".repeat(42),
    `Generated: ${new Date().toLocaleDateString()}`,
    "",
    "AGENT ACTIONS",
    ...actions.map((a) => `  · ${a.label}: ${a.credits} credits`),
    `  Credits per interaction: ${r.cpi}`,
    "",
    "USAGE",
    `  Dataset size:          ${fmt(p.datasetSize)} records`,
    `  Interactions/month:    ${p.interactionsPerMonth} per record`,
    `  Dev overhead:          ${p.overheadPct}%`,
    "",
    "PRICING",
    `  Credits per pack:      ${fmt(AGENTFORCE_PRICING.creditsPerPack)}`,
    `  Price per pack:        $${p.pricePerPack}`,
    `  Volume discount:       ${p.discountPct}%`,
    "",
    "ANNUAL ESTIMATE",
    `  Monthly credits:       ${fmt(r.monthly)}`,
    `  Annual credits:        ${fmt(r.annualProd)}`,
    `  Dev overhead (+${p.overheadPct}%):    ${fmt(r.overhead)}`,
    `  Total credits:         ${fmt(r.total)}`,
    `  Packs needed:          ${fmtD(r.packs)}`,
    `  Packs to purchase:     ${r.packsRounded}`,
    `  Total credits bought:  ${fmt(r.totalBought)}`,
    `  ${"─".repeat(40)}`,
    `  ESTIMATED ANNUAL:      ${fmtUSD(r.cost)}`,
  ].join("\n");
}

export function downloadSummary(text: string, filename = "agentforce-estimate.txt") {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
