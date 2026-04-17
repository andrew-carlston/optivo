"use client";

import { useEffect, useRef, useState } from "react";
import { Archive, ArchiveRestore, Check, RotateCcw, X, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button/button";
import { Select, type SelectOption } from "@/components/ui/select/select";
import { Switch } from "@/components/ui/switch/switch";
import { Badge } from "@/components/ui/badge/badge";
import { Skeleton } from "@/components/ui/skeleton/skeleton";
import { cn } from "@/lib/cn";
import type {
  DepartmentRow, DivisionRow, LobRow,
  LocationRow, PositionRow,
} from "@/features/hr/actions/org-actions";
import { LocationFields, type LocationFieldValues } from "./location-fields";
import { NONE, toIdOrNull, type Tab } from "./_shared";
import type { DraftRow } from "./org-settings";

type Row = DivisionRow | LocationRow | LobRow | DepartmentRow | PositionRow;

export type TableHandlers = {
  onArchive: (item: any) => Promise<void>;
  onRestore: (item: any) => Promise<void>;
  onToggleActive: (item: any, active: boolean) => Promise<void>;
  onUpdateField: (item: any, field: string, value: any) => Promise<void>;
  suggestCostCode: (name: string, parents: Partial<DraftRow>) => string;
};

export type TableOptions = {
  divisions: SelectOption[];
  lobs: SelectOption[];
  departments: SelectOption[];
  locations: SelectOption[];
};

type ColumnDef = {
  key: string;
  label: string;
  width?: string;
};

function colsForTab(tab: Tab): ColumnDef[] {
  const base: ColumnDef[] = [
    { key: "name", label: "Name" },
  ];
  const tail: ColumnDef[] = [
    { key: "costCode", label: "Cost Code", width: "170px" },
    { key: "employees", label: "Employees", width: "110px" },
    { key: "active", label: "Active", width: "80px" },
    { key: "actions", label: "", width: "64px" },
  ];
  switch (tab) {
    case "divisions":
      return [...base, ...tail];
    case "locations":
      return [
        { key: "expand", label: "", width: "36px" },
        ...base,
        { key: "parent", label: "Parent", width: "180px" },
        ...tail,
      ];
    case "lobs":
      return [...base, { key: "division", label: "Division", width: "180px" }, ...tail];
    case "departments":
      return [
        ...base,
        { key: "lob", label: "LOB", width: "160px" },
        { key: "location", label: "Location", width: "160px" },
        ...tail,
      ];
    case "positions":
      return [
        ...base,
        { key: "department", label: "Department", width: "160px" },
        { key: "lob", label: "LOB", width: "150px" },
        { key: "division", label: "Division", width: "150px" },
        ...tail,
      ];
  }
}

// ── Inline editable name input ──
function NameCell({
  value,
  onCommit,
  placeholder,
  autoFocus,
  disabled,
}: {
  value: string;
  onCommit: (next: string) => Promise<void> | void;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(!!autoFocus);
  const [local, setLocal] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!editing) setLocal(value); }, [value, editing]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  async function commit() {
    const trimmed = local.trim();
    if (trimmed && trimmed !== value) {
      await onCommit(trimmed);
    } else {
      setLocal(value);
    }
    setEditing(false);
  }

  if (!editing) {
    return (
      <button
        type="button"
        className="org-table__name-btn"
        onClick={() => !disabled && setEditing(true)}
        disabled={disabled}
        title="Click to rename"
      >
        <span className="org-table__name-text">{value || <em className="org-table__muted">{placeholder}</em>}</span>
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      className="org-table__input"
      value={local}
      placeholder={placeholder}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") { e.preventDefault(); commit(); }
        if (e.key === "Escape") { setLocal(value); setEditing(false); }
      }}
    />
  );
}

// ── Inline editable cost-code cell ──
function CostCodeCell({
  value,
  onCommit,
  onRegenerate,
  placeholder,
  disabled,
}: {
  value: string;
  onCommit: (next: string) => Promise<void> | void;
  onRegenerate?: () => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!editing) setLocal(value); }, [value, editing]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  async function commit() {
    const trimmed = local.trim().toUpperCase();
    if (trimmed !== value) await onCommit(trimmed);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="org-table__code-wrap">
        <button
          type="button"
          className="org-table__code-btn"
          onClick={() => !disabled && setEditing(true)}
          disabled={disabled}
          title="Click to edit"
        >
          {value ? value : <em className="org-table__muted">{placeholder ?? "—"}</em>}
        </button>
        {onRegenerate && !disabled && (
          <button
            type="button"
            className="org-table__icon-btn"
            onClick={onRegenerate}
            title="Regenerate"
          >
            <RotateCcw size={12} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="org-table__code-wrap">
      <input
        ref={inputRef}
        className="org-table__input org-table__input--code"
        value={local}
        placeholder={placeholder}
        onChange={(e) => setLocal(e.target.value.toUpperCase())}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); commit(); }
          if (e.key === "Escape") { setLocal(value); setEditing(false); }
        }}
      />
    </div>
  );
}

// ── Inline select for parent dropdowns ──
function InlineSelect({
  options,
  value,
  onCommit,
  disabled,
}: {
  options: SelectOption[];
  value: string | null | undefined;
  onCommit: (newValue: string | null) => Promise<void> | void;
  disabled?: boolean;
}) {
  const [saving, setSaving] = useState(false);
  const current = value ?? NONE;
  return (
    <Select
      options={[{ value: NONE, label: "—" }, ...options]}
      value={current}
      disabled={disabled || saving}
      searchable={options.length > 5}
      onChange={async (next) => {
        setSaving(true);
        try {
          await onCommit(toIdOrNull(next));
        } finally {
          setSaving(false);
        }
      }}
      className="org-table__select"
    />
  );
}

function InlineActive({
  active,
  onToggle,
}: {
  active: boolean;
  onToggle: (next: boolean) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  return (
    <Switch
      checked={active}
      disabled={saving}
      onCheckedChange={async (next) => {
        setSaving(true);
        try {
          await onToggle(next);
        } finally {
          setSaving(false);
        }
      }}
    />
  );
}

// ── Component ──

export function OrgTable({
  tab, items, loading, handlers, opts,
  draft, onDraftChange, onDraftCancel, onDraftCommit,
}: {
  tab: Tab;
  items: Row[];
  loading: boolean;
  handlers: TableHandlers;
  opts: TableOptions;
  draft: DraftRow | null;
  onDraftChange: (patch: Partial<DraftRow>) => void;
  onDraftCancel: () => void;
  onDraftCommit: () => Promise<void>;
}) {
  const cols = colsForTab(tab);
  const [expanded, setExpanded] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="org-table__wrap">
        <table className="org-table">
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c.key} style={c.width ? { width: c.width } : undefined}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {cols.map((c) => (
                  <td key={c.key}><Skeleton width="80%" height={20} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="org-table__wrap">
      <table className="org-table">
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c.key} style={c.width ? { width: c.width } : undefined}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {draft && (
            <DraftRowView
              tab={tab}
              cols={cols}
              draft={draft}
              opts={opts}
              onChange={onDraftChange}
              onCommit={onDraftCommit}
              onCancel={onDraftCancel}
            />
          )}
          {items.length === 0 && !draft && (
            <tr>
              <td colSpan={cols.length} className="org-table__empty-row">
                No items yet — click <strong>Add</strong> to create one.
              </td>
            </tr>
          )}
          {items.map((it) => (
            <ItemRow
              key={it.id}
              tab={tab}
              item={it}
              cols={cols}
              handlers={handlers}
              opts={opts}
              expanded={expanded === it.id}
              onToggleExpand={() => setExpanded((cur) => cur === it.id ? null : it.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ItemRow({
  tab, item, cols, handlers, opts, expanded, onToggleExpand,
}: {
  tab: Tab;
  item: any;
  cols: ColumnDef[];
  handlers: TableHandlers;
  opts: TableOptions;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const archived = !item.active;

  return (
    <>
      <tr className={cn("org-table__row", archived && "org-table__row--archived")}>
        {cols.map((c) => {
          switch (c.key) {
            case "expand":
              return (
                <td key={c.key} className="org-table__cell-expand">
                  <button
                    type="button"
                    className="org-table__icon-btn"
                    onClick={onToggleExpand}
                    title={expanded ? "Collapse" : "Expand"}
                  >
                    {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                </td>
              );
            case "name":
              return (
                <td key={c.key} className="org-table__cell-name">
                  <div className="org-table__name-wrap">
                    <NameCell
                      value={item.name}
                      disabled={archived}
                      onCommit={(v) => handlers.onUpdateField(item, "name", v)}
                    />
                    {tab === "locations" && item.isRemote && <Badge variant="info">Remote</Badge>}
                    {archived && <Badge variant="warning">Inactive</Badge>}
                  </div>
                </td>
              );
            case "parent":
              return (
                <td key={c.key}>
                  <InlineSelect
                    options={opts.locations.filter((o) => o.value !== item.id)}
                    value={item.parentId}
                    disabled={archived}
                    onCommit={(v) => handlers.onUpdateField(item, "parentId", v)}
                  />
                </td>
              );
            case "division":
              return (
                <td key={c.key}>
                  <InlineSelect
                    options={opts.divisions}
                    value={item.divisionId}
                    disabled={archived}
                    onCommit={(v) => handlers.onUpdateField(item, "divisionId", v)}
                  />
                </td>
              );
            case "lob":
              return (
                <td key={c.key}>
                  <InlineSelect
                    options={opts.lobs}
                    value={item.lobId}
                    disabled={archived}
                    onCommit={(v) => handlers.onUpdateField(item, "lobId", v)}
                  />
                </td>
              );
            case "department":
              return (
                <td key={c.key}>
                  <InlineSelect
                    options={opts.departments}
                    value={item.departmentId}
                    disabled={archived}
                    onCommit={(v) => handlers.onUpdateField(item, "departmentId", v)}
                  />
                </td>
              );
            case "location":
              return (
                <td key={c.key}>
                  <InlineSelect
                    options={opts.locations}
                    value={item.locationId}
                    disabled={archived}
                    onCommit={(v) => handlers.onUpdateField(item, "locationId", v)}
                  />
                </td>
              );
            case "costCode": {
              const parents: Partial<DraftRow> = {
                name: item.name,
                parentId: item.parentId,
                divisionId: item.divisionId,
                lobId: item.lobId,
                departmentId: item.departmentId,
                locationId: item.locationId,
              };
              return (
                <td key={c.key}>
                  <CostCodeCell
                    value={item.costCode ?? ""}
                    disabled={archived}
                    onCommit={(v) => handlers.onUpdateField(item, "costCode", v || null)}
                    onRegenerate={() => {
                      const next = handlers.suggestCostCode(item.name, parents);
                      if (next) handlers.onUpdateField(item, "costCode", next);
                    }}
                  />
                </td>
              );
            }
            case "employees":
              return <td key={c.key} className="org-table__cell-count">{item.employeeCount}</td>;
            case "active":
              return (
                <td key={c.key}>
                  <InlineActive active={item.active} onToggle={(next) => handlers.onToggleActive(item, next)} />
                </td>
              );
            case "actions":
              return (
                <td key={c.key} className="org-table__cell-actions">
                  {archived ? (
                    <Button variant="ghost" size="icon" onClick={() => handlers.onRestore(item)} title="Restore">
                      <ArchiveRestore size={14} />
                    </Button>
                  ) : (
                    <Button variant="ghost" size="icon" onClick={() => handlers.onArchive(item)} title="Archive">
                      <Archive size={14} />
                    </Button>
                  )}
                </td>
              );
            default:
              return <td key={c.key}>—</td>;
          }
        })}
      </tr>
      {tab === "locations" && expanded && (
        <tr className="org-table__expand-row">
          <td colSpan={cols.length}>
            <LocationExpandEditor
              item={item}
              parentOptions={opts.locations.filter((o) => o.value !== item.id)}
              onSave={async (patch) => {
                await handlers.onUpdateField(item, "_loc", patch);
              }}
            />
          </td>
        </tr>
      )}
    </>
  );
}

// ── Draft row (inline add) ──

function DraftRowView({
  tab, cols, draft, opts, onChange, onCommit, onCancel,
}: {
  tab: Tab;
  cols: ColumnDef[];
  draft: DraftRow;
  opts: TableOptions;
  onChange: (patch: Partial<DraftRow>) => void;
  onCommit: () => Promise<void>;
  onCancel: () => void;
}) {
  const [expanded, setExpanded] = useState(tab === "locations");

  return (
    <>
      <tr className="org-table__row org-table__row--draft">
        {cols.map((c) => {
          switch (c.key) {
            case "expand":
              return (
                <td key={c.key} className="org-table__cell-expand">
                  <button
                    type="button"
                    className="org-table__icon-btn"
                    onClick={() => setExpanded((v) => !v)}
                  >
                    {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                </td>
              );
            case "name":
              return (
                <td key={c.key} className="org-table__cell-name">
                  <input
                    className="org-table__input"
                    placeholder="Name..."
                    value={draft.name}
                    autoFocus
                    onChange={(e) => onChange({ name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); onCommit(); }
                      if (e.key === "Escape") onCancel();
                    }}
                  />
                </td>
              );
            case "parent":
              return (
                <td key={c.key}>
                  <Select
                    options={[{ value: NONE, label: "—" }, ...opts.locations]}
                    value={draft.parentId ?? NONE}
                    onChange={(v) => onChange({ parentId: v })}
                    className="org-table__select"
                    searchable={opts.locations.length > 5}
                  />
                </td>
              );
            case "division":
              return (
                <td key={c.key}>
                  <Select
                    options={[{ value: NONE, label: "—" }, ...opts.divisions]}
                    value={draft.divisionId ?? NONE}
                    onChange={(v) => onChange({ divisionId: v })}
                    className="org-table__select"
                    searchable={opts.divisions.length > 5}
                  />
                </td>
              );
            case "lob":
              return (
                <td key={c.key}>
                  <Select
                    options={[{ value: NONE, label: "—" }, ...opts.lobs]}
                    value={draft.lobId ?? NONE}
                    onChange={(v) => onChange({ lobId: v })}
                    className="org-table__select"
                    searchable={opts.lobs.length > 5}
                  />
                </td>
              );
            case "department":
              return (
                <td key={c.key}>
                  <Select
                    options={[{ value: NONE, label: "—" }, ...opts.departments]}
                    value={draft.departmentId ?? NONE}
                    onChange={(v) => onChange({ departmentId: v })}
                    className="org-table__select"
                    searchable={opts.departments.length > 5}
                  />
                </td>
              );
            case "location":
              return (
                <td key={c.key}>
                  <Select
                    options={[{ value: NONE, label: "—" }, ...opts.locations]}
                    value={draft.locationId ?? NONE}
                    onChange={(v) => onChange({ locationId: v })}
                    className="org-table__select"
                    searchable={opts.locations.length > 5}
                  />
                </td>
              );
            case "costCode":
              return (
                <td key={c.key}>
                  <input
                    className="org-table__input"
                    style={{ textTransform: "uppercase" }}
                    placeholder="Auto"
                    value={draft.costCode}
                    onChange={(e) => onChange({ costCode: e.target.value.toUpperCase() })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); onCommit(); }
                      if (e.key === "Escape") onCancel();
                    }}
                  />
                </td>
              );
            case "employees":
              return <td key={c.key} className="org-table__cell-count">—</td>;
            case "active":
              return <td key={c.key}><Switch checked disabled /></td>;
            case "actions":
              return (
                <td key={c.key} className="org-table__cell-actions">
                  <Button variant="ghost" size="icon" onClick={onCommit} title="Save">
                    <Check size={14} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={onCancel} title="Cancel">
                    <X size={14} />
                  </Button>
                </td>
              );
            default:
              return <td key={c.key}>—</td>;
          }
        })}
      </tr>
      {tab === "locations" && expanded && draft.loc && (
        <tr className="org-table__expand-row">
          <td colSpan={cols.length}>
            <div className="org-table__expand-body">
              <LocationFields
                values={draft.loc}
                parentOptions={[{ value: NONE, label: "None (Top level)" }, ...opts.locations]}
                onChange={(patch) => onChange({ loc: { ...draft.loc!, ...patch } })}
              />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Location inline edit row (shown under a location when expanded) ──

function LocationExpandEditor({
  item,
  parentOptions,
  onSave,
}: {
  item: LocationRow;
  parentOptions: SelectOption[];
  onSave: (patch: Partial<LocationFieldValues> & { _commit?: true }) => Promise<void>;
}) {
  const [values, setValues] = useState<LocationFieldValues>({
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
  const [saving, setSaving] = useState(false);

  async function commit() {
    setSaving(true);
    try {
      await onSave({ ...values });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="org-table__expand-body">
      <LocationFields
        values={values}
        parentOptions={[{ value: NONE, label: "None (Top level)" }, ...parentOptions]}
        onChange={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
      />
      <div className="org-table__expand-actions">
        <Button variant="primary" size="sm" onClick={commit} loading={saving}>
          Save address
        </Button>
      </div>
    </div>
  );
}
