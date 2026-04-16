"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useCurrentCompany } from "@/features/core/providers/company-provider";
import { TemplateEditor } from "@/features/core/components/template-editor/template-editor";
import type { TagOption } from "@/features/core/components/template-editor/template-editor";
import {
  getTemplate,
  updateTemplate,
  savePermissions,
} from "@/features/core/actions/template-actions";
import { getTags, getEntityTags, setEntityTags } from "@/features/core/actions/tag-actions";
import type { TemplateDetail, PermissionInput } from "@/features/core/actions/template-actions";

export default function CompanyTemplateEditorPage() {
  const company = useCurrentCompany();
  const params = useParams();
  const templateId = params.id as string;
  const [template, setTemplate] = useState<TemplateDetail | null>(null);
  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);
  const [assignedTagIds, setAssignedTagIds] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      getTemplate(company.slug, templateId),
      getTags(company.id),
      getEntityTags("template", templateId),
    ]).then(([tmpl, tags, entityTags]) => {
      setTemplate(tmpl);
      setAvailableTags(tags.map((t) => ({ id: t.id, name: t.name, color: t.color, type: t.type })));
      setAssignedTagIds(entityTags.map((t) => t.tagId));
    });
  }, [company.slug, company.id, templateId]);

  async function handleSave(data: {
    name: string; description: string; groupName: string; tags: string[];
    sensitivityLevels: number[]; permissions: PermissionInput[];
    assignedTagIds: string[]; assignedCompanyIds: string[];
  }) {
    await updateTemplate(company.slug, templateId, {
      name: data.name, description: data.description,
      groupName: data.groupName || null, tags: data.tags,
      sensitivityLevels: data.sensitivityLevels,
    });
    await savePermissions(company.slug, templateId, data.permissions);
    await setEntityTags("template", templateId, data.assignedTagIds);
  }

  if (!template) return <p>Loading...</p>;

  return (
    <TemplateEditor
      template={template}
      backHref={`/${company.slug}/settings/templates`}
      availableTags={availableTags}
      assignedTagIds={assignedTagIds}
      onSave={handleSave}
    />
  );
}
