"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp, useSession } from "@/lib/auth-client";
import { AuthCard } from "@/components/ui/auth-card/auth-card";
import "./login.scss";

export default function AdminLoginPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (session?.user) {
      setAuthenticated(true);
      router.push("/admin");
    }
  }, [session, router]);

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

  // Authenticated — show card skeleton while redirecting
  if (authenticated || session?.user) {
    return (
      <div className="admin-login">
        <AuthCard companyName="" loading />
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
