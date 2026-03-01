import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const surveyTypeEnum = pgEnum("survey_type", ["nps", "csat"]);
export const triggerTypeEnum = pgEnum("trigger_type", [
  "time",
  "pageview",
  "manual",
]);
export const surveyPositionEnum = pgEnum("survey_position", [
  "bottom-right",
  "bottom-left",
  "top-right",
  "top-left",
  "center",
]);
export const surveyThemeEnum = pgEnum("survey_theme", ["light", "dark"]);
export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free",
  "pro",
  "business",
]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled",
  "past_due",
  "trialing",
]);

// ─── Tables ───────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workspaces = pgTable("workspaces", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  apiKey: text("api_key")
    .notNull()
    .unique()
    .$defaultFn(() => `nk_live_${createId()}`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const surveys = pgTable("surveys", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  type: surveyTypeEnum("type").notNull().default("nps"),
  name: text("name").notNull(),
  triggerType: triggerTypeEnum("trigger_type").notNull().default("time"),
  triggerValue: integer("trigger_value").notNull().default(3),
  isActive: boolean("is_active").notNull().default(true),
  position: surveyPositionEnum("position").notNull().default("bottom-right"),
  theme: surveyThemeEnum("theme").notNull().default("dark"),
  primaryColor: varchar("primary_color", { length: 7 })
    .notNull()
    .default("#0ea5e9"),
  promptText: text("prompt_text"),
  followUpText: text("follow_up_text"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const responses = pgTable("responses", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  surveyId: text("survey_id")
    .notNull()
    .references(() => surveys.id, { onDelete: "cascade" }),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  followUpText: text("follow_up_text"),
  metadata: jsonb("metadata"),
  userIdentifier: text("user_identifier"),
  respondedAt: timestamp("responded_at").defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  workspaceId: text("workspace_id")
    .notNull()
    .unique()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  tier: subscriptionTierEnum("tier").notNull().default("free"),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  workspaces: many(workspaces),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, {
    fields: [workspaces.ownerId],
    references: [users.id],
  }),
  surveys: many(surveys),
  responses: many(responses),
  subscription: one(subscriptions, {
    fields: [workspaces.id],
    references: [subscriptions.workspaceId],
  }),
}));

export const surveysRelations = relations(surveys, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [surveys.workspaceId],
    references: [workspaces.id],
  }),
  responses: many(responses),
}));

export const responsesRelations = relations(responses, ({ one }) => ({
  survey: one(surveys, {
    fields: [responses.surveyId],
    references: [surveys.id],
  }),
  workspace: one(workspaces, {
    fields: [responses.workspaceId],
    references: [workspaces.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [subscriptions.workspaceId],
    references: [workspaces.id],
  }),
}));
