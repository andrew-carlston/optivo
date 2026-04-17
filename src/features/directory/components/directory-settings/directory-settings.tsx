"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Archive, Eye, EyeOff, Plus, GripVertical, ChevronDown, ChevronRight, Link2, Search } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button/button";
import { Input } from "@/components/ui/input/input";
import { Badge } from "@/components/ui/badge/badge";
import { Switch } from "@/components/ui/switch/switch";
import { Select, type SelectOption } from "@/components/ui/select/select";
import { ColorPicker } from "@/components/ui/color-picker/color-picker";
import { cn } from "@/lib/cn";
import type { ColumnRow } from "@/features/directory/actions/directory-actions";
import {
  getColumns, updateColumn, createCustomColumn, reorderColumns, archiveColumn,
} from "@/features/directory/actions/directory-actions";
import type { EmploymentTypeRow, WorkingStatusRow } from "@/features/hr/actions/org-actions";
import {
  getOrgStructureAll,
  createEmploymentType, updateEmploymentType, archiveEmploymentType,
  createWorkingStatus, updateWorkingStatus, archiveWorkingStatus,
} from "@/features/hr/actions/org-actions";
import "./directory-settings.scss";

// ── Types ──

type Props = {
  companySlug: string;
  initialColumns: ColumnRow[];
  initialEmploymentTypes: EmploymentTypeRow[];
  initialWorkingStatuses: WorkingStatusRow[];
};

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

const ORG_BACKED_KEYS = new Set(["department_id", "division_id", "lob_id", "position_id", "location_id"]);

// ── Component ──

export function DirectorySettings({
  companySlug,
  initialColumns,
  initialEmploymentTypes,
  initialWorkingStatuses,
}: Props) {
  const [columns, setColumns] = useState(initialColumns);
  const [etRows, setEtRows] = useState(initialEmploymentTypes);
  const [wsRows, setWsRows] = useState(initialWorkingStatuses);
  const [saving, setSaving] = useState(false);
  const [expandedCol, setExpandedCol] = useState<string | null>(null);
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
  const [newColLabel, setNewColLabel] = useState("");
  const [newColType, setNewColType] = useState("text");

  async function handleCreateColumn() {
    if (!newColLabel.trim()) return;
    setSaving(true);
    try {
      const key = newColLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
      await createCustomColumn(companySlug, {
        columnKey: key,
        label: newColLabel.trim(),
        type: newColType,
      });
      setShowCreateCol(false);
      setNewColLabel(""); setNewColType("text");
      bgRefresh();
    } finally { setSaving(false); }
  }

  // ── ET / WS handlers ──

  async function handleCreateEt(name: string) {
    const tempId = `temp-${Date.now()}`;
    setEtRows((prev) => [...prev, { id: tempId, name, costCode: null, active: true, sortOrder: 0, employeeCount: 0 }]);
    try {
      const realId = await createEmploymentType(companySlug, { name });
      setEtRows((prev) => prev.map((r) => r.id === tempId ? { ...r, id: realId } : r));
    } catch { setEtRows((prev) => prev.filter((r) => r.id !== tempId)); }
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

  async function handleCreateWs(name: string, color: string) {
    const tempId = `temp-${Date.now()}`;
    setWsRows((prev) => [...prev, { id: tempId, name, costCode: null, color, active: true, sortOrder: 0, employeeCount: 0 }]);
    try {
      const realId = await createWorkingStatus(companySlug, { name, color });
      setWsRows((prev) => prev.map((r) => r.id === tempId ? { ...r, id: realId } : r));
    } catch { setWsRows((prev) => prev.filter((r) => r.id !== tempId)); }
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

  async function handleUpdateColumnOptions(id: string, options: { value: string; label: string; color?: string }[]) {
    applyColumnUpdate(id, { options } as any);
  }

  // ── DnD ──

  const [search, setSearch] = useState("");
  const allActive = mergedColumns.filter((c) => c.active).sort((a, b) => a.sortOrder - b.sortOrder);
  const active = search
    ? allActive.filter((c) => c.label.toLowerCase().includes(search.toLowerCase()) || c.columnKey.toLowerCase().includes(search.toLowerCase()))
    : allActive;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  function handleDragEnd(event: DragEndEvent) {
    const { active: a, over } = event;
    if (!over || a.id === over.id) return;
    const oldIdx = active.findIndex((c) => c.id === a.id);
    const newIdx = active.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(active, oldIdx, newIdx);
    const ids = reordered.map((c) => c.id);
    setColumns((prev) => {
      const map = new Map(prev.map((c) => [c.id, c]));
      return ids.map((id, i) => ({ ...map.get(id)!, sortOrder: i }));
    });
    reorderColumns(companySlug, ids).then(() => bgRefresh());
  }

  function getOptionsContext(col: ColumnRow) {
    if (col.columnKey === "employment_type") return { type: "et" as const, rows: etRows };
    if (col.columnKey === "employment_status") return { type: "ws" as const, rows: wsRows };
    if (ORG_BACKED_KEYS.has(col.columnKey)) return { type: "org" as const };
    if (col.type === "select") return { type: "custom" as const, options: col.options ?? [] };
    return null;
  }

  const rows = active.map((col) => (
    <SortableColumnRow
      key={col.id}
      col={col}
      draggable={mounted}
      expanded={expandedCol === col.id}
      onToggleExpand={() => setExpandedCol((c) => c === col.id ? null : col.id)}
      onUpdate={(patch) => applyColumnUpdate(col.id, patch)}
      onArchive={() => { archiveColumn(companySlug, col.id); bgRefresh(); }}
      optionsContext={getOptionsContext(col)}
      onCreateEt={handleCreateEt}
      onUpdateEt={handleUpdateEt}
      onArchiveEt={handleArchiveEt}
      onCreateWs={handleCreateWs}
      onUpdateWs={handleUpdateWs}
      onArchiveWs={handleArchiveWs}
      onUpdateOptions={(opts) => handleUpdateColumnOptions(col.id, opts)}
    />
  ));

  return (
    <div className="dir-settings">
      <div className="dir-settings__header">
        <h2>Directory Settings</h2>
        <div className="dir-settings__header-actions">
          <div className="dir-settings__search">
            <Input
              placeholder="Search columns..."
              icon={<Search size={15} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowCreateCol(true)}>
            <Plus size={14} /> Custom Column
          </Button>
        </div>
      </div>

      {mounted ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={active.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="dir-settings__col-list">{rows}</div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="dir-settings__col-list">{rows}</div>
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
                Type
                <Select options={COLUMN_TYPES} value={newColType} onChange={setNewColType} placeholder="Select type..." />
              </label>
            </div>
            <div className="dir-settings__dialog-actions">
              <Button variant="outline" onClick={() => setShowCreateCol(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreateColumn} loading={saving} disabled={!newColLabel.trim()}>Create</Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

// ── Sortable Column Row ──

type OptionsContext =
  | { type: "et"; rows: EmploymentTypeRow[] }
  | { type: "ws"; rows: WorkingStatusRow[] }
  | { type: "org" }
  | { type: "custom"; options: { value: string; label: string; color?: string }[] }
  | null;

function SortableColumnRow({
  col, draggable, expanded, onToggleExpand,
  onUpdate, onArchive,
  optionsContext,
  onCreateEt, onUpdateEt, onArchiveEt,
  onCreateWs, onUpdateWs, onArchiveWs,
  onUpdateOptions,
}: {
  col: ColumnRow;
  draggable: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (patch: Partial<ColumnRow>) => void;
  onArchive: () => void;
  optionsContext: OptionsContext;
  onCreateEt: (name: string) => void;
  onUpdateEt: (id: string, patch: Record<string, any>) => void;
  onArchiveEt: (id: string) => void;
  onCreateWs: (name: string, color: string) => void;
  onUpdateWs: (id: string, patch: Record<string, any>) => void;
  onArchiveWs: (id: string) => void;
  onUpdateOptions: (opts: { value: string; label: string; color?: string }[]) => void;
}) {
  const sortable = useSortable({ id: col.id, disabled: !draggable });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;

  const style = draggable ? {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} className="dir-settings__col-wrap">
      <div className={cn("dir-settings__col-row", expanded && "dir-settings__col-row--expanded")}>
        <button type="button" className="dir-settings__col-grip" {...(draggable ? { ...attributes, ...listeners } : {})}>
          <GripVertical size={14} />
        </button>

        <button
          type="button"
          className="dir-settings__col-toggle-expand"
          onClick={onToggleExpand}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        <div className="dir-settings__col-info" onClick={onToggleExpand}>
          <span className="dir-settings__col-label">{col.label}</span>
          <span className="dir-settings__col-meta">
            {col.type}
            {!col.isSystem && " · custom"}
          </span>
        </div>

        <div className="dir-settings__col-actions">
          <button
            type="button"
            className={cn("dir-settings__col-vis", !col.visibleByDefault && "dir-settings__col-vis--hidden")}
            onClick={() => onUpdate({ visibleByDefault: !col.visibleByDefault })}
            title={col.visibleByDefault ? "Visible — click to hide" : "Hidden — click to show"}
          >
            {col.visibleByDefault ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          {!col.isSystem && (
            <Button variant="ghost" size="icon" onClick={onArchive} title="Archive">
              <Archive size={14} />
            </Button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="dir-settings__col-detail">
          {/* Settings row */}
          <div className="dir-settings__col-settings">
            <Switch checked={col.editable} onCheckedChange={(v) => onUpdate({ editable: v })} label="Editable" />
            <Switch checked={col.visibleByDefault} onCheckedChange={(v) => onUpdate({ visibleByDefault: v })} label="Visible" />
            <div className="dir-settings__col-sens">
              <span>Sensitivity</span>
              <Select
                options={SENSITIVITY_OPTIONS}
                value={String(col.sensitivityLevel)}
                onChange={(v) => onUpdate({ sensitivityLevel: parseInt(v) })}
                className="dir-settings__col-sens-select"
              />
            </div>
          </div>

          {/* Options section for select types */}
          {optionsContext?.type === "org" && (
            <p className="dir-settings__col-note">
              <Link2 size={14} /> Options managed in <strong>Organization</strong> settings
            </p>
          )}
          {optionsContext?.type === "et" && (
            <OptionsList
              items={optionsContext.rows.filter((r) => r.active).map((r) => ({ id: r.id, label: r.name }))}
              showColor={false}
              onAdd={(name) => onCreateEt(name)}
              onRename={(id, name) => onUpdateEt(id, { name })}
              onArchive={onArchiveEt}
              placeholder="Employment type..."
            />
          )}
          {optionsContext?.type === "ws" && (
            <OptionsList
              items={optionsContext.rows.filter((r) => r.active).map((r) => ({ id: r.id, label: r.name, color: r.color }))}
              showColor
              onAdd={(name, color) => onCreateWs(name, color!)}
              onRename={(id, name) => onUpdateWs(id, { name })}
              onColorChange={(id, color) => onUpdateWs(id, { color })}
              onArchive={onArchiveWs}
              placeholder="Working status..."
            />
          )}
          {optionsContext?.type === "custom" && (
            <OptionsList
              items={optionsContext.options.map((o, i) => ({ id: String(i), label: o.label, color: o.color }))}
              showColor
              onAdd={(label, color) => {
                const value = label.trim().toLowerCase().replace(/\s+/g, "_");
                onUpdateOptions([...optionsContext.options, { value, label: label.trim(), color }]);
              }}
              onRename={(id, label) => {
                const opts = [...optionsContext.options];
                opts[parseInt(id)] = { ...opts[parseInt(id)], label };
                onUpdateOptions(opts);
              }}
              onColorChange={(id, color) => {
                const opts = [...optionsContext.options];
                opts[parseInt(id)] = { ...opts[parseInt(id)], color };
                onUpdateOptions(opts);
              }}
              onArchive={(id) => {
                onUpdateOptions(optionsContext.options.filter((_, i) => String(i) !== id));
              }}
              placeholder="Option label..."
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Inline options list ──

function OptionsList({
  items, showColor, onAdd, onRename, onColorChange, onArchive, placeholder,
}: {
  items: { id: string; label: string; color?: string }[];
  showColor: boolean;
  onAdd: (label: string, color?: string) => void;
  onRename: (id: string, label: string) => void;
  onColorChange?: (id: string, color: string) => void;
  onArchive: (id: string) => void;
  placeholder: string;
}) {
  const [adding, setAdding] = useState(false);
  const [addLabel, setAddLabel] = useState("");
  const [addColor, setAddColor] = useState("#6B7280");

  function commitAdd() {
    const label = addLabel.trim();
    if (!label) return;
    onAdd(label, showColor ? addColor : undefined);
    setAddLabel("");
    setAddColor("#6B7280");
    setAdding(false);
  }

  return (
    <div className="dir-settings__opts">
      <div className="dir-settings__opts-header">Options</div>
      {items.map((item) => (
        <OptionRow
          key={item.id}
          item={item}
          showColor={showColor}
          onRename={(label) => onRename(item.id, label)}
          onColorChange={onColorChange ? (c) => onColorChange(item.id, c) : undefined}
          onArchive={() => onArchive(item.id)}
        />
      ))}
      {adding ? (
        <div className="dir-settings__opt-row dir-settings__opt-row--draft">
          {showColor && <ColorPicker value={addColor} onChange={setAddColor} />}
          <input
            className="dir-settings__opt-input"
            placeholder={placeholder}
            value={addLabel}
            autoFocus
            onChange={(e) => setAddLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitAdd();
              if (e.key === "Escape") { setAdding(false); setAddLabel(""); }
            }}
          />
          <Button variant="ghost" size="icon" onClick={commitAdd}><Plus size={14} /></Button>
        </div>
      ) : (
        <button type="button" className="dir-settings__opt-add" onClick={() => setAdding(true)}>
          <Plus size={14} /> Add option
        </button>
      )}
    </div>
  );
}

function OptionRow({
  item, showColor, onRename, onColorChange, onArchive,
}: {
  item: { id: string; label: string; color?: string };
  showColor: boolean;
  onRename: (label: string) => void;
  onColorChange?: (color: string) => void;
  onArchive: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(item.label);

  function commit() {
    const trimmed = label.trim();
    if (trimmed && trimmed !== item.label) onRename(trimmed);
    setEditing(false);
  }

  return (
    <div className="dir-settings__opt-row">
      {showColor && item.color && onColorChange && (
        <ColorPicker value={item.color} onChange={onColorChange} />
      )}
      {editing ? (
        <input
          className="dir-settings__opt-input"
          value={label}
          autoFocus
          onChange={(e) => setLabel(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") { setLabel(item.label); setEditing(false); }
          }}
        />
      ) : (
        <button type="button" className="dir-settings__opt-label" onClick={() => setEditing(true)}>
          {item.label}
        </button>
      )}
      <Button variant="ghost" size="icon" onClick={onArchive} title="Remove">
        <Archive size={14} />
      </Button>
    </div>
  );
}
