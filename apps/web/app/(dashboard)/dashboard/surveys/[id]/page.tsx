import { auth } from "@/auth";
import { db, surveys, workspaces, responses, eq, and, desc } from "@npskit/db";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SurveyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  const userId = session!.user!.id!;

  const rows = await db
    .select({ survey: surveys, wsApiKey: workspaces.apiKey })
    .from(surveys)
    .innerJoin(workspaces, eq(surveys.workspaceId, workspaces.id))
    .where(and(eq(surveys.id, params.id), eq(workspaces.ownerId, userId)))
    .limit(1);

  const row = rows[0];
  if (!row) notFound();

  const { survey, wsApiKey } = row;

  // Stats
  const allResponses = await db
    .select()
    .from(responses)
    .where(eq(responses.surveyId, survey.id))
    .orderBy(desc(responses.respondedAt))
    .limit(20);

  const total = allResponses.length;
  let npsScore: number | null = null;
  let promoters = 0;
  let passives = 0;
  let detractors = 0;

  if (total > 0 && survey.type === "nps") {
    for (const r of allResponses) {
      if (r.score >= 9) promoters++;
      else if (r.score >= 7) passives++;
      else detractors++;
    }
    npsScore = Math.round(((promoters - detractors) / total) * 100);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://npskit.threestack.io";

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/surveys" className="text-gray-400 hover:text-white text-sm">
              ← Surveys
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-white mt-2">{survey.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-gray-400 text-sm uppercase tracking-wide">{survey.type}</span>
            <div className={`w-2 h-2 rounded-full ${survey.isActive ? "bg-green-400" : "bg-gray-600"}`} />
            <span className="text-gray-400 text-sm">{survey.isActive ? "Active" : "Inactive"}</span>
          </div>
        </div>
        <a
          href={`/api/surveys/${survey.id}/export`}
          className="border border-gray-700 text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          ↓ Export CSV
        </a>
      </div>

      {/* Stats */}
      {survey.type === "nps" && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 col-span-1">
            <p className="text-gray-400 text-sm">NPS Score</p>
            <p className={`text-4xl font-bold mt-1 ${npsScore !== null && npsScore >= 50 ? "text-green-400" : npsScore !== null && npsScore >= 0 ? "text-yellow-400" : "text-red-400"}`}>
              {npsScore ?? "—"}
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Promoters</p>
            <p className="text-3xl font-bold text-green-400 mt-1">{total > 0 ? Math.round((promoters/total)*100) : 0}%</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Passives</p>
            <p className="text-3xl font-bold text-yellow-400 mt-1">{total > 0 ? Math.round((passives/total)*100) : 0}%</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Detractors</p>
            <p className="text-3xl font-bold text-red-400 mt-1">{total > 0 ? Math.round((detractors/total)*100) : 0}%</p>
          </div>
        </div>
      )}

      {/* Install snippet */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <h3 className="text-white font-medium mb-3">Install</h3>
        <pre className="text-xs text-sky-400 font-mono overflow-auto">
{`<script src="${appUrl}/api/widget.js"></script>
<script>
  NPSKit.init({ apiKey: '${wsApiKey}', surveyId: '${survey.id}' })
</script>`}
        </pre>
      </div>

      {/* Responses */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-white font-semibold">Responses ({total})</h2>
        </div>
        {allResponses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No responses yet.</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {allResponses.map((r) => (
              <div key={r.id} className="p-4 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xl font-bold w-10 text-center ${
                      r.score >= 9 ? "text-green-400" : r.score >= 7 ? "text-yellow-400" : "text-red-400"
                    }`}
                  >
                    {survey.type === "nps" ? r.score : "★".repeat(r.score)}
                  </span>
                  <div>
                    {r.followUpText && (
                      <p className="text-gray-300 text-sm">{r.followUpText}</p>
                    )}
                    {r.userIdentifier && (
                      <p className="text-gray-500 text-xs mt-0.5">{r.userIdentifier}</p>
                    )}
                  </div>
                </div>
                <span className="text-gray-500 text-xs shrink-0">
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
