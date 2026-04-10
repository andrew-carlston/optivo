export default async function DashboardPage({
  params,
}: {
  params: Promise<{ company: string }>;
}) {
  const { company } = await params;

  return (
    <main>
      <h1>Dashboard — {company}</h1>
    </main>
  );
}
