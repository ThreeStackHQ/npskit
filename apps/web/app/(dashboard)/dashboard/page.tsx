import { auth } from "@/auth";
import { db, workspaces, surveys, responses, subscriptions, eq, desc } from "@npskit/db";
import Link from "next/link";
import NPSTrendChart from "./NPSTrendChart";

export const dynamic = "force-dynamic";

function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 9
      ? "bg-green-500/10 text-green-400 border border-green-500/20"
      : score >= 7
      ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
      : "bg-red-500/10 text-red-400 border border-red-500/20";
  return (
    <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-bold ${cls}`}>
      {score}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const cls =
    type === "Promoter"
      ? "bg-green-500/10 text-green-400"
      : type === "Passive"
      ? "bg-yellow-500/10 text-yellow-400"
      : "bg-red-500/10 text-red-400";
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{type}</span>
  );
}

function responseType(score: number): string {
  if (score >= 9) return "Promoter";
  if (score >= 7) return "Passive";
  return "Detractor";
}

function NPSGauge({ score }: { score: number }) {
  const pct = (score + 100) / 200;
  const ANGLE = pct * 180;
  const r = 70;
  const cx = 90;
  const cy = 90;

  function polarToCartesian(angleDeg: number) {
    const rad = ((angleDeg - 180) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  }

  const start = polarToCartesian(0);
  const end = polarToCartesian(ANGLE);
  const largeArc = ANGLE > 90 ? 1 : 0;
  const trackEnd = polarToCartesian(180);

  return (
    <svg width="180" height="100" viewBox="0 0 180 100" className="mx-auto">
      <path
        d={`M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${trackEnd.x} ${trackEnd.y}`}
        fill="none"
        stroke="#1f2937"
        strokeWidth="12"
        strokeLinecap="round"
      />
      {ANGLE > 0 && (
        <path
          d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`}
          fill="none"
          stroke="#0ea5e9"
          strokeWidth="12"
          strokeLinecap="round"
        />
      )}
      <text x="10" y="98" fill="#6b7280" fontSize="10">-100</text>
      <text x="150" y="98" fill="#6b7280" fontSize="10">100</text>
    </svg>
  );
}

// Build a 30-day NPS trend using the provided responses
type TrendPoint = { date: string; score: number };

function buildTrend(
  allResponses: Array<{ score: number; respondedAt: Date }>
): TrendPoint[] {
  const today = new Date();

  // Bucket per ISO date key
  type Bucket = { promoters: number; detractors: number; total: number };
  const buckets = new Map<string, Bucket>();

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0]!;
    buckets.set(key, { promoters: 0, detractors: 0, total: 0 });
  }

  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - 29);
  cutoff.setHours(0, 0, 0, 0);

  for (const r of allResponses) {
    const ts = new Date(r.respondedAt);
    if (ts < cutoff) continue;
    const key = ts.toISOString().split("T")[0]!;
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.total++;
    if (r.score >= 9) bucket.promoters++;
    else if (r.score <= 6) bucket.detractors++;
  }

  // Build cumulative NPS per day
  let cumPromoters = 0;
  let cumDetractors = 0;
  let cumTotal = 0;
  const result: TrendPoint[] = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0]!;
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const bucket = buckets.get(key)!;
    cumPromoters += bucket.promoters;
    cumDetractors += bucket.detractors;
    cumTotal += bucket.total;
    const score =
      cumTotal > 0
        ? Math.round(((cumPromoters - cumDetractors) / cumTotal) * 100)
        : 0;
    result.push({ date: label, score });
  }

  return result;
}

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

  // Fetch surveys, subscription, and responses in parallel
  const [surveyRows, subRows, allResponses, recentResponseRows] = await Promise.all([
    db.select().from(surveys).where(eq(surveys.workspaceId, ws.id)),
    db.select().from(subscriptions).where(eq(subscriptions.workspaceId, ws.id)).limit(1),
    db.select({ score: responses.score, respondedAt: responses.respondedAt })
      .from(responses)
      .where(eq(responses.workspaceId, ws.id)),
    db.select()
      .from(responses)
      .where(eq(responses.workspaceId, ws.id))
      .orderBy(desc(responses.respondedAt))
      .limit(6),
  ]);

  const tier = subRows[0]?.tier ?? "free";

  // Compute real NPS metrics
  const totalResponses = allResponses.length;
  const promoterCount = allResponses.filter((r) => r.score >= 9).length;
  const detractorCount = allResponses.filter((r) => r.score <= 6).length;
  const passiveCount = totalResponses - promoterCount - detractorCount;

  const npsScore =
    totalResponses > 0
      ? Math.round(((promoterCount - detractorCount) / totalResponses) * 100)
      : 0;
  const promoterPct =
    totalResponses > 0 ? Math.round((promoterCount / totalResponses) * 100) : 0;
  const passivePct =
    totalResponses > 0 ? Math.round((passiveCount / totalResponses) * 100) : 0;
  const detractorPct =
    totalResponses > 0 ? Math.round((detractorCount / totalResponses) * 100) : 0;

  const trendData = buildTrend(allResponses);

  const periods = ["7d", "30d", "90d", "1Y"];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://npskit.threestack.io";

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">NPS Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {ws.name} · <span className="text-sky-400 capitalize">{tier}</span>
          </p>
        </div>
        <Link
          href="/dashboard/surveys/new"
          className="bg-sky-500 hover:bg-sky-400 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
        >
          + New Survey
        </Link>
      </div>

      {/* NPS Score + Breakdown row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
        {/* NPS Score Card */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col items-center">
          <NPSGauge score={npsScore} />
          <div className="text-center mt-2">
            {totalResponses > 0 ? (
              <span className="text-5xl font-bold text-sky-400">{npsScore}</span>
            ) : (
              <span className="text-5xl font-bold text-gray-600">--</span>
            )}
            <p className="text-gray-400 text-sm mt-1">Net Promoter Score</p>
            {totalResponses === 0 && (
              <p className="text-gray-600 text-xs mt-1">No responses yet</p>
            )}
          </div>
          {/* Period tabs */}
          <div className="flex gap-1 mt-4 bg-gray-800 rounded-lg p-1">
            {periods.map((p, i) => (
              <button
                key={p}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  i === 1
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Promoter Breakdown */}
        <div className="lg:col-span-3 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Response Breakdown</h3>
            <span className="text-gray-400 text-sm">{totalResponses} total</span>
          </div>

          <div className="space-y-4">
            {/* Promoters */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-green-400 font-medium">Promoters (9–10)</span>
                <span className="text-sm text-gray-300">
                  {promoterPct}% · {promoterCount}
                </span>
              </div>
              <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${promoterPct}%` }}
                />
              </div>
            </div>

            {/* Passives */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-yellow-400 font-medium">Passives (7–8)</span>
                <span className="text-sm text-gray-300">
                  {passivePct}% · {passiveCount}
                </span>
              </div>
              <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500 rounded-full"
                  style={{ width: `${passivePct}%` }}
                />
              </div>
            </div>

            {/* Detractors */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-red-400 font-medium">Detractors (0–6)</span>
                <span className="text-sm text-gray-300">
                  {detractorPct}% · {detractorCount}
                </span>
              </div>
              <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: `${detractorPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-800 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-green-400">
                {totalResponses > 0 ? `${promoterPct}%` : "--"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Promoters</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">
                {totalResponses > 0 ? `${passivePct}%` : "--"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Passives</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">
                {totalResponses > 0 ? `${detractorPct}%` : "--"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Detractors</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">NPS Trend (30 days)</h3>
          <span className="text-xs text-gray-500">Score over time</span>
        </div>
        <NPSTrendChart data={trendData} />
      </div>

      {/* Response Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-white font-semibold">Recent Responses</h3>
          <Link href="/dashboard/responses" className="text-sky-400 text-sm hover:text-sky-300">
            View all →
          </Link>
        </div>

        {recentResponseRows.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400 mb-4">No responses yet. Install the widget to start collecting.</p>
            <pre className="mt-2 text-xs text-sky-400 bg-gray-950 rounded-lg p-4 text-left overflow-auto inline-block">
{`<script src="${appUrl}/api/widget.js"></script>
<script>NPSKit.init({ apiKey: '${ws.apiKey}', surveyId: '...' })</script>`}
            </pre>
          </div>
        ) : (
          <>
            <div className="hidden md:grid grid-cols-4 gap-4 px-5 py-3 border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wide">
              <span>Score</span>
              <span>Type</span>
              <span>Comment</span>
              <span>Date</span>
            </div>
            <div className="divide-y divide-gray-800">
              {recentResponseRows.map((r) => (
                <div key={r.id} className="grid grid-cols-4 gap-4 px-5 py-4 items-center">
                  <ScoreBadge score={r.score} />
                  <TypeBadge type={responseType(r.score)} />
                  <p className="text-gray-300 text-sm truncate">
                    {r.followUpText ?? <span className="text-gray-600 italic">No comment</span>}
                  </p>
                  <span className="text-gray-500 text-xs">
                    {new Date(r.respondedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-800 text-center">
              <Link href="/dashboard/responses" className="text-sky-400 text-sm hover:text-sky-300 font-medium">
                View all responses →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
