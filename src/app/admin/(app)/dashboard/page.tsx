"use client";

import { useCurrentCompany, useCurrentUser } from "@/features/core/providers/company-provider";

export default function DashboardPage() {
  const company = useCurrentCompany();
  const user = useCurrentUser();

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome back, {user.fullName}</p>
    </div>
  );
}
