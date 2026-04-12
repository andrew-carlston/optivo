"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TemplateList } from "@/features/core/components/template-list/template-list";
import type { FilterTag, FilterCompany } from "@/features/core/components/template-list/template-list";
import {
  getTemplates,
  createTemplate,
  archiveTemplate,
} from "@/features/core/actions/template-actions";
import { getTags, getEntityTags, getTemplateCompanies } from "@/features/core/actions/tag-actions";
import { getAllCompaniesAction } from "@/features/core/actions/admin-user-actions";
import type { TemplateRow } from "@/features/core/actions/template-actions";

export default function AdminTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [availableTags, setAvailableTags] = useState<FilterTag[]>([]);
  const [templateTagMap, setTemplateTagMap] = useState<Record<string, string[]>>({});
  const [availableCompanies, setAvailableCompanies] = useState<FilterCompany[]>([]);
  const [templateCompanyMap, setTemplateCompanyMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  async function load() {
    const [data, tags, companies] = await Promise.all([
      getTemplates(null),
      getTags(null),
      getAllCompaniesAction(),
    ]);
    setTemplates(data);
    setAvailableTags(tags.map((t) => ({ id: t.id, name: t.name, color: t.color, type: t.type })));
    setAvailableCompanies(companies.map((c) => ({ id: c.id, name: c.name })));

    // Load tag + company assignments for each template
    const [tagEntries, companyEntries] = await Promise.all([
      Promise.all(data.map(async (t) => {
        const entityTags = await getEntityTags("template", t.id);
        return [t.id, entityTags.map((et) => et.tagId)] as [string, string[]];
      })),
      Promise.all(data.map(async (t) => {
        const companyIds = await getTemplateCompanies(t.id);
        return [t.id, companyIds] as [string, string[]];
      })),
    ]);
    setTemplateTagMap(Object.fromEntries(tagEntries));
    setTemplateCompanyMap(Object.fromEntries(companyEntries));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(name: string, description: string) {
    const id = await createTemplate(null, { name, description });
    router.push(`/admin/settings/templates/${id}`);
  }

  async function handleDelete(id: string) {
    await archiveTemplate(null, id);
    load();
  }

  if (loading) return <p>Loading...</p>;

  return (
    <TemplateList
      templates={templates}
      availableTags={availableTags}
      templateTagMap={templateTagMap}
      availableCompanies={availableCompanies}
      templateCompanyMap={templateCompanyMap}
      onEdit={(id) => router.push(`/admin/settings/templates/${id}`)}
      onCreate={handleCreate}
      onDelete={handleDelete}
      onSetDefault={() => {}}
    />
  );
}
