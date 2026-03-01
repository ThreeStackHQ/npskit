"use client";

import Link from "next/link";
import { useState } from "react";

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-sky-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-4 h-4 text-gray-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

const TIERS = [
  {
    name: "Starter",
    monthlyPrice: 0,
    annualPrice: 0,
    priceLabel: "Free",
    annualLabel: "Free",
    desc: "For indie developers getting started",
    features: [
      "500 responses/month",
      "1 workspace",
      "NPS widget only",
      "Email support",
    ],
    cta: "Get started free",
    ctaLink: "/signup",
    highlight: false,
  },
  {
    name: "Growth",
    monthlyPrice: 9,
    annualPrice: 7,
    priceLabel: "$9",
    annualLabel: "$7",
    desc: "For growing SaaS teams",
    features: [
      "5,000 responses/month",
      "3 workspaces",
      "NPS + CSAT + CES",
      "Segment analysis",
      "CSV export",
      "Priority support",
    ],
    cta: "Start free trial",
    ctaLink: "/signup",
    highlight: true,
    badge: "Most Popular",
  },
  {
    name: "Pro",
    monthlyPrice: 25,
    annualPrice: 20,
    priceLabel: "$25",
    annualLabel: "$20",
    desc: "For scaling teams & agencies",
    features: [
      "Unlimited responses",
      "Unlimited workspaces",
      "All survey types",
      "API access",
      "Slack + Zapier integrations",
      "White-label widget",
      "Dedicated support",
    ],
    cta: "Contact us",
    ctaLink: "/signup",
    highlight: false,
  },
];

const COMPARISON_ROWS: { label: string; starter: boolean | string; growth: boolean | string; pro: boolean | string }[] = [
  { label: "Responses/month", starter: "500", growth: "5,000", pro: "Unlimited" },
  { label: "Workspaces", starter: "1", growth: "3", pro: "Unlimited" },
  { label: "NPS surveys", starter: true, growth: true, pro: true },
  { label: "CSAT surveys", starter: false, growth: true, pro: true },
  { label: "CES surveys", starter: false, growth: true, pro: true },
  { label: "Custom questions", starter: false, growth: true, pro: true },
  { label: "Segment analysis", starter: false, growth: true, pro: true },
  { label: "Trend charts", starter: true, growth: true, pro: true },
  { label: "CSV export", starter: false, growth: true, pro: true },
  { label: "CSV import (from Delighted)", starter: true, growth: true, pro: true },
  { label: "API access", starter: false, growth: false, pro: true },
  { label: "Slack alerts", starter: false, growth: false, pro: true },
  { label: "Zapier integration", starter: false, growth: false, pro: true },
  { label: "White-label widget", starter: false, growth: false, pro: true },
  { label: "Team seats", starter: "1", growth: "3", pro: "Unlimited" },
  { label: "Response webhooks", starter: false, growth: true, pro: true },
  { label: "Multi-language widget", starter: false, growth: true, pro: true },
  { label: "Custom branding", starter: false, growth: false, pro: true },
  { label: "SLA uptime guarantee", starter: false, growth: false, pro: true },
  { label: "Dedicated support", starter: false, growth: false, pro: true },
];

const FAQS = [
  {
    q: "Is there a free trial?",
    a: "Yes — the Growth plan comes with a 14-day free trial, no credit card required. You can explore all features before committing.",
  },
  {
    q: "What counts as a response?",
    a: "A response is counted each time a user submits an NPS, CSAT, or CES survey. Partial completions (widget opened but not submitted) don't count.",
  },
  {
    q: "Can I export my data?",
    a: "Yes! Growth and Pro plans include full CSV export of all responses, including scores, comments, user identifiers, and timestamps.",
  },
  {
    q: "What happens if I cancel?",
    a: "You keep access until the end of your billing period. After that, your account downgrades to Starter (free). Your data is retained for 30 days.",
  },
  {
    q: "Can I import from Delighted?",
    a: "Absolutely. All plans include CSV import so you can bring your historical Delighted data over. We also have a migration guide to walk you through it.",
  },
];

function CellValue({ val }: { val: boolean | string }) {
  if (val === true) return <div className="flex justify-center"><CheckIcon /></div>;
  if (val === false) return <div className="flex justify-center"><XIcon /></div>;
  return <div className="text-center text-gray-300 text-sm">{val}</div>;
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#0f172a]/90 backdrop-blur border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-sky-500 rounded-md flex items-center justify-center">
              <span className="text-white text-sm font-bold">N</span>
            </div>
            <span className="font-bold text-white text-lg">NPSKit</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <Link href="/#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="/pricing" className="text-white font-medium">Pricing</Link>
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

      {/* Header */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Simple, indie-friendly pricing
        </h1>
        <p className="text-gray-400 text-lg mb-10">No hidden fees. Cancel anytime. Start free.</p>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl p-1.5">
          <button
            onClick={() => setAnnual(false)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !annual ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              annual ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Annual
            <span className="bg-green-500/20 text-green-400 text-xs px-1.5 py-0.5 rounded-full border border-green-500/20">
              2 months free
            </span>
          </button>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TIERS.map((tier) => {
            const price = annual ? tier.annualLabel : tier.priceLabel;
            return (
              <div
                key={tier.name}
                className={`rounded-2xl p-7 border flex flex-col ${
                  tier.highlight
                    ? "border-sky-500 shadow-xl shadow-sky-500/10 bg-sky-500/5"
                    : "border-gray-800 bg-gray-900"
                }`}
              >
                {tier.badge && (
                  <div className="inline-flex items-center bg-sky-500/10 text-sky-400 text-xs font-medium px-2.5 py-1 rounded-full border border-sky-500/20 mb-4 w-fit">
                    {tier.badge}
                  </div>
                )}
                <h3 className="text-white font-bold text-xl mb-1">{tier.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{tier.desc}</p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-white">{price}</span>
                  {tier.monthlyPrice > 0 && <span className="text-gray-400 text-sm">/mo</span>}
                  {annual && tier.monthlyPrice > 0 && (
                    <span className="text-gray-500 text-xs ml-1">billed annually</span>
                  )}
                </div>

                <ul className="space-y-2.5 flex-1 mb-7">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
                      <CheckIcon />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={tier.ctaLink}
                  className={`block w-full text-center py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                    tier.highlight
                      ? "bg-sky-500 hover:bg-sky-400 text-white"
                      : "border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Migration callout */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="bg-sky-500/5 border border-sky-500/20 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6 justify-between">
          <div>
            <p className="text-sky-400 text-sm font-medium mb-1">⚡ Migrating from Delighted?</p>
            <h3 className="text-white text-xl font-bold mb-1">Import your data in 5 minutes</h3>
            <p className="text-gray-400 text-sm">All plans include CSV import. Your history comes with you.</p>
          </div>
          <Link
            href="/signup"
            className="shrink-0 bg-sky-500 hover:bg-sky-400 text-white px-6 py-3 rounded-xl font-semibold transition-colors whitespace-nowrap"
          >
            Import from Delighted →
          </Link>
        </div>
      </section>

      {/* Feature comparison table */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">Full feature comparison</h2>
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900">
                <th className="text-left py-4 px-5 text-gray-400 font-medium text-sm w-52">Feature</th>
                <th className="py-4 px-4 text-gray-300 font-semibold text-sm text-center">Starter</th>
                <th className="py-4 px-4 text-sky-400 font-semibold text-sm text-center">
                  Growth ⭐
                </th>
                <th className="py-4 px-4 text-gray-300 font-semibold text-sm text-center">Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 bg-gray-900/50">
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.label} className="hover:bg-gray-900/80">
                  <td className="py-3 px-5 text-gray-400 text-sm">{row.label}</td>
                  <td className="py-3 px-4"><CellValue val={row.starter} /></td>
                  <td className="py-3 px-4 bg-sky-500/[0.03]"><CellValue val={row.growth} /></td>
                  <td className="py-3 px-4"><CellValue val={row.pro} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">Frequently asked questions</h2>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
              >
                <span className="text-white font-medium text-sm">{faq.q}</span>
                <span className="text-gray-400 shrink-0 text-lg leading-none">
                  {openFaq === i ? "−" : "+"}
                </span>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4">
                  <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-gray-900/50 border-y border-gray-800 py-20">
        <div className="max-w-xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Start free, upgrade when ready</h2>
          <p className="text-gray-400 mb-8">No credit card needed. Set up in 5 minutes.</p>
          <Link
            href="/signup"
            className="inline-block bg-sky-500 hover:bg-sky-400 text-white px-10 py-3.5 rounded-xl font-semibold text-base transition-colors"
          >
            Create free account →
          </Link>
        </div>
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
            <Link href="/#features" className="hover:text-white transition-colors">Features</Link>
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
