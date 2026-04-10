import { pgSchema, uuid, text, boolean, timestamp, date, integer, jsonb } from "drizzle-orm/pg-core";
import { companies, users } from "./core";

export const hr = pgSchema("hr");

export const departments = hr.table("departments", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  parent_id: uuid("parent_id"),
  active: boolean("active").default(true),
  sort_order: integer("sort_order").default(0),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const divisions = hr.table("divisions", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  active: boolean("active").default(true),
  sort_order: integer("sort_order").default(0),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const lobs = hr.table("lobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  department_id: uuid("department_id").references(() => departments.id),
  active: boolean("active").default(true),
  sort_order: integer("sort_order").default(0),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const positions = hr.table("positions", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  department_id: uuid("department_id").references(() => departments.id),
  lob_id: uuid("lob_id").references(() => lobs.id),
  active: boolean("active").default(true),
  sort_order: integer("sort_order").default(0),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const employees = hr.table("employees", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  user_id: uuid("user_id").references(() => users.id),
  full_name: text("full_name").notNull(),
  first_name: text("first_name"),
  last_name: text("last_name"),
  email: text("email"),
  agent_id: text("agent_id"),
  department_id: uuid("department_id").references(() => departments.id),
  division_id: uuid("division_id").references(() => divisions.id),
  lob_id: uuid("lob_id").references(() => lobs.id),
  position_id: uuid("position_id").references(() => positions.id),
  manager_id: uuid("manager_id"),
  employment_status: text("employment_status").default("active"),
  employment_type: text("employment_type"),
  start_date: date("start_date"),
  end_date: date("end_date"),
  timezone: text("timezone").default("America/New_York"),
  country: text("country"),
  state_province: text("state_province"),
  city: text("city"),
  custom_fields: jsonb("custom_fields").default({}),
  active: boolean("active").default(true),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
