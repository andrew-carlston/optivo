export default function CompanyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ company: string }>;
}) {
  // TODO: Resolve company slug → Neon branch connection
  // TODO: Add auth check, company context provider
  return <>{children}</>;
}
