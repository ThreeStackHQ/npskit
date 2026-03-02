"use client";

import { PLANS } from "@/lib/stripe";

interface UpgradeButtonsProps {
  workspaceId: string;
}

export function UpgradeButtons({ workspaceId }: UpgradeButtonsProps) {
  async function handleUpgrade(tier: "pro" | "business") {
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, tier }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        alert(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (_e) {
      alert("Network error. Please try again.");
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {(["pro", "business"] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => void handleUpgrade(t)}
          className="w-full border border-sky-500 text-sky-400 hover:bg-sky-500 hover:text-white px-4 py-3 rounded-lg font-semibold text-sm transition-colors capitalize"
        >
          Upgrade to {t}
          <span className="block text-xs font-normal mt-0.5 opacity-75">
            ${(PLANS[t].price / 100).toFixed(0)}/mo
          </span>
        </button>
      ))}
    </div>
  );
}
