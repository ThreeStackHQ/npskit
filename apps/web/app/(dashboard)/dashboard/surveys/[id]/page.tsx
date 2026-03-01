import { auth } from "@/auth";
import { db, surveys, workspaces, responses, eq, and, desc } from "@npskit/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import WidgetConfigurator from "./WidgetConfigurator";

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
    <div className="p-6 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/dashboard/surveys" className="hover:text-white transition-colors">
          Surveys
        </Link>
        <span>/</span>
        <span className="text-white">{survey.name}</span>
      </div>

      {/* Stats row (if data exists) */}
      {total > 0 && survey.type === "nps" && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
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

      {/* Widget Configurator */}
      <WidgetConfigurator
        surveyId={survey.id}
        apiKey={wsApiKey}
        surveyName={survey.name}
        surveyType={survey.type}
        appUrl={appUrl}
      />
    </div>
  );
}
