"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button/button";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    window.location.href = "/admin/login";
  }

  return (
    <Button variant="outline" size="sm" onClick={handleSignOut}>
      Sign Out
    </Button>
  );
}
