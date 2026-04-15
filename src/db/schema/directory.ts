import { pgSchema, uuid, text, boolean, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { companies, users } from "./core";
import { employees } from "./hr";

export const directory = pgSchema("directory");

// ── Column Registry (system + custom columns per company) ──

export const columns = directory.table("columns", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  column_key: text("column_key").notNull(),
  label: text("label").notNull(),
  type: text("type").notNull().default("text"),        // text, number, select, date, boolean, email, phone
  is_system: boolean("is_system").default(false),
  source_field: text("source_field").notNull(),         // hr.employees column or custom_fields key
  options: jsonb("options").default([]),                 // for select type: [{value, label}]
  required: boolean("required").default(false),
  visible_by_default: boolean("visible_by_default").default(true),
  editable: boolean("editable").default(true),
  searchable: boolean("searchable").default(true),
  filterable: boolean("filterable").default(true),
  sensitivity_level: integer("sensitivity_level").default(1),
  sort_order: integer("sort_order").default(0),
  width: integer("width"),                              // default width px, null = auto
  active: boolean("active").default(true),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Saved Views (per-user column arrangements + filters) ──

export const savedViews = directory.table("saved_views", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),  // null = company default
  name: text("name").notNull(),
  is_default: boolean("is_default").default(false),
  columns: jsonb("columns").default([]),                // [{columnKey, visible, sortOrder, width}]
  filters: jsonb("filters").default({}),                // {search, columnFilters: {dept: [...], ...}}
  sort_by: text("sort_by"),
  sort_dir: text("sort_dir").default("asc"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ── Status Options (custom employment statuses per company) ──

export const statusOptions = directory.table("status_options", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  value: text("value").notNull(),                       // slug stored in hr.employees.employment_status
  label: text("label").notNull(),
  color: text("color").default("#6b7280"),              // hex for badge
  is_system: boolean("is_system").default(false),
  sort_order: integer("sort_order").default(0),
  active: boolean("active").default(true),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Row Locks (persistent, survive page navigation) ──

export const rowLocks = directory.table("row_locks", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  row_id: uuid("row_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  user_name: text("user_name").notNull(),               // denormalized for display
  locked_at: timestamp("locked_at", { withTimezone: true }).defaultNow(),
  expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
  override_requested_by: uuid("override_requested_by").references(() => users.id),
  override_requested_at: timestamp("override_requested_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Pending Changes (server-side draft backup) ──

export const pendingChanges = directory.table("pending_changes", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  row_id: uuid("row_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  field: text("field").notNull(),                       // column key that changed
  old_value: text("old_value"),                         // serialized original
  new_value: text("new_value"),                         // serialized new
  status: text("status").default("pending").notNull(),  // pending, approved, rejected
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
