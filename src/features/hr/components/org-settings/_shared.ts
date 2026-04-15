import { Building2, Layers, Network, Briefcase, MapPin } from "lucide-react";
import type { LocationFieldValues } from "./location-fields";

// ── Tab Definitions ──

export type Tab = "divisions" | "locations" | "lobs" | "departments" | "positions";

export const TABS: { key: Tab; label: string; icon: typeof Building2 }[] = [
  { key: "divisions", label: "Divisions", icon: Layers },
  { key: "locations", label: "Locations", icon: MapPin },
  { key: "lobs", label: "LOBs", icon: Network },
  { key: "departments", label: "Departments", icon: Building2 },
  { key: "positions", label: "Positions", icon: Briefcase },
];

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
