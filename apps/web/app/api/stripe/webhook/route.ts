import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { db, subscriptions, eq } from "@npskit/db";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe/webhook] Invalid signature:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const workspaceId = session.metadata?.["workspaceId"];
        const tier = session.metadata?.["tier"] as "pro" | "business" | undefined;
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id ?? null;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id ?? null;

        if (workspaceId && tier) {
          // Fetch subscription for period end
          let periodEnd: Date | null = null;
          if (subscriptionId) {
            const stripeSub = await getStripe().subscriptions.retrieve(subscriptionId);
            periodEnd = new Date(stripeSub.current_period_end * 1000);
          }

          await db
            .update(subscriptions)
            .set({
              tier,
              status: "active",
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              currentPeriodEnd: periodEnd,
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.workspaceId, workspaceId));
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const workspaceId = sub.metadata?.["workspaceId"];
        const periodEnd = new Date(sub.current_period_end * 1000);

        if (workspaceId) {
          await db
            .update(subscriptions)
            .set({
              status: sub.status as "active" | "canceled" | "past_due" | "trialing",
              currentPeriodEnd: periodEnd,
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.workspaceId, workspaceId));
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const workspaceId = sub.metadata?.["workspaceId"];

        if (workspaceId) {
          await db
            .update(subscriptions)
            .set({
              tier: "free",
              status: "canceled",
              stripeSubscriptionId: null,
              currentPeriodEnd: null,
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.workspaceId, workspaceId));
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[stripe/webhook] Handler error:", err);
    return NextResponse.json({ error: "Webhook handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
