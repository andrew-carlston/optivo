"use client";

import { useState, useCallback, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button/button";
import { Input } from "@/components/ui/input/input";
import { Select } from "@/components/ui/select/select";
import type { EmployeeRow, OrgOptions } from "@/features/directory/actions/employee-actions";
import type { StatusOptionRow } from "@/features/directory/actions/directory-actions";
import "./employee-form.scss";

// ── Types ──

type EmployeeFormProps = {
  open: boolean;
  onClose: () => void;
  orgOptions: OrgOptions;
  statusOptions: StatusOptionRow[];
  onSave: (data: any) => Promise<void>;
  initialData?: EmployeeRow | null;
};

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  agentId: string;
  departmentId: string;
  divisionId: string;
  lobId: string;
  positionId: string;
  managerId: string;
  employmentStatus: string;
  employmentType: string;
  startDate: string;
  endDate: string;
  country: string;
  stateProvince: string;
  city: string;
  timezone: string;
};

// ── Helpers ──

function buildInitialState(data?: EmployeeRow | null): FormState {
  return {
    firstName: data?.firstName ?? "",
    lastName: data?.lastName ?? "",
    email: data?.email ?? "",
    agentId: data?.agentId ?? "",
    departmentId: data?.departmentId ?? "",
    divisionId: data?.divisionId ?? "",
    lobId: data?.lobId ?? "",
    positionId: data?.positionId ?? "",
    managerId: data?.managerId ?? "",
    employmentStatus: data?.employmentStatus ?? "active",
    employmentType: data?.employmentType ?? "",
    startDate: data?.startDate ?? "",
    endDate: data?.endDate ?? "",
    country: data?.country ?? "",
    stateProvince: data?.stateProvince ?? "",
    city: data?.city ?? "",
    timezone: data?.timezone ?? "",
  };
}

// ── Component ──

export function EmployeeForm({
  open,
  onClose,
  orgOptions,
  statusOptions,
  onSave,
  initialData,
}: EmployeeFormProps) {
  const isEdit = !!initialData;
  const [form, setForm] = useState<FormState>(() => buildInitialState(initialData));
  const [saving, setSaving] = useState(false);

  // Reset form when dialog opens or initialData changes
  useEffect(() => {
    if (open) {
      setForm(buildInitialState(initialData));
    }
  }, [open, initialData]);

  const set = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const fullName = [form.firstName, form.lastName].filter(Boolean).join(" ") || "Unnamed";

      const payload: Record<string, any> = {
        fullName,
        firstName: form.firstName || null,
        lastName: form.lastName || null,
        email: form.email || null,
        agentId: form.agentId || null,
        departmentId: form.departmentId || null,
        divisionId: form.divisionId || null,
        lobId: form.lobId || null,
        positionId: form.positionId || null,
        managerId: form.managerId || null,
        employmentStatus: form.employmentStatus || "active",
        employmentType: form.employmentType || null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        country: form.country || null,
        stateProvince: form.stateProvince || null,
        city: form.city || null,
        timezone: form.timezone || null,
      };

      setSaving(true);
      try {
        await onSave(payload);
        onClose();
      } finally {
        setSaving(false);
      }
    },
    [form, onSave, onClose],
  );

  // Filter managers to exclude the current employee when editing
  const managerOptions = orgOptions.managers
    .filter((m) => !isEdit || m.id !== initialData?.id)
    .map((m) => ({ value: m.id, label: m.name }));

  const departmentOptions = orgOptions.departments.map((d) => ({ value: d.id, label: d.name }));
  const divisionOptions = orgOptions.divisions.map((d) => ({ value: d.id, label: d.name }));
  const lobOptions = orgOptions.lobs.map((l) => ({ value: l.id, label: l.name }));
  const positionOptions = orgOptions.positions.map((p) => ({ value: p.id, label: p.name }));
  const statusOpts = statusOptions
    .filter((s) => s.active)
    .map((s) => ({ value: s.value, label: s.label }));
  const typeOptions = [
    { value: "full_time", label: "Full Time" },
    { value: "part_time", label: "Part Time" },
    { value: "contractor", label: "Contractor" },
    { value: "temp", label: "Temp" },
  ];

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="emp-form__overlay" />
        <Dialog.Content className="emp-form__dialog" aria-describedby={undefined}>
          <div className="emp-form__header">
            <Dialog.Title className="emp-form__title">
              {isEdit ? "Edit Person" : "New Person"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close">
                <X size={18} />
              </Button>
            </Dialog.Close>
          </div>

          <form className="emp-form__body" onSubmit={handleSubmit}>
            {/* ── Basic Info ── */}
            <fieldset className="emp-form__section">
              <legend className="emp-form__section-label">Basic Info</legend>
              <div className="emp-form__grid">
                <label className="emp-form__field">
                  <span className="emp-form__label">First Name</span>
                  <Input
                    value={form.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                    placeholder="First name"
                  />
                </label>
                <label className="emp-form__field">
                  <span className="emp-form__label">Last Name</span>
                  <Input
                    value={form.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                    placeholder="Last name"
                  />
                </label>
                <label className="emp-form__field">
                  <span className="emp-form__label">Email</span>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="email@example.com"
                  />
                </label>
                <label className="emp-form__field">
                  <span className="emp-form__label">Agent ID</span>
                  <Input
                    value={form.agentId}
                    onChange={(e) => set("agentId", e.target.value)}
                    placeholder="Agent ID"
                  />
                </label>
              </div>
            </fieldset>

            {/* ── Organization ── */}
            <fieldset className="emp-form__section">
              <legend className="emp-form__section-label">Organization</legend>
              <div className="emp-form__grid">
                <div className="emp-form__field">
                  <span className="emp-form__label">Department</span>
                  <Select
                    options={departmentOptions}
                    value={form.departmentId}
                    onChange={(v) => set("departmentId", v)}
                    placeholder="Select department..."
                  />
                </div>
                <div className="emp-form__field">
                  <span className="emp-form__label">Division</span>
                  <Select
                    options={divisionOptions}
                    value={form.divisionId}
                    onChange={(v) => set("divisionId", v)}
                    placeholder="Select division..."
                  />
                </div>
                <div className="emp-form__field">
                  <span className="emp-form__label">LOB</span>
                  <Select
                    options={lobOptions}
                    value={form.lobId}
                    onChange={(v) => set("lobId", v)}
                    placeholder="Select LOB..."
                  />
                </div>
                <div className="emp-form__field">
                  <span className="emp-form__label">Position</span>
                  <Select
                    options={positionOptions}
                    value={form.positionId}
                    onChange={(v) => set("positionId", v)}
                    placeholder="Select position..."
                  />
                </div>
                <div className="emp-form__field emp-form__field--full">
                  <span className="emp-form__label">Manager</span>
                  <Select
                    options={managerOptions}
                    value={form.managerId}
                    onChange={(v) => set("managerId", v)}
                    placeholder="Select manager..."
                  />
                </div>
              </div>
            </fieldset>

            {/* ── Employment ── */}
            <fieldset className="emp-form__section">
              <legend className="emp-form__section-label">Employment</legend>
              <div className="emp-form__grid">
                <div className="emp-form__field">
                  <span className="emp-form__label">Status</span>
                  <Select
                    options={statusOpts}
                    value={form.employmentStatus}
                    onChange={(v) => set("employmentStatus", v)}
                    placeholder="Select status..."
                  />
                </div>
                <div className="emp-form__field">
                  <span className="emp-form__label">Type</span>
                  <Select
                    options={typeOptions}
                    value={form.employmentType}
                    onChange={(v) => set("employmentType", v)}
                    placeholder="Select type..."
                  />
                </div>
                <label className="emp-form__field">
                  <span className="emp-form__label">Start Date</span>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => set("startDate", e.target.value)}
                  />
                </label>
                <label className="emp-form__field">
                  <span className="emp-form__label">End Date</span>
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => set("endDate", e.target.value)}
                  />
                </label>
              </div>
            </fieldset>

            {/* ── Location ── */}
            <fieldset className="emp-form__section">
              <legend className="emp-form__section-label">Location</legend>
              <div className="emp-form__grid">
                <label className="emp-form__field">
                  <span className="emp-form__label">Country</span>
                  <Input
                    value={form.country}
                    onChange={(e) => set("country", e.target.value)}
                    placeholder="Country"
                  />
                </label>
                <label className="emp-form__field">
                  <span className="emp-form__label">State / Province</span>
                  <Input
                    value={form.stateProvince}
                    onChange={(e) => set("stateProvince", e.target.value)}
                    placeholder="State or province"
                  />
                </label>
                <label className="emp-form__field">
                  <span className="emp-form__label">City</span>
                  <Input
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    placeholder="City"
                  />
                </label>
                <label className="emp-form__field">
                  <span className="emp-form__label">Timezone</span>
                  <Input
                    value={form.timezone}
                    onChange={(e) => set("timezone", e.target.value)}
                    placeholder="America/New_York"
                  />
                </label>
              </div>
            </fieldset>

            {/* ── Actions ── */}
            <div className="emp-form__actions">
              <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
