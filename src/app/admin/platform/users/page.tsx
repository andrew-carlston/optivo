"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card/card";
import { Button } from "@/components/ui/button/button";
import { Badge } from "@/components/ui/badge/badge";
import { Select, MultiSelect, type SelectOption } from "@/components/ui/select/select";
import { Avatar } from "@/components/ui/avatar/avatar";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, Trash2, Shield, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input/input";
import {
  getAdminUsers,
  getUserCompanyAccess,
  grantCompanyAccess,
  revokeCompanyAccess,
  setCompanyOverride,
  updateAdminUser,
  createAdminUser,
  getAllCompaniesAction,
} from "@/features/core/actions/admin-user-actions";
import { getTemplates } from "@/features/core/actions/template-actions";
import type { AdminUser, UserCompanyAccessRow } from "@/features/core/actions/admin-user-actions";
import type { TemplateRow } from "@/features/core/actions/template-actions";
import type { CompanyData } from "@/features/core/lib/session";
import "./users.scss";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userAccess, setUserAccess] = useState<UserCompanyAccessRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  // Draft state for user edits (only persisted on Save)
  const [draftTemplateId, setDraftTemplateId] = useState<string>("none");
  const [draftIsSuper, setDraftIsSuper] = useState(false);
  const [draftAddCompanies, setDraftAddCompanies] = useState<string[]>([]);
  const [draftRemoveAccessIds, setDraftRemoveAccessIds] = useState<Set<string>>(new Set());
  const [draftOverrides, setDraftOverrides] = useState<Record<string, string>>({});
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [createError, setCreateError] = useState("");

  async function load() {
    const [u, t, c] = await Promise.all([
      getAdminUsers(),
      getTemplates(null),
      getAllCompaniesAction(),
    ]);
    setUsers(u);
    setTemplates(t);
    setCompanies(c);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function openUser(user: AdminUser) {
    setSelectedUser(user);
    const access = await getUserCompanyAccess(user.id);
    setUserAccess(access);
    // Initialize draft from current state
    setDraftTemplateId(user.accessTemplateId ?? "none");
    setDraftIsSuper(user.isSuper);
    setDraftAddCompanies([]);
    setDraftRemoveAccessIds(new Set());
    setDraftOverrides(
      Object.fromEntries(access.map((a) => [a.id, a.overrideTemplateId ?? "none"]))
    );
  }

  function closeDialog() {
    setSelectedUser(null);
  }

  async function handleSave() {
    if (!selectedUser) return;
    setSaving(true);

    // 1. Update template + super status
    const newTemplateId = draftTemplateId === "none" ? null : draftTemplateId;
    if (newTemplateId !== selectedUser.accessTemplateId || draftIsSuper !== selectedUser.isSuper) {
      await updateAdminUser(selectedUser.id, {
        accessTemplateId: newTemplateId,
        isSuper: draftIsSuper,
      });
    }

    // 2. Revoke removed companies
    for (const accessId of draftRemoveAccessIds) {
      await revokeCompanyAccess(accessId);
    }

    // 3. Grant new companies
    for (const companyId of draftAddCompanies) {
      await grantCompanyAccess(selectedUser.id, companyId);
    }

    // 4. Update overrides on remaining access rows
    for (const [accessId, templateId] of Object.entries(draftOverrides)) {
      if (draftRemoveAccessIds.has(accessId)) continue;
      const original = userAccess.find((a) => a.id === accessId);
      const newOverride = templateId === "none" ? null : templateId;
      if (original && newOverride !== original.overrideTemplateId) {
        await setCompanyOverride(accessId, newOverride);
      }
    }

    setSaving(false);
    setSelectedUser(null);
    load();
  }

  async function handleCreateUser() {
    if (!newEmail || !newPassword || !newName) return;
    setCreateError("");
    try {
      await createAdminUser({ email: newEmail, password: newPassword, fullName: newName });
      setShowCreate(false);
      setNewEmail("");
      setNewPassword("");
      setNewName("");
      load();
    } catch (e: any) {
      setCreateError(e.message || "Failed to create user");
    }
  }

  const templateOptions: SelectOption[] = [
    { value: "none", label: "No template" },
    ...templates.map((t) => ({ value: t.id, label: t.name })),
  ];

  const overrideOptions: SelectOption[] = [
    { value: "none", label: "Same as platform" },
    ...templates.map((t) => ({ value: t.id, label: t.name })),
  ];

  if (loading) return <p>Loading...</p>;

  const assignedCompanyIds = new Set(userAccess.map((a) => a.companyId));
  const availableCompanies = companies.filter((c) => !assignedCompanyIds.has(c.id));

  return (
    <div className="admin-users">
      <div className="admin-users__header">
        <h2>Platform Users</h2>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={15} />
          Add User
        </Button>
      </div>

      <div className="admin-users__list">
        {users.map((user) => (
          <Card key={user.id} variant="flat">
            <CardContent>
              <div className="admin-users__row" onClick={() => openUser(user)} role="button" tabIndex={0}>
                <Avatar src={user.avatarUrl} fallback={user.fullName} size="md" />
                <div className="admin-users__info">
                  <span className="admin-users__name">
                    {user.fullName}
                    {user.isSuper && <Badge variant="info">Super</Badge>}
                  </span>
                  <span className="admin-users__email">{user.email}</span>
                </div>
                <div className="admin-users__meta">
                  {user.templateName && <Badge variant="default">{user.templateName}</Badge>}
                  <span className="admin-users__companies">
                    <Building2 size={13} />
                    {user.isSuper ? "All" : `${user.companyCount}`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog.Root open={!!selectedUser} onOpenChange={() => closeDialog()}>
        <Dialog.Portal>
          <Dialog.Overlay className="admin-users__overlay" />
          <Dialog.Content className="admin-users__dialog">
            {selectedUser && (
              <>
                {/* Header */}
                <div className="admin-users__dialog-header">
                  <Dialog.Title className="admin-users__dialog-title">
                    <Avatar src={selectedUser.avatarUrl} fallback={selectedUser.fullName} size="lg" />
                    <div>
                      <h3>{selectedUser.fullName}</h3>
                      <p>{selectedUser.email}</p>
                    </div>
                  </Dialog.Title>
                </div>

                {/* Body */}
                <div className="admin-users__dialog-body">
                  <div className="admin-users__section">
                    <label>Platform Template</label>
                    <Select
                      options={templateOptions}
                      value={draftTemplateId}
                      onChange={setDraftTemplateId}
                      placeholder="No template"
                    />
                  </div>

                  <div className="admin-users__section">
                    <label>
                      <Shield size={14} />
                      Full Access (Super User)
                    </label>
                    <p className="admin-users__hint">
                      Super users bypass all permission checks and can access every company.
                    </p>
                    <Button
                      variant={draftIsSuper ? "danger" : "primary"}
                      size="sm"
                      onClick={() => setDraftIsSuper(!draftIsSuper)}
                    >
                      {draftIsSuper ? "Remove Super Access" : "Grant Super Access"}
                    </Button>
                  </div>

                  {!draftIsSuper && (
                    <div className="admin-users__section">
                      <label>
                        <Building2 size={14} />
                        Company Access
                      </label>
                      <p className="admin-users__hint">
                        Assign companies this user can access. Optionally pick a different template per company.
                      </p>

                      <div className="admin-users__access-list">
                        {userAccess
                          .filter((a) => !draftRemoveAccessIds.has(a.id))
                          .map((access) => (
                            <div key={access.id} className="admin-users__access-row">
                              <span className="admin-users__access-company">{access.companyName}</span>
                              <Select
                                options={overrideOptions}
                                value={draftOverrides[access.id] ?? "none"}
                                onChange={(val) =>
                                  setDraftOverrides((prev) => ({ ...prev, [access.id]: val }))
                                }
                                placeholder="Same as platform"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  setDraftRemoveAccessIds((prev) => new Set([...prev, access.id]))
                                }
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          ))}

                        {/* Pending additions */}
                        {draftAddCompanies.map((cid) => {
                          const comp = companies.find((c) => c.id === cid);
                          return (
                            <div key={cid} className="admin-users__access-row admin-users__access-row--new">
                              <span className="admin-users__access-company">{comp?.name}</span>
                              <span className="admin-users__access-badge">New</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  setDraftAddCompanies((prev) => prev.filter((id) => id !== cid))
                                }
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          );
                        })}

                        {userAccess.filter((a) => !draftRemoveAccessIds.has(a.id)).length === 0 &&
                          draftAddCompanies.length === 0 && (
                            <p className="admin-users__empty">No companies assigned.</p>
                          )}
                      </div>

                      {availableCompanies.filter((c) => !draftAddCompanies.includes(c.id)).length > 0 && (
                        <div className="admin-users__add-company">
                          <MultiSelect
                            options={availableCompanies
                              .filter((c) => !draftAddCompanies.includes(c.id))
                              .map((c) => ({ value: c.id, label: c.name }))}
                            selected={draftAddCompanies}
                            onChange={setDraftAddCompanies}
                            placeholder="Add companies..."
                            searchable
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="admin-users__dialog-footer">
                  <Button variant="outline" size="sm" onClick={closeDialog}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>
                    Save Changes
                  </Button>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Create user dialog */}
      <Dialog.Root open={showCreate} onOpenChange={setShowCreate}>
        <Dialog.Portal>
          <Dialog.Overlay className="admin-users__overlay" />
          <Dialog.Content className="admin-users__dialog">
            <Dialog.Title className="admin-users__dialog-create-title">Add Platform User</Dialog.Title>
            <div className="admin-users__create-form">
              <Input
                placeholder="Full name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <Input
                placeholder="Email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
              <Input
                placeholder="Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              {createError && <p className="admin-users__error">{createError}</p>}
              <div className="admin-users__create-actions">
                <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleCreateUser}>
                  Create User
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
