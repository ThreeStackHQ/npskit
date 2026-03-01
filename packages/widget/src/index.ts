// NPSKit Widget — Vanilla JS, <5KB gzipped
// window.NPSKit.init({ apiKey, surveyId, userId? })

interface NPSKitConfig {
  apiKey: string;
  surveyId: string;
  userId?: string;
  apiUrl?: string;
}

interface SurveyConfig {
  id: string;
  type: "nps" | "csat";
  name: string;
  triggerType: "time" | "pageview" | "manual";
  triggerValue: number;
  isActive: boolean;
  position: string;
  theme: "light" | "dark";
  primaryColor: string;
  promptText: string | null;
  followUpText: string | null;
}

const LS_PREFIX = "npskit_";
const LS_SHOWN = (id: string): string => `${LS_PREFIX}shown_${id}`;
const LS_PV = (id: string): string => `${LS_PREFIX}pv_${id}`;
const LS_SUBMITTED = (id: string): string => `${LS_PREFIX}done_${id}`;

function getApiUrl(): string {
  // Detect from script tag src
  const scripts = document.querySelectorAll<HTMLScriptElement>("script[src]");
  for (let i = 0; i < scripts.length; i++) {
    const src = scripts[i].src;
    if (src && src.includes("widget.js")) {
      try {
        const url = new URL(src);
        return `${url.protocol}//${url.host}`;
      } catch (_e) {
        // ignore
      }
    }
  }
  return "";
}

function css(dark: boolean, primary: string): string {
  const bg = dark ? "#0f172a" : "#ffffff";
  const fg = dark ? "#f1f5f9" : "#1e293b";
  const border = dark ? "#1e293b" : "#e2e8f0";
  const inputBg = dark ? "#1e293b" : "#f8fafc";

  return (
    `#nk-wrap{position:fixed;z-index:999999;font-family:system-ui,sans-serif;` +
    `transition:opacity .3s,transform .3s}` +
    `#nk-wrap.nk-bottom-right{bottom:24px;right:24px}` +
    `#nk-wrap.nk-bottom-left{bottom:24px;left:24px}` +
    `#nk-wrap.nk-top-right{top:24px;right:24px}` +
    `#nk-wrap.nk-top-left{top:24px;left:24px}` +
    `#nk-wrap.nk-center{top:50%;left:50%;transform:translate(-50%,-50%)}` +
    `#nk-box{background:${bg};border:1px solid ${border};border-radius:12px;` +
    `padding:20px;width:320px;box-shadow:0 20px 60px rgba(0,0,0,.3)}` +
    `#nk-close{position:absolute;top:12px;right:12px;background:none;border:none;` +
    `cursor:pointer;color:${fg};opacity:.5;font-size:18px;line-height:1;padding:4px}` +
    `#nk-close:hover{opacity:1}` +
    `#nk-title{font-size:14px;font-weight:600;color:${fg};margin:0 0 14px;padding-right:20px}` +
    `#nk-scale{display:flex;gap:4px;margin-bottom:14px}` +
    `.nk-btn{flex:1;padding:6px 2px;border-radius:6px;border:1px solid ${border};` +
    `background:${inputBg};color:${fg};font-size:12px;font-weight:600;cursor:pointer;transition:all .15s}` +
    `.nk-btn:hover,.nk-btn.nk-sel{color:#fff;border-color:transparent}` +
    `.nk-btn.nk-red:hover,.nk-btn.nk-red.nk-sel{background:#ef4444}` +
    `.nk-btn.nk-yellow:hover,.nk-btn.nk-yellow.nk-sel{background:#f59e0b}` +
    `.nk-btn.nk-green:hover,.nk-btn.nk-green.nk-sel{background:#22c55e}` +
    `#nk-labels{display:flex;justify-content:space-between;font-size:11px;` +
    `color:${fg};opacity:.5;margin-bottom:14px}` +
    `.nk-stars{display:flex;gap:6px;margin-bottom:14px;justify-content:center}` +
    `.nk-star{font-size:28px;cursor:pointer;color:${border};transition:color .15s;line-height:1}` +
    `.nk-star.nk-lit{color:#f59e0b}` +
    `#nk-follow{width:100%;box-sizing:border-box;background:${inputBg};border:1px solid ${border};` +
    `border-radius:8px;color:${fg};font-size:13px;padding:8px 10px;resize:none;` +
    `font-family:inherit;outline:none;margin-bottom:12px}` +
    `#nk-follow:focus{border-color:${primary}}` +
    `#nk-submit{width:100%;padding:10px;background:${primary};color:#fff;border:none;` +
    `border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;transition:opacity .15s}` +
    `#nk-submit:hover{opacity:.85}#nk-submit:disabled{opacity:.5;cursor:default}` +
    `#nk-footer{text-align:center;margin-top:10px;font-size:11px;opacity:.4;color:${fg}}` +
    `#nk-footer a{color:inherit;text-decoration:none}` +
    `#nk-success{text-align:center;padding:10px 0;color:${fg};font-size:14px}`
  );
}

function inject(cfg: SurveyConfig): void {
  const style = document.createElement("style");
  style.textContent = css(cfg.theme === "dark", cfg.primaryColor);
  document.head.appendChild(style);

  const wrap = document.createElement("div");
  wrap.id = "nk-wrap";
  const pos = cfg.position.replace(/[^a-z-]/g, "");
  wrap.className = `nk-${pos}`;

  const isNPS = cfg.type === "nps";
  const prompt = cfg.promptText ?? (isNPS ? "How likely are you to recommend us to a friend?" : "How satisfied are you with our product?");
  const followUp = cfg.followUpText ?? (isNPS ? "Tell us more (optional)" : "Any comments? (optional)");

  let scaleHtml = "";
  if (isNPS) {
    scaleHtml = `<div id="nk-scale">`;
    for (let i = 0; i <= 10; i++) {
      const cls = i <= 6 ? "nk-red" : i <= 8 ? "nk-yellow" : "nk-green";
      scaleHtml += `<button class="nk-btn ${cls}" data-score="${i}">${i}</button>`;
    }
    scaleHtml += `</div><div id="nk-labels"><span>Not likely</span><span>Very likely</span></div>`;
  } else {
    scaleHtml = `<div class="nk-stars">`;
    for (let i = 1; i <= 5; i++) {
      scaleHtml += `<span class="nk-star" data-star="${i}">★</span>`;
    }
    scaleHtml += `</div>`;
  }

  wrap.innerHTML = `<div id="nk-box" style="position:relative">
    <button id="nk-close" aria-label="Close">✕</button>
    <p id="nk-title">${prompt}</p>
    ${scaleHtml}
    <textarea id="nk-follow" rows="2" placeholder="${followUp}" style="display:none"></textarea>
    <button id="nk-submit" disabled>Send feedback</button>
    <div id="nk-footer"><a href="https://npskit.threestack.io" target="_blank">Powered by NPSKit</a></div>
  </div>`;

  document.body.appendChild(wrap);

  let selectedScore: number | null = null;

  const submitBtn = document.getElementById("nk-submit") as HTMLButtonElement;
  const followTextarea = document.getElementById("nk-follow") as HTMLTextAreaElement;

  function selectScore(score: number): void {
    selectedScore = score;
    submitBtn.disabled = false;
    followTextarea.style.display = "block";
  }

  if (isNPS) {
    wrap.querySelectorAll<HTMLButtonElement>(".nk-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        wrap.querySelectorAll(".nk-btn").forEach((b) => b.classList.remove("nk-sel"));
        btn.classList.add("nk-sel");
        selectScore(parseInt(btn.dataset["score"] ?? "0", 10));
      });
    });
  } else {
    const stars = wrap.querySelectorAll<HTMLSpanElement>(".nk-star");
    stars.forEach((star) => {
      star.addEventListener("click", () => {
        const val = parseInt(star.dataset["star"] ?? "1", 10);
        stars.forEach((s, idx) => {
          s.classList.toggle("nk-lit", idx < val);
        });
        selectScore(val);
      });
      star.addEventListener("mouseover", () => {
        const val = parseInt(star.dataset["star"] ?? "1", 10);
        stars.forEach((s, idx) => {
          s.classList.toggle("nk-lit", idx < val);
        });
      });
      star.addEventListener("mouseout", () => {
        stars.forEach((s, idx) => {
          s.classList.toggle("nk-lit", selectedScore !== null && idx < selectedScore);
        });
      });
    });
  }

  document.getElementById("nk-close")?.addEventListener("click", () => {
    remove();
  });

  submitBtn.addEventListener("click", async () => {
    if (selectedScore === null) return;
    submitBtn.disabled = true;

    try {
      await fetch(`${getApiUrl()}/api/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surveyId: cfg.id,
          score: selectedScore,
          followUpText: followTextarea.value || undefined,
          userIdentifier: (window as unknown as Record<string, unknown>)["_npskit_userId"] as string | undefined,
        }),
      });
    } catch (_e) {
      // ignore network errors — still mark submitted
    }

    localStorage.setItem(LS_SUBMITTED(cfg.id), "1");
    const box = document.getElementById("nk-box");
    if (box) {
      box.innerHTML = `<div id="nk-success">🎉 Thank you for your feedback!</div>`;
    }
    setTimeout(() => remove(), 2500);
  });
}

function remove(): void {
  const wrap = document.getElementById("nk-wrap");
  if (wrap) wrap.remove();
}

async function init(config: NPSKitConfig): Promise<void> {
  const { apiKey, surveyId, userId } = config;

  if (userId) {
    (window as unknown as Record<string, unknown>)["_npskit_userId"] = userId;
  }

  // Already submitted
  if (localStorage.getItem(LS_SUBMITTED(surveyId))) return;

  const base = config.apiUrl ?? getApiUrl();

  let surveyConfig: SurveyConfig;
  try {
    const res = await fetch(
      `${base}/api/surveys/${surveyId}/widget-config?apiKey=${apiKey}`
    );
    if (!res.ok) return;
    surveyConfig = (await res.json()) as SurveyConfig;
  } catch (_e) {
    return;
  }

  if (!surveyConfig.isActive) return;

  const trigger = surveyConfig.triggerType;
  const val = surveyConfig.triggerValue;

  if (trigger === "manual") {
    // Expose manual trigger
    window.NPSKit.show = () => inject(surveyConfig);
    return;
  }

  if (trigger === "time") {
    const lastKey = LS_SHOWN(surveyId);
    const last = localStorage.getItem(lastKey);
    const now = Date.now();
    if (last) {
      const daysSince = (now - parseInt(last, 10)) / 86400000;
      if (daysSince < val) return;
    }
    localStorage.setItem(lastKey, String(now));
    setTimeout(() => inject(surveyConfig), 1500);
  } else if (trigger === "pageview") {
    const pvKey = LS_PV(surveyId);
    const pv = parseInt(localStorage.getItem(pvKey) ?? "0", 10) + 1;
    localStorage.setItem(pvKey, String(pv));
    if (pv >= val) {
      inject(surveyConfig);
    }
  }
}

// Expose global
declare global {
  interface Window {
    NPSKit: {
      init: (config: NPSKitConfig) => Promise<void>;
      show?: () => void;
    };
  }
}

window.NPSKit = { init };

export { init };
export type { NPSKitConfig };
