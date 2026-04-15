import { SettingsShell } from "@/features/core/components/settings-shell/settings-shell";

export default function AdminPlatformLayout({ children }: { children: React.ReactNode }) {
  return <SettingsShell>{children}</SettingsShell>;
}
