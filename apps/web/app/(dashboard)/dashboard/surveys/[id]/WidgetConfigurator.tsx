"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface Props {
  surveyId: string;
  apiKey: string;
  surveyName: string;
  surveyType: string;
  appUrl: string;
}

const POSITIONS = ["Bottom Right", "Bottom Left", "Center"];
const BG_PRESETS = [
  { label: "Dark", value: "#1e293b" },
  { label: "White", value: "#ffffff" },
  { label: "Sky Blue", value: "#0ea5e9" },
];
const TRIGGER_EVENTS = ["Page Load", "After Scroll 50%", "On Exit Intent", "Manual"];
const FREQUENCIES = ["Once", "Once per session", "Once per week", "Always"];
const SURVEY_TYPES = ["NPS", "CSAT", "CES"];
const TABS = ["Appearance", "Triggers", "Questions"] as const;
type Tab = typeof TABS[number];

function StarRating({ count, selected, onSelect }: { count: number; selected: number; onSelect: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i + 1)}
          className={`text-2xl transition-colors ${i < selected ? "text-yellow-400" : "text-gray-600"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function WidgetConfigurator({ surveyId, apiKey, surveyName, surveyType: initialType, appUrl }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("Appearance");

  // Appearance
  const [position, setPosition] = useState("Bottom Right");
  const [bgColor, setBgColor] = useState("#1e293b");
  const [questionText, setQuestionText] = useState("How likely are you to recommend us?");

  // Triggers
  const [delay, setDelay] = useState(3);
  const [triggerEvent, setTriggerEvent] = useState("Page Load");
  const [frequency, setFrequency] = useState("Once per session");
  const [urlPattern, setUrlPattern] = useState("/app/*");

  // Questions
  const [surveyTypeState, setSurveyTypeState] = useState(initialType === "csat" ? "CSAT" : initialType === "ces" ? "CES" : "NPS");
  const [followUp, setFollowUp] = useState("What's the main reason for your score?");
  const [lowThreshold, setLowThreshold] = useState(6);

  // Preview state
  const [previewScore, setPreviewScore] = useState<number | null>(null);
  const [previewStars, setPreviewStars] = useState(0);

  const [copied, setCopied] = useState(false);

  const embedCode = `<script src="${appUrl}/api/widget.js"></script>\n<script>NPSKit.init({ apiKey: '${apiKey}', surveyId: '${surveyId}' })</script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLight = bgColor === "#ffffff";
  const textCol = isLight ? "text-gray-800" : "text-white";
  const subCol = isLight ? "text-gray-500" : "text-gray-400";
  const borderCol = isLight ? "border-gray-200" : "border-gray-700";

  return (
    <div className="flex gap-6">
      {/* Left: Form */}
      <div className="flex-1 min-w-0">
        {/* Survey header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">{surveyName}</h1>
          <p className="text-gray-400 text-sm mt-1">Configure your widget settings</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1 mb-6 w-fit">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === t ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab: Appearance */}
        {activeTab === "Appearance" && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Widget Position</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-sky-500"
              >
                {POSITIONS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>

            {/* Background color */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Background Color</label>
              <div className="flex gap-2">
                {BG_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setBgColor(p.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                      bgColor === p.value
                        ? "border-sky-500 text-sky-400"
                        : "border-gray-700 text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded border border-gray-600 shrink-0"
                      style={{ background: p.value }}
                    />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Question text */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Survey Question</label>
              <input
                type="text"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-sky-500"
                placeholder="How likely are you to recommend us?"
              />
            </div>

            {/* Brand color swatch */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Brand Color</label>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500 border border-gray-700" />
                <span className="text-gray-400 text-sm">#0ea5e9 (Sky Blue)</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Triggers */}
        {activeTab === "Triggers" && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
            {/* Delay slider */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Trigger Delay: <span className="text-sky-400">{delay}s</span>
              </label>
              <input
                type="range"
                min={0}
                max={30}
                value={delay}
                onChange={(e) => setDelay(Number(e.target.value))}
                className="w-full accent-sky-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0s</span>
                <span>30s</span>
              </div>
            </div>

            {/* Trigger event */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Trigger Event</label>
              <select
                value={triggerEvent}
                onChange={(e) => setTriggerEvent(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-sky-500"
              >
                {TRIGGER_EVENTS.map((e) => <option key={e}>{e}</option>)}
              </select>
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Show Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-sky-500"
              >
                {FREQUENCIES.map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>

            {/* URL pattern */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Target URL Pattern</label>
              <input
                type="text"
                value={urlPattern}
                onChange={(e) => setUrlPattern(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-sky-500"
                placeholder="/app/*"
              />
              <p className="text-gray-500 text-xs mt-1">Use * as wildcard, e.g. /app/*</p>
            </div>
          </div>
        )}

        {/* Tab: Questions */}
        {activeTab === "Questions" && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
            {/* Survey type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Survey Type</label>
              <div className="flex gap-2">
                {SURVEY_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSurveyTypeState(t)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      surveyTypeState === t
                        ? "border-sky-500 bg-sky-500/10 text-sky-400"
                        : "border-gray-700 text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    {t === "NPS" && "NPS (0–10)"}
                    {t === "CSAT" && "CSAT (1–5 ★)"}
                    {t === "CES" && "CES (effort)"}
                  </button>
                ))}
              </div>
            </div>

            {/* Follow-up */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Follow-up Question</label>
              <input
                type="text"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Low score threshold */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Show follow-up when score ≤
              </label>
              <input
                type="number"
                value={lowThreshold}
                onChange={(e) => setLowThreshold(Number(e.target.value))}
                min={0}
                max={10}
                className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        )}

        {/* Save button */}
        <button className="mt-4 w-full bg-sky-500 hover:bg-sky-400 text-white py-2.5 rounded-lg font-semibold transition-colors">
          Save Settings
        </button>
      </div>

      {/* Right: Preview (sticky) */}
      <div className="w-80 shrink-0">
        <div className="sticky top-6 space-y-4">
          {/* Live Widget Preview */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-3">Live Preview</p>

            <div
              className={`rounded-xl border p-4 shadow-lg ${borderCol}`}
              style={{ background: bgColor }}
            >
              <p className={`text-sm font-medium mb-3 ${textCol}`}>{questionText}</p>

              {surveyTypeState === "NPS" && (
                <div>
                  <div className="flex gap-1 flex-wrap">
                    {Array.from({ length: 11 }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPreviewScore(i)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors border ${
                          previewScore === i
                            ? "bg-sky-500 border-sky-500 text-white"
                            : isLight
                            ? "bg-gray-100 border-gray-200 text-gray-600 hover:border-sky-400"
                            : "bg-gray-800 border-gray-700 text-gray-300 hover:border-sky-500"
                        }`}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                  <div className={`flex justify-between text-xs mt-1.5 ${subCol}`}>
                    <span>Not likely</span>
                    <span>Very likely</span>
                  </div>
                </div>
              )}

              {surveyTypeState === "CSAT" && (
                <StarRating count={5} selected={previewStars} onSelect={setPreviewStars} />
              )}

              {surveyTypeState === "CES" && (
                <div className="flex gap-1">
                  {["1\nVery\nEasy", "2", "3", "4", "5", "6", "7\nVery\nHard"].map((v, i) => (
                    <button
                      key={i}
                      onClick={() => setPreviewScore(i + 1)}
                      className={`flex-1 py-1.5 rounded text-xs font-bold transition-colors border ${
                        previewScore === i + 1
                          ? "bg-sky-500 border-sky-500 text-white"
                          : isLight
                          ? "bg-gray-100 border-gray-200 text-gray-600"
                          : "bg-gray-800 border-gray-700 text-gray-300"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}

              {previewScore !== null && surveyTypeState === "NPS" && previewScore <= lowThreshold && (
                <div className="mt-3">
                  <textarea
                    placeholder={followUp}
                    className={`w-full text-xs rounded-lg p-2 border resize-none ${
                      isLight ? "bg-gray-50 border-gray-200 text-gray-700" : "bg-gray-800 border-gray-700 text-gray-300"
                    }`}
                    rows={2}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Embed Code */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400">Embed Code</p>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 transition-colors"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="text-xs text-sky-400 font-mono overflow-auto whitespace-pre-wrap break-all bg-gray-950 rounded-lg p-3">
              {embedCode}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
