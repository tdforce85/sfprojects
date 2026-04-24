export const AGENTFORCE_PRICING = {
  basePricePerPack: 500,
  creditsPerPack: 100_000,
  maxDiscountPercent: 75,
  rateCardUrl: "https://www.salesforce.com/agentforce/rates/",
} as const;

export const MAX_DISCOUNT_PRICE =
  AGENTFORCE_PRICING.basePricePerPack *
  (1 - AGENTFORCE_PRICING.maxDiscountPercent / 100);
