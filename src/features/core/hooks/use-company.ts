"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface Company {
  id: string;
  name: string;
  slug: string;
  branch_id: string;
  logo_url: string | null;
  auth_methods: string[];
  force_sso: boolean;
  timezone: string;
}

/**
 * Hook to get the current company from the URL slug.
 * Fetches company config from the API (which queries main branch).
 */
export function useCompany() {
  const params = useParams();
  const slug = params?.company as string;
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    fetch(`/api/company/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Company not found");
        return res.json();
      })
      .then(setCompany)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  return { company, slug, loading, error };
}
