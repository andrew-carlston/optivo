"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card/card";
import { Button } from "@/components/ui/button/button";
import { Badge } from "@/components/ui/badge/badge";
import { Input } from "@/components/ui/input/input";
import { Plus, Pencil, Trash2, Star, Users } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import type { TemplateRow } from "@/features/core/actions/template-actions";
import "./template-list.scss";

interface TemplateListProps {
  templates: TemplateRow[];
  onEdit: (id: string) => void;
  onCreate: (name: string, description: string) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}

export function TemplateList({
  templates,
  onEdit,
  onCreate,
  onDelete,
  onSetDefault,
}: TemplateListProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  return (
    <div className="template-list">
      <div className="template-list__header">
        <h2>Access Templates</h2>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={15} />
          New Template
        </Button>
      </div>

      {templates.length === 0 && (
        <p className="template-list__empty">No templates yet. Create one to get started.</p>
      )}

      <div className="template-list__grid">
        {templates.map((t) => (
          <Card key={t.id} variant="flat">
            <CardContent>
              <div className="template-list__card">
                <div className="template-list__card-info">
                  <div className="template-list__card-title">
                    <span>{t.name}</span>
                    {t.isDefault && <Badge variant="info">Default</Badge>}
                  </div>
                  {t.description && (
                    <p className="template-list__card-desc">{t.description}</p>
                  )}
                  <div className="template-list__card-meta">
                    <Users size={13} />
                    <span>{t.userCount} user{t.userCount !== 1 ? "s" : ""}</span>
                  </div>
                </div>
                <div className="template-list__card-actions">
                  {!t.isDefault && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Set as default"
                      onClick={() => onSetDefault(t.id)}
                    >
                      <Star size={15} />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Edit permissions"
                    onClick={() => onEdit(t.id)}
                  >
                    <Pencil size={15} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Delete"
                    onClick={() => setDeleteId(t.id)}
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create dialog */}
      <Dialog.Root open={showCreate} onOpenChange={setShowCreate}>
        <Dialog.Portal>
          <Dialog.Overlay className="template-dialog__overlay" />
          <Dialog.Content className="template-dialog__content">
            <Dialog.Title className="template-dialog__title">New Template</Dialog.Title>
            <div className="template-dialog__fields">
              <Input
                placeholder="Template name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <Input
                placeholder="Description (optional)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>
            <div className="template-dialog__actions">
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleCreate}>
                Create
              </Button>
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
            <p className="template-dialog__body">
              This template will be permanently deleted. Users assigned to it will lose their permissions.
            </p>
            <div className="template-dialog__actions">
              <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
