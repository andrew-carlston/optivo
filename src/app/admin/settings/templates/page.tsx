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
import { getTags, getAllEntityTags, getAllTemplateCompanies } from "@/features/core/actions/tag-actions";
import { getAllCompaniesAction } from "@/features/core/actions/admin-user-actions";
import { Skeleton } from "@/components/ui/skeleton/skeleton";
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
    const [data, tags, companies, tagMap, companyMap] = await Promise.all([
      getTemplates(null),
      getTags(null),
      getAllCompaniesAction(),
      getAllEntityTags("template"),
      getAllTemplateCompanies(),
    ]);
    setTemplates(data);
    setAvailableTags(tags.map((t) => ({ id: t.id, name: t.name, color: t.color, type: t.type })));
    setAvailableCompanies(companies.map((c) => ({ id: c.id, name: c.name })));
    setTemplateTagMap(tagMap);
    setTemplateCompanyMap(companyMap);
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

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Skeleton width={180} height={24} radius="md" />
          <Skeleton width={130} height={34} radius="lg" />
        </div>
        <Skeleton width="100%" height={40} radius="md" />
        <div style={{ display: "flex", gap: "8px" }}>
          <Skeleton width="25%" height={38} radius="md" />
          <Skeleton width="25%" height={38} radius="md" />
          <Skeleton width="25%" height={38} radius="md" />
          <Skeleton width="25%" height={38} radius="md" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "8px" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "16px", border: "1px solid var(--border)", borderRadius: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Skeleton width={140} height={18} radius="md" />
                <Skeleton width={72} height={18} radius="md" />
              </div>
              <Skeleton width={80} height={14} radius="sm" />
              <Skeleton width={60} height={12} radius="sm" />
              <Skeleton width={50} height={12} radius="sm" />
              <Skeleton width={70} height={12} radius="sm" />
            </div>
          ))}
        </div>
      </div>
    );
  }

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
