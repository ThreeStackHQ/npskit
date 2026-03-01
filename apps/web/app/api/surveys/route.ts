import { NextRequest, NextResponse } from "next/server";
import { db, surveys, workspaces, eq } from "@npskit/db";
import { requireAuth } from "@/lib/auth-session";
import { canCreateSurvey } from "@/lib/tier";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  workspaceId: z.string().min(1),
  type: z.enum(["nps", "csat"]).default("nps"),
  name: z.string().min(1).max(200),
  triggerType: z.enum(["time", "pageview", "manual"]).default("time"),
  triggerValue: z.number().int().min(0).default(3),
  position: z
    .enum(["bottom-right", "bottom-left", "top-right", "top-left", "center"])
    .default("bottom-right"),
  theme: z.enum(["light", "dark"]).default("dark"),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#0ea5e9"),
  promptText: z.string().max(500).nullable().optional(),
  followUpText: z.string().max(500).nullable().optional(),
});

async function getWorkspaceIdForUser(
  userId: string,
  workspaceId: string
): Promise<boolean> {
  const rows = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);
  return rows[0]?.id === workspaceId && rows[0] !== undefined;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { session, error } = await requireAuth();
  if (error) return error;

  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  // Verify ownership
  const ws = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!ws[0]) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const rows = await db
    .select()
    .from(surveys)
    .where(eq(surveys.workspaceId, workspaceId));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body: unknown = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { workspaceId } = parsed.data;

  // Verify workspace ownership
  const ws = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!ws[0] || ws[0].ownerId !== session!.user!.id!) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  // Check tier limits
  const allowed = await canCreateSurvey(workspaceId);
  if (!allowed) {
    return NextResponse.json(
      { error: "Survey limit reached. Upgrade your plan." },
      { status: 403 }
    );
  }

  const [survey] = await db
    .insert(surveys)
    .values({
      workspaceId,
      type: parsed.data.type,
      name: parsed.data.name,
      triggerType: parsed.data.triggerType,
      triggerValue: parsed.data.triggerValue,
      position: parsed.data.position,
      theme: parsed.data.theme,
      primaryColor: parsed.data.primaryColor,
      promptText: parsed.data.promptText ?? null,
      followUpText: parsed.data.followUpText ?? null,
    })
    .returning();

  return NextResponse.json(survey, { status: 201 });
}
