import { auth } from "@/auth";
import { db, workspaces, surveys, responses, subscriptions, eq, desc } from "@npskit/db";
import Link from "next/link";
import NPSTrendChart from "./NPSTrendChart";

export const dynamic = "force-dynamic";

// Generate mock 30-day trend data
function getMockTrendData() {
  const data = [];
  const now = new Date();
  let score = 30;
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    score += Math.floor(Math.random() * 10) - 4;
    score = Math.max(-100, Math.min(100, score));
    data.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      score,
    });
  }
  return data;
}

const MOCK_TREND = getMockTrendData();

const MOCK_RESPONSES = [
  { id: "1", score: 10, type: "Promoter", comment: "Absolutely love it, so much better than Delighted!", date: "Mar 1, 2026" },
  { id: "2", score: 9, type: "Promoter", comment: "Setup took 2 minutes. Dashboard is clean.", date: "Feb 28, 2026" },
  { id: "3", score: 7, type: "Passive", comment: "Works well, would love more integrations.", date: "Feb 27, 2026" },
  { id: "4", score: 4, type: "Detractor", comment: "Missing some features I had in Delighted.", date: "Feb 26, 2026" },
  { id: "5", score: 10, type: "Promoter", comment: "Finally an affordable NPS tool!", date: "Feb 25, 2026" },
  { id: "6", score: 8, type: "Passive", comment: "Pretty good overall.", date: "Feb 24, 2026" },
];

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

function NPSGauge({ score }: { score: number }) {
  // SVG arc gauge: -100 to 100 mapped to 0-180 degrees
  const pct = (score + 100) / 200; // 0..1
  const ANGLE = pct * 180; // degrees of arc filled
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
      {/* Track */}
      <path
        d={`M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${trackEnd.x} ${trackEnd.y}`}
        fill="none"
        stroke="#1f2937"
        strokeWidth="12"
        strokeLinecap="round"
      />
      {/* Filled arc */}
      {ANGLE > 0 && (
        <path
          d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`}
          fill="none"
          stroke="#0ea5e9"
          strokeWidth="12"
          strokeLinecap="round"
        />
      )}
      {/* Labels */}
      <text x="10" y="98" fill="#6b7280" fontSize="10">-100</text>
      <text x="150" y="98" fill="#6b7280" fontSize="10">100</text>
    </svg>
  );
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

  const [surveyRows, subRows] = await Promise.all([
    db.select().from(surveys).where(eq(surveys.workspaceId, ws.id)),
    db.select().from(subscriptions).where(eq(subscriptions.workspaceId, ws.id)).limit(1),
  ]);

  const tier = subRows[0]?.tier ?? "free";

  // Mock NPS data — would be replaced by real DB queries
  const npsScore = 42;
  const promoterPct = 58;
  const passivePct = 26;
  const detractorPct = 16;
  const totalResponses = 247;

  const promoterCount = Math.round((promoterPct / 100) * totalResponses);
  const passiveCount = Math.round((passivePct / 100) * totalResponses);
  const detractorCount = Math.round((detractorPct / 100) * totalResponses);

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
            <span className="text-5xl font-bold text-sky-400">{npsScore}</span>
            <p className="text-gray-400 text-sm mt-1">Net Promoter Score</p>
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
                <span className="text-sm text-gray-300">{promoterPct}% · {promoterCount}</span>
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
                <span className="text-sm text-gray-300">{passivePct}% · {passiveCount}</span>
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
                <span className="text-sm text-gray-300">{detractorPct}% · {detractorCount}</span>
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
              <p className="text-2xl font-bold text-green-400">{promoterPct}%</p>
              <p className="text-xs text-gray-500 mt-0.5">Promoters</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">{passivePct}%</p>
              <p className="text-xs text-gray-500 mt-0.5">Passives</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">{detractorPct}%</p>
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
        <NPSTrendChart data={MOCK_TREND} />
      </div>

      {/* Response Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-white font-semibold">Recent Responses</h3>
          <Link href="/dashboard/responses" className="text-sky-400 text-sm hover:text-sky-300">
            View all →
          </Link>
        </div>

        {MOCK_RESPONSES.length === 0 ? (
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
              {MOCK_RESPONSES.map((r) => (
                <div key={r.id} className="grid grid-cols-4 gap-4 px-5 py-4 items-center">
                  <ScoreBadge score={r.score} />
                  <TypeBadge type={r.type} />
                  <p className="text-gray-300 text-sm truncate">{r.comment}</p>
                  <span className="text-gray-500 text-xs">{r.date}</span>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-800 text-center">
              <button className="text-sky-400 text-sm hover:text-sky-300 font-medium">
                Load more
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
