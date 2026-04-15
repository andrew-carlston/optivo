"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button/button";
import { Input } from "@/components/ui/input/input";
import { Switch } from "@/components/ui/switch/switch";
import { Badge } from "@/components/ui/badge/badge";
import { Skeleton } from "@/components/ui/skeleton/skeleton";
import { Plus, Trash2, Pencil, Tag, FolderOpen } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  getTags,
  createTag,
  updateTag,
  deleteTag,
} from "@/features/core/actions/tag-actions";
import type { TagRow } from "@/features/core/actions/tag-actions";
import "./tags.scss";

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f97316",
  "#eab308", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6",
];

export default function AdminTagsPage() {
  const [tags, setTags] = useState<TagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editTag, setEditTag] = useState<TagRow | null>(null);

  // Create/edit form state
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState(COLORS[0]);
  const [formType, setFormType] = useState<"tag" | "group">("tag");
  const [formGlobal, setFormGlobal] = useState(false);

  async function load() {
    const data = await getTags(null);
    setTags(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate(type: "tag" | "group") {
    setFormName("");
    setFormColor(COLORS[0]);
    setFormType(type);
    setFormGlobal(false);
    setEditTag(null);
    setShowCreate(true);
  }

  function openEdit(tag: TagRow) {
    setFormName(tag.name);
    setFormColor(tag.color);
    setFormType(tag.type);
    setFormGlobal(tag.isGlobal);
    setEditTag(tag);
    setShowCreate(true);
  }

  async function handleSave() {
    if (!formName.trim()) return;
    if (editTag) {
      await updateTag(editTag.id, { name: formName.trim(), color: formColor, isGlobal: formGlobal });
    } else {
      await createTag({ companyId: null, name: formName.trim(), color: formColor, type: formType, isGlobal: formGlobal });
    }
    setShowCreate(false);
    load();
  }

  async function handleDelete(id: string) {
    await deleteTag(id);
    load();
  }

  const groupTags = tags.filter((t) => t.type === "group");
  const regularTags = tags.filter((t) => t.type === "tag");

  if (loading) {
    return (
      <div className="tags-page">
        {[0, 1].map((s) => (
          <div key={s} className="tags-page__section">
            <div className="tags-page__section-header">
              <Skeleton width="100%" height={38} radius="md" />
              <Skeleton width={110} height={34} radius="lg" />
            </div>
            <div className="tags-page__list">
              {[1, 2].map((i) => (
                <div key={i} className="tags-page__item">
                  <Skeleton width={12} height={12} radius="full" />
                  <Skeleton width={120} height={14} radius="md" style={{ flex: 1 }} />
                  <Skeleton width={60} height={14} radius="sm" />
                  <Skeleton width={28} height={28} radius="md" />
                  <Skeleton width={28} height={28} radius="md" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="tags-page">
      <div className="tags-page__section">
        <div className="tags-page__section-header">
          <div className="tags-page__section-title">
            <FolderOpen size={14} />
            <span>Groups</span>
            <span className="tags-page__section-count">{groupTags.length}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => openCreate("group")}>
            <Plus size={14} /> New Group
          </Button>
        </div>
        {groupTags.length === 0 && <p className="tags-page__empty">No groups yet.</p>}
        <div className="tags-page__list">
          {groupTags.map((tag) => (
            <div key={tag.id} className="tags-page__item">
              <span className="tags-page__dot" style={{ background: tag.color }} />
              <span className="tags-page__name">{tag.name}</span>
              {tag.isGlobal && <Badge variant="info">Global</Badge>}
              <span className="tags-page__count">{tag.assignmentCount} assigned</span>
              <Button variant="ghost" size="icon" onClick={() => openEdit(tag)}>
                <Pencil size={14} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(tag.id)}>
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="tags-page__section">
        <div className="tags-page__section-header">
          <div className="tags-page__section-title">
            <Tag size={14} />
            <span>Tags</span>
            <span className="tags-page__section-count">{regularTags.length}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => openCreate("tag")}>
            <Plus size={14} /> New Tag
          </Button>
        </div>
        {regularTags.length === 0 && <p className="tags-page__empty">No tags yet.</p>}
        <div className="tags-page__list">
          {regularTags.map((tag) => (
            <div key={tag.id} className="tags-page__item">
              <span className="tags-page__dot" style={{ background: tag.color }} />
              <span className="tags-page__name">{tag.name}</span>
              {tag.isGlobal && <Badge variant="info">Global</Badge>}
              <span className="tags-page__count">{tag.assignmentCount} assigned</span>
              <Button variant="ghost" size="icon" onClick={() => openEdit(tag)}>
                <Pencil size={14} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(tag.id)}>
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Create/Edit dialog */}
      <Dialog.Root open={showCreate} onOpenChange={setShowCreate}>
        <Dialog.Portal>
          <Dialog.Overlay className="tags-dialog__overlay" />
          <Dialog.Content className="tags-dialog__content">
            <Dialog.Title className="tags-dialog__title">
              {editTag ? `Edit ${formType}` : `New ${formType}`}
            </Dialog.Title>
            <div className="tags-dialog__fields">
              <Input
                placeholder={formType === "group" ? "Group name" : "Tag name"}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
              <div className="tags-dialog__field">
                <label>Color</label>
                <div className="tags-dialog__colors">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      className={`tags-dialog__color ${formColor === c ? "tags-dialog__color--active" : ""}`}
                      style={{ background: c }}
                      onClick={() => setFormColor(c)}
                    />
                  ))}
                </div>
              </div>
              <div className="tags-dialog__field">
                <label>Visible to companies</label>
                <div className="tags-dialog__toggle-row">
                  <Switch checked={formGlobal} onCheckedChange={setFormGlobal} />
                  <span>{formGlobal ? "Global — companies can see and use this" : "Internal — admin only"}</span>
                </div>
              </div>
            </div>
            <div className="tags-dialog__actions">
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleSave}>
                {editTag ? "Save" : "Create"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
