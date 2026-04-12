"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card/card";
import { Button } from "@/components/ui/button/button";
import { Badge } from "@/components/ui/badge/badge";
import { Input } from "@/components/ui/input/input";
import { Select, MultiSelect, type SelectOption } from "@/components/ui/select/select";
import { Plus, Pencil, Trash2, Star, Users, Search, LayoutGrid, List, ChevronDown, ChevronRight, Building2, Tag, FolderOpen } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import type { TemplateRow } from "@/features/core/actions/template-actions";
import "./template-list.scss";

export type FilterTag = { id: string; name: string; color: string; type: "tag" | "group" };
export type FilterCompany = { id: string; name: string };

interface TemplateListProps {
  templates: TemplateRow[];
  availableTags?: FilterTag[];
  templateTagMap?: Record<string, string[]>;
  availableCompanies?: FilterCompany[];
  templateCompanyMap?: Record<string, string[]>;
  onEdit: (id: string) => void;
  onCreate: (name: string, description: string) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}

export function TemplateList({
  templates,
  availableTags = [],
  templateTagMap = {},
  availableCompanies = [],
  templateCompanyMap = {},
  onEdit,
  onCreate,
  onDelete,
  onSetDefault,
}: TemplateListProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterGroups, setFilterGroups] = useState<string[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterCompanies, setFilterCompanies] = useState<string[]>([]);
  const [groupBy, setGroupBy] = useState<"none" | "group" | "tag" | "company">("none");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const groupOptions: SelectOption[] = useMemo(() => {
    return availableTags
      .filter((t) => t.type === "group")
      .map((g) => ({ value: g.id, label: g.name }));
  }, [availableTags]);

  const tagOptions: SelectOption[] = useMemo(() => {
    return availableTags
      .filter((t) => t.type === "tag")
      .map((t) => ({ value: t.id, label: t.name }));
  }, [availableTags]);

  const companyOptions: SelectOption[] = useMemo(() => {
    return availableCompanies.map((c) => ({ value: c.id, label: c.name }));
  }, [availableCompanies]);

  // Filter
  const filtered = useMemo(() => {
    return templates.filter((t) => {
      // Search by name/description
      if (search) {
        const q = search.toLowerCase();
        if (!t.name.toLowerCase().includes(q) && !t.description?.toLowerCase().includes(q)) return false;
      }
      // Filter by groups
      if (filterGroups.length > 0) {
        const assignedIds = templateTagMap[t.id] ?? [];
        if (assignedIds.length === 0) return false;
        if (!filterGroups.some((gid) => assignedIds.includes(gid))) return false;
      }
      // Filter by tags (must have ALL selected tags)
      if (filterTags.length > 0) {
        const assignedIds = templateTagMap[t.id] ?? [];
        if (!filterTags.every((tagId) => assignedIds.includes(tagId))) return false;
      }
      // Filter by companies — template must be assigned to at least one selected company
      if (filterCompanies.length > 0) {
        const assignedCompanyIds = templateCompanyMap[t.id] ?? [];
        if (assignedCompanyIds.length === 0) return false;
        if (!filterCompanies.some((cid) => assignedCompanyIds.includes(cid))) return false;
      }
      return true;
    });
  }, [templates, search, filterGroups, filterTags, filterCompanies, templateTagMap, templateCompanyMap]);

  function handleCreate() {
    if (!newName.trim()) return;
    onCreate(newName.trim(), newDesc.trim());
    setNewName("");
    setNewDesc("");
    setShowCreate(false);
  }

  function handleDelete() {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  }

  // Group-by options
  const groupByOptions: SelectOption[] = [
    { value: "none", label: "No grouping" },
    { value: "group", label: "By group" },
    { value: "tag", label: "By tag" },
    { value: "company", label: "By company" },
  ];

  // Build grouped sections
  const grouped = useMemo(() => {
    if (groupBy === "none") return null;
    const sections = new Map<string, { label: string; icon: string; templates: TemplateRow[] }>();

    for (const t of filtered) {
      const assignedIds = templateTagMap[t.id] ?? [];
      const companyIds = templateCompanyMap[t.id] ?? [];
      let keys: { id: string; label: string }[] = [];

      if (groupBy === "group") {
        const groupTags = availableTags.filter((at) => at.type === "group" && assignedIds.includes(at.id));
        keys = groupTags.map((g) => ({ id: g.id, label: g.name }));
        if (keys.length === 0) keys = [{ id: "__none", label: "Ungrouped" }];
      } else if (groupBy === "tag") {
        const tagItems = availableTags.filter((at) => at.type === "tag" && assignedIds.includes(at.id));
        keys = tagItems.map((tg) => ({ id: tg.id, label: tg.name }));
        if (keys.length === 0) keys = [{ id: "__none", label: "Untagged" }];
      } else if (groupBy === "company") {
        const comps = companyIds.map((cid) => availableCompanies.find((c) => c.id === cid)).filter(Boolean);
        keys = comps.map((c) => ({ id: c!.id, label: c!.name }));
        if (keys.length === 0) keys = [{ id: "__none", label: "No company" }];
      }

      for (const key of keys) {
        if (!sections.has(key.id)) sections.set(key.id, { label: key.label, icon: groupBy, templates: [] });
        sections.get(key.id)!.templates.push(t);
      }
    }
    return sections;
  }, [filtered, groupBy, templateTagMap, templateCompanyMap, availableTags, availableCompanies]);

  function toggleCollapse(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Resolve tag names for display on cards
  const tagMap = useMemo(() => {
    const map = new Map<string, FilterTag>();
    availableTags.forEach((t) => map.set(t.id, t));
    return map;
  }, [availableTags]);

  function CardSections({ groups, tags, companies }: { groups: FilterTag[]; tags: FilterTag[]; companies: FilterCompany[] }) {
    const [showGroups, setShowGroups] = useState(false);
    const [showTags, setShowTags] = useState(false);
    const [showCompanies, setShowCompanies] = useState(false);

    return (
      <div className="template-list__card-sections">
        <div className="template-list__card-section">
          {groups.length > 0 ? (
            <button className="template-list__card-section-toggle" onClick={(e) => { e.stopPropagation(); setShowGroups(!showGroups); }}>
              {showGroups ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              <FolderOpen size={11} />
              <span>{groups.length} group{groups.length !== 1 ? "s" : ""}</span>
            </button>
          ) : (
            <span className="template-list__card-section-empty">
              <FolderOpen size={11} />
              <span>0 groups</span>
            </span>
          )}
          {showGroups && groups.length > 0 && (
            <div className="template-list__card-section-items">
              {groups.map((g) => (
                <span key={g.id} className="template-list__badge template-list__badge--group">
                  {g.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="template-list__card-section">
          {tags.length > 0 ? (
            <button className="template-list__card-section-toggle" onClick={(e) => { e.stopPropagation(); setShowTags(!showTags); }}>
              {showTags ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              <Tag size={11} />
              <span>{tags.length} tag{tags.length !== 1 ? "s" : ""}</span>
            </button>
          ) : (
            <span className="template-list__card-section-empty">
              <Tag size={11} />
              <span>0 tags</span>
            </span>
          )}
          {showTags && tags.length > 0 && (
            <div className="template-list__card-section-items">
              {tags.map((tag) => (
                <span key={tag.id} className="template-list__badge template-list__badge--tag">
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="template-list__card-section">
          {companies.length > 0 ? (
            <button className="template-list__card-section-toggle" onClick={(e) => { e.stopPropagation(); setShowCompanies(!showCompanies); }}>
              {showCompanies ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              <Building2 size={11} />
              <span>{companies.length} compan{companies.length !== 1 ? "ies" : "y"}</span>
            </button>
          ) : (
            <span className="template-list__card-section-empty">
              <Building2 size={11} />
              <span>0 companies</span>
            </span>
          )}
          {showCompanies && companies.length > 0 && (
            <div className="template-list__card-section-items">
              {companies.map((c) => (
                <span key={c.id} className="template-list__badge template-list__badge--company">
                  {c.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderCard(t: TemplateRow) {
    const assignedIds = templateTagMap[t.id] ?? [];
    const assignedTags = assignedIds.map((id) => tagMap.get(id)).filter(Boolean) as FilterTag[];
    const cardGroups = assignedTags.filter((at) => at.type === "group");
    const cardTags = assignedTags.filter((at) => at.type === "tag");
    const companyIds = templateCompanyMap[t.id] ?? [];
    const cardCompanies = companyIds.map((cid) => availableCompanies.find((c) => c.id === cid)).filter(Boolean) as FilterCompany[];

    return (
      <Card key={t.id} variant="flat">
        <CardContent>
          <div className="template-list__card">
            <div className="template-list__card-header">
              <div className="template-list__card-title">
                <span>{t.name}</span>
                {t.isDefault && <Badge variant="info">Default</Badge>}
              </div>
              <div className="template-list__card-actions">
                {!t.isDefault && (
                  <Button variant="ghost" size="icon" title="Set as default" onClick={() => onSetDefault(t.id)}>
                    <Star size={15} />
                  </Button>
                )}
                <Button variant="ghost" size="icon" title="Edit" onClick={() => onEdit(t.id)}>
                  <Pencil size={15} />
                </Button>
                <Button variant="ghost" size="icon" title="Delete" onClick={() => setDeleteId(t.id)}>
                  <Trash2 size={15} />
                </Button>
              </div>
            </div>
            {t.description && <p className="template-list__card-desc">{t.description}</p>}
            <div className="template-list__card-meta">
              <Users size={13} />
              <span>{t.userCount} user{t.userCount !== 1 ? "s" : ""}</span>
            </div>
            <CardSections groups={cardGroups} tags={cardTags} companies={cardCompanies} />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="template-list">
      <div className="template-list__header">
        <h2>Access Templates</h2>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={15} />
          New Template
        </Button>
      </div>

      {/* Filters */}
      <div className="template-list__filters">
        <Input
          placeholder="Search templates..."
          icon={<Search size={15} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="template-list__filter-row">
          <MultiSelect options={groupOptions} selected={filterGroups} onChange={setFilterGroups} placeholder="Groups" searchable />
          <MultiSelect options={tagOptions} selected={filterTags} onChange={setFilterTags} placeholder="Tags" searchable />
          <MultiSelect options={companyOptions} selected={filterCompanies} onChange={setFilterCompanies} placeholder="Companies" searchable />
          <Select options={groupByOptions} value={groupBy} onChange={(v) => { setGroupBy(v as any); setCollapsed(new Set()); }} placeholder="Group by" />
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="template-list__empty">
          {templates.length === 0 ? "No templates yet. Create one to get started." : "No templates match your filters."}
        </p>
      )}

      {/* Grouped view */}
      {grouped ? (
        Array.from(grouped.entries()).map(([key, section]) => (
          <div key={key} className="template-list__section">
            <button className="template-list__section-header" onClick={() => toggleCollapse(key)}>
              {collapsed.has(key) ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              {section.icon === "group" && <FolderOpen size={14} />}
              {section.icon === "tag" && <Tag size={14} />}
              {section.icon === "company" && <Building2 size={14} />}
              <span>{section.label}</span>
              <span className="template-list__section-count">{section.templates.length}</span>
            </button>
            {!collapsed.has(key) && (
              <div className="template-list__grid">
                {section.templates.map((t) => renderCard(t))}
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="template-list__grid">
          {filtered.map((t) => renderCard(t))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog.Root open={showCreate} onOpenChange={setShowCreate}>
        <Dialog.Portal>
          <Dialog.Overlay className="template-dialog__overlay" />
          <Dialog.Content className="template-dialog__content">
            <Dialog.Title className="template-dialog__title">New Template</Dialog.Title>
            <div className="template-dialog__fields">
              <Input placeholder="Template name" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Input placeholder="Description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
            </div>
            <div className="template-dialog__actions">
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleCreate}>Create</Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete confirmation */}
      <Dialog.Root open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="template-dialog__overlay" />
          <Dialog.Content className="template-dialog__content">
            <Dialog.Title className="template-dialog__title">Delete Template</Dialog.Title>
            <p className="template-dialog__body">This template will be permanently deleted.</p>
            <div className="template-dialog__actions">
              <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
