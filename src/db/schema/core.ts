import { pgSchema, uuid, text, boolean, timestamp, jsonb, integer } from "drizzle-orm/pg-core";

export const core = pgSchema("core");

// ── Companies (exists on main for routing + on each branch for self-reference) ──

export const companies = core.table("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  branch_id: text("branch_id"),             // Neon branch ID for reference
  branch_host: text("branch_host"),         // Neon branch endpoint hostname (for DB connection)
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

// ── Users (super users on main, company users on branch) ──

export const users = core.table("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
  auth_user_id: text("auth_user_id").unique(),
  email: text("email").notNull(),
  full_name: text("full_name").notNull(),
  avatar_url: text("avatar_url"),
  timezone: text("timezone").default("America/New_York"),
  is_super: boolean("is_super").default(false),
  access_template_id: uuid("access_template_id").references(() => accessTemplates.id),
  active: boolean("active").default(true),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ── ReBAC: Access Templates ──

export const accessTemplates = core.table("access_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  is_default: boolean("is_default").default(false),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── ReBAC: Template → Resource → Action → Scope ──

export const templateAccess = core.table("template_access", {
  id: uuid("id").defaultRandom().primaryKey(),
  template_id: uuid("template_id").references(() => accessTemplates.id, { onDelete: "cascade" }).notNull(),
  resource: text("resource").notNull(),       // e.g., "directory", "realtime", "settings.org"
  action: text("action").notNull(),           // "view", "create", "edit", "archive"
  scope_type: text("scope_type").notNull(),   // "all", "division", "department", "team", "reports", "self"
});

// ── ReBAC: Resource Registry (for template editor UI) ──

export const accessResources = core.table("access_resources", {
  id: uuid("id").defaultRandom().primaryKey(),
  resource: text("resource").notNull(),
  action: text("action").notNull(),
  label: text("label").notNull(),
  parent_resource: text("parent_resource"),   // for grouping in UI (e.g., "settings.wfm")
  sort_order: integer("sort_order").default(0),
});

// ── Config (key-value per company) ──

export const config = core.table("config", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  key: text("key").notNull(),
  value: jsonb("value").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ── Audit Log ──

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

// ── Notifications ──

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
