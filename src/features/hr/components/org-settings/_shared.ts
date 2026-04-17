import { Building2, Layers, Network, Briefcase, MapPin } from "lucide-react";
import type { LocationFieldValues } from "./location-fields";

// ── Tab Definitions ──

export type Tab =
  | "divisions"
  | "departments"
  | "lobs"
  | "positions"      // DB table name stays; UI label is "Roles"
  | "locations";

export const TABS: { key: Tab; label: string; icon: typeof Building2; prefix: string }[] = [
  { key: "divisions",         label: "Divisions",         icon: Layers,    prefix: "DIV" },
  { key: "departments",       label: "Departments",       icon: Building2, prefix: "DEPT" },
  { key: "lobs",              label: "LOBs",              icon: Network,   prefix: "LOB" },
  { key: "positions",         label: "Roles",             icon: Briefcase, prefix: "ROLE" },
  { key: "locations",         label: "Locations",         icon: MapPin,    prefix: "LOC" },
];

export const TAB_SINGULAR: Record<Tab, string> = {
  divisions: "Division",
  departments: "Department",
  lobs: "LOB",
  positions: "Role",
  locations: "Location",
};

// ── Sentinel for empty selection (Radix Select disallows empty string) ──

export const NONE = "__none";
export const toId = (v: string) => (v === NONE ? undefined : v);
export const toIdOrNull = (v: string) => (v === NONE ? null : v);

// ── Location Form ──

export const EMPTY_LOC: LocationFieldValues = {
  isRemote: false,
  parentId: NONE,
  addressLine1: "",
  addressLine2: "",
  city: "",
  stateCode: "",
  postalCode: "",
  countryCode: "",
  timezone: "",
  phone: "",
};

export type LocationInput = {
  name: string;
  parentId?: string | null;
  isRemote?: boolean;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  stateProvince?: string | null;
  postalCode?: string | null;
  country?: string | null;
  timezone?: string | null;
  phone?: string | null;
  costCode?: string | null;
  sortOrder?: number;
  active?: boolean;
};
