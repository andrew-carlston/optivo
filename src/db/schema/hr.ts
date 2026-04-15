import { pgSchema, uuid, text, boolean, timestamp, date, integer, jsonb } from "drizzle-orm/pg-core";
import { companies, users } from "./core";

export const hr = pgSchema("hr");

// Org hierarchy: Division → LOB → Department → Position
//   LOB rolls up to Division
//   Department rolls up to LOB (optionally with parent Department + Location)
//   Position can link to any of: Department, LOB, Location, Division

export const divisions = hr.table("divisions", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  cost_code: text("cost_code"),
  active: boolean("active").default(true),
  sort_order: integer("sort_order").default(0),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const lobs = hr.table("lobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  division_id: uuid("division_id").references(() => divisions.id),
  cost_code: text("cost_code"),
  active: boolean("active").default(true),
  sort_order: integer("sort_order").default(0),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const departments = hr.table("departments", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  parent_id: uuid("parent_id"),                                  // self-ref
  lob_id: uuid("lob_id").references(() => lobs.id),
  // location_id added below via separate ref to avoid circular decl with locations
  location_id: uuid("location_id"),
  cost_code: text("cost_code"),
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
  division_id: uuid("division_id").references(() => divisions.id),
  location_id: uuid("location_id"),                              // FK added below
  cost_code: text("cost_code"),
  active: boolean("active").default(true),
  sort_order: integer("sort_order").default(0),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const locations = hr.table("locations", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  parent_id: uuid("parent_id"),                    // self-ref hierarchy (region → country → office)
  name: text("name").notNull(),
  is_remote: boolean("is_remote").default(false),  // remote locations skip physical address
  address_line_1: text("address_line_1"),
  address_line_2: text("address_line_2"),
  city: text("city"),
  state_province: text("state_province"),          // ISO code (e.g., "CA", "TX") when country-state-city used
  postal_code: text("postal_code"),
  country: text("country"),                        // ISO code (e.g., "US", "GB")
  timezone: text("timezone"),                      // IANA tz name (e.g., "America/New_York")
  phone: text("phone"),
  cost_code: text("cost_code"),
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

// ── Many-to-many: employees ↔ locations ──
// A person can be assigned to multiple locations (primary office + remote sites).

export const employeeLocations = hr.table("employee_locations", {
  id: uuid("id").defaultRandom().primaryKey(),
  employee_id: uuid("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  location_id: uuid("location_id").references(() => locations.id, { onDelete: "cascade" }).notNull(),
  is_primary: boolean("is_primary").default(false),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
