"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { TemplateEditor } from "@/features/core/components/template-editor/template-editor";
import {
  getTemplate,
  updateTemplate,
  savePermissions,
} from "@/features/core/actions/template-actions";
import type { TemplateDetail, PermissionInput } from "@/features/core/actions/template-actions";

export default function AdminTemplateEditorPage() {
  const params = useParams();
  const templateId = params.id as string;
  const [template, setTemplate] = useState<TemplateDetail | null>(null);

  useEffect(() => {
    getTemplate(null, templateId).then(setTemplate);
  }, [templateId]);

  async function handleSave(name: string, description: string, sensitivityLevels: number[], permissions: PermissionInput[]) {
    await updateTemplate(null, templateId, { name, description, sensitivityLevels });
    await savePermissions(null, templateId, permissions);
  }

  if (!template) return <p>Loading...</p>;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem 1rem" }}>
      <TemplateEditor
        template={template}
        backHref="/admin/templates"
        onSave={handleSave}
      />
    </div>
  );
}
