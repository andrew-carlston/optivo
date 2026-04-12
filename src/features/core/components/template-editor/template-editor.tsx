"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button/button";
import { Input } from "@/components/ui/input/input";
import { Card, CardContent } from "@/components/ui/card/card";
import { Select, MultiSelect, type SelectOption } from "@/components/ui/select/select";
import { Switch } from "@/components/ui/switch/switch";
import { ArrowLeft, Save } from "lucide-react";
import { ACTIONS } from "@/features/core/lib/access/types";
import { MODULE_GROUPS } from "@/features/core/lib/access/seed";
import type { Action, ScopeType } from "@/features/core/lib/access/types";
import type { TemplateDetail, PermissionInput } from "@/features/core/actions/template-actions";
import { PermissionRow } from "./permission-row";
import "./template-editor.scss";

const CONFIG_RESOURCES = new Set([
  "settings.general", "settings.org", "settings.points", "settings.integrations",
]);

const FULL_ACTIONS: Action[] = [ACTIONS.view, ACTIONS.create, ACTIONS.edit, ACTIONS.archive];
const CONFIG_ACTIONS: Action[] = [ACTIONS.view, ACTIONS.edit];

const SENSITIVITY_LEVEL_OPTIONS: SelectOption[] = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: `Level ${i + 1}`,
}));

const SCOPE_OPTIONS: SelectOption[] = [
  { value: "all", label: "All" },
  { value: "division", label: "Division" },
  { value: "department", label: "Department" },
  { value: "lob", label: "LOB" },
  { value: "team", label: "Team" },
  { value: "reports", label: "Reports" },
  { value: "self", label: "Self" },
];

const SCOPE_OPTIONS_WITH_DEFAULT: SelectOption[] = [
  { value: "default", label: "Default" },
  ...SCOPE_OPTIONS,
];

const SENSITIVITY_LEVEL_OPTIONS_WITH_DEFAULT: SelectOption[] = [
  { value: "default", label: "Default" },
  ...SENSITIVITY_LEVEL_OPTIONS,
];

// ── State types ──

/** Which actions are enabled per resource */
type ActionMap = Map<string, Set<string>>; // resource → set of enabled actions

/** Per-resource scope override ("default" = inherit group) */
type ResourceScopeMap = Map<string, string>; // resource → "default" | ScopeType

/** Per-resource sensitivity override ("default" = inherit group/global, or specific levels) */
type ResourceSensMap = Map<string, string | string[]>; // resource → "default" | string[]

export type TagOption = { id: string; name: string; color: string; type: "tag" | "group" };
export type CompanyOption = { id: string; name: string };

interface TemplateEditorProps {
  template: TemplateDetail;
  backHref: string;
  /** Available tags/groups to assign */
  availableTags?: TagOption[];
  /** Currently assigned tag IDs */
  assignedTagIds?: string[];
  /** Available companies (admin only) */
  availableCompanies?: CompanyOption[];
  /** Currently assigned company IDs */
  assignedCompanyIds?: string[];
  onSave: (data: {
    name: string;
    description: string;
    groupName: string;
    tags: string[];
    sensitivityLevels: number[];
    permissions: PermissionInput[];
    assignedTagIds: string[];
    assignedCompanyIds: string[];
  }) => Promise<void>;
}

export function TemplateEditor({
  template,
  backHref,
  availableTags = [],
  assignedTagIds: initialTagIds = [],
  availableCompanies = [],
  assignedCompanyIds: initialCompanyIds = [],
  onSave,
}: TemplateEditorProps) {
  const router = useRouter();
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description ?? "");
  const [groupName] = useState(template.groupName ?? "");
  const [tags] = useState<string[]>(template.tags ?? []);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialTagIds);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>(initialCompanyIds);
  const [sensitivityLevels, setSensitivityLevels] = useState<string[]>(
    (template.sensitivityLevels ?? [1]).map(String)
  );
  const [saving, setSaving] = useState(false);

  // Global defaults
  const [globalScope, setGlobalScope] = useState<ScopeType>("all");

  // Group-level overrides ("default" = inherit global, or specific levels)
  const [groupScopes, setGroupScopes] = useState<Record<string, string>>({});
  const [groupSens, setGroupSens] = useState<Record<string, string[]>>({});

  // Per-resource action toggles
  const [actions, setActions] = useState<ActionMap>(() => {
    const map = new Map<string, Set<string>>();
    for (const p of template.permissions) {
      if (!map.has(p.resource)) map.set(p.resource, new Set());
      map.get(p.resource)!.add(p.action);
    }
    return map;
  });

  // Per-resource scope overrides
  const [resourceScopes, setResourceScopes] = useState<ResourceScopeMap>(() => {
    const map = new Map<string, string>();
    // If a resource has permissions, infer its scope from the first action's scope
    for (const p of template.permissions) {
      if (!map.has(p.resource)) map.set(p.resource, p.scopeType);
    }
    return map;
  });

  // Per-resource sensitivity overrides
  const [resourceSens, setResourceSens] = useState<ResourceSensMap>(new Map());

  // ── Resolve effective values: resource → group → global ──
  function getEffectiveScope(resource: string, groupKey: string): ScopeType {
    const resOverride = resourceScopes.get(resource);
    if (resOverride && resOverride !== "default") return resOverride as ScopeType;
    const grpOverride = groupScopes[groupKey];
    if (grpOverride && grpOverride !== "default") return grpOverride as ScopeType;
    return globalScope;
  }

  function getEffectiveGroupScope(groupKey: string): ScopeType {
    const grpOverride = groupScopes[groupKey];
    if (grpOverride && grpOverride !== "default") return grpOverride as ScopeType;
    return globalScope;
  }

  function getEffectiveSensitivity(resource: string, groupKey: string): string[] {
    const resOverride = resourceSens.get(resource);
    if (resOverride && resOverride !== "default") return resOverride as string[];
    const grpOverride = groupSens[groupKey];
    if (grpOverride && grpOverride.length > 0) return grpOverride;
    return sensitivityLevels;
  }

  function getEffectiveGroupSensitivity(groupKey: string): string[] {
    const grpOverride = groupSens[groupKey];
    if (grpOverride && grpOverride.length > 0) return grpOverride;
    return sensitivityLevels;
  }

  // ── Action toggle ──
  function toggleAction(resource: string, action: string, enabled: boolean) {
    setActions((prev) => {
      const next = new Map(prev);
      const set = new Set(next.get(resource) ?? []);
      if (enabled) set.add(action);
      else set.delete(action);
      next.set(resource, set);
      return next;
    });
  }

  // ── Group cascade: toggle all on/off ──
  function toggleGroup(resources: readonly { resource: string }[], enable: boolean) {
    setActions((prev) => {
      const next = new Map(prev);
      for (const { resource } of resources) {
        const avail = CONFIG_RESOURCES.has(resource) ? CONFIG_ACTIONS : FULL_ACTIONS;
        next.set(resource, enable ? new Set(avail) : new Set());
      }
      return next;
    });
  }

  // ── Master: full access toggle ──
  const isFullAccess = MODULE_GROUPS.every((g) =>
    g.resources.every(({ resource }) => {
      const avail = CONFIG_RESOURCES.has(resource) ? CONFIG_ACTIONS : FULL_ACTIONS;
      const set = actions.get(resource);
      return avail.every((a) => set?.has(a));
    })
  );

  function toggleFullAccess(enable: boolean) {
    if (enable) {
      // Enable all actions
      setActions(() => {
        const map = new Map<string, Set<string>>();
        for (const group of MODULE_GROUPS) {
          for (const { resource } of group.resources) {
            const avail = CONFIG_RESOURCES.has(resource) ? CONFIG_ACTIONS : FULL_ACTIONS;
            map.set(resource, new Set(avail));
          }
        }
        return map;
      });
      // Set global scope to all
      setGlobalScope("all");
      // Set all sensitivity levels
      setSensitivityLevels(SENSITIVITY_LEVEL_OPTIONS.map((o) => o.value));
      // Reset overrides
      setGroupScopes({});
      setGroupSens({});
      setResourceScopes(new Map());
      setResourceSens(new Map());
    } else {
      // Disable everything
      setActions(new Map());
    }
  }

  // ── Master: toggle a single action across ALL resources ──
  function isMasterActionEnabled(action: Action): boolean {
    return MODULE_GROUPS.every((g) =>
      g.resources.every(({ resource }) => {
        const avail = CONFIG_RESOURCES.has(resource) ? CONFIG_ACTIONS : FULL_ACTIONS;
        if (!avail.includes(action)) return true;
        return actions.get(resource)?.has(action) ?? false;
      })
    );
  }

  function toggleMasterAction(action: Action, enable: boolean) {
    setActions((prev) => {
      const next = new Map(prev);
      for (const group of MODULE_GROUPS) {
        for (const { resource } of group.resources) {
          const avail = CONFIG_RESOURCES.has(resource) ? CONFIG_ACTIONS : FULL_ACTIONS;
          if (!avail.includes(action)) continue;
          const set = new Set(next.get(resource) ?? []);
          if (enable) set.add(action);
          else set.delete(action);
          next.set(resource, set);
        }
      }
      return next;
    });
  }

  // ── Group cascade: set scope for group (resets resource overrides) ──
  function setGroupScopeVal(groupKey: string, resources: readonly { resource: string }[], scope: string) {
    setGroupScopes((prev) => ({ ...prev, [groupKey]: scope }));
    setResourceScopes((prev) => {
      const next = new Map(prev);
      for (const { resource } of resources) next.set(resource, "default");
      return next;
    });
  }

  // ── Group cascade: set sensitivity levels for group (resets resource overrides) ──
  function setGroupSensArr(groupKey: string, resources: readonly { resource: string }[], levels: string[]) {
    setGroupSens((prev) => ({ ...prev, [groupKey]: levels }));
    setResourceSens((prev) => {
      const next = new Map(prev);
      for (const { resource } of resources) next.set(resource, "default");
      return next;
    });
  }

  // ── Mixed state detection ──

  // Is the master scope "mixed" (any group or resource overrides it)?
  function isMasterScopeMixed(): boolean {
    for (const group of MODULE_GROUPS) {
      const grp = groupScopes[group.key];
      if (grp && grp !== "default") return true;
      for (const { resource } of group.resources) {
        const res = resourceScopes.get(resource);
        if (res && res !== "default") return true;
      }
    }
    return false;
  }

  // Is a group scope "mixed" (any resource in it overrides)?
  function isGroupScopeMixed(groupKey: string, resources: readonly { resource: string }[]): boolean {
    for (const { resource } of resources) {
      const res = resourceScopes.get(resource);
      if (res && res !== "default") return true;
    }
    return false;
  }

  // Is the master sensitivity "mixed"?
  function isMasterSensMixed(): boolean {
    for (const group of MODULE_GROUPS) {
      const grp = groupSens[group.key];
      if (grp && grp.length > 0) return true;
      for (const { resource } of group.resources) {
        const res = resourceSens.get(resource);
        if (res && res !== "default") return true;
      }
    }
    return false;
  }

  // Is a group sensitivity "mixed"?
  function isGroupSensMixed(groupKey: string, resources: readonly { resource: string }[]): boolean {
    for (const { resource } of resources) {
      const res = resourceSens.get(resource);
      if (res && res !== "default") return true;
    }
    return false;
  }

  // ── Column cascade: toggle action for all resources in group ──
  function toggleGroupAction(resources: readonly { resource: string }[], action: Action, enable: boolean) {
    setActions((prev) => {
      const next = new Map(prev);
      for (const { resource } of resources) {
        const avail = CONFIG_RESOURCES.has(resource) ? CONFIG_ACTIONS : FULL_ACTIONS;
        if (!avail.includes(action)) continue;
        const set = new Set(next.get(resource) ?? []);
        if (enable) set.add(action);
        else set.delete(action);
        next.set(resource, set);
      }
      return next;
    });
  }

  // ── Checks ──
  function isGroupEnabled(resources: readonly { resource: string }[]): boolean {
    return resources.every(({ resource }) => {
      const avail = CONFIG_RESOURCES.has(resource) ? CONFIG_ACTIONS : FULL_ACTIONS;
      const set = actions.get(resource);
      return avail.every((a) => set?.has(a));
    });
  }

  function isGroupActionEnabled(resources: readonly { resource: string }[], action: Action): boolean {
    return resources.every(({ resource }) => {
      const avail = CONFIG_RESOURCES.has(resource) ? CONFIG_ACTIONS : FULL_ACTIONS;
      if (!avail.includes(action)) return true;
      return actions.get(resource)?.has(action) ?? false;
    });
  }

  // ── Save: build flat permission list ──
  async function handleSave() {
    setSaving(true);
    const permissions: PermissionInput[] = [];

    for (const group of MODULE_GROUPS) {
      for (const { resource } of group.resources) {
        const enabledActions = actions.get(resource);
        if (!enabledActions?.size) continue;
        const scope = getEffectiveScope(resource, group.key);
        for (const action of enabledActions) {
          permissions.push({ resource, action, scopeType: scope });
        }
      }
    }

    await onSave({ name, description, groupName, tags, sensitivityLevels: sensitivityLevels.map(Number), permissions, assignedTagIds: selectedTagIds, assignedCompanyIds: selectedCompanyIds });
    setSaving(false);
  }

  return (
    <div className="template-editor">
      <div className="template-editor__top">
        <Button variant="ghost" size="sm" onClick={() => router.push(backHref)}>
          <ArrowLeft size={15} />
          Back
        </Button>
        <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>
          <Save size={15} />
          Save
        </Button>
      </div>

      <div className="template-editor__info-card">
        <div className="template-editor__info-header">
          <h3>Template Details</h3>
        </div>
        <Input
          placeholder="Template name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="template-editor__fields-row">
          {(() => {
            const groups = availableTags.filter((t) => t.type === "group");
            const tagsList = availableTags.filter((t) => t.type === "tag");
            return (
              <>
                <MultiSelect
                  options={groups.map((g) => ({ value: g.id, label: g.name }))}
                  selected={selectedTagIds.filter((id) => groups.some((g) => g.id === id))}
                  onChange={(vals) => {
                    const tagOnlyIds = selectedTagIds.filter((id) => !groups.some((g) => g.id === id));
                    setSelectedTagIds([...tagOnlyIds, ...vals]);
                  }}
                  placeholder="Groups"
                  searchable={false}
                />
                <MultiSelect
                  options={tagsList.map((t) => ({ value: t.id, label: t.name }))}
                  selected={selectedTagIds.filter((id) => tagsList.some((t) => t.id === id))}
                  onChange={(vals) => {
                    const groupOnlyIds = selectedTagIds.filter((id) => !tagsList.some((t) => t.id === id));
                    setSelectedTagIds([...groupOnlyIds, ...vals]);
                  }}
                  placeholder="Tags"
                  searchable={false}
                />
              </>
            );
          })()}
          <MultiSelect
            options={availableCompanies.map((c) => ({ value: c.id, label: c.name }))}
            selected={selectedCompanyIds}
            onChange={setSelectedCompanyIds}
            placeholder="Companies"
            searchable
          />
        </div>
      </div>

      {/* Master Defaults */}
      <Card variant="flat">
        <CardContent>
          <div className="template-editor__table-wrap">
            <table className="template-editor__table">
              <colgroup>
                <col /><col /><col /><col /><col /><col /><col />
              </colgroup>
              <thead>
                <tr>
                  <th>
                    <div className="template-editor__group-name">Master Defaults</div>
                    <div className="template-editor__group-master">
                      <span>Full Access</span>
                      <Switch checked={isFullAccess} onCheckedChange={toggleFullAccess} />
                    </div>
                  </th>
                  {FULL_ACTIONS.map((action) => (
                    <th key={action}>
                      <div className="template-editor__col-header">
                        <span>{action.charAt(0).toUpperCase() + action.slice(1)}</span>
                        <Switch checked={isMasterActionEnabled(action)} onCheckedChange={(checked) => toggleMasterAction(action, checked)} />
                      </div>
                    </th>
                  ))}
                  <th>
                    <div className="template-editor__col-header">
                      <span>Scope</span>
                      <Select options={SCOPE_OPTIONS} value={isMasterScopeMixed() ? "" : globalScope} onChange={(val) => { setGlobalScope(val as ScopeType); setGroupScopes({}); setResourceScopes(new Map()); }} placeholder={isMasterScopeMixed() ? "Mixed" : "Scope"} />
                    </div>
                  </th>
                  <th>
                    <div className="template-editor__col-header">
                      <span>Sensitivity</span>
                      <MultiSelect options={SENSITIVITY_LEVEL_OPTIONS} selected={sensitivityLevels} onChange={(vals) => { setSensitivityLevels(vals); setGroupSens({}); setResourceSens(new Map()); }} placeholder={isMasterSensMixed() ? "Mixed" : `${sensitivityLevels.length} selected`} mixed={isMasterSensMixed()} />
                    </div>
                  </th>
                </tr>
              </thead>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Module Groups */}
      {MODULE_GROUPS.map((group) => {
        const groupEnabled = isGroupEnabled(group.resources);
        return (
          <Card key={group.key} variant="flat">
            <CardContent>
              <div className="template-editor__table-wrap">
                <table className="template-editor__table">
                  <colgroup>
                    <col /><col /><col /><col /><col /><col /><col />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>
                        <div className="template-editor__group-name">{group.label}</div>
                        <div className="template-editor__group-master">
                          <span>Full Access</span>
                          <Switch checked={groupEnabled} onCheckedChange={(checked) => toggleGroup(group.resources, checked)} />
                        </div>
                      </th>
                      {FULL_ACTIONS.map((action) => (
                        <th key={action}>
                          <div className="template-editor__col-header">
                            <span>{action.charAt(0).toUpperCase() + action.slice(1)}</span>
                            <Switch checked={isGroupActionEnabled(group.resources, action)} onCheckedChange={(checked) => toggleGroupAction(group.resources, action, checked)} />
                          </div>
                        </th>
                      ))}
                      <th>
                        <div className="template-editor__col-header">
                          <span>Scope</span>
                          <Select options={SCOPE_OPTIONS_WITH_DEFAULT} value={isGroupScopeMixed(group.key, group.resources) ? "" : (groupScopes[group.key] ?? "default")} onChange={(val) => setGroupScopeVal(group.key, group.resources, val)} placeholder={isGroupScopeMixed(group.key, group.resources) ? "Mixed" : globalScope.charAt(0).toUpperCase() + globalScope.slice(1)} />
                        </div>
                      </th>
                      <th>
                        <div className="template-editor__col-header">
                          <span>Sensitivity</span>
                          <MultiSelect options={SENSITIVITY_LEVEL_OPTIONS} selected={groupSens[group.key] ?? []} onChange={(vals) => setGroupSensArr(group.key, group.resources, vals)} placeholder={isGroupSensMixed(group.key, group.resources) ? "Mixed" : `${getEffectiveGroupSensitivity(group.key).length} selected`} mixed={isGroupSensMixed(group.key, group.resources)} />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.resources.map(({ resource, label }) => {
                      const enabledActions = actions.get(resource) ?? new Set();
                      const actionStates: Record<string, boolean> = {};
                      for (const a of FULL_ACTIONS) actionStates[a] = enabledActions.has(a);
                      const parentScope = getEffectiveGroupScope(group.key);
                      const parentSens = getEffectiveGroupSensitivity(group.key);
                      return (
                        <PermissionRow
                          key={resource}
                          resource={resource}
                          label={label}
                          availableActions={CONFIG_RESOURCES.has(resource) ? CONFIG_ACTIONS : FULL_ACTIONS}
                          actionStates={actionStates}
                          scopeOverride={resourceScopes.get(resource) ?? "default"}
                          scopePlaceholder={parentScope.charAt(0).toUpperCase() + parentScope.slice(1)}
                          sensitivityOverride={resourceSens.get(resource) ?? "default"}
                          sensitivityPlaceholder={`${parentSens.length} selected`}
                          onToggleAction={(action, enabled) => toggleAction(resource, action, enabled)}
                          onScopeChange={(scope) => setResourceScopes((prev) => new Map(prev).set(resource, scope))}
                          onSensitivityChange={(levels) => setResourceSens((prev) => new Map(prev).set(resource, levels))}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
