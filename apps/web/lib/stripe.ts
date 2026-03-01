import Stripe from "stripe";

// Lazy Stripe singleton — never throws at module load time
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key, {
      // stripe v17 compatible API version
      apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
    });
  }
  return _stripe;
}

export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    surveys: 1,
    responses: 50,
    priceId: null as string | null,
  },
  pro: {
    name: "Pro",
    price: 900,
    surveys: 3,
    responses: 1000,
    priceId: (process.env.STRIPE_PRO_PRICE_ID ?? null) as string | null,
  },
  business: {
    name: "Business",
    price: 2500,
    surveys: -1, // unlimited
    responses: -1, // unlimited
    priceId: (process.env.STRIPE_BUSINESS_PRICE_ID ?? null) as string | null,
  },
} as const;

export type PlanTier = keyof typeof PLANS;
