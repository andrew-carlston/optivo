"use client";

import { useState, useEffect } from "react";
import { useCurrentCompany } from "@/features/core/providers/company-provider";
import { DirectorySettings } from "@/features/directory/components/directory-settings/directory-settings";
import {
  getColumns, updateColumn, createCustomColumn, archiveColumn,
  getStatusOptions, createStatusOption, updateStatusOption, archiveStatusOption,
} from "@/features/directory/actions/directory-actions";
import type { ColumnRow, StatusOptionRow } from "@/features/directory/actions/directory-actions";

export default function DirectorySettingsPage() {
  const company = useCurrentCompany();
  const [columns, setColumns] = useState<ColumnRow[]>([]);
  const [statusOptions, setStatusOptions] = useState<StatusOptionRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [cols, statuses] = await Promise.all([
      getColumns(company.slug),
      getStatusOptions(company.slug),
    ]);
    setColumns(cols);
    setStatusOptions(statuses);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <DirectorySettings
      columns={columns}
      statusOptions={statusOptions}
      loading={loading}
      onUpdateColumn={async (id, data) => { await updateColumn(company.slug, id, data as any); }}
      onCreateCustomColumn={async (data) => { await createCustomColumn(company.slug, data); load(); }}
      onArchiveColumn={async (id) => { await archiveColumn(company.slug, id); load(); }}
      onCreateStatusOption={async (data) => { await createStatusOption(company.slug, data); load(); }}
      onUpdateStatusOption={async (id, data) => { await updateStatusOption(company.slug, id, data); }}
      onArchiveStatusOption={async (id) => { await archiveStatusOption(company.slug, id); load(); }}
    />
  );
}
