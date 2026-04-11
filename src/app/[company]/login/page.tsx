"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp, useSession } from "@/lib/auth-client";
import { useCompany } from "@/features/core/hooks/use-company";
import { Button } from "@/components/ui/button/button";
import { Input } from "@/components/ui/input/input";
import { Skeleton } from "@/components/ui/skeleton/skeleton";
import "./login.scss";

export default function LoginPage() {
  const router = useRouter();
  const { company, slug, loading: companyLoading, error: companyError } = useCompany();
  const { data: session, isPending } = useSession();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const allowGoogle = company?.auth_methods?.includes("google") ?? true;
  const allowPassword = company?.auth_methods?.includes("password") ?? true;

  // Redirect if already logged in
  useEffect(() => {
    if (session?.user && slug) {
      router.push(`/${slug}/dashboard`);
    }
  }, [session, slug, router]);

  // Force SSO redirect
  useEffect(() => {
    if (company?.force_sso && allowGoogle && !session?.user) {
      handleGoogleSSO();
    }
  }, [company?.force_sso]); // eslint-disable-line

  async function handleGoogleSSO() {
    setError("");
    setLoading(true);
    const result = await signIn.social({
      provider: "google",
      callbackURL: `/${slug}/dashboard`,
    });
    if (result.error) {
      setError(result.error.message || "Google sign-in failed");
      setLoading(false);
    }
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const result = await signUp.email({
          email,
          password,
          name,
          callbackURL: `/${slug}/dashboard`,
        });
        if (result.error) setError(result.error.message || "Sign up failed");
      } else {
        const result = await signIn.email({
          email,
          password,
          callbackURL: `/${slug}/dashboard`,
        });
        if (result.error) setError(result.error.message || "Sign in failed");
      }
    } catch {
      setError("An unexpected error occurred");
    }
    setLoading(false);
  }

  // Loading states
  if (isPending || companyLoading) {
    return (
      <div className="login">
        <div className="login__card">
          <div className="login__branding">
            <Skeleton width={200} height={28} radius="md" />
            <Skeleton width={160} height={16} radius="sm" />
          </div>
          <Skeleton width="100%" height={44} radius="full" />
          <Skeleton width="100%" height={44} radius="full" />
          <Skeleton width="100%" height={44} radius="full" />
        </div>
      </div>
    );
  }

  // Company not found
  if (companyError || !company) {
    return (
      <div className="login">
        <div className="login__card">
          <div className="login__branding">
            <h1 className="login__company-name">Company Not Found</h1>
            <p className="login__subtitle">The URL you entered doesn&apos;t match any organization.</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="login">
      <div className="login__card">
        {/* Company branding */}
        <div className="login__branding">
          {company.logo_url ? (
            <img src={company.logo_url} alt={company.name} className="login__logo" referrerPolicy="no-referrer" />
          ) : (
            <h1 className="login__company-name">{company.name}</h1>
          )}
          <p className="login__subtitle">Sign in to continue</p>
        </div>

        {error && <div className="login__error">{error}</div>}

        {/* Google SSO */}
        {allowGoogle && (
          <button className="login__google" onClick={handleGoogleSSO} disabled={loading}>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </button>
        )}

        {/* Divider */}
        {allowGoogle && allowPassword && (
          <div className="login__divider"><span>or</span></div>
        )}

        {/* Email/Password form */}
        {allowPassword && (
          <form onSubmit={handleEmailAuth} className="login__form">
            {mode === "signup" && (
              <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
            )}
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            <Button variant="primary" type="submit" disabled={loading} style={{ width: "100%" }}>
              {loading ? "..." : mode === "signup" ? "Create account" : "Sign in"}
            </Button>
          </form>
        )}

        {/* Toggle */}
        {allowPassword && (
          <p className="login__toggle">
            {mode === "signin" ? (
              <>Don&apos;t have an account? <button onClick={() => { setMode("signup"); setError(""); }}>Sign up</button></>
            ) : (
              <>Already have an account? <button onClick={() => { setMode("signin"); setError(""); }}>Sign in</button></>
            )}
          </p>
        )}

        <p className="login__powered">Powered by Optivo</p>
      </div>
    </div>
  );
}
