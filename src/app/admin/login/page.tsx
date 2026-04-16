"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp, signOut, useSession } from "@/lib/auth-client";
import { AuthCard } from "@/components/ui/auth-card/auth-card";
import { Button } from "@/components/ui/button/button";
import { Avatar } from "@/components/ui/avatar/avatar";
import "./login.scss";

export default function AdminLoginPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleGoogleSSO() {
    setError("");
    setSubmitting(true);
    const result = await signIn.social({
      provider: "google",
      callbackURL: "/admin",
    });
    if (result.error) {
      setError(result.error.message || "Google sign-in failed");
      setSubmitting(false);
    }
  }

  async function handleEmailSignIn(email: string, password: string) {
    setError("");
    setSubmitting(true);
    const result = await signIn.email({ email, password, callbackURL: "/admin" });
    if (result.error) {
      setError(result.error.message || "Sign in failed");
      setSubmitting(false);
    }
  }

  async function handleEmailSignUp(email: string, password: string, name: string) {
    setError("");
    setSubmitting(true);
    const result = await signUp.email({ email, password, name, callbackURL: "/admin" });
    if (result.error) {
      setError(result.error.message || "Sign up failed");
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    // Hard reload to clear client auth state
    window.location.href = "/admin/login";
  }

  if (isPending) {
    return (
      <div className="admin-login">
        <AuthCard companyName="" loading />
      </div>
    );
  }

  // Already signed in — offer to continue or switch accounts
  if (session?.user) {
    return (
      <div className="admin-login">
        <div className="admin-login__signed-in">
          <Avatar src={session.user.image ?? null} fallback={session.user.name ?? session.user.email} size="lg" />
          <h2>Already signed in</h2>
          <p>{session.user.email}</p>
          <div className="admin-login__actions">
            <Button variant="primary" onClick={() => router.push("/admin")}>Continue to Admin</Button>
            <Button variant="outline" onClick={handleSignOut}>Sign out</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-login">
      <AuthCard
        companyName="Optivo"
        subtitle="Platform admin sign in"
        allowGoogle
        allowPassword
        allowSignup={false}
        loading={isPending}
        error={error}
        onGoogleSSO={handleGoogleSSO}
        onEmailSignIn={handleEmailSignIn}
        onEmailSignUp={handleEmailSignUp}
        submitting={submitting}
        footer="Optivo Platform"
      />
    </div>
  );
}
