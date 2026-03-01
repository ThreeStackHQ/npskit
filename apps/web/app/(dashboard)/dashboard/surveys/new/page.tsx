"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewSurveyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    type: "nps" as "nps" | "csat",
    triggerType: "time" as "time" | "pageview" | "manual",
    triggerValue: 3,
    promptText: "",
    followUpText: "",
    theme: "dark" as "light" | "dark",
    primaryColor: "#0ea5e9",
    position: "bottom-right" as "bottom-right" | "bottom-left" | "top-right" | "top-left" | "center",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Get workspace
    const wsRes = await fetch("/api/workspaces");
    const wsData = await wsRes.json() as Array<{ id: string }>;
    const workspaceId = wsData[0]?.id;

    if (!workspaceId) {
      setError("No workspace found");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/surveys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        workspaceId,
        promptText: form.promptText || undefined,
        followUpText: form.followUpText || undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json() as { error?: string };
      setError(data.error ?? "Failed to create survey");
      setLoading(false);
      return;
    }

    router.push("/dashboard/surveys");
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-8">New Survey</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Survey Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-sky-500"
            placeholder="Product NPS Survey"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Survey Type</label>
          <div className="flex gap-3">
            {(["nps", "csat"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm({ ...form, type: t })}
                className={`flex-1 py-2.5 rounded-lg font-medium text-sm uppercase tracking-wide border transition-colors ${
                  form.type === t
                    ? "bg-sky-500 border-sky-500 text-white"
                    : "border-gray-700 text-gray-400 hover:border-gray-600"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Trigger</label>
          <div className="flex gap-3 mb-3">
            {(["time", "pageview", "manual"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm({ ...form, triggerType: t })}
                className={`flex-1 py-2 rounded-lg font-medium text-sm capitalize border transition-colors ${
                  form.triggerType === t
                    ? "bg-sky-500 border-sky-500 text-white"
                    : "border-gray-700 text-gray-400 hover:border-gray-600"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          {form.triggerType !== "manual" && (
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={form.triggerValue}
                onChange={(e) => setForm({ ...form, triggerValue: parseInt(e.target.value, 10) })}
                min={0}
                className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-sky-500"
              />
              <span className="text-gray-400 text-sm">
                {form.triggerType === "time" ? "days" : "pageviews"}
              </span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Prompt Text <span className="text-gray-500">(optional)</span>
          </label>
          <input
            type="text"
            value={form.promptText}
            onChange={(e) => setForm({ ...form, promptText: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-sky-500"
            placeholder={form.type === "nps" ? "How likely are you to recommend us?" : "How satisfied are you?"}
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Theme</label>
            <select
              value={form.theme}
              onChange={(e) => setForm({ ...form, theme: e.target.value as "light" | "dark" })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-sky-500"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Color</label>
            <input
              type="color"
              value={form.primaryColor}
              onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
              className="w-16 h-10 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
          >
            {loading ? "Creating..." : "Create Survey"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-gray-700 text-gray-400 hover:text-white px-6 py-2.5 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
