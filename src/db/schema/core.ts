import { pgSchema, uuid, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const core = pgSchema("core");

export const companies = core.table("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  domain: text("domain"),
  logo_url: text("logo_url"),
  auth_methods: jsonb("auth_methods").default(["google", "password"]),
  allowed_domains: text("allowed_domains").array(),
  force_sso: boolean("force_sso").default(false),
  features: jsonb("features").default({}),
  timezone: text("timezone").default("America/New_York"),
  active: boolean("active").default(true),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const users = core.table("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
  auth_user_id: uuid("auth_user_id").unique(),
  email: text("email").notNull(),
  full_name: text("full_name").notNull(),
  avatar_url: text("avatar_url"),
  timezone: text("timezone").default("America/New_York"),
  is_super: boolean("is_super").default(false),
  active: boolean("active").default(true),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const config = core.table("config", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  key: text("key").notNull(),
  value: jsonb("value").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const auditLog = core.table("audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id),
  user_id: uuid("user_id").references(() => users.id),
  action: text("action").notNull(),
  target_type: text("target_type"),
  target_id: text("target_id"),
  details: jsonb("details"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const notifications = core.table("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  link: text("link"),
  read: boolean("read").default(false),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
