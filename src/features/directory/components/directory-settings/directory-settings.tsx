"use client";

import { useState, useMemo } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Columns3, CircleDot, LayoutGrid, Archive, Pencil, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card/card";
import { Button } from "@/components/ui/button/button";
import { Input } from "@/components/ui/input/input";
import { Badge } from "@/components/ui/badge/badge";
import { Switch } from "@/components/ui/switch/switch";
import { Select, type SelectOption } from "@/components/ui/select/select";
import { SkeletonCard } from "@/components/ui/skeleton/skeleton";
import { cn } from "@/lib/cn";
import type { ColumnRow, StatusOptionRow } from "@/features/directory/actions/directory-actions";
import "./directory-settings.scss";

// ── Types ──

type Tab = "columns" | "statuses" | "default-view";

type DirectorySettingsProps = {
  columns: ColumnRow[];
  statusOptions: StatusOptionRow[];
  loading: boolean;
  onUpdateColumn: (id: string, data: Partial<ColumnRow>) => Promise<void>;
  onCreateCustomColumn: (data: { columnKey: string; label: string; type: string; options?: { value: string; label: string }[]; sensitivityLevel?: number }) => Promise<void>;
  onArchiveColumn: (id: string) => Promise<void>;
  onCreateStatusOption: (data: { value: string; label: string; color: string }) => Promise<void>;
  onUpdateStatusOption: (id: string, data: { label?: string; color?: string }) => Promise<void>;
  onArchiveStatusOption: (id: string) => Promise<void>;
};

const TABS: { key: Tab; label: string; icon: typeof Columns3 }[] = [
  { key: "columns", label: "Columns", icon: Columns3 },
  { key: "statuses", label: "Status Options", icon: CircleDot },
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
  columns, statusOptions, loading,
  onUpdateColumn, onCreateCustomColumn, onArchiveColumn,
  onCreateStatusOption, onUpdateStatusOption, onArchiveStatusOption,
}: DirectorySettingsProps) {
  const [tab, setTab] = useState<Tab>("columns");
  const [saving, setSaving] = useState(false);

  // ── Optimistic overrides ──
  // When user toggles a switch we apply change locally first for instant feedback,
  // then fire the server action in the background. If server fails we revert.
  const [colOverrides, setColOverrides] = useState<Record<string, Partial<ColumnRow>>>({});
  const [statusOverrides, setStatusOverrides] = useState<Record<string, Partial<StatusOptionRow>>>({});

  // Merge props with local overrides for render
  const mergedColumns = useMemo(
    () => columns.map((c) => ({ ...c, ...(colOverrides[c.id] ?? {}) })),
    [columns, colOverrides],
  );
  const mergedStatuses = useMemo(
    () => statusOptions.map((s) => ({ ...s, ...(statusOverrides[s.id] ?? {}) })),
    [statusOptions, statusOverrides],
  );

  async function applyColumnUpdate(id: string, patch: Partial<ColumnRow>) {
    // Optimistic — apply locally immediately
    setColOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
    try {
      await onUpdateColumn(id, patch);
    } catch (err) {
      // Revert on error
      setColOverrides((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      throw err;
    }
  }

  async function applyStatusUpdate(id: string, patch: Partial<StatusOptionRow>) {
    setStatusOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
    try {
      await onUpdateStatusOption(id, patch);
    } catch (err) {
      setStatusOverrides((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      throw err;
    }
  }

  // Create column dialog
  const [showCreateCol, setShowCreateCol] = useState(false);
  const [newColKey, setNewColKey] = useState("");
  const [newColLabel, setNewColLabel] = useState("");
  const [newColType, setNewColType] = useState("text");
  const [newColSensitivity, setNewColSensitivity] = useState("1");

  // Create status dialog
  const [showCreateStatus, setShowCreateStatus] = useState(false);
  const [newStatusValue, setNewStatusValue] = useState("");
  const [newStatusLabel, setNewStatusLabel] = useState("");
  const [newStatusColor, setNewStatusColor] = useState("#6366f1");

  // Edit status dialog
  const [editStatus, setEditStatus] = useState<StatusOptionRow | null>(null);
  const [editStatusLabel, setEditStatusLabel] = useState("");
  const [editStatusColor, setEditStatusColor] = useState("");

  // ── Handlers ──

  async function handleCreateColumn() {
    if (!newColKey.trim() || !newColLabel.trim()) return;
    setSaving(true);
    try {
      await onCreateCustomColumn({
        columnKey: newColKey.trim().toLowerCase().replace(/\s+/g, "_"),
        label: newColLabel.trim(),
        type: newColType,
        sensitivityLevel: parseInt(newColSensitivity),
      });
      setShowCreateCol(false);
      setNewColKey("");
      setNewColLabel("");
      setNewColType("text");
      setNewColSensitivity("1");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleVisibility(col: ColumnRow) {
    await applyColumnUpdate(col.id, { visibleByDefault: !col.visibleByDefault });
  }

  async function handleToggleEditable(col: ColumnRow) {
    await applyColumnUpdate(col.id, { editable: !col.editable });
  }

  async function handleSensitivityChange(col: ColumnRow, level: string) {
    await applyColumnUpdate(col.id, { sensitivityLevel: parseInt(level) });
  }

  async function handleCreateStatus() {
    if (!newStatusValue.trim() || !newStatusLabel.trim()) return;
    setSaving(true);
    try {
      await onCreateStatusOption({
        value: newStatusValue.trim().toLowerCase().replace(/\s+/g, "_"),
        label: newStatusLabel.trim(),
        color: newStatusColor,
      });
      setShowCreateStatus(false);
      setNewStatusValue("");
      setNewStatusLabel("");
      setNewStatusColor("#6366f1");
    } finally {
      setSaving(false);
    }
  }

  function openEditStatus(status: StatusOptionRow) {
    setEditStatus(status);
    setEditStatusLabel(status.label);
    setEditStatusColor(status.color);
  }

  async function handleEditStatus() {
    if (!editStatus || !editStatusLabel.trim()) return;
    setSaving(true);
    try {
      await applyStatusUpdate(editStatus.id, {
        label: editStatusLabel.trim(),
        color: editStatusColor,
      });
      setEditStatus(null);
    } finally {
      setSaving(false);
    }
  }

  // ── Render ──

  function renderColumns() {
    if (loading) {
      return (
        <div className="dir-settings__col-list">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      );
    }

    const active = mergedColumns.filter((c) => c.active);

    return (
      <>
        <div className="dir-settings__toolbar">
          <Button variant="primary" size="sm" onClick={() => setShowCreateCol(true)}>
            + Custom Column
          </Button>
        </div>
        <div className="dir-settings__col-list">
          {active.map((col) => (
            <div key={col.id} className="dir-settings__col-row">
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
                  <Switch
                    checked={col.visibleByDefault}
                    onCheckedChange={() => handleToggleVisibility(col)}
                  />
                  {col.visibleByDefault ? <Eye size={14} /> : <EyeOff size={14} />}
                </div>
                <div className="dir-settings__col-toggle">
                  <Switch
                    checked={col.editable}
                    onCheckedChange={() => handleToggleEditable(col)}
                  />
                  <Pencil size={14} />
                </div>
                <div className="dir-settings__col-sensitivity">
                  <ShieldCheck size={14} />
                  <Select
                    options={SENSITIVITY_OPTIONS}
                    value={String(col.sensitivityLevel)}
                    onChange={(v) => handleSensitivityChange(col, v)}
                    placeholder="Level"
                  />
                </div>
                {!col.isSystem && (
                  <Button variant="ghost" size="icon" onClick={() => onArchiveColumn(col.id)}>
                    <Archive size={14} />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  function renderStatuses() {
    if (loading) {
      return (
        <div className="dir-settings__status-list">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      );
    }

    const active = mergedStatuses.filter((s) => s.active);

    return (
      <>
        <div className="dir-settings__toolbar">
          <Button variant="primary" size="sm" onClick={() => setShowCreateStatus(true)}>
            + Custom Status
          </Button>
        </div>
        <div className="dir-settings__status-list">
          {active.map((status) => (
            <div key={status.id} className="dir-settings__status-row">
              <div className="dir-settings__status-swatch" style={{ backgroundColor: status.color }} />
              <div className="dir-settings__status-info">
                <span className="dir-settings__status-label">{status.label}</span>
                <span className="dir-settings__status-value">{status.value}</span>
              </div>
              {status.isSystem && <Badge variant="default">System</Badge>}
              <div className="dir-settings__status-actions">
                <Button variant="ghost" size="icon" onClick={() => openEditStatus(status)}>
                  <Pencil size={14} />
                </Button>
                {!status.isSystem && (
                  <Button variant="ghost" size="icon" onClick={() => onArchiveStatusOption(status.id)}>
                    <Archive size={14} />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  function renderDefaultView() {
    return (
      <p className="dir-settings__empty">
        Default view configuration will be available once the directory has data. Column order and visibility defaults are managed in the Columns tab.
      </p>
    );
  }

  return (
    <div className="dir-settings">
      <div className="dir-settings__header">
        <h2>Directory Settings</h2>
      </div>

      {/* Tabs */}
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

      {/* Content */}
      {tab === "columns" && renderColumns()}
      {tab === "statuses" && renderStatuses()}
      {tab === "default-view" && renderDefaultView()}

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

      {/* Create Status Dialog */}
      <Dialog.Root open={showCreateStatus} onOpenChange={setShowCreateStatus}>
        <Dialog.Portal>
          <Dialog.Overlay className="dir-settings__overlay" />
          <Dialog.Content className="dir-settings__dialog" aria-describedby={undefined}>
            <Dialog.Title className="dir-settings__dialog-title">New Status Option</Dialog.Title>
            <div className="dir-settings__dialog-fields">
              <label className="dir-settings__dialog-label">
                Label
                <Input placeholder="e.g., Suspended" value={newStatusLabel} onChange={(e) => setNewStatusLabel(e.target.value)} autoFocus />
              </label>
              <label className="dir-settings__dialog-label">
                Value (slug)
                <Input placeholder="e.g., suspended" value={newStatusValue} onChange={(e) => setNewStatusValue(e.target.value)} />
              </label>
              <label className="dir-settings__dialog-label">
                Color
                <div className="dir-settings__color-input">
                  <input type="color" value={newStatusColor} onChange={(e) => setNewStatusColor(e.target.value)} />
                  <Input value={newStatusColor} onChange={(e) => setNewStatusColor(e.target.value)} placeholder="#6366f1" />
                </div>
              </label>
            </div>
            <div className="dir-settings__dialog-actions">
              <Button variant="outline" onClick={() => setShowCreateStatus(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreateStatus} loading={saving} disabled={!newStatusLabel.trim() || !newStatusValue.trim()}>Create</Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit Status Dialog */}
      <Dialog.Root open={!!editStatus} onOpenChange={() => setEditStatus(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="dir-settings__overlay" />
          <Dialog.Content className="dir-settings__dialog" aria-describedby={undefined}>
            <Dialog.Title className="dir-settings__dialog-title">Edit Status</Dialog.Title>
            <div className="dir-settings__dialog-fields">
              <label className="dir-settings__dialog-label">
                Label
                <Input value={editStatusLabel} onChange={(e) => setEditStatusLabel(e.target.value)} autoFocus />
              </label>
              <label className="dir-settings__dialog-label">
                Color
                <div className="dir-settings__color-input">
                  <input type="color" value={editStatusColor} onChange={(e) => setEditStatusColor(e.target.value)} />
                  <Input value={editStatusColor} onChange={(e) => setEditStatusColor(e.target.value)} />
                </div>
              </label>
            </div>
            <div className="dir-settings__dialog-actions">
              <Button variant="outline" onClick={() => setEditStatus(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleEditStatus} loading={saving} disabled={!editStatusLabel.trim()}>Save</Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
