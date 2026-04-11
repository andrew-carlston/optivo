"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TemplateList } from "@/features/core/components/template-list/template-list";
import {
  getTemplates,
  createTemplate,
  archiveTemplate,
} from "@/features/core/actions/template-actions";
import type { TemplateRow } from "@/features/core/actions/template-actions";

export default function AdminTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await getTemplates(null);
    setTemplates(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(name: string, description: string) {
    const id = await createTemplate(null, { name, description });
    router.push(`/admin/templates/${id}`);
  }

  async function handleDelete(id: string) {
    await archiveTemplate(null, id);
    load();
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1rem" }}>
      <TemplateList
        templates={templates}
        onEdit={(id) => router.push(`/admin/templates/${id}`)}
        onCreate={handleCreate}
        onDelete={handleDelete}
        onSetDefault={() => {}}
      />
    </div>
  );
}
