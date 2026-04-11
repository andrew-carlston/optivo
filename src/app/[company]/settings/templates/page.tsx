"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentCompany } from "@/features/core/providers/company-provider";
import { TemplateList } from "@/features/core/components/template-list/template-list";
import {
  getTemplates,
  createTemplate,
  archiveTemplate,
  setDefaultTemplate,
} from "@/features/core/actions/template-actions";
import type { TemplateRow } from "@/features/core/actions/template-actions";

export default function CompanyTemplatesPage() {
  const company = useCurrentCompany();
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await getTemplates(company.slug);
    setTemplates(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(name: string, description: string) {
    const id = await createTemplate(company.slug, { name, description });
    router.push(`/${company.slug}/settings/templates/${id}`);
  }

  async function handleDelete(id: string) {
    await archiveTemplate(company.slug, id);
    load();
  }

  async function handleSetDefault(id: string) {
    await setDefaultTemplate(company.slug, id);
    load();
  }

  if (loading) return <p>Loading...</p>;

  return (
    <TemplateList
      templates={templates}
      onEdit={(id) => router.push(`/${company.slug}/settings/templates/${id}`)}
      onCreate={handleCreate}
      onDelete={handleDelete}
      onSetDefault={handleSetDefault}
    />
  );
}
