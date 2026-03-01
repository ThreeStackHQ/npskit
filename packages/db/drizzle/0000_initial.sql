-- NPSKit Initial Migration

CREATE TYPE "survey_type" AS ENUM('nps', 'csat');
CREATE TYPE "trigger_type" AS ENUM('time', 'pageview', 'manual');
CREATE TYPE "survey_position" AS ENUM('bottom-right', 'bottom-left', 'top-right', 'top-left', 'center');
CREATE TYPE "survey_theme" AS ENUM('light', 'dark');
CREATE TYPE "subscription_tier" AS ENUM('free', 'pro', 'business');
CREATE TYPE "subscription_status" AS ENUM('active', 'canceled', 'past_due', 'trialing');

CREATE TABLE IF NOT EXISTS "users" (
  "id" text PRIMARY KEY NOT NULL,
  "email" text NOT NULL UNIQUE,
  "password_hash" text NOT NULL,
  "name" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "workspaces" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "owner_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "api_key" text NOT NULL UNIQUE,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "surveys" (
  "id" text PRIMARY KEY NOT NULL,
  "workspace_id" text NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "type" "survey_type" NOT NULL DEFAULT 'nps',
  "name" text NOT NULL,
  "trigger_type" "trigger_type" NOT NULL DEFAULT 'time',
  "trigger_value" integer NOT NULL DEFAULT 3,
  "is_active" boolean NOT NULL DEFAULT true,
  "position" "survey_position" NOT NULL DEFAULT 'bottom-right',
  "theme" "survey_theme" NOT NULL DEFAULT 'dark',
  "primary_color" varchar(7) NOT NULL DEFAULT '#0ea5e9',
  "prompt_text" text,
  "follow_up_text" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "responses" (
  "id" text PRIMARY KEY NOT NULL,
  "survey_id" text NOT NULL REFERENCES "surveys"("id") ON DELETE CASCADE,
  "workspace_id" text NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "score" integer NOT NULL,
  "follow_up_text" text,
  "metadata" jsonb,
  "user_identifier" text,
  "responded_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" text PRIMARY KEY NOT NULL,
  "workspace_id" text NOT NULL UNIQUE REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "tier" "subscription_tier" NOT NULL DEFAULT 'free',
  "status" "subscription_status" NOT NULL DEFAULT 'active',
  "stripe_customer_id" text,
  "stripe_subscription_id" text,
  "current_period_end" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_surveys_workspace" ON "surveys" ("workspace_id");
CREATE INDEX IF NOT EXISTS "idx_responses_survey" ON "responses" ("survey_id");
CREATE INDEX IF NOT EXISTS "idx_responses_workspace" ON "responses" ("workspace_id");
CREATE INDEX IF NOT EXISTS "idx_responses_responded_at" ON "responses" ("responded_at");
CREATE INDEX IF NOT EXISTS "idx_responses_user_identifier" ON "responses" ("survey_id", "user_identifier");
CREATE INDEX IF NOT EXISTS "idx_workspaces_owner" ON "workspaces" ("owner_id");
CREATE INDEX IF NOT EXISTS "idx_workspaces_api_key" ON "workspaces" ("api_key");
