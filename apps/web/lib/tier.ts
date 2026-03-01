import { db, subscriptions, surveys, responses, eq, and, gte } from "@npskit/db";
import { PLANS, type PlanTier } from "./stripe";

export async function getUserTier(workspaceId: string): Promise<PlanTier> {
  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.workspaceId, workspaceId))
    .limit(1);

  const sub = rows[0];
  if (!sub || sub.status !== "active") return "free";
  return sub.tier as PlanTier;
}

export async function canCreateSurvey(workspaceId: string): Promise<boolean> {
  const tier = await getUserTier(workspaceId);
  const limit = PLANS[tier].surveys;
  if (limit === -1) return true;

  const rows = await db
    .select()
    .from(surveys)
    .where(eq(surveys.workspaceId, workspaceId));

  return rows.length < limit;
}

export async function isWithinResponseLimit(workspaceId: string): Promise<boolean> {
  const tier = await getUserTier(workspaceId);
  const limit = PLANS[tier].responses;
  if (limit === -1) return true;

  // Count responses in current calendar month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const rows = await db
    .select()
    .from(responses)
    .where(
      and(
        eq(responses.workspaceId, workspaceId),
        gte(responses.respondedAt, startOfMonth)
      )
    );

  return rows.length < limit;
}
