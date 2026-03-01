import { auth } from "@/auth";
import { db, workspaces, surveys, responses, eq, desc } from "@npskit/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SurveysPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const wsRows = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.ownerId, userId))
    .limit(1);

  const ws = wsRows[0];
  if (!ws) {
    return <div className="p-8 text-gray-400">No workspace found.</div>;
  }

  const surveyRows = await db
    .select()
    .from(surveys)
    .where(eq(surveys.workspaceId, ws.id))
    .orderBy(desc(surveys.createdAt));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Surveys</h1>
        <Link
          href="/dashboard/surveys/new"
          className="bg-sky-500 hover:bg-sky-400 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
        >
          + New Survey
        </Link>
      </div>

      {surveyRows.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-400 mb-4">No surveys yet.</p>
          <Link
            href="/dashboard/surveys/new"
            className="text-sky-400 hover:text-sky-300"
          >
            Create your first survey →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {surveyRows.map((survey) => (
            <div
              key={survey.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    survey.isActive ? "bg-green-400" : "bg-gray-600"
                  }`}
                />
                <div>
                  <p className="text-white font-medium">{survey.name}</p>
                  <p className="text-gray-500 text-sm uppercase tracking-wide mt-0.5">
                    {survey.type} · {survey.triggerType}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/dashboard/surveys/${survey.id}`}
                  className="text-sky-400 hover:text-sky-300 text-sm font-medium"
                >
                  View →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
