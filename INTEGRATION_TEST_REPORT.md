# NPSKit [Sprint 4.5] — Integration Test Report

**Date:** 2026-03-01  
**Tester:** Sage (automated QA sub-agent)  
**Repo:** https://github.com/ThreeStackHQ/npskit  
**Method:** Static code analysis across all API routes, pages, middleware, and the widget package  
**Scope:** 24 integration test cases across 9 flows  

---

## Executive Summary

NPSKit has a solid auth and CRUD foundation, with proper Zod validation, bcrypt passwords, and JWT sessions. However, **3 P0 blockers** prevent deployment: an IDOR vulnerability in survey listing (SEC-001, unpatched from Sprint 4.4), hardcoded mock data on the main dashboard page, and an unbuilt widget JS bundle. Additionally, the Stripe upgrade flow is broken from the UI (form sends form-encoded data; API expects JSON).

**Overall verdict: NOT deployment-ready.**

---

## Score

| Result | Count |
|--------|-------|
| ✅ PASS | 19 |
| ⚠️ PARTIAL | 2 |
| ❌ FAIL | 3 |
| **Total** | **24** |

---

## Flow Results

### 1. Auth Flow: Signup → Login → JWT Session

| # | Test Case | Result | Notes |
|---|-----------|--------|-------|
| 1.1 | `POST /api/auth/signup` — creates user, workspace, free subscription | ✅ PASS | bcrypt(12), email uniqueness check, CUID IDs, workspace auto-created |
| 1.2 | `POST /api/auth/signup` — rejects duplicate email → 409 | ✅ PASS | Explicit duplicate check before insert |
| 1.3 | NextAuth Credentials login — password compared with bcryptjs, JWT issued | ✅ PASS | `strategy: "jwt"`, maxAge 30 days, userId propagated via `token["userId"]` |
| 1.4 | JWT session callback populates `session.user.id` | ✅ PASS | Verified in `auth.ts` callbacks |

**Summary:** Auth flow is complete and secure. ✅

---

### 2. Workspace Creation and Ownership

| # | Test Case | Result | Notes |
|---|-----------|--------|-------|
| 2.1 | `GET /api/workspaces` — returns only authenticated user's workspaces | ✅ PASS | `WHERE ownerId = session.user.id` correctly applied |
| 2.2 | `POST /api/workspaces` — creates workspace + free subscription | ✅ PASS | Slug uniqueness enforced, subscription row created |
| 2.3 | `POST /api/workspaces` — free tier limited to 1 workspace | ✅ PASS | Returns 403 "Upgrade to create multiple workspaces" if existing workspace found |
| 2.4 | `GET /api/workspaces/[id]/api-key` — returns API key only for own workspace | ✅ PASS | `AND(workspaces.id = id, workspaces.ownerId = userId)` |

**Summary:** Workspace creation and ownership fully implemented. ✅

---

### 3. Survey CRUD with Ownership Checks (SEC-001 IDOR Assessment)

| # | Test Case | Result | Notes |
|---|-----------|--------|-------|
| 3.1 | `GET /api/surveys?workspaceId=X` — IDOR check: ownership verified? | ❌ **FAIL** | **SEC-001 UNPATCHED.** Query only checks workspace existence, NOT `ownerId`. Any authenticated user can list surveys for any workspace ID. See detail below. |
| 3.2 | `POST /api/surveys` — creates survey only for own workspace | ✅ PASS | `ws.ownerId !== session.user.id` check present, returns 404 if not owned |
| 3.3 | `GET /api/surveys/[id]` — ownership enforced | ✅ PASS | `getSurveyForUser()` inner joins `workspaces.ownerId = userId` |
| 3.4 | `PATCH /api/surveys/[id]` — ownership enforced | ✅ PASS | Same `getSurveyForUser()` ownership gate |
| 3.5 | `DELETE /api/surveys/[id]` — ownership enforced | ✅ PASS | Same `getSurveyForUser()` ownership gate |
| 3.6 | `GET /api/surveys/[id]/responses` — ownership enforced | ✅ PASS | `surveyBelongsToUser()` joins `workspaces.ownerId` |
| 3.7 | `GET /api/surveys/[id]/export` — ownership enforced, CSV output | ✅ PASS | Inner join on `workspaces.ownerId`; proper `Content-Disposition` header |

**FAIL Detail — SEC-001 (line ~45, `apps/web/app/api/surveys/route.ts`):**

```ts
// Current (VULNERABLE):
const ws = await db
  .select({ id: workspaces.id })
  .from(workspaces)
  .where(eq(workspaces.id, workspaceId))  // ← no ownerId check!
  .limit(1);

// Fix required:
.where(and(eq(workspaces.id, workspaceId), eq(workspaces.ownerId, session!.user!.id!)))
```

**Impact:** Any authenticated user who discovers or guesses another user's `workspaceId` (a CUID string available via their own profile/URL) can list all surveys in that workspace.

---

### 4. Response Ingestion (`POST /api/respond`)

| # | Test Case | Result | Notes |
|---|-----------|--------|-------|
| 4.1 | Submit NPS response (score 0–10) — stored in DB | ✅ PASS | Survey lookup by ID, workspace derived, response inserted |
| 4.2 | Submit CSAT response (score 1–5) — validated | ✅ PASS | Score range validation per survey type |
| 4.3 | Submit to inactive/missing survey → 404 | ✅ PASS | `!survey.isActive` check present |
| 4.4 | Rate limiting: in-memory + anonymous bypass | ⚠️ **PARTIAL** | **SEC-003 UNPATCHED.** Rate limit only activates when `userIdentifier` is provided. Anonymous submissions (no `userIdentifier`) are unlimited. In-memory `Map` is reset on cold starts in serverless/multi-instance environments. |

**PARTIAL Detail — SEC-003:**
- Rate limit key: `${surveyId}:${userIdentifier}` — only applies when `userIdentifier` present
- No IP-based fallback for anonymous submissions
- In a Vercel/Coolify multi-instance deployment, the `Map` is not shared between instances — effectively non-functional

---

### 5. Dashboard Stats — Real vs Hardcoded Data

| # | Test Case | Result | Notes |
|---|-----------|--------|-------|
| 5.1 | `GET /api/surveys/[id]/stats` — real DB calculation | ✅ PASS | Calculates NPS/CSAT from actual response rows; 90-day trend grouped by ISO week |
| 5.2 | `/dashboard` page — NPS score and recent responses are real data | ❌ **FAIL** | **P0 BUG.** Main dashboard page uses hardcoded mock data (see detail below) |
| 5.3 | `/dashboard/responses` page — real DB query | ✅ PASS | Joins `responses` + `surveys`, filters by `workspaceId`, real data |

**FAIL Detail — Hardcoded Mock Dashboard (`apps/web/app/(dashboard)/dashboard/page.tsx`):**

```ts
// HARDCODED values — never reflects real user data:
const npsScore = 42;
const promoterPct = 58;
const passivePct = 26;
const detractorPct = 16;
const totalResponses = 247;

const MOCK_TREND = getMockTrendData();  // random values generated at render time

const MOCK_RESPONSES = [
  { id: "1", score: 10, comment: "Absolutely love it, so much better than Delighted!", date: "Mar 1, 2026" },
  // ...5 more static entries
];
```

All users see NPS = 42 and the same 6 fake responses on the main dashboard, regardless of their actual data. This is a P0 data integrity issue that would mislead every paying customer.

**Fix required:** Replace with real DB queries using `/api/surveys/[id]/stats` data, similar to the pattern in the Responses page.

---

### 6. Widget — Loading and API Integration

| # | Test Case | Result | Notes |
|---|-----------|--------|-------|
| 6.1 | `GET /api/widget.js` — serves widget bundle with CORS | ❌ **FAIL** | `packages/widget/dist/widget.js` does **not exist** in the repo. Endpoint falls back to `// Widget not built yet` — a no-op JavaScript comment. |
| 6.2 | Widget source calls real API (`/api/respond`) | ✅ PASS | Source-level: `fetch(\`\${getApiUrl()}/api/respond\`, ...)` correctly sends to the NPSKit server |
| 6.3 | Widget config endpoint requires valid API key | ✅ PASS | `GET /api/surveys/[id]/widget-config` validates API key → workspace → survey ownership |
| 6.4 | Widget injects UI via DOM correctly | ✅ PASS | TypeScript source builds proper DOM structure with NPS (0-10) and CSAT (star) modes |
| 6.5 | SEC-002 Widget XSS — `promptText`/`followUpText` escaped? | ❌ **FAIL** | **SEC-002 UNPATCHED.** `wrap.innerHTML` contains unescaped `${prompt}` and `${followUp}` from server config. Stored XSS risk on every customer site embedding the widget. |

**FAIL Detail — Widget Not Built:**

`/api/widget.js/route.ts` reads from `packages/widget/dist/widget.js` using `readFileSync`. The `dist/` directory does not exist in the repository and must be built via `pnpm build` in the widget package. Without this, every customer embedding `<script src="/api/widget.js">` gets a no-op comment — the widget is completely non-functional in production.

**Fix:** Either commit `dist/widget.js` to the repo or add a build step to the deployment pipeline before the Next.js app starts.

---

### 7. Stripe — Checkout and Webhook

| # | Test Case | Result | Notes |
|---|-----------|--------|-------|
| 7.1 | `POST /api/stripe/checkout` — workspace ownership verified before creating session | ✅ PASS | `AND(workspaces.id, workspaces.ownerId = userId)` checked |
| 7.2 | Stripe customer created or reused | ✅ PASS | Looks up existing `stripeCustomerId` from subscriptions; creates if absent |
| 7.3 | Settings page Stripe upgrade form → API call | ⚠️ **PARTIAL** | **BUG:** Settings form uses HTML `<form action="/api/stripe/checkout" method="POST">` which sends `application/x-www-form-urlencoded` data. API handler uses `req.json()` → will throw/return 400. Checkout is broken from the UI. |
| 7.4 | Stripe webhook — signature verified | ✅ PASS | `stripe.webhooks.constructEvent(body, signature, webhookSecret)` — returns 400 on invalid signature |
| 7.5 | Webhook handles `checkout.session.completed` | ✅ PASS | Updates subscription tier, stripeCustomerId, stripeSubscriptionId, currentPeriodEnd |
| 7.6 | Webhook handles `customer.subscription.updated` | ✅ PASS | Updates status and period end |
| 7.7 | Webhook handles `customer.subscription.deleted` | ✅ PASS | Downgrades to free, clears subscription IDs |

**PARTIAL Detail — Settings Billing Form (Bug):**

```tsx
// apps/web/app/(dashboard)/dashboard/settings/page.tsx
<form action="/api/stripe/checkout" method="POST">
  <input type="hidden" name="workspaceId" value={ws.id} />
  <input type="hidden" name="tier" value={t} />
  <button type="submit">Upgrade to {t}</button>
</form>
```

This sends `Content-Type: application/x-www-form-urlencoded`. The handler calls `await req.json()` which will fail on form-encoded bodies. Must convert to a `fetch()` POST with `JSON.stringify` or add a client component handler.

---

### 8. Middleware — Route Protection

| # | Test Case | Result | Notes |
|---|-----------|--------|-------|
| 8.1 | Dashboard routes (`/dashboard/*`) protected by middleware | ✅ PASS | `matcher: ["/dashboard/:path*"]` — redirects unauthenticated requests to `/login` |
| 8.2 | Dashboard layout double-checks auth | ✅ PASS | `auth()` → `redirect("/login")` in layout.tsx provides defence-in-depth |
| 8.3 | Public widget endpoints accessible without auth | ✅ PASS | `/api/respond`, `/api/widget.js`, `/api/surveys/[id]/widget-config` not in middleware matcher |
| 8.4 | CORS headers on public widget endpoints | ✅ PASS | `Access-Control-Allow-Origin: *` on all three public endpoints; OPTIONS preflight handled |

**Summary:** Middleware correctly scoped. ✅

---

## Security Audit Cross-Reference (Sprint 4.4)

| ID | Severity | Finding | Sprint 4.5 Status |
|----|----------|---------|-------------------|
| SEC-001 | HIGH | IDOR in `GET /api/surveys` — no ownerId check | ❌ **Still open** |
| SEC-002 | MEDIUM | Widget `innerHTML` XSS with unsanitised survey config | ❌ **Still open** |
| SEC-003 | MEDIUM | Rate limiting in-memory only; anonymous bypass | ❌ **Still open** |
| SEC-004 | LOW | No `AUTH_SECRET` startup guard | ❌ **Still open** (no change expected) |

**None of the Sprint 4.4 security findings have been patched.**

---

## Bug Summary

### P0 — Critical (Deployment Blockers)

| ID | Bug | File | Impact |
|----|-----|------|--------|
| P0-001 | **SEC-001 IDOR**: `GET /api/surveys` returns any workspace's surveys to any authenticated user | `apps/web/app/api/surveys/route.ts:45` | Data breach — any logged-in user can read other users' surveys |
| P0-002 | **Dashboard hardcoded mock data**: NPS=42, 247 responses, same 6 fake responses shown to every user | `apps/web/app/(dashboard)/dashboard/page.tsx` | Every customer sees fake data — completely misleading product |
| P0-003 | **Widget bundle missing**: `packages/widget/dist/` does not exist; `/api/widget.js` returns a no-op comment | `apps/web/app/api/widget.js/route.ts` | Core product feature (widget) non-functional in production |

### P1 — High (Pre-Launch Required)

| ID | Bug | File | Impact |
|----|-----|------|--------|
| P1-001 | **SEC-002 Widget XSS**: `promptText`/`followUpText` rendered via `innerHTML` without escaping | `packages/widget/src/index.ts:122` | Stored XSS on every customer website embedding the widget |
| P1-002 | **SEC-003 Rate limiting**: Anonymous submissions unlimited; in-memory map not shared across instances | `apps/web/app/api/respond/route.ts:12` | Survey data poisoning; tier response limits bypassable |
| P1-003 | **Stripe UI broken**: Settings form POSTs form-encoded data but API expects JSON | `apps/web/app/(dashboard)/dashboard/settings/page.tsx` | Users cannot upgrade from the UI |

### P2 — Medium

| ID | Bug | Impact |
|----|-----|--------|
| P2-001 | `getWorkspaceIdForUser()` in `lib/auth-session.ts` defined but never used anywhere — dead code | Minor code quality |
| P2-002 | Dashboard period tabs (7d/30d/90d/1Y) are static buttons with no functionality | Feature gap |
| P2-003 | No `AUTH_SECRET` startup guard (SEC-004) | Risk of misconfigured production deployment |

---

## What Works Well ✅

- **Auth foundation:** Bcrypt(12), email uniqueness, JWT sessions with 30-day expiry — solid
- **Individual resource ownership:** `GET/PATCH/DELETE /api/surveys/[id]`, responses, stats, export, API key — all properly guard with `workspaces.ownerId` join
- **Stripe webhook:** Full signature verification + 3 event types handled correctly
- **Widget source logic:** Trigger types (time/pageview/manual), survey type handling (NPS/CSAT), localStorage deduplication — all well-implemented
- **Zod validation:** All mutating routes have proper input schemas
- **CORS:** Correctly applied only to public endpoints, not dashboard/auth routes
- **Drizzle ORM:** No raw SQL; parameterised queries throughout — no SQL injection risk

---

## Deployment Readiness

**❌ NOT READY FOR DEPLOYMENT**

**P0 blockers must be resolved before any production traffic:**
1. Fix SEC-001 IDOR (one-line fix: add `ownerId` to WHERE clause in GET /api/surveys)
2. Replace hardcoded mock data on dashboard with real DB queries
3. Build widget bundle (`pnpm build` in `packages/widget`) and include `dist/widget.js` in deployment

**P1 issues must be resolved before public launch:**
4. Fix SEC-002 widget innerHTML XSS (use `textContent` or HTML escaping)
5. Fix SEC-003 rate limiting (Redis-backed or IP-based fallback for anonymous)
6. Fix Stripe settings form to use `fetch()` with JSON body

---

*Report generated by Sage v1 — Sprint 4.5 NPSKit Integration Testing — 2026-03-01*
