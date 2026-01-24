"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { TenantInfo } from "../../layout";

type SettingsTab = "general" | "billing" | "appearance" | "rbac" | "danger";
const VALID_TABS: SettingsTab[] = ["general", "billing", "appearance", "rbac", "danger"];

interface CompanyAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface BillingInfo {
  plan: "free" | "starter" | "professional" | "enterprise";
  billingEmail: string;
  billingAddress: CompanyAddress;
  cardLast4?: string;
  cardBrand?: string;
  cardExpiry?: string;
}

interface FormErrors {
  companyName?: string;
  companySubtext?: string;
  address?: string;
  billing?: string;
  general?: string;
}

const DEFAULT_ADDRESS: CompanyAddress = {
  street: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
};

const DEFAULT_BILLING: BillingInfo = {
  plan: "free",
  billingEmail: "",
  billingAddress: { ...DEFAULT_ADDRESS },
};

export function useSettings() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSlug = params.tenant as string;

  // Get view param from URL (defaults to "general")
  const viewFromUrl = searchParams.get('view') as SettingsTab | null;
  const initialTab = viewFromUrl && VALID_TABS.includes(viewFromUrl) ? viewFromUrl : "general";

  // State
  const [activeTab, setActiveTabState] = useState<SettingsTab>(initialTab);

  // Update activeTab when URL changes (browser back/forward)
  useEffect(() => {
    const newTab = viewFromUrl && VALID_TABS.includes(viewFromUrl) ? viewFromUrl : "general";
    setActiveTabState(newTab);
  }, [viewFromUrl]);

  // Wrapper to update both state and URL
  const setActiveTab = useCallback((tab: SettingsTab) => {
    setActiveTabState(tab);
    router.push(`/${tenantSlug}/settings?view=${tab}`, { scroll: false });
  }, [router, tenantSlug]);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Company form state
  const [companyName, setCompanyName] = useState("");
  const [companySubtext, setCompanySubtext] = useState("");
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoMode, setLogoMode] = useState<'text' | 'image'>('text');
  const [companyAddress, setCompanyAddress] =
    useState<CompanyAddress>(DEFAULT_ADDRESS);

  // Billing state
  const [billing, setBilling] = useState<BillingInfo>(DEFAULT_BILLING);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Delete state
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Load tenant data from script tag
  useEffect(() => {
    const tenantDataScript = document.getElementById("tenant-data");
    if (tenantDataScript) {
      try {
        const data = JSON.parse(tenantDataScript.textContent || "{}");
        setTenant(data);
        setCompanyName(data.name || "");
        setCompanySubtext(data.subtext || "");
        setCompanyLogo(data.logo || null);
        setLogoMode(data.logoMode || 'text');
      } catch (e) {
        console.error("Failed to parse tenant data:", e);
      }
    }
    setIsLoading(false);
  }, []);

  // Logo upload handler
  const handleLogoChange = useCallback((file: File | null) => {
    setLogoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCompanyLogo(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Address change handler
  const handleAddressChange = useCallback(
    (field: keyof CompanyAddress, value: string) => {
      setCompanyAddress((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  // Billing address change handler
  const handleBillingAddressChange = useCallback(
    (field: keyof CompanyAddress, value: string) => {
      setBilling((prev) => ({
        ...prev,
        billingAddress: { ...prev.billingAddress, [field]: value },
      }));
    },
    [],
  );

  // Save company info
  const handleSaveCompanyInfo = useCallback(async () => {
    setErrors({});
    setSaveSuccess(false);

    // Validate
    if (!companyName.trim()) {
      setErrors({ companyName: "Company name is required" });
      return;
    }

    setIsSaving(true);

    try {
      // First upload logo if changed
      if (logoFile) {
        const formData = new FormData();
        formData.append("file", logoFile);
        formData.append("type", "logo");

        const uploadResponse = await fetch(`/api/${tenantSlug}/upload`, {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload logo");
        }

        const uploadData = await uploadResponse.json();
        setCompanyLogo(uploadData.url);
        setLogoFile(null);
      }

      // Update company settings
      const response = await fetch(`/api/${tenantSlug}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyName.trim(),
          subtext: companySubtext.trim() || null,
          logoMode,
          address: companyAddress,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save settings");
      }

      // Update local tenant state
      setTenant((prev) =>
        prev
          ? {
              ...prev,
              name: companyName.trim(),
              subtext: companySubtext.trim() || null,
            }
          : prev,
      );

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Save error:", error);
      setErrors({
        general:
          error instanceof Error ? error.message : "Failed to save settings",
      });
    } finally {
      setIsSaving(false);
    }
  }, [companyName, companySubtext, companyAddress, logoFile, tenantSlug]);

  // Save billing info
  const handleSaveBilling = useCallback(async () => {
    setErrors({});
    setSaveSuccess(false);
    setIsSaving(true);

    try {
      // TODO: Implement billing API
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Billing save error:", error);
      setErrors({
        billing:
          error instanceof Error ? error.message : "Failed to save billing",
      });
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Delete company
  const handleDeleteCompany = useCallback(async () => {
    if (deleteConfirmText !== tenant?.name) {
      setErrors({ general: "Please type the company name to confirm" });
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/${tenantSlug}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete company");
      }

      // Clear local storage and redirect
      localStorage.removeItem("userId");
      localStorage.removeItem("userEmail");
      router.push("/");
    } catch (error) {
      console.error("Delete error:", error);
      setErrors({
        general:
          error instanceof Error ? error.message : "Failed to delete company",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [tenantSlug, router, deleteConfirmText, tenant?.name]);

  return {
    // Navigation
    activeTab,
    setActiveTab,

    // Tenant
    tenant,
    tenantSlug,
    isLoading,

    // Company form state
    companyName,
    setCompanyName,
    companySubtext,
    setCompanySubtext,
    companyLogo,
    handleLogoChange,
    logoMode,
    setLogoMode,
    companyAddress,
    handleAddressChange,

    // Billing state
    billing,
    setBilling,
    handleBillingAddressChange,
    handleSaveBilling,

    // UI state
    isSaving,
    errors,
    saveSuccess,
    handleSaveCompanyInfo,

    // Delete
    isDeleting,
    deleteConfirmText,
    setDeleteConfirmText,
    handleDeleteCompany,
  };
}

export type UseSettingsReturn = ReturnType<typeof useSettings>;
