import { NextRequest, NextResponse } from "next/server";
import { db, surveys, workspaces, responses, eq, and, desc, count, sql } from "@npskit/db";
import { requireAuth } from "@/lib/auth-session";
import { z } from "zod";

export const dynamic = "force-dynamic";

async function getSurveyForUser(
  surveyId: string,
  userId: string
): Promise<(typeof surveys.$inferSelect) | null> {
  const rows = await db
    .select({
      survey: surveys,
      wsOwnerId: workspaces.ownerId,
    })
    .from(surveys)
    .innerJoin(workspaces, eq(surveys.workspaceId, workspaces.id))
    .where(eq(surveys.id, surveyId))
    .limit(1);

  const row = rows[0];
  if (!row || row.wsOwnerId !== userId) return null;
  return row.survey;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const { session, error } = await requireAuth();
  if (error) return error;

  const survey = await getSurveyForUser(params.id, session!.user!.id!);
  if (!survey) {
    return NextResponse.json({ error: "Survey not found" }, { status: 404 });
  }

  return NextResponse.json(survey);
}

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.enum(["nps", "csat"]).optional(),
  triggerType: z.enum(["time", "pageview", "manual"]).optional(),
  triggerValue: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  position: z
    .enum(["bottom-right", "bottom-left", "top-right", "top-left", "center"])
    .optional(),
  theme: z.enum(["light", "dark"]).optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  promptText: z.string().max(500).nullable().optional(),
  followUpText: z.string().max(500).nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const { session, error } = await requireAuth();
  if (error) return error;

  const survey = await getSurveyForUser(params.id, session!.user!.id!);
  if (!survey) {
    return NextResponse.json({ error: "Survey not found" }, { status: 404 });
  }

  const body: unknown = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const [updated] = await db
    .update(surveys)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(surveys.id, params.id))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const { session, error } = await requireAuth();
  if (error) return error;

  const survey = await getSurveyForUser(params.id, session!.user!.id!);
  if (!survey) {
    return NextResponse.json({ error: "Survey not found" }, { status: 404 });
  }

  await db.delete(surveys).where(eq(surveys.id, params.id));
  return NextResponse.json({ success: true });
}
