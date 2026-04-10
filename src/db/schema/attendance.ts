import { pgSchema, uuid, text, boolean, timestamp, date, integer, numeric, jsonb } from "drizzle-orm/pg-core";
import { companies } from "./core";

export const attendance = pgSchema("attendance");

export const config = attendance.table("config", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull().unique(),
  grace_minutes: integer("grace_minutes").default(5),
  tiers: jsonb("tiers").default([]),
  no_show_minutes: integer("no_show_minutes").default(30),
  no_show_points: numeric("no_show_points", { precision: 3, scale: 1 }).default("5"),
  warnings: jsonb("warnings").default([]),
  termination_enabled: boolean("termination_enabled").default(true),
  termination_rule: text("termination_rule").default("infraction_on_final"),
  rolloff_amount: numeric("rolloff_amount", { precision: 3, scale: 1 }).default("-1"),
  rolloff_frequency: text("rolloff_frequency").default("monthly"),
  rolloff_requires_clean: boolean("rolloff_requires_clean").default(true),
  eligible_roles: text("eligible_roles").array(),
  color_medium: integer("color_medium").default(3),
  color_high: integer("color_high").default(6),
  color_critical: integer("color_critical").default(9),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const log = attendance.table("log", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  agent_id: text("agent_id").notNull(),
  agent_name: text("agent_name"),
  date: date("date").notNull(),
  classification: text("classification"),
  notified: boolean("notified").default(true),
  late_min: integer("late_min").default(0),
  points: numeric("points", { precision: 3, scale: 1 }).default("0"),
  scheduled_start: timestamp("scheduled_start", { withTimezone: true }),
  scheduled_end: timestamp("scheduled_end", { withTimezone: true }),
  first_seen: timestamp("first_seen", { withTimezone: true }),
  last_seen: timestamp("last_seen", { withTimezone: true }),
  flagged: boolean("flagged").default(false),
  department: text("department"),
  role: text("role"),
  manager: text("manager"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const points = attendance.table("points", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  agent_id: text("agent_id").notNull(),
  agent_name: text("agent_name"),
  total_points: numeric("total_points", { precision: 4, scale: 1 }).default("0"),
  warning_level: text("warning_level").default("none"),
  warning_issued_at: date("warning_issued_at"),
  warning_expires_at: date("warning_expires_at"),
  point_floor: numeric("point_floor", { precision: 4, scale: 1 }).default("0"),
  last_infraction_date: date("last_infraction_date"),
  department: text("department"),
  role: text("role"),
  manager: text("manager"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const pointHistory = attendance.table("point_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  agent_id: text("agent_id").notNull(),
  agent_name: text("agent_name"),
  date: date("date").notNull(),
  change: numeric("change", { precision: 3, scale: 1 }).notNull(),
  reason: text("reason").notNull(),
  new_total: numeric("new_total", { precision: 4, scale: 1 }),
  warning_level: text("warning_level"),
  notes: text("notes"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const firstSeen = attendance.table("first_seen", {
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  agent_id: text("agent_id").notNull(),
  date: date("date").notNull(),
  first_seen_utc: timestamp("first_seen_utc", { withTimezone: true }).notNull(),
  last_seen_utc: timestamp("last_seen_utc", { withTimezone: true }).notNull(),
  platform: text("platform"),
});

export const disputes = attendance.table("disputes", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  attendance_log_id: uuid("attendance_log_id").references(() => log.id),
  agent_id: text("agent_id").notNull(),
  agent_name: text("agent_name"),
  status: text("status").default("pending"),
  reason: text("reason"),
  notes: text("notes"),
  evidence_urls: text("evidence_urls").array(),
  resolution: text("resolution"),
  resolved_by: uuid("resolved_by"),
  resolved_at: timestamp("resolved_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
