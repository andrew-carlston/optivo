"use client";

import { useState, useMemo, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Building2, Search, Archive } from "lucide-react";
import { Button } from "@/components/ui/button/button";
import { Input } from "@/components/ui/input/input";
import { Select, type SelectOption } from "@/components/ui/select/select";
import { Switch } from "@/components/ui/switch/switch";
import { SkeletonCard } from "@/components/ui/skeleton/skeleton";
import { cn } from "@/lib/cn";
import type { DepartmentRow, DivisionRow, LobRow, PositionRow, LocationRow } from "@/features/hr/actions/org-actions";
import { LocationFields, type LocationFieldValues } from "./location-fields";
import { TABS, NONE, toId, toIdOrNull, EMPTY_LOC, type Tab, type LocationInput } from "./_shared";
import { generateLocalCode, localPart, composeFullCode } from "./cost-code";
import { DivisionCard, LobCard, DepartmentCard, PositionCard, LocationCard } from "./org-cards";
import "./org-settings.scss";

// ── Props ──

type OrgSettingsProps = {
  departments: DepartmentRow[];
  divisions: DivisionRow[];
  lobs: LobRow[];
  positions: PositionRow[];
  locations: LocationRow[];
  loading: boolean;
  onCreateDepartment: (data: { name: string; parentId?: string; lobId?: string; locationId?: string; costCode?: string | null; sortOrder?: number }) => Promise<void>;
  onUpdateDepartment: (id: string, data: { name?: string; parentId?: string | null; lobId?: string | null; locationId?: string | null; costCode?: string | null; sortOrder?: number; active?: boolean }) => Promise<void>;
  onArchiveDepartment: (id: string) => Promise<void>;
  onCreateDivision: (data: { name: string; costCode?: string | null; sortOrder?: number }) => Promise<void>;
  onUpdateDivision: (id: string, data: { name?: string; costCode?: string | null; sortOrder?: number; active?: boolean }) => Promise<void>;
  onArchiveDivision: (id: string) => Promise<void>;
  onCreateLob: (data: { name: string; divisionId?: string; costCode?: string | null; sortOrder?: number }) => Promise<void>;
  onUpdateLob: (id: string, data: { name?: string; divisionId?: string | null; costCode?: string | null; sortOrder?: number; active?: boolean }) => Promise<void>;
  onArchiveLob: (id: string) => Promise<void>;
  onCreatePosition: (data: { name: string; departmentId?: string; lobId?: string; divisionId?: string; locationId?: string; costCode?: string | null; sortOrder?: number }) => Promise<void>;
  onUpdatePosition: (id: string, data: { name?: string; departmentId?: string | null; lobId?: string | null; divisionId?: string | null; locationId?: string | null; costCode?: string | null; sortOrder?: number; active?: boolean }) => Promise<void>;
  onArchivePosition: (id: string) => Promise<void>;
  onCreateLocation: (data: LocationInput) => Promise<void>;
  onUpdateLocation: (id: string, data: LocationInput) => Promise<void>;
  onArchiveLocation: (id: string) => Promise<void>;
};

// ── Component ──

export function OrgSettings({
  departments, divisions, lobs, positions, locations,
  loading,
  onCreateDepartment, onUpdateDepartment, onArchiveDepartment,
  onCreateDivision, onUpdateDivision, onArchiveDivision,
  onCreateLob, onUpdateLob, onArchiveLob,
  onCreatePosition, onUpdatePosition, onArchivePosition,
  onCreateLocation, onUpdateLocation, onArchiveLocation,
}: OrgSettingsProps) {
  const [tab, setTab] = useState<Tab>("divisions");
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [archiveItem, setArchiveItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // ── Create form state ──
  const [createName, setCreateName] = useState("");
  const [createParentId, setCreateParentId] = useState("");       // parent dept (depts) or parent location (locations)
  const [createDeptId, setCreateDeptId] = useState("");           // position
  const [createLobId, setCreateLobId] = useState("");             // dept, position
  const [createDivisionId, setCreateDivisionId] = useState("");   // lob, position
  const [createLocationId, setCreateLocationId] = useState("");   // dept, position
  const [createCostCode, setCreateCostCode] = useState("");       // all entities
  const [createCostCodeManual, setCreateCostCodeManual] = useState(false);  // true once user types in cost code
  const [createLoc, setCreateLoc] = useState<LocationFieldValues>(EMPTY_LOC);

  // ── Edit form state ──
  const [editName, setEditName] = useState("");
  const [editParentId, setEditParentId] = useState("");
  const [editDeptId, setEditDeptId] = useState("");
  const [editLobId, setEditLobId] = useState("");
  const [editDivisionId, setEditDivisionId] = useState("");
  const [editLocationId, setEditLocationId] = useState("");
  const [editCostCode, setEditCostCode] = useState("");
  const [editLoc, setEditLoc] = useState<LocationFieldValues>(EMPTY_LOC);

  // ── Computed ──

  const counts: Record<Tab, number> = {
    divisions: divisions.filter((d) => d.active).length,
    locations: locations.filter((l) => l.active).length,
    lobs: lobs.filter((l) => l.active).length,
    departments: departments.filter((d) => d.active).length,
    positions: positions.filter((p) => p.active).length,
  };

  const deptOptions: SelectOption[] = useMemo(() =>
    departments.filter((d) => d.active).map((d) => ({ value: d.id, label: d.name })),
    [departments],
  );

  const lobOptions: SelectOption[] = useMemo(() =>
    lobs.filter((l) => l.active).map((l) => ({ value: l.id, label: l.name })),
    [lobs],
  );

  const parentDeptOptions: SelectOption[] = useMemo(() =>
    [{ value: NONE, label: "None (Top level)" }, ...deptOptions],
    [deptOptions],
  );

  const locationOptions: SelectOption[] = useMemo(() =>
    locations.filter((l) => l.active).map((l) => ({ value: l.id, label: l.name })),
    [locations],
  );

  const parentLocationOptions: SelectOption[] = useMemo(() =>
    [{ value: NONE, label: "None (Top level)" }, ...locationOptions],
    [locationOptions],
  );

  const divisionOptions: SelectOption[] = useMemo(() =>
    divisions.filter((d) => d.active).map((d) => ({ value: d.id, label: d.name })),
    [divisions],
  );

  const divisionOptionsWithNone: SelectOption[] = useMemo(() =>
    [{ value: NONE, label: "None" }, ...divisionOptions],
    [divisionOptions],
  );

  const lobOptionsWithNone: SelectOption[] = useMemo(() =>
    [{ value: NONE, label: "None" }, ...lobOptions],
    [lobOptions],
  );

  const deptOptionsWithNone: SelectOption[] = useMemo(() =>
    [{ value: NONE, label: "None" }, ...deptOptions],
    [deptOptions],
  );

  const locationOptionsWithNone: SelectOption[] = useMemo(() =>
    [{ value: NONE, label: "None" }, ...locationOptions],
    [locationOptions],
  );

  // ── Filter ──

  function filterBySearch<T extends { name: string; active: boolean }>(items: T[]): T[] {
    let list = showArchived ? items : items.filter((i) => i.active);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q));
    }
    return list;
  }

  async function handleRestore(item: any) {
    setSaving(true);
    try {
      switch (tab) {
        case "departments": await onUpdateDepartment(item.id, { active: true }); break;
        case "divisions": await onUpdateDivision(item.id, { active: true }); break;
        case "lobs": await onUpdateLob(item.id, { active: true }); break;
        case "positions": await onUpdatePosition(item.id, { active: true }); break;
        case "locations": await onUpdateLocation(item.id, { name: item.name, active: true }); break;
      }
    } finally {
      setSaving(false);
    }
  }

  // ── Handlers ──

  function resetCreateForm() {
    setCreateName("");
    setCreateParentId(NONE);
    setCreateDeptId(NONE);
    setCreateLobId(NONE);
    setCreateDivisionId(NONE);
    setCreateLocationId(NONE);
    setCreateCostCode("");
    setCreateCostCodeManual(false);
    setCreateLoc(EMPTY_LOC);
  }

  // Existing local codes for siblings under the same parent — used for collision-free auto-gen
  const existingLocalCodes = useMemo(() => {
    const items =
      tab === "departments" ? departments :
      tab === "divisions" ? divisions :
      tab === "lobs" ? lobs :
      tab === "positions" ? positions :
      locations;
    return new Set(
      items
        .filter((i: any) => i.costCode && (!editItem || i.id !== editItem.id))
        .map((i: any) => localPart(i.costCode as string))
    );
  }, [tab, departments, divisions, lobs, positions, locations, editItem]);

  // Auto-fill CREATE cost code as user types name or changes parents
  useEffect(() => {
    if (createCostCodeManual) return;
    if (!createName.trim()) {
      setCreateCostCode("");
      return;
    }
    const local = generateLocalCode(createName, existingLocalCodes);
    setCreateCostCode(composeFullCode(tab, local, {
      parentLocId: createParentId,
      divisionId: createDivisionId,
      lobId: createLobId,
      deptId: createDeptId,
      locationId: createLocationId,
    }, { divisions, locations, lobs, departments }));
  }, [tab, createName, createCostCodeManual, existingLocalCodes, createParentId, createDivisionId, createLobId, createDeptId, createLocationId, divisions, locations, lobs, departments]);

  // Auto-fill EDIT cost code if it's empty (legacy items without a code)
  const [editCostCodeManual, setEditCostCodeManual] = useState(false);
  useEffect(() => {
    if (!editItem) return;
    if (editCostCodeManual) return;
    if (editCostCode.trim()) return;  // already has one — leave it alone
    if (!editName.trim()) return;
    const local = generateLocalCode(editName, existingLocalCodes);
    setEditCostCode(composeFullCode(tab, local, {
      parentLocId: editParentId,
      divisionId: editDivisionId,
      lobId: editLobId,
      deptId: editDeptId,
      locationId: editLocationId,
    }, { divisions, locations, lobs, departments }));
  }, [tab, editItem, editName, editCostCode, editCostCodeManual, existingLocalCodes, editParentId, editDivisionId, editLobId, editDeptId, editLocationId, divisions, locations, lobs, departments]);

  function handleCreateCostCodeChange(value: string) {
    setCreateCostCode(value.toUpperCase());
    setCreateCostCodeManual(true);
  }

  function handleEditCostCodeChange(value: string) {
    setEditCostCode(value.toUpperCase());
    setEditCostCodeManual(true);
  }

  function openEdit(item: any) {
    setEditItem(item);
    setEditName(item.name);
    setEditParentId(item.parentId ?? NONE);
    setEditDeptId(item.departmentId ?? NONE);
    setEditLobId(item.lobId ?? NONE);
    setEditDivisionId(item.divisionId ?? NONE);
    setEditLocationId(item.locationId ?? NONE);
    setEditCostCode(item.costCode ?? "");
    setEditCostCodeManual(!!item.costCode);  // existing code = treat as manual; empty = auto-fill on the fly
    setEditLoc({
      isRemote: item.isRemote ?? false,
      parentId: item.parentId ?? NONE,
      addressLine1: item.addressLine1 ?? "",
      addressLine2: item.addressLine2 ?? "",
      city: item.city ?? "",
      stateCode: item.stateProvince ?? "",
      postalCode: item.postalCode ?? "",
      countryCode: item.country ?? "",
      timezone: item.timezone ?? "",
      phone: item.phone ?? "",
    });
  }

  function locValuesToPayload(name: string, loc: LocationFieldValues, costCode: string): LocationInput {
    // Remote locations clear address fields
    const remote = loc.isRemote;
    return {
      name: name.trim(),
      parentId: toIdOrNull(loc.parentId),
      isRemote: remote,
      addressLine1: remote ? null : (loc.addressLine1.trim() || null),
      addressLine2: remote ? null : (loc.addressLine2.trim() || null),
      city: remote ? null : (loc.city.trim() || null),
      stateProvince: remote ? null : (loc.stateCode || null),
      postalCode: remote ? null : (loc.postalCode.trim() || null),
      country: remote ? null : (loc.countryCode || null),
      timezone: loc.timezone || null,
      phone: loc.phone.trim() || null,
      costCode: costCode.trim() || null,
    };
  }

  async function handleCreate() {
    if (!createName.trim()) return;
    setSaving(true);
    try {
      const costCode = createCostCode.trim() || null;
      switch (tab) {
        case "departments":
          await onCreateDepartment({
            name: createName.trim(),
            parentId: toId(createParentId),
            lobId: toId(createLobId),
            locationId: toId(createLocationId),
            costCode,
          });
          break;
        case "divisions":
          await onCreateDivision({ name: createName.trim(), costCode });
          break;
        case "lobs":
          await onCreateLob({
            name: createName.trim(),
            divisionId: toId(createDivisionId),
            costCode,
          });
          break;
        case "positions":
          await onCreatePosition({
            name: createName.trim(),
            departmentId: toId(createDeptId),
            lobId: toId(createLobId),
            divisionId: toId(createDivisionId),
            locationId: toId(createLocationId),
            costCode,
          });
          break;
        case "locations":
          await onCreateLocation(locValuesToPayload(createName, createLoc, createCostCode));
          break;
      }
      setShowCreate(false);
      resetCreateForm();
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit() {
    if (!editItem || !editName.trim()) return;
    setSaving(true);
    try {
      const costCode = editCostCode.trim() || null;
      switch (tab) {
        case "departments":
          await onUpdateDepartment(editItem.id, {
            name: editName.trim(),
            parentId: toIdOrNull(editParentId),
            lobId: toIdOrNull(editLobId),
            locationId: toIdOrNull(editLocationId),
            costCode,
          });
          break;
        case "divisions":
          await onUpdateDivision(editItem.id, { name: editName.trim(), costCode });
          break;
        case "lobs":
          await onUpdateLob(editItem.id, {
            name: editName.trim(),
            divisionId: toIdOrNull(editDivisionId),
            costCode,
          });
          break;
        case "positions":
          await onUpdatePosition(editItem.id, {
            name: editName.trim(),
            departmentId: toIdOrNull(editDeptId),
            lobId: toIdOrNull(editLobId),
            divisionId: toIdOrNull(editDivisionId),
            locationId: toIdOrNull(editLocationId),
            costCode,
          });
          break;
        case "locations":
          await onUpdateLocation(editItem.id, locValuesToPayload(editName, editLoc, editCostCode));
          break;
      }
      setEditItem(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive() {
    if (!archiveItem) return;
    setSaving(true);
    try {
      switch (tab) {
        case "departments": await onArchiveDepartment(archiveItem.id); break;
        case "divisions": await onArchiveDivision(archiveItem.id); break;
        case "lobs": await onArchiveLob(archiveItem.id); break;
        case "positions": await onArchivePosition(archiveItem.id); break;
        case "locations": await onArchiveLocation(archiveItem.id); break;
      }
      setArchiveItem(null);
    } finally {
      setSaving(false);
    }
  }

  // ── Render Helpers ──

  const cardHandlers = {
    onEdit: openEdit,
    onArchive: setArchiveItem,
    onRestore: handleRestore,
  };

  function renderCards() {
    if (loading) {
      return (
        <div className="org-settings__grid">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      );
    }

    const items =
      tab === "departments" ? filterBySearch(departments) :
      tab === "divisions" ? filterBySearch(divisions) :
      tab === "lobs" ? filterBySearch(lobs) :
      tab === "positions" ? filterBySearch(positions) :
      filterBySearch(locations);

    if (items.length === 0) {
      return (
        <p className="org-settings__empty">
          {search ? `No ${tab} match your search.` : `No ${tab} yet.`}
        </p>
      );
    }

    return (
      <div className="org-settings__grid">
        {tab === "divisions" && (items as DivisionRow[]).map((d) => <DivisionCard key={d.id} d={d} handlers={cardHandlers} />)}
        {tab === "locations" && (items as LocationRow[]).map((l) => <LocationCard key={l.id} l={l} handlers={cardHandlers} />)}
        {tab === "lobs" && (items as LobRow[]).map((l) => <LobCard key={l.id} l={l} handlers={cardHandlers} />)}
        {tab === "departments" && (items as DepartmentRow[]).map((d) => <DepartmentCard key={d.id} d={d} handlers={cardHandlers} />)}
        {tab === "positions" && (items as PositionRow[]).map((p) => <PositionCard key={p.id} p={p} handlers={cardHandlers} />)}
      </div>
    );
  }

  function renderCreateFields() {
    if (tab === "locations") {
      return (
        <>
          <div className="org-settings__dialog-section">
            <div className="org-settings__dialog-fields">
              <label className="org-settings__dialog-label">
                Name
                <Input placeholder="e.g., Austin HQ" value={createName} onChange={(e) => setCreateName(e.target.value)} autoFocus />
              </label>
            </div>
          </div>
          <LocationFields
            values={createLoc}
            parentOptions={parentLocationOptions}
            onChange={(patch) => setCreateLoc((prev) => ({ ...prev, ...patch }))}
          />
        </>
      );
    }

    return (
      <div className="org-settings__dialog-fields">
        <label className="org-settings__dialog-label">
          Name
          <Input placeholder="Enter name..." value={createName} onChange={(e) => setCreateName(e.target.value)} autoFocus />
        </label>

        {tab === "lobs" && (
          <label className="org-settings__dialog-label">
            Division
            <Select options={divisionOptionsWithNone} value={createDivisionId} onChange={setCreateDivisionId} placeholder="None" />
          </label>
        )}

        {tab === "departments" && (
          <>
            <div className="org-settings__dialog-row">
              <label className="org-settings__dialog-label">
                LOB
                <Select options={lobOptionsWithNone} value={createLobId} onChange={setCreateLobId} placeholder="None" />
              </label>
              <label className="org-settings__dialog-label">
                Location
                <Select options={locationOptionsWithNone} value={createLocationId} onChange={setCreateLocationId} placeholder="None" />
              </label>
            </div>
            <label className="org-settings__dialog-label">
              Parent Department
              <Select options={parentDeptOptions} value={createParentId} onChange={setCreateParentId} placeholder="None (Top level)" />
            </label>
          </>
        )}

        {tab === "positions" && (
          <>
            <div className="org-settings__dialog-row">
              <label className="org-settings__dialog-label">
                Division
                <Select options={divisionOptionsWithNone} value={createDivisionId} onChange={setCreateDivisionId} placeholder="None" />
              </label>
              <label className="org-settings__dialog-label">
                LOB
                <Select options={lobOptionsWithNone} value={createLobId} onChange={setCreateLobId} placeholder="None" />
              </label>
            </div>
            <div className="org-settings__dialog-row">
              <label className="org-settings__dialog-label">
                Department
                <Select options={deptOptionsWithNone} value={createDeptId} onChange={setCreateDeptId} placeholder="None" />
              </label>
              <label className="org-settings__dialog-label">
                Location
                <Select options={locationOptionsWithNone} value={createLocationId} onChange={setCreateLocationId} placeholder="None" />
              </label>
            </div>
          </>
        )}
      </div>
    );
  }

  function renderEditFields() {
    if (tab === "locations") {
      return (
        <>
          <div className="org-settings__dialog-section">
            <div className="org-settings__dialog-fields">
              <label className="org-settings__dialog-label">
                Name
                <Input placeholder="e.g., Austin HQ" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
              </label>
            </div>
          </div>
          <LocationFields
            values={editLoc}
            parentOptions={parentLocationOptions.filter((o) => o.value !== editItem?.id)}
            onChange={(patch) => setEditLoc((prev) => ({ ...prev, ...patch }))}
          />
        </>
      );
    }

    return (
      <div className="org-settings__dialog-fields">
        <label className="org-settings__dialog-label">
          Name
          <Input placeholder="Enter name..." value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
        </label>

        {tab === "lobs" && (
          <label className="org-settings__dialog-label">
            Division
            <Select options={divisionOptionsWithNone} value={editDivisionId} onChange={setEditDivisionId} placeholder="None" />
          </label>
        )}

        {tab === "departments" && (
          <>
            <div className="org-settings__dialog-row">
              <label className="org-settings__dialog-label">
                LOB
                <Select options={lobOptionsWithNone} value={editLobId} onChange={setEditLobId} placeholder="None" />
              </label>
              <label className="org-settings__dialog-label">
                Location
                <Select options={locationOptionsWithNone} value={editLocationId} onChange={setEditLocationId} placeholder="None" />
              </label>
            </div>
            <label className="org-settings__dialog-label">
              Parent Department
              <Select options={parentDeptOptions.filter((o) => o.value !== editItem?.id)} value={editParentId} onChange={setEditParentId} placeholder="None (Top level)" />
            </label>
          </>
        )}

        {tab === "positions" && (
          <>
            <div className="org-settings__dialog-row">
              <label className="org-settings__dialog-label">
                Division
                <Select options={divisionOptionsWithNone} value={editDivisionId} onChange={setEditDivisionId} placeholder="None" />
              </label>
              <label className="org-settings__dialog-label">
                LOB
                <Select options={lobOptionsWithNone} value={editLobId} onChange={setEditLobId} placeholder="None" />
              </label>
            </div>
            <div className="org-settings__dialog-row">
              <label className="org-settings__dialog-label">
                Department
                <Select options={deptOptionsWithNone} value={editDeptId} onChange={setEditDeptId} placeholder="None" />
              </label>
              <label className="org-settings__dialog-label">
                Location
                <Select options={locationOptionsWithNone} value={editLocationId} onChange={setEditLocationId} placeholder="None" />
              </label>
            </div>
          </>
        )}
      </div>
    );
  }

  const currentTab = TABS.find((t) => t.key === tab);
  const tabLabel = currentTab?.label ?? "";
  const tabSingular = tabLabel.endsWith("s") ? tabLabel.slice(0, -1) : tabLabel;
  const TabIcon = currentTab?.icon ?? Building2;

  return (
    <div className="org-settings">
      <div className="org-settings__header">
        <h2>Organization</h2>
      </div>

      {/* Tabs */}
      <div className="org-settings__tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={cn("org-settings__tab", tab === t.key && "org-settings__tab--active")}
            onClick={() => { setTab(t.key); setSearch(""); }}
          >
            <t.icon size={14} />
            {t.label}
            <span className="org-settings__tab-count">{counts[t.key]}</span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="org-settings__toolbar">
        <div className="org-settings__search">
          <Input
            placeholder={`Search ${tabLabel.toLowerCase()}...`}
            icon={<Search size={15} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Switch checked={showArchived} onCheckedChange={setShowArchived} label="Show archived" />
        <Button variant="primary" size="sm" onClick={() => { resetCreateForm(); setShowCreate(true); }}>
          + New {tabSingular}
        </Button>
      </div>

      {/* Cards */}
      {renderCards()}

      {/* Create Dialog */}
      <Dialog.Root open={showCreate} onOpenChange={setShowCreate}>
        <Dialog.Portal>
          <Dialog.Overlay className="org-settings__overlay" />
          <Dialog.Content className="org-settings__dialog" aria-describedby={undefined}>
            <div className="org-settings__dialog-header">
              <div className="org-settings__dialog-header-left">
                <span className="org-settings__dialog-header-icon"><TabIcon size={16} /></span>
                <div>
                  <Dialog.Title className="org-settings__dialog-title">New {tabSingular}</Dialog.Title>
                  <p className="org-settings__dialog-subtitle">Add a new {tabSingular.toLowerCase()} to your org structure</p>
                </div>
              </div>
              <label className="org-settings__dialog-cost">
                <span className="org-settings__dialog-cost-label">Cost Code</span>
                <Input
                  className="org-settings__dialog-cost-input"
                  placeholder="Auto-filled"
                  value={createCostCode}
                  onChange={(e) => handleCreateCostCodeChange(e.target.value)}
                />
              </label>
            </div>
            <div className="org-settings__dialog-body">
              {renderCreateFields()}
            </div>
            <div className="org-settings__dialog-actions">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreate} loading={saving} disabled={!createName.trim() || !createCostCode.trim()}>Create</Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit Dialog */}
      <Dialog.Root open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="org-settings__overlay" />
          <Dialog.Content className="org-settings__dialog" aria-describedby={undefined}>
            <div className="org-settings__dialog-header">
              <div className="org-settings__dialog-header-left">
                <span className="org-settings__dialog-header-icon"><TabIcon size={16} /></span>
                <div>
                  <Dialog.Title className="org-settings__dialog-title">Edit {tabSingular}</Dialog.Title>
                  <p className="org-settings__dialog-subtitle">{editItem?.name}</p>
                </div>
              </div>
              <label className="org-settings__dialog-cost">
                <span className="org-settings__dialog-cost-label">Cost Code</span>
                <Input
                  className="org-settings__dialog-cost-input"
                  placeholder="Required"
                  value={editCostCode}
                  onChange={(e) => handleEditCostCodeChange(e.target.value)}
                />
              </label>
            </div>
            <div className="org-settings__dialog-body">
              {renderEditFields()}
            </div>
            <div className="org-settings__dialog-actions">
              <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleEdit} loading={saving} disabled={!editName.trim() || !editCostCode.trim()}>Save</Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Archive Confirmation */}
      <Dialog.Root open={!!archiveItem} onOpenChange={() => setArchiveItem(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="org-settings__overlay" />
          <Dialog.Content className="org-settings__dialog" aria-describedby={undefined}>
            <div className="org-settings__dialog-header">
              <div className="org-settings__dialog-header-left">
                <span className="org-settings__dialog-header-icon"><Archive size={16} /></span>
                <div>
                  <Dialog.Title className="org-settings__dialog-title">Archive {tabSingular}</Dialog.Title>
                  <p className="org-settings__dialog-subtitle">{archiveItem?.name}</p>
                </div>
              </div>
            </div>
            <div className="org-settings__dialog-body">
              <p className="org-settings__dialog-text">
                It will be hidden from dropdowns but existing assignments are preserved. You can restore it later if needed.
              </p>
            </div>
            <div className="org-settings__dialog-actions">
              <Button variant="outline" onClick={() => setArchiveItem(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleArchive} loading={saving}>Archive</Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
