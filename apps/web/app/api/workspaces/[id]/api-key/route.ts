import { NextRequest, NextResponse } from "next/server";
import { db, workspaces, eq, and } from "@npskit/db";
import { requireAuth } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const { session, error } = await requireAuth();
  if (error) return error;

  const rows = await db
    .select({ apiKey: workspaces.apiKey })
    .from(workspaces)
    .where(
      and(
        eq(workspaces.id, params.id),
        eq(workspaces.ownerId, session!.user!.id!)
      )
    )
    .limit(1);

  if (!rows[0]) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  return NextResponse.json({ apiKey: rows[0].apiKey });
}
