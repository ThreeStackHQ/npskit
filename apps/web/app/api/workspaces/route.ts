import { NextRequest, NextResponse } from "next/server";
import { db, workspaces, subscriptions, eq } from "@npskit/db";
import { requireAuth } from "@/lib/auth-session";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(1).max(100),
});

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const { session, error } = await requireAuth();
  if (error) return error;

  const rows = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.ownerId, session!.user!.id!));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body: unknown = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const userId = session!.user!.id!;

  // Check tier — free users get 1 workspace
  const existing = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.ownerId, userId));

  if (existing.length >= 1) {
    // For now, limit to 1 workspace (upgrade flow for more)
    return NextResponse.json(
      { error: "Upgrade to create multiple workspaces" },
      { status: 403 }
    );
  }

  let slug = slugify(parsed.data.name);
  const existingSlug = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.slug, slug))
    .limit(1);

  if (existingSlug.length > 0) {
    slug = `${slug}-${createId().slice(0, 6)}`;
  }

  const [ws] = await db
    .insert(workspaces)
    .values({ name: parsed.data.name, slug, ownerId: userId })
    .returning();

  if (!ws) {
    return NextResponse.json({ error: "Failed to create workspace" }, { status: 500 });
  }

  await db.insert(subscriptions).values({
    workspaceId: ws.id,
    tier: "free",
    status: "active",
  });

  return NextResponse.json(ws, { status: 201 });
}
