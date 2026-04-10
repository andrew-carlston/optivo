import { pgSchema, uuid, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { companies } from "./core";

export const system = pgSchema("system");

export const integrations = system.table("integrations", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  platform: text("platform").notNull(),
  credentials: jsonb("credentials"),
  config: jsonb("config").default({}),
  active: boolean("active").default(true),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const featureFlags = system.table("feature_flags", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  enabled: boolean("enabled").default(false),
  config: jsonb("config").default({}),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const jobs = system.table("jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id),
  type: text("type").notNull(),
  status: text("status").default("pending"),
  payload: jsonb("payload"),
  result: jsonb("result"),
  error: text("error"),
  started_at: timestamp("started_at", { withTimezone: true }),
  completed_at: timestamp("completed_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const apiKeys = system.table("api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  key_hash: text("key_hash").notNull(),
  scopes: text("scopes").array(),
  active: boolean("active").default(true),
  last_used_at: timestamp("last_used_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const webhooks = system.table("webhooks", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  url: text("url").notNull(),
  events: text("events").array(),
  secret: text("secret"),
  active: boolean("active").default(true),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
