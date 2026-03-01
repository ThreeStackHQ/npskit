import { NextRequest, NextResponse } from "next/server";
import { getStripe, PLANS, type PlanTier } from "@/lib/stripe";
import { db, workspaces, subscriptions, eq, and } from "@npskit/db";
import { requireAuth } from "@/lib/auth-session";
import { z } from "zod";

export const dynamic = "force-dynamic";

const checkoutSchema = z.object({
  workspaceId: z.string().min(1),
  tier: z.enum(["pro", "business"]),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body: unknown = await req.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { workspaceId, tier } = parsed.data;

  // Verify workspace ownership
  const ws = await db
    .select()
    .from(workspaces)
    .where(and(eq(workspaces.id, workspaceId), eq(workspaces.ownerId, session!.user!.id!)))
    .limit(1);

  if (!ws[0]) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const plan = PLANS[tier as PlanTier];
  if (!plan.priceId) {
    return NextResponse.json({ error: "Price not configured" }, { status: 500 });
  }

  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Get or create Stripe customer
  const subRows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.workspaceId, workspaceId))
    .limit(1);

  let customerId = subRows[0]?.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session!.user!.email ?? undefined,
      metadata: { workspaceId },
    });
    customerId = customer.id;
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: plan.priceId, quantity: 1 }],
    mode: "subscription",
    success_url: `${appUrl}/dashboard?upgraded=1`,
    cancel_url: `${appUrl}/dashboard/settings/billing`,
    metadata: { workspaceId, tier },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
