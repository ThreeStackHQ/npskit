import { NextRequest, NextResponse } from "next/server";
import { db, surveys, responses, workspaces, eq, and, gte, lte, desc } from "@npskit/db";
import { requireAuth } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

async function surveyBelongsToUser(
  surveyId: string,
  userId: string
): Promise<boolean> {
  const rows = await db
    .select({ id: workspaces.id })
    .from(surveys)
    .innerJoin(workspaces, eq(surveys.workspaceId, workspaces.id))
    .where(and(eq(surveys.id, surveyId), eq(workspaces.ownerId, userId)))
    .limit(1);
  return rows.length > 0;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const { session, error } = await requireAuth();
  if (error) return error;

  const owned = await surveyBelongsToUser(params.id, session!.user!.id!);
  if (!owned) {
    return NextResponse.json({ error: "Survey not found" }, { status: 404 });
  }

  const url = req.nextUrl;
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, parseInt(url.searchParams.get("limit") ?? "50", 10));
  const offset = (page - 1) * limit;
  const minScore = url.searchParams.get("minScore");
  const maxScore = url.searchParams.get("maxScore");

  const conditions = [eq(responses.surveyId, params.id)];
  if (minScore !== null) {
    conditions.push(gte(responses.score, parseInt(minScore, 10)));
  }
  if (maxScore !== null) {
    conditions.push(lte(responses.score, parseInt(maxScore, 10)));
  }

  const rows = await db
    .select()
    .from(responses)
    .where(and(...conditions))
    .orderBy(desc(responses.respondedAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ data: rows, page, limit });
}
