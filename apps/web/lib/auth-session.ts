import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function getAuthSession() {
  const session = await auth();
  return session;
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session, error: null };
}

export async function getUserWorkspaceId(userId: string): Promise<string | null> {
  const { db, workspaces, eq } = await import("@npskit/db");
  const rows = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.ownerId, userId))
    .limit(1);
  return rows[0]?.id ?? null;
}
