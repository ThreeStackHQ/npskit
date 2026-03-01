import { NextRequest, NextResponse } from "next/server";
import { db, surveys, responses, workspaces, eq, and, gte, sql } from "@npskit/db";
import { requireAuth } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

async function surveyBelongsToUser(
  surveyId: string,
  userId: string
): Promise<string | null> {
  const rows = await db
    .select({ surveyType: surveys.type })
    .from(surveys)
    .innerJoin(workspaces, eq(surveys.workspaceId, workspaces.id))
    .where(and(eq(surveys.id, surveyId), eq(workspaces.ownerId, userId)))
    .limit(1);
  return rows[0]?.surveyType ?? null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const { session, error } = await requireAuth();
  if (error) return error;

  const surveyType = await surveyBelongsToUser(params.id, session!.user!.id!);
  if (!surveyType) {
    return NextResponse.json({ error: "Survey not found" }, { status: 404 });
  }

  const allResponses = await db
    .select({ score: responses.score, respondedAt: responses.respondedAt })
    .from(responses)
    .where(eq(responses.surveyId, params.id));

  const total = allResponses.length;
  let npsScore: number | null = null;
  let promoters = 0;
  let passives = 0;
  let detractors = 0;
  let avgCsat: number | null = null;

  if (total > 0) {
    if (surveyType === "nps") {
      for (const r of allResponses) {
        if (r.score >= 9) promoters++;
        else if (r.score >= 7) passives++;
        else detractors++;
      }
      npsScore = Math.round(
        ((promoters - detractors) / total) * 100
      );
    } else {
      const sum = allResponses.reduce((acc, r) => acc + r.score, 0);
      avgCsat = Math.round((sum / total) * 10) / 10;
    }
  }

  // Trend: last 90 days by week
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const recentResponses = allResponses.filter(
    (r) => r.respondedAt >= ninetyDaysAgo
  );

  // Group by ISO week
  const weekMap = new Map<string, { total: number; promoters: number; detractors: number; scores: number[] }>();
  for (const r of recentResponses) {
    const date = new Date(r.respondedAt);
    // Get Monday of week
    const day = date.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + diff);
    const weekKey = monday.toISOString().slice(0, 10);

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, { total: 0, promoters: 0, detractors: 0, scores: [] });
    }
    const week = weekMap.get(weekKey)!;
    week.total++;
    week.scores.push(r.score);
    if (r.score >= 9) week.promoters++;
    else if (r.score <= 6) week.detractors++;
  }

  const trend = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, data]) => ({
      week,
      total: data.total,
      nps:
        surveyType === "nps"
          ? Math.round(((data.promoters - data.detractors) / data.total) * 100)
          : null,
      avgScore:
        surveyType === "csat"
          ? Math.round((data.scores.reduce((a, b) => a + b, 0) / data.scores.length) * 10) / 10
          : null,
    }));

  return NextResponse.json({
    total,
    npsScore,
    avgCsat,
    promoters,
    passives,
    detractors,
    promoterPct: total > 0 ? Math.round((promoters / total) * 100) : 0,
    passivePct: total > 0 ? Math.round((passives / total) * 100) : 0,
    detractorPct: total > 0 ? Math.round((detractors / total) * 100) : 0,
    trend,
  });
}
