import { NextRequest, NextResponse } from "next/server";
import { db, surveys, workspaces, eq, and } from "@npskit/db";
import { corsOk, corsJson } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS(): Promise<NextResponse> {
  return corsOk();
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const { id } = params;
  const apiKey =
    req.headers.get("x-api-key") ??
    req.nextUrl.searchParams.get("apiKey") ??
    "";

  if (!apiKey) {
    return corsJson({ error: "API key required" }, 401);
  }

  // Validate API key belongs to a workspace
  const wsRows = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.apiKey, apiKey))
    .limit(1);

  const ws = wsRows[0];
  if (!ws) {
    return corsJson({ error: "Invalid API key" }, 401);
  }

  // Fetch survey belonging to that workspace
  const surveyRows = await db
    .select()
    .from(surveys)
    .where(and(eq(surveys.id, id), eq(surveys.workspaceId, ws.id)))
    .limit(1);

  const survey = surveyRows[0];
  if (!survey) {
    return corsJson({ error: "Survey not found" }, 404);
  }

  return corsJson({
    id: survey.id,
    type: survey.type,
    name: survey.name,
    triggerType: survey.triggerType,
    triggerValue: survey.triggerValue,
    isActive: survey.isActive,
    position: survey.position,
    theme: survey.theme,
    primaryColor: survey.primaryColor,
    promptText: survey.promptText,
    followUpText: survey.followUpText,
  });
}
