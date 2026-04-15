"use client";

import { Building2, Layers, Network, Briefcase, Users, Archive, ArchiveRestore, MapPin, Wifi, Hash } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card/card";
import { Button } from "@/components/ui/button/button";
import { Badge } from "@/components/ui/badge/badge";
import { cn } from "@/lib/cn";
import type { DepartmentRow, DivisionRow, LobRow, LocationRow, PositionRow } from "@/features/hr/actions/org-actions";

// ── Shared bits ──

function Actions({ active, onArchive, onRestore }: { active: boolean; onArchive: () => void; onRestore: () => void }) {
  return (
    <div className="org-settings__card-actions">
      {active ? (
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onArchive(); }} title="Archive">
          <Archive size={14} />
        </Button>
      ) : (
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onRestore(); }} title="Restore">
          <ArchiveRestore size={14} />
        </Button>
      )}
    </div>
  );
}

function CountBadge({ active, costCode, employeeCount }: { active: boolean; costCode: string | null; employeeCount: number }) {
  return (
    <>
      <span className="org-settings__card-meta-item">
        <Users size={12} /> {employeeCount}
      </span>
      {costCode && (
        <span className="org-settings__card-meta-item">
          <Hash size={12} /> {costCode}
        </span>
      )}
      {!active && <Badge variant="warning">Archived</Badge>}
    </>
  );
}

type CardHandlers = {
  onEdit: (item: any) => void;
  onArchive: (item: any) => void;
  onRestore: (item: any) => void;
};

// ── Division ──

export function DivisionCard({ d, handlers }: { d: DivisionRow; handlers: CardHandlers }) {
  return (
    <Card variant="flat">
      <CardContent>
        <div className={cn("org-settings__card", !d.active && "org-settings__card--archived")} onClick={() => d.active && handlers.onEdit(d)}>
          <div className="org-settings__card-header">
            <div className="org-settings__card-title">
              <Layers size={14} />
              <span className="org-settings__card-name">{d.name}</span>
            </div>
            <Actions active={d.active} onArchive={() => handlers.onArchive(d)} onRestore={() => handlers.onRestore(d)} />
          </div>
          <div className="org-settings__card-meta">
            <CountBadge active={d.active} costCode={d.costCode} employeeCount={d.employeeCount} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Location ──

export function LocationCard({ l, handlers }: { l: LocationRow; handlers: CardHandlers }) {
  return (
    <Card variant="flat">
      <CardContent>
        <div className={cn("org-settings__card", !l.active && "org-settings__card--archived")} onClick={() => l.active && handlers.onEdit(l)}>
          <div className="org-settings__card-header">
            <div className="org-settings__card-title">
              {l.isRemote ? <Wifi size={14} /> : <MapPin size={14} />}
              <span className="org-settings__card-name">{l.name}</span>
              {l.isRemote && <Badge variant="info">Remote</Badge>}
            </div>
            <Actions active={l.active} onArchive={() => handlers.onArchive(l)} onRestore={() => handlers.onRestore(l)} />
          </div>
          <div className="org-settings__card-meta">
            {l.parentName && (
              <span className="org-settings__card-meta-item">
                <Network size={12} /> {l.parentName}
              </span>
            )}
            {!l.isRemote && (l.city || l.stateProvince) && (
              <span className="org-settings__card-meta-item">
                {[l.city, l.stateProvince, l.country].filter(Boolean).join(", ")}
              </span>
            )}
            <CountBadge active={l.active} costCode={l.costCode} employeeCount={l.employeeCount} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── LOB ──

export function LobCard({ l, handlers }: { l: LobRow; handlers: CardHandlers }) {
  return (
    <Card variant="flat">
      <CardContent>
        <div className={cn("org-settings__card", !l.active && "org-settings__card--archived")} onClick={() => l.active && handlers.onEdit(l)}>
          <div className="org-settings__card-header">
            <div className="org-settings__card-title">
              <Network size={14} />
              <span className="org-settings__card-name">{l.name}</span>
            </div>
            <Actions active={l.active} onArchive={() => handlers.onArchive(l)} onRestore={() => handlers.onRestore(l)} />
          </div>
          <div className="org-settings__card-meta">
            {l.divisionName && (
              <span className="org-settings__card-meta-item">
                <Layers size={12} /> {l.divisionName}
              </span>
            )}
            <CountBadge active={l.active} costCode={l.costCode} employeeCount={l.employeeCount} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Department ──

export function DepartmentCard({ d, handlers }: { d: DepartmentRow; handlers: CardHandlers }) {
  return (
    <Card variant="flat">
      <CardContent>
        <div className={cn("org-settings__card", !d.active && "org-settings__card--archived")} onClick={() => d.active && handlers.onEdit(d)}>
          <div className="org-settings__card-header">
            <div className="org-settings__card-title">
              <Building2 size={14} />
              <span className="org-settings__card-name">{d.name}</span>
            </div>
            <Actions active={d.active} onArchive={() => handlers.onArchive(d)} onRestore={() => handlers.onRestore(d)} />
          </div>
          <div className="org-settings__card-meta">
            {d.lobName && (
              <span className="org-settings__card-meta-item">
                <Network size={12} /> {d.lobName}
              </span>
            )}
            {d.locationName && (
              <span className="org-settings__card-meta-item">
                <MapPin size={12} /> {d.locationName}
              </span>
            )}
            {d.parentName && (
              <span className="org-settings__card-meta-item">
                <Building2 size={12} /> {d.parentName}
              </span>
            )}
            <CountBadge active={d.active} costCode={d.costCode} employeeCount={d.employeeCount} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Position ──

export function PositionCard({ p, handlers }: { p: PositionRow; handlers: CardHandlers }) {
  return (
    <Card variant="flat">
      <CardContent>
        <div className={cn("org-settings__card", !p.active && "org-settings__card--archived")} onClick={() => p.active && handlers.onEdit(p)}>
          <div className="org-settings__card-header">
            <div className="org-settings__card-title">
              <Briefcase size={14} />
              <span className="org-settings__card-name">{p.name}</span>
            </div>
            <Actions active={p.active} onArchive={() => handlers.onArchive(p)} onRestore={() => handlers.onRestore(p)} />
          </div>
          <div className="org-settings__card-meta">
            {p.divisionName && (
              <span className="org-settings__card-meta-item">
                <Layers size={12} /> {p.divisionName}
              </span>
            )}
            {p.lobName && (
              <span className="org-settings__card-meta-item">
                <Network size={12} /> {p.lobName}
              </span>
            )}
            {p.departmentName && (
              <span className="org-settings__card-meta-item">
                <Building2 size={12} /> {p.departmentName}
              </span>
            )}
            {p.locationName && (
              <span className="org-settings__card-meta-item">
                <MapPin size={12} /> {p.locationName}
              </span>
            )}
            <CountBadge active={p.active} costCode={p.costCode} employeeCount={p.employeeCount} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
