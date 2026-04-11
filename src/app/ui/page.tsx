"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button/button";
import { Input } from "@/components/ui/input/input";
import { Select, MultiSelect, type SelectOption } from "@/components/ui/select/select";
import { Switch } from "@/components/ui/switch/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card/card";
import { Badge } from "@/components/ui/badge/badge";
import { Skeleton, SkeletonText, SkeletonButton, SkeletonAvatar, SkeletonCard, SkeletonTable } from "@/components/ui/skeleton/skeleton";
import { AccessGate } from "@/components/ui/access-gate/access-gate";
import { AppShell } from "@/components/ui/app-shell/app-shell";
import { Header, NavItem } from "@/components/ui/header/header";
import { Footer } from "@/components/ui/footer/footer";
import { Search, Mail, Plus, Trash2, Settings, Bell, Check, Sun, Moon, Monitor, Lock, Palette, LayoutGrid, Users, Clock, BarChart3 } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import "./ui-preview.scss";

const THEMES = [
  { id: "default", label: "Default", color: "#2563EB" },
  { id: "midnight", label: "Midnight", color: "#7C3AED" },
  { id: "ember", label: "Ember", color: "#EA580C" },
];

export default function UIPreviewPage() {
  const [mode, setMode] = useState<"light" | "dark" | "system">("light");
  const [theme, setTheme] = useState("default");
  const [inputVal, setInputVal] = useState("");
  const [selectVal, setSelectVal] = useState("");
  const [multiVal, setMultiVal] = useState<string[]>([]);
  const [switchVal, setSwitchVal] = useState(false);

  const sampleOptions: SelectOption[] = [
    { value: "sales", label: "Sales" },
    { value: "ops", label: "Operations" },
    { value: "hr", label: "Human Resources" },
    { value: "wfm", label: "Workforce Management" },
    { value: "finance", label: "Finance" },
    { value: "engineering", label: "Engineering" },
  ];

  // Restore from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem("optivo-mode") as "light" | "dark" | "system" | null;
    const savedTheme = localStorage.getItem("optivo-theme");
    if (savedMode) { setMode(savedMode); document.documentElement.setAttribute("data-mode", savedMode); }
    if (savedTheme) { setTheme(savedTheme); document.documentElement.setAttribute("data-theme", savedTheme); }
  }, []);

  function changeMode(m: "light" | "dark" | "system") {
    setMode(m);
    const resolved = m === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : m;
    document.documentElement.setAttribute("data-mode", resolved);
    localStorage.setItem("optivo-mode", m);
  }

  function changeTheme(t: string) {
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("optivo-theme", t);
  }

  const headerContent = (
    <Header
      logo={<><LayoutGrid size={20} /> Optivo</>}
      nav={
        <>
          <NavItem href="/ui" active>UI Kit</NavItem>
          <NavItem href="/ui"><Users size={15} /> Directory</NavItem>
          <NavItem href="/ui"><Clock size={15} /> Realtime</NavItem>
          <NavItem href="/ui"><BarChart3 size={15} /> Analytics</NavItem>
        </>
      }
      actions={
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button variant="ghost" size="sm">
              <Palette size={14} /> Theme
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="theme-menu" sideOffset={6} align="end">
              <DropdownMenu.Label className="theme-menu__label">Mode</DropdownMenu.Label>
              <div className="theme-menu__slider">
                {([
                  { id: "light" as const, icon: <Sun size={13} />, label: "Light" },
                  { id: "system" as const, icon: <Monitor size={13} />, label: "System" },
                  { id: "dark" as const, icon: <Moon size={13} />, label: "Dark" },
                ]).map((m) => (
                  <button
                    key={m.id}
                    className={`theme-menu__slider-btn ${mode === m.id ? "theme-menu__slider-btn--active" : ""}`}
                    onClick={() => changeMode(m.id)}
                  >
                    {m.icon}
                    {m.label}
                  </button>
                ))}
              </div>
              <DropdownMenu.Separator className="theme-menu__separator" />
              <DropdownMenu.Label className="theme-menu__label">Theme</DropdownMenu.Label>
              <div className="theme-menu__themes">
                {THEMES.map((t) => (
                  <DropdownMenu.Item
                    key={t.id}
                    className={`theme-menu__item ${theme === t.id ? "theme-menu__item--active" : ""}`}
                    onSelect={() => changeTheme(t.id)}
                  >
                    <span className="theme-menu__dot" style={{ background: t.color }} />
                    {t.label}
                    {theme === t.id && <span className="theme-menu__check"><Check size={10} /></span>}
                  </DropdownMenu.Item>
                ))}
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      }
    />
  );

  return (
    <AppShell header={headerContent} footer={<Footer />}>
    <div className="ui-preview">
      <div className="ui-preview__header">
        <h1>UI Kit</h1>
      </div>

      {/* ── Colors ── */}
      <section className="ui-preview__section">
        <h2>Colors</h2>
        <div className="ui-preview__colors">
          <div className="ui-preview__swatch" style={{ background: "var(--bg)" }}><span>bg</span></div>
          <div className="ui-preview__swatch" style={{ background: "var(--surface)" }}><span>surface</span></div>
          <div className="ui-preview__swatch" style={{ background: "var(--surface-2)" }}><span>surface-2</span></div>
          <div className="ui-preview__swatch" style={{ background: "var(--accent)" }}><span>accent</span></div>
          <div className="ui-preview__swatch" style={{ background: "var(--border)" }}><span>border</span></div>
          <div className="ui-preview__swatch" style={{ background: "var(--pop)", color: "var(--pop-fg)" }}><span>pop</span></div>
          <div className="ui-preview__swatch" style={{ background: "var(--pop-muted)", color: "var(--pop)" }}><span>pop-muted</span></div>
          <div className="ui-preview__swatch" style={{ background: "var(--success)", color: "var(--success-fg)" }}><span>success</span></div>
          <div className="ui-preview__swatch" style={{ background: "var(--warning)", color: "var(--warning-fg)" }}><span>warning</span></div>
          <div className="ui-preview__swatch" style={{ background: "var(--danger)", color: "var(--danger-fg)" }}><span>danger</span></div>
          <div className="ui-preview__swatch" style={{ background: "var(--info)", color: "var(--info-fg)" }}><span>info</span></div>
        </div>
      </section>

      {/* ── Buttons ── */}
      <section className="ui-preview__section">
        <h2>Buttons</h2>
        <div className="ui-preview__row">
          <Button>Default</Button>
          <Button variant="primary">Primary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="link">Link</Button>
        </div>
        <div className="ui-preview__row">
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon"><Settings size={16} /></Button>
        </div>
        <div className="ui-preview__row">
          <Button variant="primary" disabled>Disabled</Button>
          <Button variant="primary"><Plus size={14} /> With Icon</Button>
          <Button variant="outline"><Trash2 size={14} /> Delete</Button>
        </div>
      </section>

      {/* ── Inputs ── */}
      <section className="ui-preview__section">
        <h2>Inputs</h2>
        <div className="ui-preview__grid">
          <Input placeholder="Default input" />
          <Input placeholder="With icon" icon={<Search size={16} />} />
          <Input placeholder="With value" value={inputVal} onChange={(e) => setInputVal(e.target.value)} />
          <Input placeholder="Error state" error />
          <Input placeholder="Disabled" disabled />
          <Input type="password" placeholder="Password" />
        </div>
      </section>

      {/* ── Selects ── */}
      <section className="ui-preview__section">
        <h2>Select & MultiSelect</h2>
        <div className="ui-preview__grid">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <label style={{ fontSize: "0.8125rem", fontWeight: 500 }}>Single Select</label>
            <Select options={sampleOptions} value={selectVal} onChange={setSelectVal} placeholder="Choose department..." />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <label style={{ fontSize: "0.8125rem", fontWeight: 500 }}>Single Select (disabled)</label>
            <Select options={sampleOptions} value="wfm" placeholder="Disabled..." disabled />
          </div>
        </div>
        <div className="ui-preview__grid">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <label style={{ fontSize: "0.8125rem", fontWeight: 500 }}>Multi Select</label>
            <MultiSelect options={sampleOptions} selected={multiVal} onChange={setMultiVal} placeholder="Select departments..." />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <label style={{ fontSize: "0.8125rem", fontWeight: 500 }}>Multi Select (loading)</label>
            <MultiSelect options={[]} selected={[]} onChange={() => {}} loading />
          </div>
        </div>
      </section>

      {/* ── Switch ── */}
      <section className="ui-preview__section">
        <h2>Switch</h2>
        <div className="ui-preview__row">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Switch checked={switchVal} onCheckedChange={setSwitchVal} />
            <span style={{ fontSize: "0.8125rem" }}>{switchVal ? "Enabled" : "Disabled"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Switch checked disabled />
            <span style={{ fontSize: "0.8125rem", color: "var(--muted-fg)" }}>Disabled on</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Switch disabled />
            <span style={{ fontSize: "0.8125rem", color: "var(--muted-fg)" }}>Disabled off</span>
          </div>
        </div>
      </section>

      {/* ── Cards ── */}
      <section className="ui-preview__section">
        <h2>Cards</h2>
        <div className="ui-preview__grid ui-preview__grid--3">
          <Card>
            <CardHeader>
              <CardTitle>Flat (default)</CardTitle>
              <Button variant="ghost" size="icon"><Settings size={16} /></Button>
            </CardHeader>
            <CardContent>
              <p style={{ color: "var(--muted-fg)", fontSize: "0.8125rem" }}>Standard card with border, no shadow. The default look for content containers.</p>
            </CardContent>
          </Card>
          <Card variant="raised">
            <CardHeader>
              <CardTitle>Raised</CardTitle>
              <Button variant="ghost" size="icon"><Settings size={16} /></Button>
            </CardHeader>
            <CardContent>
              <p style={{ color: "var(--muted-fg)", fontSize: "0.8125rem" }}>Elevated card with shadow. Lifts on hover. Great for interactive or primary content.</p>
            </CardContent>
          </Card>
          <Card variant="inset">
            <CardHeader>
              <CardTitle>Inset</CardTitle>
              <Button variant="ghost" size="icon"><Settings size={16} /></Button>
            </CardHeader>
            <CardContent>
              <p style={{ color: "var(--muted-fg)", fontSize: "0.8125rem" }}>Recessed card with inner shadow. Good for nested content or secondary panels.</p>
            </CardContent>
          </Card>
        </div>
        <div className="ui-preview__grid">
          <Card variant="raised">
            <CardContent>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--pop)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--pop-fg)", fontWeight: 600, fontSize: "0.875rem" }}>AC</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>Andrew Carlston</div>
                  <div style={{ color: "var(--muted-fg)", fontSize: "0.75rem" }}>Senior Manager, WFM</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="inset">
            <CardContent>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--success-fg)", fontWeight: 600, fontSize: "0.875rem" }}>JD</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>Jane Doe</div>
                  <div style={{ color: "var(--muted-fg)", fontSize: "0.75rem" }}>Agent, Sales</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Badges ── */}
      <section className="ui-preview__section">
        <h2>Badges</h2>
        <div className="ui-preview__row">
          <Badge>Default</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
        <div className="ui-preview__row">
          <Badge variant="success"><Check size={10} /> On Time</Badge>
          <Badge variant="warning">Late</Badge>
          <Badge variant="danger">No Show</Badge>
          <Badge variant="outline">Verbal Warning</Badge>
        </div>
      </section>

      {/* ── Skeletons ── */}
      <section className="ui-preview__section">
        <h2>Loading Skeletons</h2>
        <div className="ui-preview__row">
          <Skeleton width={120} height={20} radius="sm" />
          <SkeletonText width={200} />
          <SkeletonButton />
          <SkeletonAvatar />
          <SkeletonAvatar size={32} />
        </div>
        <div className="ui-preview__row" style={{ alignItems: "flex-start" }}>
          <Button loading>Loading</Button>
          <Button loading size="sm">Small</Button>
          <Button loading size="icon">X</Button>
          <Input loading placeholder="Loading..." />
        </div>
        <div className="ui-preview__grid">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonTable rows={3} cols={5} />
      </section>

      {/* ── Access Gate ── */}
      <section className="ui-preview__section">
        <h2>Access Gate (ReBAC)</h2>
        <div className="ui-preview__row">
          <AccessGate access="admin:edit">
            <Button variant="primary"><Lock size={14} /> Admin Only (visible — no auth yet)</Button>
          </AccessGate>
          <AccessGate access="billing:view" fallback={<Badge variant="outline">No Access</Badge>}>
            <Button>Billing (with fallback)</Button>
          </AccessGate>
        </div>
        <Card>
          <CardContent>
            <p style={{ fontSize: "0.8125rem", color: "var(--muted-fg)" }}>
              <code>&lt;AccessGate access=&quot;resource:action&quot;&gt;</code> wraps any component.
              Hidden when denied, shows fallback if provided. When ReBAC is wired up,
              these will gate automatically based on the user&apos;s template permissions.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* ── Typography ── */}
      <section className="ui-preview__section">
        <h2>Typography</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <p style={{ fontSize: "2rem", fontWeight: 700 }}>Heading 2xl (32px)</p>
          <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>Heading xl (24px)</p>
          <p style={{ fontSize: "1.125rem", fontWeight: 600 }}>Heading lg (18px)</p>
          <p style={{ fontSize: "0.9375rem" }}>Body base (15px)</p>
          <p style={{ fontSize: "0.8125rem" }}>Body sm (13px)</p>
          <p style={{ fontSize: "0.6875rem", color: "var(--muted-fg)" }}>Caption xs (11px)</p>
        </div>
      </section>

      {/* ── Spacing ── */}
      <section className="ui-preview__section">
        <h2>Spacing</h2>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "1rem" }}>
          {[
            ["xs", "4px"],
            ["sm", "8px"],
            ["md", "12px"],
            ["lg", "16px"],
            ["xl", "24px"],
            ["2xl", "32px"],
          ].map(([name, size]) => (
            <div key={name} style={{ textAlign: "center" }}>
              <div style={{ width: size, height: size, background: "var(--pop)", borderRadius: 2 }} />
              <span style={{ fontSize: "0.6875rem", color: "var(--muted-fg)", marginTop: 4, display: "block" }}>{name}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
    </AppShell>
  );
}
