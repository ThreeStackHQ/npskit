import { auth } from "@/auth";
import { db, workspaces, responses, surveys, eq, desc } from "@npskit/db";

export const dynamic = "force-dynamic";

export default async function ResponsesPage() {
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

  const allResponses = await db
    .select({
      response: responses,
      surveyName: surveys.name,
      surveyType: surveys.type,
    })
    .from(responses)
    .innerJoin(surveys, eq(responses.surveyId, surveys.id))
    .where(eq(responses.workspaceId, ws.id))
    .orderBy(desc(responses.respondedAt))
    .limit(100);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-8">All Responses</h1>

      {allResponses.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center text-gray-500">
          No responses yet.
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
          {allResponses.map(({ response: r, surveyName, surveyType }) => (
            <div key={r.id} className="p-4 flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <span
                  className={`text-xl font-bold w-10 text-center ${
                    surveyType === "csat"
                      ? "text-yellow-400"
                      : r.score >= 9
                      ? "text-green-400"
                      : r.score >= 7
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}
                >
                  {surveyType === "nps" ? r.score : "★".repeat(r.score)}
                </span>
                <div>
                  <p className="text-gray-400 text-xs">{surveyName}</p>
                  {r.followUpText && (
                    <p className="text-gray-300 text-sm mt-0.5">{r.followUpText}</p>
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
  );
}
