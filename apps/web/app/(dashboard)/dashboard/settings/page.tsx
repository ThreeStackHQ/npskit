import { auth } from "@/auth";
import { db, workspaces, subscriptions, eq } from "@npskit/db";
import { PLANS } from "@/lib/stripe";
import { UpgradeButtons } from "./UpgradeButtons";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
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

  const subRows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.workspaceId, ws.id))
    .limit(1);

  const sub = subRows[0];
  const tier = (sub?.tier ?? "free") as keyof typeof PLANS;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-8">Settings</h1>

      {/* Workspace */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-white font-semibold mb-4">Workspace</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400 text-sm">Name</span>
            <span className="text-white text-sm">{ws.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400 text-sm">Slug</span>
            <span className="text-white text-sm font-mono">{ws.slug}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">API Key</span>
            <span className="text-sky-400 text-sm font-mono bg-sky-500/10 px-3 py-1 rounded">
              {ws.apiKey}
            </span>
          </div>
        </div>
      </div>

      {/* Billing */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-white font-semibold mb-4">Billing</h2>
        <div className="mb-6">
          <p className="text-gray-400 text-sm mb-1">Current Plan</p>
          <p className="text-xl font-bold text-white capitalize">{tier}</p>
          {tier !== "free" && sub?.currentPeriodEnd && (
            <p className="text-gray-500 text-sm mt-1">
              Renews {new Date(sub.currentPeriodEnd).toLocaleDateString()}
            </p>
          )}
        </div>

        {tier === "free" && <UpgradeButtons workspaceId={ws.id} />}
      </div>
    </div>
  );
}
