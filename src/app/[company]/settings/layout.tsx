import { SettingsShell } from "@/features/core/components/settings-shell/settings-shell";

export default function CompanySettingsLayout({ children }: { children: React.ReactNode }) {
  return <SettingsShell>{children}</SettingsShell>;
}
