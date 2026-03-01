import { NextRequest, NextResponse } from "next/server";
import { db, surveys, responses, workspaces, eq, and } from "@npskit/db";
import { z } from "zod";
import { corsOk, corsJson, CORS_HEADERS } from "@/lib/cors";
import { isWithinResponseLimit } from "@/lib/tier";

export const dynamic = "force-dynamic";

// In-memory rate limit: surveyId:userIdentifier → last response timestamp
const rateLimit = new Map<string, number>();

const respondSchema = z.object({
  surveyId: z.string().min(1),
  score: z.number().int().min(0).max(10),
  followUpText: z.string().max(2000).optional(),
  userIdentifier: z.string().max(255).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function OPTIONS(): Promise<NextResponse> {
  return corsOk();
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await req.json();
    const parsed = respondSchema.safeParse(body);
    if (!parsed.success) {
      return corsJson({ error: "Invalid input" }, 400);
    }

    const { surveyId, score, followUpText, userIdentifier, metadata } =
      parsed.data;

    // Fetch survey
    const surveyRows = await db
      .select()
      .from(surveys)
      .where(eq(surveys.id, surveyId))
      .limit(1);

    const survey = surveyRows[0];
    if (!survey || !survey.isActive) {
      return corsJson({ error: "Survey not found or inactive" }, 404);
    }

    // Check response limit for workspace
    const withinLimit = await isWithinResponseLimit(survey.workspaceId);
    if (!withinLimit) {
      return corsJson({ error: "Response limit reached" }, 429);
    }

    // Rate limit: 1 response per userIdentifier per survey per 30 days
    if (userIdentifier) {
      const key = `${surveyId}:${userIdentifier}`;
      const lastTime = rateLimit.get(key);
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      if (lastTime && Date.now() - lastTime < thirtyDays) {
        return corsJson({ error: "Rate limit: already responded" }, 429);
      }
      rateLimit.set(key, Date.now());
    }

    // Validate score range for survey type
    if (survey.type === "csat" && (score < 1 || score > 5)) {
      return corsJson({ error: "CSAT score must be 1-5" }, 400);
    }
    if (survey.type === "nps" && (score < 0 || score > 10)) {
      return corsJson({ error: "NPS score must be 0-10" }, 400);
    }

    await db.insert(responses).values({
      surveyId,
      workspaceId: survey.workspaceId,
      score,
      followUpText: followUpText ?? null,
      metadata: metadata ?? null,
      userIdentifier: userIdentifier ?? null,
    });

    return corsJson({ success: true });
  } catch (err) {
    console.error("[respond]", err);
    return new NextResponse(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}
