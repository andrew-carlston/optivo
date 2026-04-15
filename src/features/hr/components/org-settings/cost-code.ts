import type { DepartmentRow, DivisionRow, LobRow, LocationRow } from "@/features/hr/actions/org-actions";
import type { Tab } from "./_shared";
import { NONE, toIdOrNull } from "./_shared";

/**
 * Generate a LOCAL cost code suffix from a name. The full cascading code is
 * built by composeFullCode by joining the parent's full code with this local
 * suffix. Auto-tries variations to avoid collision with existing local codes.
 *
 *   "North America"   → "NA"  (initials of each word)
 *   "Customer Care"   → "CC"
 *   "Engineering"     → "EN"  (first 2 chars when single word)
 */
export function generateLocalCode(name: string, existingLocals: Set<string>): string {
  const cleaned = name.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, "");
  if (!cleaned) return "";
  const words = cleaned.split(/\s+/).filter(Boolean);

  const candidates: string[] = [];
  if (words.length >= 2) {
    candidates.push(words[0][0] + words[1][0]);
    if (words.length >= 3) candidates.push(words.map((w) => w[0]).join("").slice(0, 3));
    for (let i = 2; i <= Math.min(words[0].length, 4); i++) {
      candidates.push(words[0].slice(0, i) + words[1][0]);
    }
  } else {
    const w = words[0];
    for (let i = 2; i <= Math.min(w.length, 5); i++) candidates.push(w.slice(0, i));
  }

  for (const c of candidates) {
    if (c.length >= 2 && !existingLocals.has(c)) return c;
  }
  const base = candidates[0] ?? cleaned.slice(0, 2);
  let n = 2;
  while (existingLocals.has(`${base}${n}`)) n++;
  return `${base}${n}`;
}

/**
 * Extract the LOCAL portion of a stored full cost code (the part after the last colon).
 *   "NA:R:S:T1" → "T1"
 *   "NA"        → "NA"
 */
export function localPart(code: string | null | undefined): string {
  if (!code) return "";
  const idx = code.lastIndexOf(":");
  return idx === -1 ? code : code.slice(idx + 1);
}

/**
 * Compose a Department cost code by interleaving location into the LOB chain:
 *   div + (location?) + lob_local + dept_local  →  "NA:R:S:T1"
 */
function composeDeptCode(lobCode: string | null, locationCode: string | null, deptLocal: string): string {
  if (!lobCode && !locationCode) return deptLocal;
  if (!lobCode) return [locationCode, deptLocal].filter(Boolean).join(":");
  const parts = lobCode.split(":");
  const div = parts[0];
  const lobLocal = parts[parts.length - 1];
  if (parts.length === 1) {
    return [locationCode, lobLocal, deptLocal].filter(Boolean).join(":");
  }
  return [div, locationCode, lobLocal, deptLocal].filter(Boolean).join(":");
}

/**
 * Form data shape for parent IDs needed by composeFullCode.
 * Each tab uses a subset.
 */
export type ParentForm = {
  parentLocId?: string;
  divisionId?: string;
  lobId?: string;
  deptId?: string;
  locationId?: string;
};

/**
 * Compose the full cost code for the current tab + selected parents + a local suffix.
 * Cascade order (always): Division → Location → LOB → Department → Position.
 */
export function composeFullCode(
  tab: Tab,
  local: string,
  formData: ParentForm,
  lookups: {
    divisions: DivisionRow[];
    locations: LocationRow[];
    lobs: LobRow[];
    departments: DepartmentRow[];
  },
): string {
  if (!local) return "";
  switch (tab) {
    case "divisions":
      return local;
    case "locations": {
      const parent = lookups.locations.find((l) => l.id === toIdOrNull(formData.parentLocId ?? NONE));
      return parent?.costCode ? `${parent.costCode}:${local}` : local;
    }
    case "lobs": {
      const div = lookups.divisions.find((d) => d.id === toIdOrNull(formData.divisionId ?? NONE));
      return div?.costCode ? `${div.costCode}:${local}` : local;
    }
    case "departments": {
      const lob = lookups.lobs.find((l) => l.id === toIdOrNull(formData.lobId ?? NONE));
      const loc = lookups.locations.find((l) => l.id === toIdOrNull(formData.locationId ?? NONE));
      return composeDeptCode(lob?.costCode ?? null, loc?.costCode ?? null, local);
    }
    case "positions": {
      const dept = lookups.departments.find((d) => d.id === toIdOrNull(formData.deptId ?? NONE));
      if (dept?.costCode) return `${dept.costCode}:${local}`;
      // Fallback if no dept selected — compose from other parents
      const lob = lookups.lobs.find((l) => l.id === toIdOrNull(formData.lobId ?? NONE));
      const div = lookups.divisions.find((d) => d.id === toIdOrNull(formData.divisionId ?? NONE));
      const loc = lookups.locations.find((l) => l.id === toIdOrNull(formData.locationId ?? NONE));
      return composeDeptCode(lob?.costCode ?? div?.costCode ?? null, loc?.costCode ?? null, local);
    }
  }
}
