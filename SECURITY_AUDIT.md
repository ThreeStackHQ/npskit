# NPSKit Security Audit Report — Sprint 4.4

**Date:** 2026-03-01  
**Auditor:** Sage (automated security audit sub-agent)  
**Repo:** https://github.com/ThreeStackHQ/npskit  
**Scope:** Full codebase — Next.js 14, TypeScript, Drizzle ORM (PostgreSQL), NextAuth v5, Stripe, vanilla JS widget

---

## Executive Summary

NPSKit has a solid security foundation. All database queries use parameterised Drizzle ORM queries (no SQL injection risk), authentication middleware correctly protects the dashboard, the Stripe webhook verifies signatures, and Zod validation is applied consistently across API routes. No hardcoded secrets were found.

Two actionable security issues were identified: a missing ownership check (IDOR) in the survey listing endpoint, and a potential stored XSS in the widget via unescaped `innerHTML`. Rate limiting on the public response endpoint is in-memory only and is bypassed entirely for anonymous submissions.

**Overall verdict:** 1 HIGH, 2 MEDIUM, 1 LOW finding. Not blocking for integration testing, but the IDOR must be patched before launch.

---

## Findings

### SEC-001 — IDOR: Missing Ownership Check in GET /api/surveys ❌ HIGH

**File:** `apps/web/app/api/surveys/route.ts` (lines ~45–65)

The `GET /api/surveys?workspaceId=<id>` endpoint requires authentication but does **not** verify that the authenticated user owns the requested workspace. The comment reads `// Verify ownership` but the query only checks workspace existence:

```ts
const ws = await db
  .select({ id: workspaces.id })
  .from(workspaces)
  .where(eq(workspaces.id, workspaceId))  // ← missing ownerId check!
  .limit(1);
```

**Impact:** Any logged-in user who discovers or guesses another user's `workspaceId` (a CUID, not a UUID — but still predictable via the API) can list all surveys for that workspace.

**Note:** `getWorkspaceIdForUser()` is defined in the same file but is not used in the GET handler, and the function itself also fails to filter by `userId`.

**Fix:**

```ts
// Add ownerId to the WHERE clause:
.where(and(eq(workspaces.id, workspaceId), eq(workspaces.ownerId, session!.user!.id!)))
```

---

### SEC-002 — Stored XSS: Widget innerHTML with Unsanitised Survey Config ⚠️ MEDIUM

**File:** `packages/widget/src/index.ts` (line 122)

The widget renders `promptText` and `followUpText` from the server-fetched survey config directly into `innerHTML` without HTML escaping:

```ts
wrap.innerHTML = `<div id="nk-box" style="position:relative">
    ...
    <p id="nk-title">${prompt}</p>       <!-- promptText from DB -->
    ...
    <textarea ... placeholder="${followUp}" ...>  <!-- followUpText from DB -->
```

`prompt` = `cfg.promptText ?? "How likely are you to recommend us..."` — sourced from `/api/surveys/[id]/widget-config` → database.

**Impact:** In the current implementation, only the authenticated workspace owner can set `promptText`/`followUpText` via PATCH `/api/surveys/[id]`. So this is currently a self-XSS risk. However:

1. If the SEC-001 IDOR (or a future bug) allows an attacker to modify survey config, they can inject arbitrary JavaScript into **every customer website** that embeds the widget. This becomes a supply-chain attack.
2. Account takeover (phishing, credential stuffing, etc.) + this innerHTML pattern = widespread XSS on customer websites.

**Fix:** Use `textContent` (for `<p>` and `<textarea>` placeholders) instead of embedding in a template literal:

```ts
const box = document.createElement("div");
// ...build DOM with createElement + textContent instead of innerHTML
const title = document.getElementById("nk-title");
if (title) title.textContent = prompt;
```

Or at minimum, escape HTML entities before interpolation:

```ts
function escapeHtml(str: string): string {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
            .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
```

---

### SEC-003 — Rate Limiting: In-Memory Only + Anonymous Bypass ⚠️ MEDIUM

**File:** `apps/web/app/api/respond/route.ts` (lines 12–14, 44–53)

```ts
// In-memory rate limit: surveyId:userIdentifier → last response timestamp
const rateLimit = new Map<string, number>();
```

Two issues:

1. **Serverless/multi-instance environments** reset this `Map` on every cold start and it is not shared across concurrent function instances. In production (Vercel, Coolify with multiple replicas), the rate limit is effectively non-functional.

2. **Anonymous submissions are unlimited.** Rate limiting only activates when `userIdentifier` is supplied:
   ```ts
   if (userIdentifier) { // ← rate limit only runs here
     ...
   }
   ```
   An attacker can spam unlimited responses simply by omitting `userIdentifier` from the POST body.

**Impact:** Survey response data can be poisoned with spam (fake scores), skewing NPS metrics. Response count limits (tier enforcement) can be quickly exhausted.

**Fix:**
- Use Redis-backed or DB-backed rate limiting (e.g., Upstash Ratelimit).
- Apply a fallback IP-based rate limit when `userIdentifier` is absent: read `req.headers.get("x-forwarded-for")` and rate-limit by IP.

---

### SEC-004 — No AUTH_SECRET Startup Guard ⚠️ LOW

**File:** `apps/web/auth.ts`

NextAuth v5 requires `AUTH_SECRET` to be set for secure JWT signing. There is no explicit startup check — if the environment variable is absent in production, NextAuth may emit a warning (or silently use an insecure fallback in older minor versions).

**Fix:** Add an explicit guard in `auth.ts` or `next.config.mjs`:

```ts
if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
  throw new Error("AUTH_SECRET is required in production");
}
```

---

## Passed Checks ✅

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1 | **SQL Injection** | ✅ PASS | All queries use Drizzle ORM parameterised builder. No `sql\`...\${userInput}\`` found anywhere. |
| 2 | **Auth Middleware** | ✅ PASS | `middleware.ts` correctly uses `matcher: ["/dashboard/:path*"]` and redirects unauthenticated users. Layout also double-checks (`auth()` → `redirect("/login")`). |
| 3 | **IDOR — Individual Survey** | ✅ PASS | `getSurveyForUser()` in `apps/web/app/api/surveys/[id]/route.ts` joins on `workspaces.ownerId` and verifies ownership before GET/PATCH/DELETE. |
| 4 | **IDOR — Survey Responses** | ✅ PASS | `surveyBelongsToUser()` in `apps/web/app/api/surveys/[id]/responses/route.ts` uses `and(eq(surveys.id, surveyId), eq(workspaces.ownerId, userId))`. |
| 5 | **IDOR — Stats Endpoint** | ✅ PASS | Same `surveyBelongsToUser()` pattern in `apps/web/app/api/surveys/[id]/stats/route.ts`. |
| 6 | **IDOR — Export Endpoint** | ✅ PASS | `apps/web/app/api/surveys/[id]/export/route.ts` uses inner join with `workspaces.ownerId` check. |
| 7 | **IDOR — API Key Endpoint** | ✅ PASS | `apps/web/app/api/workspaces/[id]/api-key/route.ts` uses `and(eq(workspaces.id, ...), eq(workspaces.ownerId, session.user.id))`. |
| 8 | **Stripe Webhook Signature** | ✅ PASS | `apps/web/app/api/stripe/webhook/route.ts` uses `stripe.webhooks.constructEvent(body, signature, webhookSecret)`. Returns 400 on invalid signature. |
| 9 | **Widget Endpoint Auth** | ✅ PASS | `/api/surveys/[id]/widget-config` requires API key and verifies the survey belongs to the API key's workspace (`and(eq(surveys.id, id), eq(surveys.workspaceId, ws.id))`). |
| 10 | **Input Validation (Zod)** | ✅ PASS | Zod schemas on all mutating API routes: `signupSchema`, `signInSchema`, `createSchema`, `updateSchema`, `respondSchema`, `checkoutSchema`. |
| 11 | **CORS Configuration** | ✅ PASS | Wildcard CORS (`Access-Control-Allow-Origin: *`) is correct for the public widget endpoints (`/api/respond`, `/api/surveys/[id]/widget-config`, `/api/widget.js`). Dashboard/auth routes do not set CORS headers. |
| 12 | **Environment Variables** | ✅ PASS | No hardcoded secrets. All sensitive values reference `process.env.*`. `.env.example` contains placeholder values only. |
| 13 | **Password Security** | ✅ PASS | `bcrypt.hash(password, 12)` — cost factor 12 is appropriate. Zod enforces min 8, max 72 chars (bcrypt truncation boundary). |
| 14 | **JWT Session Security** | ✅ PASS | `strategy: "jwt"`, `maxAge: 30 * 24 * 60 * 60`. `userId` correctly propagated via JWT callback. |
| 15 | **Stripe Checkout IDOR** | ✅ PASS | `apps/web/app/api/stripe/checkout/route.ts` verifies `workspaces.ownerId === session.user.id` before creating a Stripe session. |
| 16 | **Response Data Protection** | ✅ PASS | `userIdentifier` is optional, not required. Responses accessible only to authenticated workspace owners via ownership-checked endpoints. |
| 17 | **Survey Enumeration** | ✅ PASS | `/api/respond` looks up surveys by ID and returns 404 (not a different error) for inactive/missing surveys — no oracle to distinguish the two. |

---

## Findings Summary

| ID | Severity | Title | Status |
|----|----------|-------|--------|
| SEC-001 | HIGH | IDOR in `GET /api/surveys` — missing ownership check | ❌ Open |
| SEC-002 | MEDIUM | Stored XSS: widget `innerHTML` with unsanitised survey config | ❌ Open |
| SEC-003 | MEDIUM | Rate limiting in-memory only; anonymous submissions unlimited | ❌ Open |
| SEC-004 | LOW | No `AUTH_SECRET` startup guard | ❌ Open |

---

## Recommended Fix Priority

1. **Immediately (pre-integration):** SEC-001 — one-line fix, add `ownerId` to WHERE clause
2. **Pre-launch:** SEC-002 — refactor widget to avoid `innerHTML` for dynamic content
3. **Pre-launch:** SEC-003 — add Redis/DB-backed rate limiting with IP fallback
4. **Post-launch:** SEC-004 — add startup env var guard

---

*Audit generated by Sage v1 — Sprint 4.4 automated security review.*
