"use client";

import { useState, useMemo, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Columns3, LayoutGrid, FileBadge, Activity, Archive, Pencil, Eye, EyeOff, ShieldCheck, Plus, GripVertical } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button/button";
import { Input } from "@/components/ui/input/input";
import { Badge } from "@/components/ui/badge/badge";
import { Switch } from "@/components/ui/switch/switch";
import { Select, type SelectOption } from "@/components/ui/select/select";
import { Skeleton } from "@/components/ui/skeleton/skeleton";
import { ColorPicker } from "@/components/ui/color-picker/color-picker";
import { cn } from "@/lib/cn";
import type { ColumnRow, StatusOptionRow } from "@/features/directory/actions/directory-actions";
import {
  getColumns, updateColumn, createCustomColumn, archiveColumn,
  getStatusOptions,
} from "@/features/directory/actions/directory-actions";
import type { EmploymentTypeRow, WorkingStatusRow } from "@/features/hr/actions/org-actions";
import {
  getOrgStructureAll,
  createEmploymentType, updateEmploymentType, archiveEmploymentType,
  createWorkingStatus, updateWorkingStatus, archiveWorkingStatus,
} from "@/features/hr/actions/org-actions";
import { generateLocalCode, composeFullCode } from "@/features/hr/components/org-settings/cost-code";
import "./directory-settings.scss";

// ── Types ──

type Tab = "columns" | "employment-types" | "working-statuses" | "default-view";

type Props = {
  companySlug: string;
  initialColumns: ColumnRow[];
  initialStatusOptions: StatusOptionRow[];
  initialEmploymentTypes: EmploymentTypeRow[];
  initialWorkingStatuses: WorkingStatusRow[];
};

const TABS: { key: Tab; label: string; icon: typeof Columns3 }[] = [
  { key: "columns", label: "Columns", icon: Columns3 },
  { key: "employment-types", label: "Employment Types", icon: FileBadge },
  { key: "working-statuses", label: "Working Statuses", icon: Activity },
  { key: "default-view", label: "Default View", icon: LayoutGrid },
];

const COLUMN_TYPES: SelectOption[] = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "select", label: "Dropdown" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Yes/No" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
];

const SENSITIVITY_OPTIONS: SelectOption[] = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: `Level ${i + 1}`,
}));

// ── Component ──

export function DirectorySettings({
  companySlug,
  initialColumns,
  initialStatusOptions,
  initialEmploymentTypes,
  initialWorkingStatuses,
}: Props) {
  const [tab, setTab] = useState<Tab>("columns");
  const [columns, setColumns] = useState(initialColumns);
  const [etRows, setEtRows] = useState(initialEmploymentTypes);
  const [wsRows, setWsRows] = useState(initialWorkingStatuses);
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  function bgRefresh() {
    startTransition(async () => {
      try {
        const [cols, org] = await Promise.all([
          getColumns(companySlug),
          getOrgStructureAll(companySlug),
        ]);
        setColumns(cols);
        setEtRows(org.employmentTypes);
        setWsRows(org.workingStatuses);
      } catch { /* silent */ }
    });
  }

  // ── Column optimistic overrides ──
  const [colOverrides, setColOverrides] = useState<Record<string, Partial<ColumnRow>>>({});
  const mergedColumns = useMemo(
    () => columns.map((c) => ({ ...c, ...(colOverrides[c.id] ?? {}) })),
    [columns, colOverrides],
  );

  async function applyColumnUpdate(id: string, patch: Partial<ColumnRow>) {
    setColOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
    try {
      await updateColumn(companySlug, id, patch as any);
    } catch {
      setColOverrides((prev) => { const next = { ...prev }; delete next[id]; return next; });
    }
  }

  // Create column dialog
  const [showCreateCol, setShowCreateCol] = useState(false);
  const [newColKey, setNewColKey] = useState("");
  const [newColLabel, setNewColLabel] = useState("");
  const [newColType, setNewColType] = useState("text");
  const [newColSensitivity, setNewColSensitivity] = useState("1");

  async function handleCreateColumn() {
    if (!newColKey.trim() || !newColLabel.trim()) return;
    setSaving(true);
    try {
      await createCustomColumn(companySlug, {
        columnKey: newColKey.trim().toLowerCase().replace(/\s+/g, "_"),
        label: newColLabel.trim(),
        type: newColType,
        sensitivityLevel: parseInt(newColSensitivity),
      });
      setShowCreateCol(false);
      setNewColKey(""); setNewColLabel(""); setNewColType("text"); setNewColSensitivity("1");
      bgRefresh();
    } finally { setSaving(false); }
  }

  // ── Employment Types ──

  async function handleCreateEt(name: string, costCode: string) {
    const tempId = `temp-${Date.now()}`;
    setEtRows((prev) => [...prev, { id: tempId, name, costCode, active: true, sortOrder: 0, employeeCount: 0 }]);
    try {
      const realId = await createEmploymentType(companySlug, { name, costCode: costCode || null });
      setEtRows((prev) => prev.map((r) => r.id === tempId ? { ...r, id: realId } : r));
    } catch {
      setEtRows((prev) => prev.filter((r) => r.id !== tempId));
    }
    bgRefresh();
  }

  async function handleUpdateEt(id: string, patch: Record<string, any>) {
    setEtRows((prev) => prev.map((r) => r.id === id ? { ...r, ...patch } : r));
    await updateEmploymentType(companySlug, id, patch);
    bgRefresh();
  }

  async function handleArchiveEt(id: string) {
    setEtRows((prev) => prev.map((r) => r.id === id ? { ...r, active: false } : r));
    await archiveEmploymentType(companySlug, id);
    bgRefresh();
  }

  // ── Working Statuses ──

  async function handleCreateWs(name: string, costCode: string, color: string) {
    const tempId = `temp-${Date.now()}`;
    setWsRows((prev) => [...prev, { id: tempId, name, costCode, color, active: true, sortOrder: 0, employeeCount: 0 }]);
    try {
      const realId = await createWorkingStatus(companySlug, { name, color, costCode: costCode || null });
      setWsRows((prev) => prev.map((r) => r.id === tempId ? { ...r, id: realId } : r));
    } catch {
      setWsRows((prev) => prev.filter((r) => r.id !== tempId));
    }
    bgRefresh();
  }

  async function handleUpdateWs(id: string, patch: Record<string, any>) {
    setWsRows((prev) => prev.map((r) => r.id === id ? { ...r, ...patch } : r));
    await updateWorkingStatus(companySlug, id, patch);
    bgRefresh();
  }

  async function handleArchiveWs(id: string) {
    setWsRows((prev) => prev.map((r) => r.id === id ? { ...r, active: false } : r));
    await archiveWorkingStatus(companySlug, id);
    bgRefresh();
  }

  // ── Render ──

  return (
    <div className="dir-settings">
      <div className="dir-settings__header">
        <h2>Directory Settings</h2>
      </div>

      <div className="dir-settings__tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={cn("dir-settings__tab", tab === t.key && "dir-settings__tab--active")}
            onClick={() => setTab(t.key)}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "columns" && (
        <ColumnsTab
          columns={mergedColumns}
          onToggleVisibility={(col) => applyColumnUpdate(col.id, { visibleByDefault: !col.visibleByDefault })}
          onToggleEditable={(col) => applyColumnUpdate(col.id, { editable: !col.editable })}
          onSensitivityChange={(col, level) => applyColumnUpdate(col.id, { sensitivityLevel: parseInt(level) })}
          onArchive={(id) => { archiveColumn(companySlug, id); bgRefresh(); }}
          onAdd={() => setShowCreateCol(true)}
          onSortEnd={(ids) => {
            ids.forEach((id, i) => applyColumnUpdate(id, { sortOrder: i }));
          }}
        />
      )}

      {tab === "employment-types" && (
        <SimpleEntityTab
          rows={etRows}
          entityLabel="Employment Type"
          showColor={false}
          costCodePrefix="ET"
          existingCodes={etRows}
          onCreate={handleCreateEt}
          onUpdate={handleUpdateEt}
          onArchive={handleArchiveEt}
        />
      )}

      {tab === "working-statuses" && (
        <SimpleEntityTab
          rows={wsRows}
          entityLabel="Working Status"
          showColor
          costCodePrefix="WS"
          existingCodes={wsRows}
          onCreate={(name, costCode, color) => handleCreateWs(name, costCode, color!)}
          onUpdate={handleUpdateWs}
          onArchive={handleArchiveWs}
        />
      )}

      {tab === "default-view" && (
        <p className="dir-settings__empty">
          Default view configuration will be available once the directory has data.
        </p>
      )}

      {/* Create Column Dialog */}
      <Dialog.Root open={showCreateCol} onOpenChange={setShowCreateCol}>
        <Dialog.Portal>
          <Dialog.Overlay className="dir-settings__overlay" />
          <Dialog.Content className="dir-settings__dialog" aria-describedby={undefined}>
            <Dialog.Title className="dir-settings__dialog-title">New Custom Column</Dialog.Title>
            <div className="dir-settings__dialog-fields">
              <label className="dir-settings__dialog-label">
                Label
                <Input placeholder="e.g., Badge Number" value={newColLabel} onChange={(e) => setNewColLabel(e.target.value)} autoFocus />
              </label>
              <label className="dir-settings__dialog-label">
                Key
                <Input placeholder="e.g., badge_number" value={newColKey} onChange={(e) => setNewColKey(e.target.value)} />
              </label>
              <div className="dir-settings__dialog-row">
                <label className="dir-settings__dialog-label">
                  Type
                  <Select options={COLUMN_TYPES} value={newColType} onChange={setNewColType} placeholder="Select type..." />
                </label>
                <label className="dir-settings__dialog-label">
                  Sensitivity Level
                  <Select options={SENSITIVITY_OPTIONS} value={newColSensitivity} onChange={setNewColSensitivity} />
                </label>
              </div>
            </div>
            <div className="dir-settings__dialog-actions">
              <Button variant="outline" onClick={() => setShowCreateCol(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreateColumn} loading={saving} disabled={!newColLabel.trim() || !newColKey.trim()}>Create</Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

// ── Columns Tab ──

function ColumnsTab({
  columns, onToggleVisibility, onToggleEditable, onSensitivityChange, onArchive, onAdd, onSortEnd,
}: {
  columns: ColumnRow[];
  onToggleVisibility: (col: ColumnRow) => void;
  onToggleEditable: (col: ColumnRow) => void;
  onSensitivityChange: (col: ColumnRow, level: string) => void;
  onArchive: (id: string) => void;
  onAdd: () => void;
  onSortEnd: (orderedIds: string[]) => void;
}) {
  const active = columns.filter((c) => c.active).sort((a, b) => a.sortOrder - b.sortOrder);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active: a, over } = event;
    if (!over || a.id === over.id) return;
    const oldIdx = active.findIndex((c) => c.id === a.id);
    const newIdx = active.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(active, oldIdx, newIdx);
    onSortEnd(reordered.map((c) => c.id));
  }

  return (
    <>
      <div className="dir-settings__toolbar">
        <Button variant="primary" size="sm" onClick={onAdd}>
          <Plus size={14} /> Custom Column
        </Button>
      </div>
      <DndContext id="col-sort" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={active.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="dir-settings__col-list">
            {active.map((col) => (
              <SortableColumnRow
                key={col.id}
                col={col}
                onToggleVisibility={onToggleVisibility}
                onToggleEditable={onToggleEditable}
                onSensitivityChange={onSensitivityChange}
                onArchive={onArchive}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </>
  );
}

function SortableColumnRow({
  col, onToggleVisibility, onToggleEditable, onSensitivityChange, onArchive,
}: {
  col: ColumnRow;
  onToggleVisibility: (col: ColumnRow) => void;
  onToggleEditable: (col: ColumnRow) => void;
  onSensitivityChange: (col: ColumnRow, level: string) => void;
  onArchive: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: col.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="dir-settings__col-row">
      <button type="button" className="dir-settings__col-grip" {...attributes} {...listeners}>
        <GripVertical size={16} />
      </button>
      <div className="dir-settings__col-info">
        <div className="dir-settings__col-name">
          {col.label}
          <Badge variant={col.isSystem ? "default" : "info"}>
            {col.isSystem ? "System" : "Custom"}
          </Badge>
          <Badge variant="outline">{col.type}</Badge>
        </div>
        <span className="dir-settings__col-key">{col.columnKey}</span>
      </div>
      <div className="dir-settings__col-controls">
        <div className="dir-settings__col-toggle">
          {col.visibleByDefault ? <Eye size={14} /> : <EyeOff size={14} />}
          <Switch checked={col.visibleByDefault} onCheckedChange={() => onToggleVisibility(col)} />
        </div>
        <div className="dir-settings__col-toggle">
          <Pencil size={14} />
          <Switch checked={col.editable} onCheckedChange={() => onToggleEditable(col)} />
        </div>
        <div className="dir-settings__col-sensitivity">
          <ShieldCheck size={14} />
          <Select options={SENSITIVITY_OPTIONS} value={String(col.sensitivityLevel)} onChange={(v) => onSensitivityChange(col, v)} placeholder="Level" />
        </div>
        {!col.isSystem && (
          <Button variant="ghost" size="icon" onClick={() => onArchive(col.id)}>
            <Archive size={14} />
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Reusable inline-edit tab for simple entities (Employment Types / Working Statuses) ──

function SimpleEntityTab({
  rows, entityLabel, showColor, costCodePrefix, existingCodes,
  onCreate, onUpdate, onArchive,
}: {
  rows: (EmploymentTypeRow | WorkingStatusRow)[];
  entityLabel: string;
  showColor: boolean;
  costCodePrefix: string;
  existingCodes: { costCode: string | null }[];
  onCreate: (name: string, costCode: string, color?: string) => void;
  onUpdate: (id: string, patch: Record<string, any>) => void;
  onArchive: (id: string) => void;
}) {
  const [showInactive, setShowInactive] = useState(false);
  const [addName, setAddName] = useState("");
  const [addColor, setAddColor] = useState("#6B7280");
  const [adding, setAdding] = useState(false);

  const filtered = showInactive ? rows : rows.filter((r) => r.active);

  const usedCodes = new Set(existingCodes.filter((r) => r.costCode).map((r) => {
    const code = r.costCode!;
    const idx = code.lastIndexOf("-");
    return idx === -1 ? code : code.slice(idx + 1);
  }));

  function commitAdd() {
    const name = addName.trim();
    if (!name) return;
    const local = generateLocalCode(name, usedCodes);
    const costCode = `${costCodePrefix}-${local}`;
    onCreate(name, costCode, showColor ? addColor : undefined);
    setAddName("");
    setAddColor("#6B7280");
    setAdding(false);
  }

  return (
    <>
      <div className="dir-settings__toolbar">
        <Switch checked={showInactive} onCheckedChange={setShowInactive} label="Inactive" />
        <Button variant="primary" size="sm" onClick={() => setAdding(true)} disabled={adding}>
          <Plus size={14} /> Add
        </Button>
      </div>
      <div className="dir-settings__entity-list">
        {adding && (
          <div className="dir-settings__entity-row dir-settings__entity-row--draft">
            {showColor && (
              <ColorPicker value={addColor} onChange={setAddColor} />
            )}
            <input
              className="dir-settings__entity-input"
              placeholder={`${entityLabel} name...`}
              value={addName}
              autoFocus
              onChange={(e) => setAddName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitAdd();
                if (e.key === "Escape") { setAdding(false); setAddName(""); }
              }}
            />
            <div className="dir-settings__entity-actions">
              <Button variant="ghost" size="icon" onClick={commitAdd} title="Save"><Plus size={14} /></Button>
              <Button variant="ghost" size="icon" onClick={() => { setAdding(false); setAddName(""); }} title="Cancel"><Archive size={14} /></Button>
            </div>
          </div>
        )}
        {filtered.length === 0 && !adding && (
          <p className="dir-settings__empty">No {entityLabel.toLowerCase()}s yet.</p>
        )}
        {filtered.map((row) => (
          <SimpleEntityRow
            key={row.id}
            row={row}
            showColor={showColor}
            onUpdate={onUpdate}
            onArchive={onArchive}
          />
        ))}
      </div>
    </>
  );
}

function SimpleEntityRow({
  row, showColor, onUpdate, onArchive,
}: {
  row: EmploymentTypeRow | WorkingStatusRow;
  showColor: boolean;
  onUpdate: (id: string, patch: Record<string, any>) => void;
  onArchive: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(row.name);
  const archived = !row.active;
  const color = (row as WorkingStatusRow).color;

  function commitName() {
    const trimmed = name.trim();
    if (trimmed && trimmed !== row.name) onUpdate(row.id, { name: trimmed });
    setEditing(false);
  }

  return (
    <div className={cn("dir-settings__entity-row", archived && "dir-settings__entity-row--archived")}>
      {showColor && color && (
        <ColorPicker
          value={color}
          disabled={archived}
          onChange={(c) => onUpdate(row.id, { color: c })}
        />
      )}
      <div className="dir-settings__entity-info">
        {editing ? (
          <input
            className="dir-settings__entity-input"
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitName();
              if (e.key === "Escape") { setName(row.name); setEditing(false); }
            }}
          />
        ) : (
          <button
            type="button"
            className="dir-settings__entity-name"
            onClick={() => !archived && setEditing(true)}
            disabled={archived}
          >
            {row.name}
          </button>
        )}
        {row.costCode && <span className="dir-settings__entity-code">{row.costCode}</span>}
        {archived && <Badge variant="warning">Inactive</Badge>}
      </div>
      <span className="dir-settings__entity-count">{row.employeeCount}</span>
      <div className="dir-settings__entity-actions">
        {archived ? (
          <Button variant="ghost" size="icon" onClick={() => onUpdate(row.id, { active: true })} title="Restore">
            <Activity size={14} />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" onClick={() => onArchive(row.id)} title="Archive">
            <Archive size={14} />
          </Button>
        )}
      </div>
    </div>
  );
}
