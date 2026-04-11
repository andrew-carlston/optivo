"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useCurrentCompany } from "@/features/core/providers/company-provider";
import { TemplateEditor } from "@/features/core/components/template-editor/template-editor";
import {
  getTemplate,
  updateTemplate,
  savePermissions,
} from "@/features/core/actions/template-actions";
import type { TemplateDetail, PermissionInput } from "@/features/core/actions/template-actions";

export default function CompanyTemplateEditorPage() {
  const company = useCurrentCompany();
  const params = useParams();
  const templateId = params.id as string;
  const [template, setTemplate] = useState<TemplateDetail | null>(null);

  useEffect(() => {
    getTemplate(company.slug, templateId).then(setTemplate);
  }, [company.slug, templateId]);

  async function handleSave(name: string, description: string, sensitivityLevels: number[], permissions: PermissionInput[]) {
    await updateTemplate(company.slug, templateId, { name, description, sensitivityLevels });
    await savePermissions(company.slug, templateId, permissions);
  }

  if (!template) return <p>Loading...</p>;

  return (
    <TemplateEditor
      template={template}
      backHref={`/${company.slug}/settings/templates`}
      onSave={handleSave}
    />
  );
}
