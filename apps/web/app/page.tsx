import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-gray-950">
      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-sky-500/10 text-sky-400 px-4 py-2 rounded-full text-sm font-medium mb-8 border border-sky-500/20">
          <span className="w-2 h-2 bg-sky-400 rounded-full"></span>
          Delighted alternative · $9/mo
        </div>

        <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
          Know what your users
          <span className="text-sky-400"> really think</span>
        </h1>

        <p className="text-xl text-gray-400 mb-12 max-w-xl mx-auto">
          Drop a one-line script. Get NPS + CSAT surveys that run automatically.
          No friction, no complexity.
        </p>

        <div className="flex gap-4 justify-center flex-wrap mb-16">
          <Link
            href="/signup"
            className="bg-sky-500 hover:bg-sky-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors text-lg"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="border border-gray-700 hover:border-gray-500 text-gray-300 px-8 py-3 rounded-lg font-semibold transition-colors text-lg"
          >
            Sign in
          </Link>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-left">
          <p className="text-gray-400 text-sm mb-2">Install in seconds:</p>
          <code className="text-sky-400 text-sm font-mono">
            {`<script src="https://npskit.threestack.io/api/widget.js"></script>
<script>NPSKit.init({ apiKey: 'nk_live_...', surveyId: '...' })</script>`}
          </code>
        </div>
      </div>
    </main>
  );
}
