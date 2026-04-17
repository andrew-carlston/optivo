"use client";

import { useState, useMemo, useRef, useEffect, useCallback, useTransition } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button/button";
import { Input } from "@/components/ui/input/input";
import { type SelectOption } from "@/components/ui/select/select";
import { Switch } from "@/components/ui/switch/switch";
import { cn } from "@/lib/cn";
import type {
  DepartmentRow, DivisionRow, LobRow, PositionRow, LocationRow,
  EmploymentTypeRow, WorkingStatusRow,
} from "@/features/hr/actions/org-actions";
import {
  getOrgStructureAll,
  createDepartment, updateDepartment, archiveDepartment,
  createDivision, updateDivision, archiveDivision,
  createLob, updateLob, archiveLob,
  createPosition, updatePosition, archivePosition,
  createLocation, updateLocation, archiveLocation,
  createEmploymentType, updateEmploymentType, archiveEmploymentType,
  createWorkingStatus, updateWorkingStatus, archiveWorkingStatus,
} from "@/features/hr/actions/org-actions";
import { type LocationFieldValues } from "./location-fields";
import { TABS, NONE, toId, toIdOrNull, EMPTY_LOC, type Tab, type LocationInput } from "./_shared";
import { generateLocalCode, localPart, composeFullCode } from "./cost-code";
import { OrgTable, type TableHandlers, type TableOptions } from "./org-table";
import "./org-settings.scss";

// ── Types ──

export type OrgData = {
  departments: DepartmentRow[];
  divisions: DivisionRow[];
  lobs: LobRow[];
  positions: PositionRow[];
  locations: LocationRow[];
  employmentTypes: EmploymentTypeRow[];
  workingStatuses: WorkingStatusRow[];
};

export type DraftRow = {
  tempId: string;
  name: string;
  costCode: string;
  color?: string;
  parentId?: string | null;
  divisionId?: string | null;
  lobId?: string | null;
  departmentId?: string | null;
  locationId?: string | null;
  loc?: LocationFieldValues;
};

type OrgSettingsProps = {
  companySlug: string;
  initialData: OrgData;
};

// ── Helpers ──

function listForTab(data: OrgData, tab: Tab): any[] {
  switch (tab) {
    case "departments": return data.departments;
    case "divisions": return data.divisions;
    case "lobs": return data.lobs;
    case "positions": return data.positions;
    case "locations": return data.locations;
    case "employment_types": return data.employmentTypes;
    case "working_statuses": return data.workingStatuses;
  }
}

function updateList(data: OrgData, tab: Tab, fn: (items: any[]) => any[]): OrgData {
  const key: keyof OrgData =
    tab === "departments" ? "departments" :
    tab === "divisions" ? "divisions" :
    tab === "lobs" ? "lobs" :
    tab === "positions" ? "positions" :
    tab === "locations" ? "locations" :
    tab === "employment_types" ? "employmentTypes" : "workingStatuses";
  return { ...data, [key]: fn(data[key]) };
}

// ── Component ──

const VALID_TABS = new Set<string>(["divisions","departments","lobs","positions","locations","employment_types","working_statuses"]);

export function OrgSettings({ companySlug, initialData }: OrgSettingsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const paramTab = searchParams.get("tab");
  const initialTab: Tab = paramTab && VALID_TABS.has(paramTab) ? (paramTab as Tab) : "divisions";

  const [data, setData] = useState<OrgData>(initialData);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [draft, setDraft] = useState<DraftRow | null>(null);
  const [, startTransition] = useTransition();

  function changeTab(next: Tab) {
    setTab(next);
    setSearch("");
    setDraft(null);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "divisions") {
      params.delete("tab");
    } else {
      params.set("tab", next);
    }
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  // Sync if parent re-renders with fresh data (e.g., navigation)
  useEffect(() => { setData(initialData); }, [initialData]);

  // Background refresh — fires after mutations, doesn't block UI
  function bgRefresh() {
    startTransition(async () => {
      try {
        const fresh = await getOrgStructureAll(companySlug);
        setData(fresh);
      } catch { /* silent — optimistic state is already correct */ }
    });
  }

  // ── Scroll fade hints ──
  const tabsRef = useRef<HTMLDivElement>(null);

  const updateScrollHints = useCallback(() => {
    const el = tabsRef.current;
    if (!el) return;
    const tolerance = 2;
    el.dataset.scrollLeft = String(el.scrollLeft > tolerance);
    el.dataset.scrollRight = String(el.scrollLeft + el.clientWidth < el.scrollWidth - tolerance);
  }, []);

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    updateScrollHints();
    el.addEventListener("scroll", updateScrollHints, { passive: true });
    const ro = new ResizeObserver(updateScrollHints);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", updateScrollHints); ro.disconnect(); };
  }, [updateScrollHints]);

  // ── Derived state ──

  const counts: Record<Tab, number> = {
    divisions: data.divisions.filter((d) => d.active).length,
    locations: data.locations.filter((l) => l.active).length,
    lobs: data.lobs.filter((l) => l.active).length,
    departments: data.departments.filter((d) => d.active).length,
    positions: data.positions.filter((p) => p.active).length,
    employment_types: data.employmentTypes.filter((e) => e.active).length,
    working_statuses: data.workingStatuses.filter((w) => w.active).length,
  };

  const deptOptions: SelectOption[] = useMemo(() =>
    data.departments.filter((d) => d.active).map((d) => ({ value: d.id, label: d.name })),
    [data.departments],
  );
  const lobOptions: SelectOption[] = useMemo(() =>
    data.lobs.filter((l) => l.active).map((l) => ({ value: l.id, label: l.name })),
    [data.lobs],
  );
  const locationOptions: SelectOption[] = useMemo(() =>
    data.locations.filter((l) => l.active).map((l) => ({ value: l.id, label: l.name })),
    [data.locations],
  );
  const divisionOptions: SelectOption[] = useMemo(() =>
    data.divisions.filter((d) => d.active).map((d) => ({ value: d.id, label: d.name })),
    [data.divisions],
  );

  // ── Filter ──

  function filtered(): any[] {
    let list: any[] = listForTab(data, tab);
    if (!showInactive) list = list.filter((i: any) => i.active);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((i: any) => i.name.toLowerCase().includes(q));
    }
    return list;
  }

  // ── Cost code helpers ──

  const existingLocalCodes = useMemo(() => {
    const items = listForTab(data, tab);
    return new Set(
      items.filter((i: any) => i.costCode).map((i: any) => localPart(i.costCode as string))
    );
  }, [data, tab]);

  function suggestCostCode(name: string, parents?: Partial<DraftRow>): string {
    if (!name.trim()) return "";
    const local = generateLocalCode(name, existingLocalCodes);
    return composeFullCode(tab, local, {
      parentLocId: parents?.parentId ?? undefined,
      divisionId: parents?.divisionId ?? undefined,
      lobId: parents?.lobId ?? undefined,
      deptId: parents?.departmentId ?? undefined,
      locationId: parents?.locationId ?? undefined,
    }, { divisions: data.divisions, locations: data.locations, lobs: data.lobs, departments: data.departments });
  }

  // ── Mutations with optimistic updates ──

  async function handleToggleActive(item: any, next: boolean) {
    // Optimistic
    setData((d) => updateList(d, tab, (list) =>
      list.map((r) => r.id === item.id ? { ...r, active: next } : r)
    ));
    // Server
    switch (tab) {
      case "departments": await updateDepartment(companySlug, item.id, { active: next }); break;
      case "divisions": await updateDivision(companySlug, item.id, { active: next }); break;
      case "lobs": await updateLob(companySlug, item.id, { active: next }); break;
      case "positions": await updatePosition(companySlug, item.id, { active: next }); break;
      case "locations": await updateLocation(companySlug, item.id, { name: item.name, active: next }); break;
      case "employment_types": await updateEmploymentType(companySlug, item.id, { active: next }); break;
      case "working_statuses": await updateWorkingStatus(companySlug, item.id, { active: next }); break;
    }
    bgRefresh();
  }

  async function handleUpdateField(item: any, field: string, value: any) {
    // Optimistic update for all fields
    if (tab === "locations" && field === "_loc") {
      const loc = value as LocationFieldValues;
      const remote = loc.isRemote;
      setData((d) => updateList(d, tab, (list) =>
        list.map((r) => r.id === item.id ? {
          ...r,
          isRemote: remote,
          parentId: toIdOrNull(loc.parentId ?? NONE),
          addressLine1: remote ? null : loc.addressLine1,
          addressLine2: remote ? null : loc.addressLine2,
          city: remote ? null : loc.city,
          stateProvince: remote ? null : loc.stateCode,
          postalCode: remote ? null : loc.postalCode,
          country: remote ? null : loc.countryCode,
          timezone: loc.timezone,
          phone: loc.phone,
        } : r)
      ));
      await updateLocation(companySlug, item.id, {
        name: item.name,
        parentId: toIdOrNull(loc.parentId ?? NONE),
        isRemote: remote,
        addressLine1: remote ? null : (loc.addressLine1.trim() || null),
        addressLine2: remote ? null : (loc.addressLine2.trim() || null),
        city: remote ? null : (loc.city.trim() || null),
        stateProvince: remote ? null : (loc.stateCode || null),
        postalCode: remote ? null : (loc.postalCode.trim() || null),
        country: remote ? null : (loc.countryCode || null),
        timezone: loc.timezone || null,
        phone: loc.phone.trim() || null,
      });
      bgRefresh();
      return;
    }

    setData((d) => updateList(d, tab, (list) =>
      list.map((r) => r.id === item.id ? { ...r, [field]: value } : r)
    ));

    const patch: any = { [field]: value };
    switch (tab) {
      case "departments": await updateDepartment(companySlug, item.id, patch); break;
      case "divisions": await updateDivision(companySlug, item.id, patch); break;
      case "lobs": await updateLob(companySlug, item.id, patch); break;
      case "positions": await updatePosition(companySlug, item.id, patch); break;
      case "locations":
        await updateLocation(companySlug, item.id, { name: field === "name" ? value : item.name, ...patch });
        break;
      case "employment_types": await updateEmploymentType(companySlug, item.id, patch); break;
      case "working_statuses": await updateWorkingStatus(companySlug, item.id, patch); break;
    }
    bgRefresh();
  }

  async function handleArchive(item: any) {
    setData((d) => updateList(d, tab, (list) =>
      list.map((r) => r.id === item.id ? { ...r, active: false } : r)
    ));
    switch (tab) {
      case "departments": await archiveDepartment(companySlug, item.id); break;
      case "divisions": await archiveDivision(companySlug, item.id); break;
      case "lobs": await archiveLob(companySlug, item.id); break;
      case "positions": await archivePosition(companySlug, item.id); break;
      case "locations": await archiveLocation(companySlug, item.id); break;
      case "employment_types": await archiveEmploymentType(companySlug, item.id); break;
      case "working_statuses": await archiveWorkingStatus(companySlug, item.id); break;
    }
    bgRefresh();
  }

  async function handleRestore(item: any) {
    await handleToggleActive(item, true);
  }

  // ── Draft row handlers ──

  function startAdd() {
    if (draft) return;
    setDraft({
      tempId: `draft-${Date.now()}`,
      name: "",
      costCode: "",
      color: tab === "working_statuses" ? "#6b7280" : undefined,
      parentId: NONE,
      divisionId: NONE,
      lobId: NONE,
      departmentId: NONE,
      locationId: NONE,
      loc: EMPTY_LOC,
    });
  }

  function updateDraftFn(patch: Partial<DraftRow>) {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      if (patch.name !== undefined && (!prev.costCode || prev.costCode === suggestCostCode(prev.name, prev))) {
        next.costCode = suggestCostCode(next.name, next);
      }
      return next;
    });
  }

  async function commitDraft() {
    if (!draft) return;
    const name = draft.name.trim();
    if (!name) return;
    const costCode = draft.costCode.trim() || suggestCostCode(name, draft);

    // Optimistic insert — use temp ID, replaced after server confirms
    const tempId = draft.tempId;
    const stub: any = {
      id: tempId, name, costCode: costCode || null, active: true, sortOrder: 0, employeeCount: 0,
      parentId: toId(draft.parentId ?? NONE) ?? null,
      divisionId: toId(draft.divisionId ?? NONE) ?? null,
      lobId: toId(draft.lobId ?? NONE) ?? null,
      departmentId: toId(draft.departmentId ?? NONE) ?? null,
      locationId: toId(draft.locationId ?? NONE) ?? null,
    };
    setData((d) => updateList(d, tab, (list) => [...list, stub]));
    setDraft(null);

    try {
      let realId: string | undefined;
      switch (tab) {
        case "departments":
          realId = await createDepartment(companySlug, {
            name, parentId: toId(draft.parentId ?? NONE), lobId: toId(draft.lobId ?? NONE),
            locationId: toId(draft.locationId ?? NONE), costCode: costCode || null,
          });
          break;
        case "divisions":
          realId = await createDivision(companySlug, { name, costCode: costCode || null });
          break;
        case "lobs":
          realId = await createLob(companySlug, {
            name, divisionId: toId(draft.divisionId ?? NONE), costCode: costCode || null,
          });
          break;
        case "positions":
          realId = await createPosition(companySlug, {
            name, departmentId: toId(draft.departmentId ?? NONE), lobId: toId(draft.lobId ?? NONE),
            divisionId: toId(draft.divisionId ?? NONE), locationId: toId(draft.locationId ?? NONE),
            costCode: costCode || null,
          });
          break;
        case "locations": {
          const loc = draft.loc ?? EMPTY_LOC;
          const remote = loc.isRemote;
          realId = await createLocation(companySlug, {
            name,
            parentId: toIdOrNull(loc.parentId ?? NONE),
            isRemote: remote,
            addressLine1: remote ? null : (loc.addressLine1.trim() || null),
            addressLine2: remote ? null : (loc.addressLine2.trim() || null),
            city: remote ? null : (loc.city.trim() || null),
            stateProvince: remote ? null : (loc.stateCode || null),
            postalCode: remote ? null : (loc.postalCode.trim() || null),
            country: remote ? null : (loc.countryCode || null),
            timezone: loc.timezone || null,
            phone: loc.phone.trim() || null,
            costCode: costCode || null,
          });
          break;
        }
        case "employment_types":
          realId = await createEmploymentType(companySlug, { name, costCode: costCode || null });
          break;
        case "working_statuses":
          realId = await createWorkingStatus(companySlug, { name, color: draft.color ?? "#6b7280", costCode: costCode || null });
          break;
      }
      // Swap temp ID with real one
      if (realId) {
        setData((d) => updateList(d, tab, (list) =>
          list.map((r) => r.id === tempId ? { ...r, id: realId } : r)
        ));
      }
    } catch (err) {
      // Rollback optimistic insert
      setData((d) => updateList(d, tab, (list) => list.filter((r) => r.id !== tempId)));
      console.error("Create failed", err);
    }
    bgRefresh();
  }

  // ── Render ──

  const tableHandlers: TableHandlers = {
    onArchive: handleArchive,
    onRestore: handleRestore,
    onToggleActive: handleToggleActive,
    onUpdateField: handleUpdateField,
    suggestCostCode: (name, parents) => suggestCostCode(name, parents),
  };

  const tableOpts: TableOptions = {
    divisions: divisionOptions,
    lobs: lobOptions,
    departments: deptOptions,
    locations: locationOptions,
  };

  const tabLabel = TABS.find((t) => t.key === tab)?.label ?? "";

  return (
    <div className="org-settings">
      <div className="org-settings__header">
        <h2>Organization</h2>
      </div>

      {/* Tabs */}
      <div className="org-settings__tabs" ref={tabsRef}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={cn("org-settings__tab", tab === t.key && "org-settings__tab--active")}
            onClick={() => changeTab(t.key)}
          >
            <t.icon size={14} />
            {t.label}
            <span className="org-settings__tab-count">{counts[t.key]}</span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="org-settings__toolbar">
        <div className="org-settings__toolbar-search">
          <Input
            placeholder={`Search ${tabLabel.toLowerCase()}...`}
            icon={<Search size={15} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Switch checked={showInactive} onCheckedChange={setShowInactive} label="Inactive" />
        <Button variant="primary" size="sm" onClick={startAdd} disabled={!!draft}>
          <Plus size={14} /> Add
        </Button>
      </div>

      {/* Table */}
      <OrgTable
        tab={tab}
        items={filtered()}
        loading={false}
        handlers={tableHandlers}
        opts={tableOpts}
        draft={draft}
        onDraftChange={updateDraftFn}
        onDraftCancel={() => setDraft(null)}
        onDraftCommit={commitDraft}
      />
    </div>
  );
}
