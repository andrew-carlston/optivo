"use client";

import { Switch } from "@/components/ui/switch/switch";
import { Select, MultiSelect, type SelectOption } from "@/components/ui/select/select";
import { ACTIONS, SCOPE_TYPES } from "@/features/core/lib/access/types";
import type { Action } from "@/features/core/lib/access/types";
import "./template-editor.scss";

const SCOPE_OPTIONS: SelectOption[] = [
  { value: "default", label: "Default" },
  ...Object.values(SCOPE_TYPES).map((s) => ({
    value: s,
    label: s.charAt(0).toUpperCase() + s.slice(1),
  })),
];

const SENSITIVITY_LEVEL_OPTIONS: SelectOption[] = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: `Level ${i + 1}`,
}));

const ALL_ACTIONS: Action[] = [ACTIONS.view, ACTIONS.create, ACTIONS.edit, ACTIONS.archive];

interface PermissionRowProps {
  resource: string;
  label: string;
  availableActions: Action[];
  actionStates: Record<string, boolean>;
  scopeOverride: string;
  scopePlaceholder?: string;
  sensitivityOverride: string | string[];
  sensitivityPlaceholder?: string;
  onToggleAction: (action: string, enabled: boolean) => void;
  onScopeChange: (scope: string) => void;
  onSensitivityChange: (levels: string[]) => void;
}

export function PermissionRow({
  resource,
  label,
  availableActions,
  actionStates,
  scopeOverride,
  scopePlaceholder = "Default",
  sensitivityOverride,
  sensitivityPlaceholder = "Default",
  onToggleAction,
  onScopeChange,
  onSensitivityChange,
}: PermissionRowProps) {
  const hasAnyEnabled = availableActions.some((a) => actionStates[a]);
  const sensSelected = sensitivityOverride === "default" ? [] : (sensitivityOverride as string[]);

  return (
    <tr className="perm-row">
      <td className="perm-row__label">{label}</td>
      {ALL_ACTIONS.map((action) => {
        const isAvailable = availableActions.includes(action);

        if (!isAvailable) {
          return (
            <td key={action} className="perm-row__cell perm-row__cell--disabled">
              <span className="perm-row__na">—</span>
            </td>
          );
        }

        return (
          <td key={action} className="perm-row__cell">
            <Switch
              checked={actionStates[action] ?? false}
              onCheckedChange={(checked) => onToggleAction(action, checked)}
            />
          </td>
        );
      })}
      <td className={`perm-row__cell perm-row__cell--select ${!hasAnyEnabled ? "perm-row__cell--muted" : ""}`}>
        <Select
          options={SCOPE_OPTIONS}
          value={!hasAnyEnabled ? "" : scopeOverride}
          onChange={onScopeChange}
          placeholder={scopePlaceholder}
          disabled={!hasAnyEnabled}
        />
      </td>
      <td className={`perm-row__cell perm-row__cell--select ${!hasAnyEnabled ? "perm-row__cell--muted" : ""}`}>
        <MultiSelect
          options={SENSITIVITY_LEVEL_OPTIONS}
          selected={!hasAnyEnabled ? [] : sensSelected}
          onChange={(vals) => onSensitivityChange(vals.length ? vals : ["default"] as any)}
          placeholder={sensitivityPlaceholder}
          disabled={!hasAnyEnabled}
        />
      </td>
    </tr>
  );
}
