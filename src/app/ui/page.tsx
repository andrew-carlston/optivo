"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button/button";
import { Input } from "@/components/ui/input/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card/card";
import { Badge } from "@/components/ui/badge/badge";
import { Search, Mail, Plus, Trash2, Settings, Bell, Check } from "lucide-react";
import "./ui-preview.scss";

export default function UIPreviewPage() {
  const [mode, setMode] = useState<"light" | "dark">("light");
  const [inputVal, setInputVal] = useState("");

  function toggleMode() {
    const next = mode === "light" ? "dark" : "light";
    setMode(next);
    document.documentElement.setAttribute("data-mode", next);
  }

  return (
    <div className="ui-preview">
      <div className="ui-preview__header">
        <h1>Optivo UI Kit</h1>
        <Button variant="outline" size="sm" onClick={toggleMode}>
          {mode === "light" ? "🌙 Dark" : "☀️ Light"}
        </Button>
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

      {/* ── Cards ── */}
      <section className="ui-preview__section">
        <h2>Cards</h2>
        <div className="ui-preview__grid">
          <Card>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <Button variant="ghost" size="icon"><Settings size={16} /></Button>
            </CardHeader>
            <CardContent>
              <p style={{ color: "var(--muted-fg)", fontSize: "0.8125rem" }}>This is a card with a header and content area. Cards use the surface background with a border.</p>
            </CardContent>
          </Card>
          <Card>
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
  );
}
