import type { DepartmentRow, DivisionRow, LobRow, LocationRow, PositionRow } from "@/features/hr/actions/org-actions";
import type { Tab } from "./_shared";
import { TABS } from "./_shared";

/**
 * Cost code format: {ENTITY_PREFIX}-{LOCAL_CODE}
 *   Division  → DIV-NA
 *   Location  → LOC-HQ
 *   LOB       → LOB-SUP
 *   Department → DEPT-OPS
 *   Role      → ROLE-PA
 *   Employment Type → ET-FT
 *   Working Status  → WS-AC
 *
 * Entities are NOT cascaded. Each one has its own flat code. A separate
 * full-path string (e.g., "NA:R:S:OPS") can be built from the parent chain
 * when needed for reporting — see buildFullPath below.
 */

function prefixForTab(tab: Tab): string {
  return TABS.find((t) => t.key === tab)?.prefix ?? "";
}

/**
 * Generate a short local code (e.g., "NA", "OPS", "FT") from a name.
 * Falls back to numeric suffix if all initial variants collide.
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
 * Extract the LOCAL portion of a stored cost code (the part after the last hyphen).
 *   "DEPT-OPS"   → "OPS"
 *   "DIV-NA"     → "NA"
 *   "NA"         → "NA"  (legacy, no prefix)
 */
export function localPart(code: string | null | undefined): string {
  if (!code) return "";
  const idx = code.lastIndexOf("-");
  return idx === -1 ? code : code.slice(idx + 1);
}

export type ParentForm = {
  parentLocId?: string;
  divisionId?: string;
  lobId?: string;
  deptId?: string;
  locationId?: string;
};

/**
 * Compose a flat PREFIX-LOCAL cost code for the given tab.
 * Parent dropdowns are ignored here — each entity has its own standalone code.
 */
export function composeFullCode(
  tab: Tab,
  local: string,
  _formData: ParentForm,
  _lookups: {
    divisions: DivisionRow[];
    locations: LocationRow[];
    lobs: LobRow[];
    departments: DepartmentRow[];
  },
): string {
  if (!local) return "";
  const prefix = prefixForTab(tab);
  return prefix ? `${prefix}-${local}` : local;
}

/**
 * Build the full hierarchical path string for an entity (for reports / display).
 * Walks up parents and joins local codes with ":". Returns empty string when no
 * parents can be resolved.
 *
 *   Position "Phone Agent" under Dept "Ops" under LOB "Support" under Div "NA"
 *   with Location "Remote" →  "NA:R:S:OPS:PA"
 */
export function buildFullPath(
  tab: Tab,
  costCode: string,
  entity: {
    parentId?: string | null;
    divisionId?: string | null;
    lobId?: string | null;
    departmentId?: string | null;
    locationId?: string | null;
  },
  lookups: {
    divisions: DivisionRow[];
    locations: LocationRow[];
    lobs: LobRow[];
    departments: DepartmentRow[];
    positions?: PositionRow[];
  },
): string {
  const own = localPart(costCode);
  const chain: string[] = [];

  const add = (code: string | null | undefined) => {
    const c = localPart(code);
    if (c) chain.push(c);
  };

  switch (tab) {
    case "divisions":
      return own;
    case "locations": {
      const parent = entity.parentId ? lookups.locations.find((l) => l.id === entity.parentId) : null;
      add(parent?.costCode);
      break;
    }
    case "lobs": {
      const div = entity.divisionId ? lookups.divisions.find((d) => d.id === entity.divisionId) : null;
      add(div?.costCode);
      break;
    }
    case "departments": {
      const lob = entity.lobId ? lookups.lobs.find((l) => l.id === entity.lobId) : null;
      if (lob) {
        const div = lob.divisionId ? lookups.divisions.find((d) => d.id === lob.divisionId) : null;
        add(div?.costCode);
      }
      const loc = entity.locationId ? lookups.locations.find((l) => l.id === entity.locationId) : null;
      add(loc?.costCode);
      add(lob?.costCode);
      break;
    }
    case "positions": {
      const dept = entity.departmentId ? lookups.departments.find((d) => d.id === entity.departmentId) : null;
      if (dept) {
        const lob = dept.lobId ? lookups.lobs.find((l) => l.id === dept.lobId) : null;
        if (lob) {
          const div = lob.divisionId ? lookups.divisions.find((d) => d.id === lob.divisionId) : null;
          add(div?.costCode);
        }
        const loc = dept.locationId ? lookups.locations.find((l) => l.id === dept.locationId) : null;
        add(loc?.costCode);
        add(lob?.costCode);
        add(dept.costCode);
      }
      break;
    }
  }

  chain.push(own);
  return chain.filter(Boolean).join(":");
}
