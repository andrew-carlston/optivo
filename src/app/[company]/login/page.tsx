"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp, useSession } from "@/lib/auth-client";
import { useCompany } from "@/features/core/hooks/use-company";
import { AuthCard, AuthCardNotFound } from "@/components/ui/auth-card/auth-card";
import "./login.scss";

export default function LoginPage() {
  const router = useRouter();
  const { company, slug, loading: companyLoading, error: companyError } = useCompany();
  const { data: session, isPending } = useSession();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (session?.user && slug) {
      setAuthenticated(true);
      router.push(`/${slug}/dashboard`);
    }
  }, [session, slug, router]);

  // Force SSO redirect
  useEffect(() => {
    if (company?.force_sso && !session?.user) {
      handleGoogleSSO();
    }
  }, [company?.force_sso]); // eslint-disable-line

  async function handleGoogleSSO() {
    setError("");
    setSubmitting(true);
    const result = await signIn.social({
      provider: "google",
      callbackURL: `/${slug}/dashboard`,
    });
    if (result.error) {
      setError(result.error.message || "Google sign-in failed");
      setSubmitting(false);
    }
  }

  async function handleEmailSignIn(email: string, password: string) {
    setError("");
    setSubmitting(true);
    const result = await signIn.email({ email, password, callbackURL: `/${slug}/dashboard` });
    if (result.error) {
      setError(result.error.message || "Sign in failed");
      setSubmitting(false);
    }
  }

  async function handleEmailSignUp(email: string, password: string, name: string) {
    setError("");
    setSubmitting(true);
    const result = await signUp.email({ email, password, name, callbackURL: `/${slug}/dashboard` });
    if (result.error) {
      setError(result.error.message || "Sign up failed");
      setSubmitting(false);
    }
  }

  // Company not found
  if (!companyLoading && !isPending && (companyError || !company)) {
    return (
      <div className="login">
        <AuthCardNotFound onGoHome={() => router.push("/")} />
      </div>
    );
  }

  // Authenticated — show card skeleton while redirecting
  if (authenticated || (session?.user && slug)) {
    return (
      <div className="login">
        <AuthCard companyName="" loading />
      </div>
    );
  }

  return (
    <div className="login">
      <AuthCard
        companyName={company?.name || ""}
        logoUrl={company?.logo_url}
        allowGoogle={company?.auth_methods?.includes("google") ?? true}
        allowPassword={company?.auth_methods?.includes("password") ?? true}
        loading={companyLoading}
        error={error}
        onGoogleSSO={handleGoogleSSO}
        onEmailSignIn={handleEmailSignIn}
        onEmailSignUp={handleEmailSignUp}
        submitting={submitting}
      />
    </div>
  );
}
