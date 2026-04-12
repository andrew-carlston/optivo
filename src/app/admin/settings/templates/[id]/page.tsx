"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { TemplateEditor } from "@/features/core/components/template-editor/template-editor";
import type { TagOption, CompanyOption } from "@/features/core/components/template-editor/template-editor";
import {
  getTemplate,
  updateTemplate,
  savePermissions,
} from "@/features/core/actions/template-actions";
import { getTags, getEntityTags, setEntityTags, getTemplateCompanies, setTemplateCompanies } from "@/features/core/actions/tag-actions";
import { getAllCompaniesAction } from "@/features/core/actions/admin-user-actions";
import type { TemplateDetail, PermissionInput } from "@/features/core/actions/template-actions";

export default function AdminTemplateEditorPage() {
  const params = useParams();
  const templateId = params.id as string;
  const [template, setTemplate] = useState<TemplateDetail | null>(null);
  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);
  const [assignedTagIds, setAssignedTagIds] = useState<string[]>([]);
  const [availableCompanies, setAvailableCompanies] = useState<CompanyOption[]>([]);
  const [assignedCompanyIds, setAssignedCompanyIds] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      getTemplate(null, templateId),
      getTags(null),
      getEntityTags("template", templateId),
      getAllCompaniesAction(),
      getTemplateCompanies(templateId),
    ]).then(([tmpl, tags, entityTags, companies, companyIds]) => {
      setTemplate(tmpl);
      setAvailableTags(tags.map((t) => ({ id: t.id, name: t.name, color: t.color, type: t.type })));
      setAssignedTagIds(entityTags.map((t) => t.tagId));
      setAvailableCompanies(companies.map((c) => ({ id: c.id, name: c.name })));
      setAssignedCompanyIds(companyIds);
    });
  }, [templateId]);

  async function handleSave(data: {
    name: string; description: string; groupName: string; tags: string[];
    sensitivityLevels: number[]; permissions: PermissionInput[];
    assignedTagIds: string[]; assignedCompanyIds: string[];
  }) {
    await updateTemplate(null, templateId, {
      name: data.name, description: data.description,
      groupName: data.groupName || null, tags: data.tags,
      sensitivityLevels: data.sensitivityLevels,
    });
    await savePermissions(null, templateId, data.permissions);
    await setEntityTags("template", templateId, data.assignedTagIds);
    await setTemplateCompanies(templateId, data.assignedCompanyIds);
  }

  if (!template) return <p>Loading...</p>;

  return (
    <TemplateEditor
      template={template}
      backHref="/admin/settings/templates"
      availableTags={availableTags}
      assignedTagIds={assignedTagIds}
      availableCompanies={availableCompanies}
      assignedCompanyIds={assignedCompanyIds}
      onSave={handleSave}
    />
  );
}
