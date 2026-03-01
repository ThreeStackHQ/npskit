import { auth } from "@/auth";
import { db, workspaces, surveys, responses, subscriptions, eq, desc } from "@npskit/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const wsRows = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.ownerId, userId))
    .limit(1);

  const ws = wsRows[0];

  if (!ws) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-white mb-4">Welcome to NPSKit</h1>
        <p className="text-gray-400">Setting up your workspace...</p>
      </div>
    );
  }

  const [surveyRows, subRows] = await Promise.all([
    db.select().from(surveys).where(eq(surveys.workspaceId, ws.id)),
    db.select().from(subscriptions).where(eq(subscriptions.workspaceId, ws.id)).limit(1),
  ]);

  const tier = subRows[0]?.tier ?? "free";
  const totalSurveys = surveyRows.length;
  const activeSurveys = surveyRows.filter((s) => s.isActive).length;

  // Get recent responses
  const recentResponses = await db
    .select()
    .from(responses)
    .where(eq(responses.workspaceId, ws.id))
    .orderBy(desc(responses.respondedAt))
    .limit(5);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">{ws.name}</h1>
          <p className="text-gray-400 mt-1">
            Plan:{" "}
            <span className="text-sky-400 capitalize font-medium">{tier}</span>
          </p>
        </div>
        <Link
          href="/dashboard/surveys/new"
          className="bg-sky-500 hover:bg-sky-400 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
        >
          + New Survey
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Total Surveys</p>
          <p className="text-3xl font-bold text-white mt-1">{totalSurveys}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Active Surveys</p>
          <p className="text-3xl font-bold text-sky-400 mt-1">{activeSurveys}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">API Key</p>
          <p className="text-sm font-mono text-gray-300 mt-2 truncate">{ws.apiKey}</p>
        </div>
      </div>

      {/* Recent responses */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="p-5 border-b border-gray-800">
          <h2 className="text-white font-semibold">Recent Responses</h2>
        </div>
        {recentResponses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No responses yet. Install the widget to start collecting.</p>
            <pre className="mt-4 text-xs text-gray-600 bg-gray-950 rounded-lg p-4 text-left overflow-auto">
{`<script src="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://npskit.threestack.io'}/api/widget.js"></script>
<script>
  NPSKit.init({ apiKey: '${ws.apiKey}', surveyId: 'YOUR_SURVEY_ID' })
</script>`}
            </pre>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {recentResponses.map((r) => (
              <div key={r.id} className="p-4 flex items-center justify-between">
                <div>
                  <span
                    className={`text-lg font-bold ${
                      r.score >= 9
                        ? "text-green-400"
                        : r.score >= 7
                        ? "text-yellow-400"
                        : "text-red-400"
                    }`}
                  >
                    {r.score}
                  </span>
                  {r.followUpText && (
                    <p className="text-gray-400 text-sm mt-0.5">{r.followUpText}</p>
                  )}
                </div>
                <span className="text-gray-500 text-xs">
                  {new Date(r.respondedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
