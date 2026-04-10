import { pgSchema, uuid, text, timestamp, date, jsonb, integer } from "drizzle-orm/pg-core";
import { companies, users } from "./core";

export const analytics = pgSchema("analytics");

export const reports = analytics.table("reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  config: jsonb("config").default({}),
  created_by: uuid("created_by").references(() => users.id),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const savedFilters = analytics.table("saved_filters", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  page: text("page").notNull(),
  filters: jsonb("filters").default({}),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const agentMetrics = analytics.table("agent_metrics", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  agent_id: text("agent_id").notNull(),
  date: date("date").notNull(),
  total_online_sec: integer("total_online_sec").default(0),
  total_available_sec: integer("total_available_sec").default(0),
  total_on_call_sec: integer("total_on_call_sec").default(0),
  total_break_sec: integer("total_break_sec").default(0),
  total_lunch_sec: integer("total_lunch_sec").default(0),
  contacts_handled: integer("contacts_handled").default(0),
  avg_handle_time_sec: integer("avg_handle_time_sec").default(0),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
