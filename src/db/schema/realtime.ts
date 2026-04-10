import { pgSchema, uuid, text, boolean, timestamp, integer, numeric, jsonb } from "drizzle-orm/pg-core";
import { companies } from "./core";

export const realtime = pgSchema("realtime");

export const agentStates = realtime.table("agent_states", {
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  agent_id: text("agent_id").notNull(),
  agent_name: text("agent_name"),
  status: text("status"),
  reason_code: text("reason_code"),
  status_since: timestamp("status_since", { withTimezone: true }),
  duration_sec: integer("duration_sec"),
  queue: text("queue"),
  platform: text("platform"),
  metadata: jsonb("metadata"),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const queueMetrics = realtime.table("queue_metrics", {
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  queue_id: text("queue_id").notNull(),
  queue_name: text("queue_name"),
  platform: text("platform"),
  agents_online: integer("agents_online").default(0),
  agents_available: integer("agents_available").default(0),
  agents_on_contact: integer("agents_on_contact").default(0),
  contacts_in_queue: integer("contacts_in_queue").default(0),
  oldest_contact_age: integer("oldest_contact_age").default(0),
  service_level_60: numeric("service_level_60", { precision: 5, scale: 2 }),
  service_level_120: numeric("service_level_120", { precision: 5, scale: 2 }),
  aht_seconds: integer("aht_seconds").default(0),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const queueGroups = realtime.table("queue_groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  parent_id: uuid("parent_id"),
  name: text("name").notNull(),
  depth: integer("depth").default(0),
  sort_order: integer("sort_order").default(0),
});

export const queueMembers = realtime.table("queue_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  group_id: uuid("group_id").references(() => queueGroups.id, { onDelete: "cascade" }).notNull(),
  queue_name: text("queue_name").notNull(),
  platform: text("platform"),
  sort_order: integer("sort_order").default(0),
});

export const statusMappings = realtime.table("status_mappings", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  platform_status: text("platform_status").notNull(),
  display_label: text("display_label").notNull(),
  color: text("color"),
  sort_order: integer("sort_order").default(0),
});
