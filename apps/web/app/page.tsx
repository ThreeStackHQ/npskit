import Link from "next/link";

const CHECK = () => (
  <svg className="w-5 h-5 text-sky-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const X_MARK = () => (
  <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const MINUS = () => (
  <svg className="w-5 h-5 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
  </svg>
);

const FEATURES = [
  { icon: "🎯", title: "NPS + CSAT + CES", desc: "Three survey types in one tool. Cover every feedback scenario without switching platforms." },
  { icon: "⚡", title: "One-line install", desc: "Drop a script tag and you're done. No SDK, no npm, no config files needed." },
  { icon: "📊", title: "Smart dashboards", desc: "NPS gauge, 90-day trend charts, segment analysis, and response tables — all built in." },
  { icon: "🔔", title: "Slack alerts", desc: "Get notified instantly when a detractor responds. Close the loop before they churn." },
  { icon: "📤", title: "CSV export", desc: "Your data belongs to you. Export all responses anytime with one click." },
  { icon: "🔀", title: "Migrate from Delighted", desc: "CSV import included. Bring your historical data in 5 minutes flat." },
];

const COMPARISON = [
  {
    label: "Price/mo",
    npskit: "$9",
    delighted: "$49+",
    survicate: "$89+",
    retently: "$49+",
  },
  { label: "NPS surveys", npskit: true, delighted: true, survicate: true, retently: true },
  { label: "CSAT surveys", npskit: true, delighted: "paid", survicate: true, retently: true },
  { label: "CES surveys", npskit: true, delighted: false, survicate: true, retently: true },
  { label: "Responses/mo", npskit: "5,000", delighted: "200", survicate: "500", retently: "500" },
  { label: "CSV export", npskit: true, delighted: "paid", survicate: true, retently: true },
  { label: "Team seats", npskit: "3", delighted: "1", survicate: "3", retently: "3" },
  { label: "API access", npskit: true, delighted: "paid", survicate: "paid", retently: "paid" },
];

const TESTIMONIALS = [
  {
    quote: "Delighted was shutting down and I needed an alternative fast. NPSKit took 10 minutes to set up and has everything I need.",
    name: "Sarah K.",
    title: "Founder, Inboxly",
    avatar: "SK",
  },
  {
    quote: "We went from paying $59/mo on Delighted to $9/mo on NPSKit. The dashboards are actually better.",
    name: "Marcus T.",
    title: "Head of Product, Launchd",
    avatar: "MT",
  },
  {
    quote: "That 2-line install is not a joke. I shipped NPS surveys to our app in literally 5 minutes.",
    name: "Priya R.",
    title: "Co-founder, ShipFast",
    avatar: "PR",
  },
];

const PRICING_TIERS = [
  {
    name: "Starter",
    price: "Free",
    features: ["500 responses/mo", "1 workspace", "NPS widget", "Email support"],
    cta: "Get started",
    highlight: false,
  },
  {
    name: "Growth",
    price: "$9",
    features: ["5,000 responses/mo", "3 workspaces", "NPS + CSAT + CES", "Segments", "CSV export", "Priority support"],
    cta: "Start free trial",
    highlight: true,
  },
  {
    name: "Pro",
    price: "$25",
    features: ["Unlimited responses", "Unlimited workspaces", "All survey types", "API access", "Slack + Zapier", "White-label", "Dedicated support"],
    cta: "Contact us",
    highlight: false,
  },
];

function CellValue({ val }: { val: boolean | string | undefined }) {
  if (val === true) return <CHECK />;
  if (val === false) return <X_MARK />;
  if (val === "paid") return <span className="text-yellow-400 text-xs">paid</span>;
  return <span className="text-gray-300 text-sm">{val}</span>;
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Sticky nav */}
      <nav className="sticky top-0 z-50 bg-[#0f172a]/90 backdrop-blur border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-sky-500 rounded-md flex items-center justify-center">
              <span className="text-white text-sm font-bold">N</span>
            </div>
            <span className="font-bold text-white text-lg">NPSKit</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <a href="#" className="hover:text-white transition-colors">Docs</a>
          </div>

          <Link
            href="/signup"
            className="bg-sky-500 hover:bg-sky-400 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-400 border border-orange-500/20 px-4 py-2 rounded-full text-sm font-medium mb-8">
          <span>⚡</span>
          <span>Delighted is shutting down June 30 — We&apos;re the $9 alternative</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          Know what your users<br />
          <span className="text-sky-400">really think</span>
        </h1>

        <p className="text-xl text-gray-400 max-w-xl mx-auto mb-10">
          Drop one script. Get NPS + CSAT surveys that run automatically. No friction, no $49/mo tools.
        </p>

        <div className="flex gap-4 justify-center flex-wrap mb-12">
          <Link
            href="/signup"
            className="bg-sky-500 hover:bg-sky-400 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
          >
            Start free
          </Link>
          <Link
            href="/pricing"
            className="border border-gray-700 hover:border-gray-500 text-gray-300 px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
          >
            See pricing
          </Link>
        </div>

        {/* Code snippet */}
        <div className="max-w-xl mx-auto bg-gray-900 border border-gray-800 rounded-xl p-5 text-left">
          <p className="text-gray-500 text-xs mb-3">Install in 2 lines:</p>
          <pre className="text-sm text-sky-400 font-mono overflow-auto">
{`<script src="https://npskit.threestack.io/api/widget.js"></script>
<script>NPSKit.init({ apiKey: 'nk_live_...', surveyId: '...' })</script>`}
          </pre>
        </div>
      </section>

      {/* Social proof bar */}
      <section className="border-y border-gray-800 bg-gray-900/50 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-gray-400 text-sm mb-6">Join 500+ SaaS teams collecting better feedback</p>
          <div className="flex gap-8 justify-center flex-wrap items-center">
            {["Acme Corp", "Vercel Co", "Stripe Inc", "Linear HQ", "Notion Co"].map((name) => (
              <div key={name} className="text-gray-600 font-semibold text-sm tracking-wide uppercase">
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-white mb-3">Everything you need, nothing you don&apos;t</h2>
          <p className="text-gray-400">One tool. Three survey types. Zero friction.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
              <span className="text-3xl mb-4 block">{f.icon}</span>
              <h3 className="text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison table */}
      <section className="bg-gray-900/50 border-y border-gray-800 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">How we compare</h2>
            <p className="text-gray-400">Spoiler: you&apos;re getting more for 5× less</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm w-40">Feature</th>
                  <th className="py-3 px-4 text-sky-400 font-semibold text-sm">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="w-5 h-5 bg-sky-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">N</span>
                      </div>
                      NPSKit
                    </div>
                  </th>
                  <th className="py-3 px-4 text-gray-400 font-medium text-sm">Delighted</th>
                  <th className="py-3 px-4 text-gray-400 font-medium text-sm">Survicate</th>
                  <th className="py-3 px-4 text-gray-400 font-medium text-sm">Retently</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {COMPARISON.map((row) => (
                  <tr key={row.label} className="hover:bg-gray-900/50">
                    <td className="py-3 px-4 text-gray-300 text-sm">{row.label}</td>
                    <td className="py-3 px-4 text-center"><div className="flex justify-center"><CellValue val={row.npskit} /></div></td>
                    <td className="py-3 px-4 text-center"><div className="flex justify-center"><CellValue val={row.delighted} /></div></td>
                    <td className="py-3 px-4 text-center"><div className="flex justify-center"><CellValue val={row.survicate} /></div></td>
                    <td className="py-3 px-4 text-center"><div className="flex justify-center"><CellValue val={row.retently} /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Migration CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-2xl p-10 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 px-4 py-1.5 rounded-full text-sm font-medium mb-5">
            🚨 Delighted shutting down June 30, 2026
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Migrate in 5 minutes</h2>
          <p className="text-gray-400 max-w-md mx-auto mb-8">
            Import your existing responses via CSV. Your history, your data, your NPS trend — intact.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-sky-500 hover:bg-sky-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Start migrating →
            </Link>
            <a href="#" className="border border-gray-700 hover:border-gray-500 text-gray-300 px-6 py-3 rounded-lg font-semibold transition-colors">
              Read migration guide
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-900/50 border-y border-gray-800 py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-14">Up and running in 3 steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Install the script", desc: "Drop 2 lines of HTML into your app. That's it. No build step." },
              { step: "2", title: "Surveys run automatically", desc: "NPSKit triggers surveys based on your rules — page load, scroll, exit intent." },
              { step: "3", title: "View NPS in dashboard", desc: "Real-time score gauge, trend charts, and response table. No setup required." },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="w-10 h-10 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 font-bold text-lg flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">Loved by indie teams</h2>
          <p className="text-gray-400">SaaS founders who switched from Delighted</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <p className="text-gray-300 text-sm leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-sky-400">{t.avatar}</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{t.name}</p>
                  <p className="text-gray-500 text-xs">{t.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing preview */}
      <section className="bg-gray-900/50 border-y border-gray-800 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Simple pricing</h2>
            <p className="text-gray-400">No surprises. Cancel anytime.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-xl p-6 border ${
                  tier.highlight
                    ? "border-sky-500 shadow-lg shadow-sky-500/10 bg-sky-500/5"
                    : "border-gray-800 bg-gray-900"
                }`}
              >
                {tier.highlight && (
                  <div className="inline-flex items-center bg-sky-500/10 text-sky-400 text-xs font-medium px-2.5 py-1 rounded-full border border-sky-500/20 mb-3">
                    Most Popular
                  </div>
                )}
                <h3 className="text-white font-semibold mb-1">{tier.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-bold text-white">{tier.price}</span>
                  {tier.price !== "Free" && <span className="text-gray-400 text-sm">/mo</span>}
                </div>
                <ul className="space-y-2 mb-6">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                      <CHECK />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`block w-full text-center py-2 rounded-lg font-semibold text-sm transition-colors ${
                    tier.highlight
                      ? "bg-sky-500 hover:bg-sky-400 text-white"
                      : "border border-gray-700 hover:border-gray-600 text-gray-300"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/pricing" className="text-sky-400 hover:text-sky-300 text-sm font-medium">
              See full pricing & comparison →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h2 className="text-4xl font-bold text-white mb-4">
          Start collecting NPS today
        </h2>
        <p className="text-gray-400 mb-8 text-lg">Free plan. No credit card. Takes 5 minutes.</p>
        <Link
          href="/signup"
          className="inline-block bg-sky-500 hover:bg-sky-400 text-white px-10 py-4 rounded-lg font-semibold text-lg transition-colors"
        >
          Get started free →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-sky-500 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">N</span>
            </div>
            <span className="text-gray-400 text-sm font-medium">NPSKit</span>
          </div>

          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Features</a>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <a href="#" className="hover:text-white transition-colors">Docs</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>

          <p className="text-gray-600 text-sm">© 2026 NPSKit · Made by ThreeStack</p>
        </div>
      </footer>
    </div>
  );
}
