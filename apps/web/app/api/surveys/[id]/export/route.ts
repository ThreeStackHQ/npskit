import { NextRequest, NextResponse } from "next/server";
import { db, surveys, responses, workspaces, eq, and, desc } from "@npskit/db";
import { requireAuth } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

function escapeCsv(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const { session, error } = await requireAuth();
  if (error) return error;

  const owned = await db
    .select({ id: surveys.id })
    .from(surveys)
    .innerJoin(workspaces, eq(surveys.workspaceId, workspaces.id))
    .where(and(eq(surveys.id, params.id), eq(workspaces.ownerId, session!.user!.id!)))
    .limit(1);

  if (!owned[0]) {
    return NextResponse.json({ error: "Survey not found" }, { status: 404 });
  }

  const rows = await db
    .select()
    .from(responses)
    .where(eq(responses.surveyId, params.id))
    .orderBy(desc(responses.respondedAt));

  const header = "score,followUpText,respondedAt,userIdentifier\n";
  const body = rows
    .map(
      (r) =>
        [
          r.score,
          escapeCsv(r.followUpText),
          r.respondedAt.toISOString(),
          escapeCsv(r.userIdentifier),
        ].join(",")
    )
    .join("\n");

  return new NextResponse(header + body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="responses-${params.id}.csv"`,
    },
  });
}
