import { pgSchema, uuid, text, boolean, timestamp, date, integer, jsonb } from "drizzle-orm/pg-core";
import { companies } from "./core";

export const schedule = pgSchema("schedule");

export const shifts = schedule.table("shifts", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  agent_id: text("agent_id").notNull(),
  agent_name: text("agent_name"),
  date: date("date").notNull(),
  start_utc: timestamp("start_utc", { withTimezone: true }),
  end_utc: timestamp("end_utc", { withTimezone: true }),
  working_off: text("working_off").default("Working"),
  lunch_start_utc: timestamp("lunch_start_utc", { withTimezone: true }),
  lunch_end_utc: timestamp("lunch_end_utc", { withTimezone: true }),
  brk1_start_utc: timestamp("brk1_start_utc", { withTimezone: true }),
  brk1_end_utc: timestamp("brk1_end_utc", { withTimezone: true }),
  brk2_start_utc: timestamp("brk2_start_utc", { withTimezone: true }),
  brk2_end_utc: timestamp("brk2_end_utc", { withTimezone: true }),
  brk3_start_utc: timestamp("brk3_start_utc", { withTimezone: true }),
  brk3_end_utc: timestamp("brk3_end_utc", { withTimezone: true }),
  schedule_min: integer("schedule_min"),
  lunch_min: integer("lunch_min"),
  break_min: integer("break_min"),
  department: text("department"),
  role: text("role"),
  manager: text("manager"),
  synced_at: timestamp("synced_at", { withTimezone: true }).defaultNow(),
});

export const templates = schedule.table("templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  shifts: jsonb("shifts").default([]),
  active: boolean("active").default(true),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const calendarTokens = schedule.table("calendar_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  agent_id: text("agent_id").notNull(),
  token: text("token").notNull().unique(),
  revoked: boolean("revoked").default(false),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
