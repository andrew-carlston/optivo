"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Avatar, Badge, Button, Card, Container, Dropdown, FormCard, Input } from "@/components";
import { useSettings } from "./hooks/useSettings";
import { useAppearanceSettings } from "./appearance/hooks/useAppearanceSettings";
import { useRbacRoles, useRolePermissions, useRbacGroups, useRbacTags } from "./rbac/hooks";
import {
  RoleCardGrid,
  RoleDetailPanel,
  CreateRoleModal,
  ManageTagsGroupsModal,
} from "./rbac/components";
import {
  SHAPE_OPTIONS,
  FILL_OPTIONS,
  BADGE_COLORS,
  BADGE_TYPE_LABELS,
  SAMPLE_BADGE_TEXT,
} from "./appearance/constants";
import type { BadgeConfig } from "@/types/appearance";
import type { Role } from "@/types/rbac";
import styles from "./page.module.sass";

const SIDEBAR_TABS = [
  { id: "general", label: "General" },
  { id: "billing", label: "Billing" },
  { id: "appearance", label: "Appearance" },
  { id: "rbac", label: "RBAC" },
  { id: "danger", label: "Danger Zone" },
] as const;

const GENERAL_SUB_TABS = [
  { id: "profile", label: "Company Profile" },
  { id: "address", label: "Company Address" },
] as const;

const BILLING_SUB_TABS = [
  { id: "plan", label: "Current Plan" },
  { id: "payment", label: "Payment Method" },
  { id: "billingAddress", label: "Billing Address" },
  { id: "history", label: "Payment History" },
] as const;

export default function SettingsPage() {
  const settings = useSettings();
  const appearanceSettings = useAppearanceSettings();
  const {
    activeTab,
    setActiveTab,
    tenant,
    isLoading,
    companyName,
    setCompanyName,
    companySubtext,
    setCompanySubtext,
    companyLogo,
    handleLogoChange,
    companyAddress,
    handleAddressChange,
    billing,
    handleBillingAddressChange,
    handleSaveBilling,
    isSaving,
    errors,
    saveSuccess,
    handleSaveCompanyInfo,
    deleteConfirmText,
    setDeleteConfirmText,
    isDeleting,
    handleDeleteCompany,
  } = settings;

  const [generalSubTab, setGeneralSubTab] = useState<"profile" | "address">(
    "profile",
  );
  const [billingSubTab, setBillingSubTab] = useState<
    "plan" | "payment" | "billingAddress" | "history"
  >("plan");

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingSkeleton}>
          <div className={styles.skeletonContainer}>
            {/* Skeleton Sidebar */}
            <aside className={styles.skeletonSidebar}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className={styles.skeletonNavItem} />
              ))}
            </aside>

            {/* Skeleton Content */}
            <div className={styles.skeletonContent}>
              <div className={styles.skeletonCard}>
                <div className={styles.skeletonTitle} />
                <div className={styles.skeletonDescription} />
                <div className={styles.skeletonInputRow}>
                  <div style={{ flex: 1 }}>
                    <div className={styles.skeletonInputLabel} />
                    <div className={styles.skeletonInput} />
                  </div>
                </div>
                <div className={styles.skeletonInputRow}>
                  <div style={{ flex: 1 }}>
                    <div className={styles.skeletonInputLabel} />
                    <div className={styles.skeletonInput} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className={styles.skeletonInputLabel} />
                    <div className={styles.skeletonInput} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                  <div className={styles.skeletonButton} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Container className={styles.container}>
          <aside className={styles.sidebar}>
            <nav className={styles.sidebarNav}>
              {SIDEBAR_TABS.map((tab) => (
                <Button
                  key={tab.id}
                  type="button"
                  variant="ghost"
                  active={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </Button>
              ))}
            </nav>
          </aside>

          <div key={activeTab} className={styles.content}>
            {activeTab === "general" && (
              <>
                <div className={styles.subTabs}>
                  {GENERAL_SUB_TABS.map((tab) => (
                    <Button
                      key={tab.id}
                      type="button"
                      variant="ghost"
                      active={generalSubTab === tab.id}
                      onClick={() => setGeneralSubTab(tab.id)}
                    >
                      {tab.label}
                    </Button>
                  ))}
                </div>
                <div key={generalSubTab} className={styles.viewContainer}>
                  {generalSubTab === "profile" && (
                    <CompanyProfileView
                      companyName={companyName}
                      companySubtext={companySubtext}
                      companyLogo={companyLogo}
                      onNameChange={setCompanyName}
                      onSubtextChange={setCompanySubtext}
                      onLogoChange={handleLogoChange}
                      onSave={handleSaveCompanyInfo}
                      isSaving={isSaving}
                      errors={errors}
                      saveSuccess={saveSuccess}
                    />
                  )}
                  {generalSubTab === "address" && (
                    <CompanyAddressView
                      companyAddress={companyAddress}
                      onAddressChange={handleAddressChange}
                      onSave={handleSaveCompanyInfo}
                      isSaving={isSaving}
                      errors={errors}
                      saveSuccess={saveSuccess}
                    />
                  )}
                </div>
              </>
            )}

            {activeTab === "billing" && (
              <>
                <div className={styles.subTabs}>
                  {BILLING_SUB_TABS.map((tab) => (
                    <Button
                      key={tab.id}
                      type="button"
                      variant="ghost"
                      active={billingSubTab === tab.id}
                      onClick={() => setBillingSubTab(tab.id)}
                    >
                      {tab.label}
                    </Button>
                  ))}
                </div>
                <div key={billingSubTab} className={styles.viewContainer}>
                  {billingSubTab === "plan" && (
                    <CurrentPlanView billing={billing} />
                  )}
                  {billingSubTab === "payment" && (
                    <PaymentMethodView billing={billing} />
                  )}
                  {billingSubTab === "billingAddress" && (
                    <BillingAddressView
                      billing={billing}
                      onBillingAddressChange={handleBillingAddressChange}
                      onSave={handleSaveBilling}
                      isSaving={isSaving}
                      errors={errors}
                      saveSuccess={saveSuccess}
                    />
                  )}
                  {billingSubTab === "history" && <PaymentHistoryView />}
                </div>
              </>
            )}

            {activeTab === "appearance" && (
              <AppearanceView appearanceSettings={appearanceSettings} />
            )}
            {activeTab === "rbac" && <RbacView />}
            {activeTab === "danger" && (
              <DangerZoneView
                companyName={tenant?.name || ""}
                deleteConfirmText={deleteConfirmText}
                onDeleteConfirmTextChange={setDeleteConfirmText}
                onDelete={handleDeleteCompany}
                isDeleting={isDeleting}
                errors={errors}
              />
            )}
          </div>
        </Container>
      </main>
    </div>
  );
}

// =============================================================================
// Types
// =============================================================================

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

// =============================================================================
// General Tab Views
// =============================================================================

interface CompanyProfileViewProps {
  companyName: string;
  companySubtext: string;
  companyLogo: string | null;
  onNameChange: (value: string) => void;
  onSubtextChange: (value: string) => void;
  onLogoChange: (file: File | null) => void;
  onSave: () => void;
  isSaving: boolean;
  errors: { companyName?: string; companySubtext?: string; general?: string };
  saveSuccess: boolean;
}

function CompanyProfileView({
  companyName,
  companySubtext,
  companyLogo,
  onNameChange,
  onSubtextChange,
  onLogoChange,
  onSave,
  isSaving,
  errors,
  saveSuccess,
}: CompanyProfileViewProps) {
  return (
    <FormCard
      header={
        <>
          <h2>Company Profile</h2>
          <p>Update your company&apos;s branding and identity.</p>
        </>
      }
      footer={
        <>
          {saveSuccess && (
            <span className={styles.successMessage}>Settings saved</span>
          )}
          {errors.general && (
            <span className={styles.errorMessage}>{errors.general}</span>
          )}
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </>
      }
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <div className={styles.profileLayout}>
        <div className={styles.logoSection}>
          <label className={styles.configLabel}>Company Logo</label>
          <Avatar
            src={companyLogo || undefined}
            size="xxl"
            editable
            onChange={onLogoChange}
            placeholder="Upload Logo"
          />
        </div>
        <div className={styles.fieldsColumn}>
          <Input
            id="companyName"
            label="Company Name"
            value={companyName}
            onChange={(e) => onNameChange(e.target.value)}
            error={errors.companyName}
            placeholder="Enter company name"
          />
          <Input
            id="companySubtext"
            label="Tagline"
            value={companySubtext}
            onChange={(e) => onSubtextChange(e.target.value)}
            error={errors.companySubtext}
            placeholder="A short description"
            hint="Appears below your company name"
          />
        </div>
      </div>
    </FormCard>
  );
}

interface CompanyAddressViewProps {
  companyAddress: CompanyAddress;
  onAddressChange: (field: keyof CompanyAddress, value: string) => void;
  onSave: () => void;
  isSaving: boolean;
  errors: { address?: string; general?: string };
  saveSuccess: boolean;
}

function CompanyAddressView({
  companyAddress,
  onAddressChange,
  onSave,
  isSaving,
  errors,
  saveSuccess,
}: CompanyAddressViewProps) {
  return (
    <FormCard
      header={
        <>
          <h2>Company Address</h2>
          <p>Physical address for official correspondence.</p>
        </>
      }
      footer={
        <>
          {saveSuccess && (
            <span className={styles.successMessage}>Address saved</span>
          )}
          {errors.general && (
            <span className={styles.errorMessage}>{errors.general}</span>
          )}
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Address"}
          </Button>
        </>
      }
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <div className={styles.addressForm}>
        <Input
          id="street"
          label="Street Address"
          value={companyAddress.street}
          onChange={(e) => onAddressChange("street", e.target.value)}
          placeholder="123 Main Street"
        />
        <div className={styles.twoColumnGrid}>
          <Input
            id="city"
            label="City"
            value={companyAddress.city}
            onChange={(e) => onAddressChange("city", e.target.value)}
            placeholder="San Francisco"
          />
          <Input
            id="state"
            label="State / Province"
            value={companyAddress.state}
            onChange={(e) => onAddressChange("state", e.target.value)}
            placeholder="California"
          />
        </div>
        <div className={styles.twoColumnGrid}>
          <Input
            id="postalCode"
            label="Postal Code"
            value={companyAddress.postalCode}
            onChange={(e) => onAddressChange("postalCode", e.target.value)}
            placeholder="94102"
          />
          <Input
            id="country"
            label="Country"
            value={companyAddress.country}
            onChange={(e) => onAddressChange("country", e.target.value)}
            placeholder="United States"
          />
        </div>
      </div>
    </FormCard>
  );
}

// =============================================================================
// Billing Tab Views
// =============================================================================

const PLAN_INFO: Record<
  BillingInfo["plan"],
  { label: string; description: string; features: string[] }
> = {
  free: {
    label: "Free",
    description: "Basic features for small teams getting started.",
    features: [
      "Up to 5 team members",
      "Basic project management",
      "1GB storage",
    ],
  },
  starter: {
    label: "Starter",
    description: "Essential features for growing teams.",
    features: [
      "Up to 15 team members",
      "Advanced projects",
      "10GB storage",
      "Priority support",
    ],
  },
  professional: {
    label: "Professional",
    description: "Advanced features for scaling businesses.",
    features: [
      "Unlimited members",
      "Custom workflows",
      "100GB storage",
      "24/7 support",
      "API access",
    ],
  },
  enterprise: {
    label: "Enterprise",
    description: "Custom solutions for large organizations.",
    features: [
      "Everything in Pro",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantee",
    ],
  },
};

function CurrentPlanView({ billing }: { billing: BillingInfo }) {
  const plan = PLAN_INFO[billing.plan];
  return (
    <Card>
      <div className={styles.planHeader}>
        <div className={styles.planInfo}>
          <h2>Current Plan</h2>
          <span className={styles.planBadge}>{plan.label}</span>
        </div>
        <Button type="button">Upgrade Plan</Button>
      </div>
      <p className={styles.planDescription}>{plan.description}</p>
      <ul className={styles.featureList}>
        {plan.features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
    </Card>
  );
}

function PaymentMethodView({ billing }: { billing: BillingInfo }) {
  return (
    <Card>
      <h2>Payment Method</h2>
      {billing.cardLast4 ? (
        <div className={styles.paymentMethod}>
          <div className={styles.cardIcon}>
            {billing.cardBrand?.toUpperCase()}
          </div>
          <div className={styles.cardDetails}>
            <span>•••• •••• •••• {billing.cardLast4}</span>
            <span className={styles.cardExpiry}>
              Expires {billing.cardExpiry}
            </span>
          </div>
          <Button type="button" variant="ghost">
            Update
          </Button>
        </div>
      ) : (
        <div className={styles.noPayment}>
          <p>No payment method on file.</p>
          <Button type="button">Add Payment Method</Button>
        </div>
      )}
    </Card>
  );
}

interface BillingAddressViewProps {
  billing: BillingInfo;
  onBillingAddressChange: (field: keyof CompanyAddress, value: string) => void;
  onSave: () => void;
  isSaving: boolean;
  errors: { billing?: string; general?: string };
  saveSuccess: boolean;
}

function BillingAddressView({
  billing,
  onBillingAddressChange,
  onSave,
  isSaving,
  errors,
  saveSuccess,
}: BillingAddressViewProps) {
  return (
    <FormCard
      header={
        <>
          <h2>Billing Address</h2>
          <p>Address for invoices and billing.</p>
        </>
      }
      footer={
        <>
          {saveSuccess && (
            <span className={styles.successMessage}>Billing address saved</span>
          )}
          {errors.billing && (
            <span className={styles.errorMessage}>{errors.billing}</span>
          )}
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Address"}
          </Button>
        </>
      }
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <div className={styles.addressForm}>
        <Input
          id="billingStreet"
          label="Street Address"
          value={billing.billingAddress.street}
          onChange={(e) => onBillingAddressChange("street", e.target.value)}
          placeholder="123 Main Street"
        />
        <div className={styles.twoColumnGrid}>
          <Input
            id="billingCity"
            label="City"
            value={billing.billingAddress.city}
            onChange={(e) => onBillingAddressChange("city", e.target.value)}
            placeholder="San Francisco"
          />
          <Input
            id="billingState"
            label="State / Province"
            value={billing.billingAddress.state}
            onChange={(e) => onBillingAddressChange("state", e.target.value)}
            placeholder="California"
          />
        </div>
        <div className={styles.twoColumnGrid}>
          <Input
            id="billingPostalCode"
            label="Postal Code"
            value={billing.billingAddress.postalCode}
            onChange={(e) =>
              onBillingAddressChange("postalCode", e.target.value)
            }
            placeholder="94102"
          />
          <Input
            id="billingCountry"
            label="Country"
            value={billing.billingAddress.country}
            onChange={(e) => onBillingAddressChange("country", e.target.value)}
            placeholder="United States"
          />
        </div>
      </div>
    </FormCard>
  );
}

function PaymentHistoryView() {
  return (
    <Card>
      <h2>Payment History</h2>
      <p className={styles.comingSoonText}>Payment history coming soon.</p>
    </Card>
  );
}

// =============================================================================
// Danger Zone View
// =============================================================================

interface DangerZoneViewProps {
  companyName: string;
  deleteConfirmText: string;
  onDeleteConfirmTextChange: (value: string) => void;
  onDelete: () => void;
  isDeleting: boolean;
  errors: { general?: string };
}

function DangerZoneView({
  companyName,
  deleteConfirmText,
  onDeleteConfirmTextChange,
  onDelete,
  isDeleting,
  errors,
}: DangerZoneViewProps) {
  const isDeleteEnabled =
    deleteConfirmText === companyName && companyName.length > 0;

  return (
    <Card className={styles.dangerCard}>
      <h2 className={styles.dangerTitle}>Delete Company</h2>
      <p>
        This action is <strong>permanent</strong> and{" "}
        <strong>cannot be undone</strong>. Deleting your company will
        immediately remove:
      </p>
      <ul className={styles.dangerList}>
        <li>All projects, tasks, and associated data</li>
        <li>All team members and their access</li>
        <li>All uploaded files and documents</li>
        <li>All settings and configurations</li>
        <li>All billing history and subscription data</li>
      </ul>
      <div className={styles.deleteConfirm}>
        <p>
          To confirm, type <strong>{companyName}</strong> below:
        </p>
        <Input
          id="deleteConfirmText"
          label="Company Name"
          value={deleteConfirmText}
          onChange={(e) => onDeleteConfirmTextChange(e.target.value)}
          placeholder="Type company name to confirm"
          autoComplete="off"
        />
        {errors.general && (
          <span className={styles.errorMessage}>{errors.general}</span>
        )}
        <Button
          type="button"
          className={styles.dangerButton}
          onClick={onDelete}
          disabled={!isDeleteEnabled || isDeleting}
        >
          {isDeleting ? "Deleting..." : "Permanently Delete Company"}
        </Button>
      </div>
    </Card>
  );
}

// =============================================================================
// Appearance View
// =============================================================================

interface AppearanceViewProps {
  appearanceSettings: ReturnType<typeof useAppearanceSettings>;
}

function AppearanceView({ appearanceSettings }: AppearanceViewProps) {
  const {
    isLoading,
    isSaving,
    errors,
    saveSuccess,
    hasChanges,
    badgeConfigs,
    updateShape,
    updateFill,
    updateLeafSide,
    updateCornerPosition,
    updateColorEnabled,
    handleSave,
    handleResetToDefaults,
    handleDiscardChanges,
  } = appearanceSettings;

  const [activeType, setActiveType] = useState<string>('status');

  if (isLoading) {
    return (
      <Card>
        <div className={styles.appearanceSkeleton}>
          {/* Skeleton tabs */}
          <div className={styles.skeletonTabRow}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className={styles.skeletonTab} />
            ))}
          </div>

          {/* Skeleton two-column layout */}
          <div className={styles.skeletonTwoColumn}>
            <div className={styles.skeletonSettingsColumn}>
              <div className={styles.skeletonTitle} />
              <div className={styles.skeletonDescription} />
              <div style={{ marginTop: '16px' }}>
                <div className={styles.skeletonInputLabel} />
                <div className={styles.skeletonInput} />
              </div>
              <div style={{ marginTop: '16px' }}>
                <div className={styles.skeletonInputLabel} />
                <div className={styles.skeletonInput} />
              </div>
            </div>
            <div className={styles.skeletonPreviewColumn} />
          </div>
        </div>
      </Card>
    );
  }

  const badgeTypes = Object.keys(badgeConfigs);
  const config = badgeConfigs[activeType];
  const typeInfo = BADGE_TYPE_LABELS[activeType];
  const sampleText = SAMPLE_BADGE_TEXT[activeType] || SAMPLE_BADGE_TEXT.status;
  const showLeafSide = config?.shape === 'leaf';
  const showCornerPosition = config?.shape === 'corner';

  return (
    <div className={styles.appearanceContainer}>
      <Card>
        {/* Tab buttons at top */}
        <div className={styles.badgeTypeTabs}>
          {badgeTypes.map((type) => (
            <Button
              key={type}
              type="button"
              variant="ghost"
              active={activeType === type}
              onClick={() => setActiveType(type)}
            >
              {BADGE_TYPE_LABELS[type]?.title?.replace(' Badges', '') || type}
            </Button>
          ))}
        </div>

        {/* Two-column layout: Settings on left, Preview on right */}
        <div className={styles.appearanceLayout}>
          {/* Left side: Settings */}
          <div className={styles.settingsColumn}>
            <div className={styles.appearanceSection}>
              <h3>{typeInfo?.title || `${activeType.charAt(0).toUpperCase() + activeType.slice(1)} Configuration`}</h3>
              <p className={styles.sectionDescription}>
                {typeInfo?.description || 'Configure the appearance of these badges.'}
              </p>
            </div>

            {/* Configuration options */}
            <div className={styles.configGrid}>
              {/* Row 1: Fill Style (left) | Shape (right) */}
              <div className={styles.configField}>
                <label id={`${activeType}-fill-label`} className={styles.configLabel}>
                  Fill Style
                </label>
                <Dropdown
                  options={[...FILL_OPTIONS]}
                  value={config.fill}
                  onChange={(value) => updateFill(activeType, value as BadgeConfig["fill"])}
                  placeholder="Select fill"
                  searchable={false}
                  aria-labelledby={`${activeType}-fill-label`}
                />
              </div>

              <div className={styles.configField}>
                <label id={`${activeType}-shape-label`} className={styles.configLabel}>
                  Shape
                </label>
                <Dropdown
                  options={[...SHAPE_OPTIONS]}
                  value={config.shape}
                  onChange={(value) => updateShape(activeType, value as BadgeConfig["shape"])}
                  placeholder="Select shape"
                  searchable={false}
                  aria-labelledby={`${activeType}-shape-label`}
                />
              </div>

              {/* Row 2: Color (left) | Leaf Side or Corner Position (right) */}
              <div className={styles.configField}>
                <label className={styles.configLabel}>Color</label>
                <div className={styles.toggleButtons}>
                  <Button
                    type="button"
                    className={config.colorEnabled !== false ? styles.toggleActive : styles.toggleInactive}
                    onClick={() => updateColorEnabled(activeType, true)}
                  >
                    Enabled
                  </Button>
                  <Button
                    type="button"
                    className={config.colorEnabled === false ? styles.toggleActive : styles.toggleInactive}
                    onClick={() => updateColorEnabled(activeType, false)}
                  >
                    Disabled
                  </Button>
                </div>
              </div>

              {/* Leaf Side - Toggle buttons (right side, row 2) */}
              {showLeafSide && (
                <div className={styles.configField}>
                  <label className={styles.configLabel}>Leaf Side</label>
                  <div className={styles.toggleButtons}>
                    <Button
                      type="button"
                      className={config.leafSide === 'left' ? styles.toggleActive : styles.toggleInactive}
                      onClick={() => updateLeafSide(activeType, 'left')}
                    >
                      Left
                    </Button>
                    <Button
                      type="button"
                      className={config.leafSide === 'right' ? styles.toggleActive : styles.toggleInactive}
                      onClick={() => updateLeafSide(activeType, 'right')}
                    >
                      Right
                    </Button>
                  </div>
                </div>
              )}

              {/* Corner Position - 2x2 grid of toggle buttons (right side, row 2) */}
              {showCornerPosition && (
                <div className={styles.configField}>
                  <label className={styles.configLabel}>Corner Position</label>
                  <div className={styles.cornerGrid}>
                    <Button
                      type="button"
                      className={config.cornerPosition === 'top-left' ? styles.toggleActive : styles.toggleInactive}
                      onClick={() => updateCornerPosition(activeType, 'top-left')}
                    >
                      Top-Left
                    </Button>
                    <Button
                      type="button"
                      className={config.cornerPosition === 'top-right' ? styles.toggleActive : styles.toggleInactive}
                      onClick={() => updateCornerPosition(activeType, 'top-right')}
                    >
                      Top-Right
                    </Button>
                    <Button
                      type="button"
                      className={config.cornerPosition === 'bottom-left' ? styles.toggleActive : styles.toggleInactive}
                      onClick={() => updateCornerPosition(activeType, 'bottom-left')}
                    >
                      Bottom-Left
                    </Button>
                    <Button
                      type="button"
                      className={config.cornerPosition === 'bottom-right' ? styles.toggleActive : styles.toggleInactive}
                      onClick={() => updateCornerPosition(activeType, 'bottom-right')}
                    >
                      Bottom-Right
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right side: Preview */}
          <div className={styles.previewColumn}>
            <h4 className={styles.previewTitle}>Preview</h4>
            <div className={styles.badgeGrid}>
              {BADGE_COLORS.map((color) => (
                <Badge
                  key={color}
                  variant={config.shape}
                  fill={config.fill}
                  color={config.colorEnabled !== false ? color : 'default'}
                  leafSide={config.leafSide}
                  cornerPosition={config.cornerPosition}
                >
                  {sampleText[color] || color}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={styles.appearanceFooter}>
          <div className={styles.footerLeft}>
            <Button
              type="button"
              variant="ghost"
              onClick={handleResetToDefaults}
              disabled={isSaving}
            >
              Reset to Defaults
            </Button>
            {hasChanges && (
              <>
                <span className={styles.unsavedIndicator}>Unsaved changes</span>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleDiscardChanges}
                  disabled={isSaving}
                >
                  Discard
                </Button>
              </>
            )}
          </div>
          <div className={styles.footerRight}>
            {saveSuccess && (
              <span className={styles.successMessage}>Settings saved</span>
            )}
            {errors.general && (
              <span className={styles.errorMessage}>{errors.general}</span>
            )}
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// =============================================================================
// RBAC View
// =============================================================================

function RbacView() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tenantSlug = params.tenant as string;

  // Get URL params for state restoration
  const roleIdFromUrl = searchParams.get('role');
  const tabFromUrl = searchParams.get('tab') as 'pages' | 'tables' | null;

  const rbacRoles = useRbacRoles();
  const rbacGroups = useRbacGroups();
  const rbacTags = useRbacTags();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [activePermissionTab, setActivePermissionTab] = useState<'pages' | 'tables'>(tabFromUrl || 'pages');
  const [isManageTagsGroupsModalOpen, setIsManageTagsGroupsModalOpen] = useState(false);

  const rolePermissions = useRolePermissions(selectedRole?.id || null);

  // Sync selected role with URL (handles both browser back/forward and initial load)
  useEffect(() => {
    if (rbacRoles.roles.length === 0) return; // Wait for roles to load

    if (roleIdFromUrl) {
      // URL has role ID - select that role if not already selected
      const roleFromUrl = rbacRoles.roles.find(r => r.id === roleIdFromUrl);
      if (roleFromUrl && selectedRole?.id !== roleIdFromUrl) {
        setSelectedRole(roleFromUrl);
      }
    } else {
      // URL has no role ID - clear selection (browser back was pressed)
      if (selectedRole) {
        setSelectedRole(null);
        setActivePermissionTab('pages');
      }
    }
  }, [roleIdFromUrl, rbacRoles.roles]); // Don't include selectedRole to avoid loops

  // Sync active permission tab from URL
  useEffect(() => {
    if (tabFromUrl && (tabFromUrl === 'pages' || tabFromUrl === 'tables')) {
      setActivePermissionTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // Update URL when permission tab changes
  const handlePermissionTabChange = useCallback((tab: 'pages' | 'tables') => {
    setActivePermissionTab(tab);
    if (selectedRole) {
      router.push(`/${params.tenant}/settings?view=rbac&role=${selectedRole.id}&tab=${tab}`, { scroll: false });
    }
  }, [router, params.tenant, selectedRole]);

  const {
    roles,
    isLoading,
    errors,
    saveSuccess,
    isCreateModalOpen,
    openCreateModal,
    closeCreateModal,
  } = rbacRoles;

  const { groups, createGroup, updateGroup, deleteGroup, isSaving: isGroupSaving } = rbacGroups;
  const { tags, activeTags, createTag, updateTag, deleteTag, isSaving: isTagSaving } = rbacTags;

  // Handle creating a new tag inline
  const handleCreateTag = async (displayName: string) => {
    const name = displayName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return await createTag({ name, displayName });
  };

  // Handle role card click - open detail panel with URL update
  const handleRoleClick = useCallback((role: Role) => {
    setSelectedRole(role);
    router.push(`/${params.tenant}/settings?view=rbac&role=${role.id}&tab=${activePermissionTab}`, { scroll: false });
  }, [router, params.tenant, activePermissionTab]);

  // Handle back from detail panel with URL update
  const handleBackToGrid = useCallback(() => {
    setSelectedRole(null);
    setActivePermissionTab('pages'); // Reset tab when going back
    router.push(`/${params.tenant}/settings?view=rbac`, { scroll: false });
  }, [router, params.tenant]);

  // Handle save from detail panel - call API directly to avoid React state timing issues
  const handleSaveRoleFromPanel = async (updatedRole: import("@/types/rbac").RoleWithPermissions) => {
    console.log('[RbacView] Saving role:', { id: updatedRole.id, displayName: updatedRole.displayName, tenantSlug })

    // Validate role ID before making API call
    if (!updatedRole.id) {
      console.error('[RbacView] Error: Role ID is missing!', updatedRole)
      throw new Error('Role ID is missing - cannot save')
    }

    // Save role details directly via API
    const roleResponse = await fetch(`/api/${tenantSlug}/rbac/${updatedRole.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: updatedRole.displayName,
        description: updatedRole.description || null,
        color: updatedRole.color,
        icon: updatedRole.icon,
        parentRoleId: updatedRole.parentRoleId,
        groupId: updatedRole.groupId || null,
      }),
    });

    if (!roleResponse.ok) {
      const result = await roleResponse.json();
      throw new Error(result.error || 'Failed to save role');
    }

    // Save permissions
    const permResponse = await fetch(`/api/${tenantSlug}/rbac/${updatedRole.id}/permissions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pagePermissions: updatedRole.permissions.pagePermissions,
        tablePermissions: updatedRole.permissions.tablePermissions,
        dataScope: updatedRole.permissions.dataScope,
        tagPermissions: {
          ...updatedRole.permissions.tagPermissions,
          visibleTags: updatedRole.permissions.tags || [], // Save assigned tags here
        },
        labelPermissions: updatedRole.permissions.labelPermissions,
        cascadeToChildren: updatedRole.permissions.cascadeToChildren,
        inheritFromParent: updatedRole.permissions.inheritFromParent,
      }),
    });

    if (!permResponse.ok) {
      const result = await permResponse.json();
      throw new Error(result.error || 'Failed to save permissions');
    }

    // Refresh the roles list only - don't call loadRole() here
    // The role selection will trigger a fresh load when the user navigates back
    // Calling loadRole() after save can corrupt parent role data due to stale state
    rbacRoles.loadRoles();
  };

  // Handle create role from modal - call API directly to avoid React state timing issues
  const handleCreateRoleSubmit = async (data: import("@/types/rbac").CreateRoleRequest) => {
    const response = await fetch(`/api/${tenantSlug}/rbac`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to create role');
    }

    // Refresh roles list and close modal
    rbacRoles.loadRoles();
    rbacRoles.closeCreateModal();
  };

  // Handlers for ManageTagsGroupsModal
  const handleCreateGroupFromModal = async (data: import("@/types/rbac").CreateGroupRequest) => {
    await createGroup(data);
  };

  const handleUpdateGroupFromModal = async (groupId: string, data: import("@/types/rbac").UpdateGroupRequest) => {
    await updateGroup(groupId, data);
  };

  const handleDeleteGroupFromModal = async (groupId: string) => {
    await deleteGroup(groupId);
  };

  const handleCreateTagFromModal = async (data: import("@/types/rbac").CreateTagRequest) => {
    await createTag(data);
  };

  const handleUpdateTagFromModal = async (tagId: string, data: import("@/types/rbac").UpdateTagRequest) => {
    await updateTag(tagId, data);
  };

  const handleDeleteTagFromModal = async (tagId: string) => {
    await deleteTag(tagId);
  };

  // Build RoleWithPermissions for detail panel
  const roleWithPermissions = selectedRole && rolePermissions.role ? {
    ...rolePermissions.role,
    permissions: rolePermissions.permissions || {
      id: '',
      roleId: selectedRole.id,
      pagePermissions: rolePermissions.pagePermissions,
      tablePermissions: rolePermissions.tablePermissions,
      dataScope: rolePermissions.dataScope,
      tagPermissions: rolePermissions.tagPermissions,
      labelPermissions: rolePermissions.labelPermissions,
      // Extract tags from tagPermissions.visibleTags for the UI
      tags: rolePermissions.tagPermissions?.visibleTags || [],
      cascadeToChildren: rolePermissions.cascadeToChildren,
      inheritFromParent: rolePermissions.inheritFromParent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  } : null;

  // Show detail panel if a role is selected (or loading)
  if (selectedRole) {
    // Show skeleton while loading, or actual panel when data is ready
    if (rolePermissions.isLoading || !roleWithPermissions) {
      return (
        <RoleDetailPanel
          role={{
            ...selectedRole,
            permissions: {
              id: '',
              roleId: selectedRole.id,
              pagePermissions: {},
              tablePermissions: {},
              dataScope: { scopeType: 'all', includeIndirectReports: false, includeCrossDepartment: false, excludeTerminated: true },
              cascadeToChildren: true,
              inheritFromParent: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          }}
          allRoles={roles}
          allGroups={groups}
          availableTags={activeTags}
          onBack={handleBackToGrid}
          onSave={handleSaveRoleFromPanel}
          onCreateTag={handleCreateTag}
          isLoading={true}
          isSaving={false}
          initialTab={activePermissionTab}
          onTabChange={handlePermissionTabChange}
        />
      );
    }

    return (
      <RoleDetailPanel
        role={roleWithPermissions}
        allRoles={roles}
        allGroups={groups}
        availableTags={activeTags}
        onBack={handleBackToGrid}
        onSave={handleSaveRoleFromPanel}
        onCreateTag={handleCreateTag}
        isLoading={false}
        isSaving={rolePermissions.isSaving}
        parentRole={rolePermissions.parentRole ?? undefined}
        parentPermissions={rolePermissions.parentPermissions ?? undefined}
        initialTab={activePermissionTab}
        onTabChange={handlePermissionTabChange}
      />
    );
  }

  // Show role cards grid
  return (
    <>
      <RoleCardGrid
        roles={roles}
        groups={groups}
        onRoleClick={handleRoleClick}
        onCreateRole={openCreateModal}
        onManageTagsGroups={() => setIsManageTagsGroupsModalOpen(true)}
        isLoading={isLoading || (selectedRole !== null && rolePermissions.isLoading)}
      />
      <CreateRoleModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSubmit={handleCreateRoleSubmit}
        existingRoles={roles}
        existingGroups={groups}
        existingTags={activeTags}
        onCreateTag={handleCreateTag}
      />
      <ManageTagsGroupsModal
        isOpen={isManageTagsGroupsModalOpen}
        onClose={() => setIsManageTagsGroupsModalOpen(false)}
        groups={groups}
        onCreateGroup={handleCreateGroupFromModal}
        onUpdateGroup={handleUpdateGroupFromModal}
        onDeleteGroup={handleDeleteGroupFromModal}
        isGroupSaving={isGroupSaving}
        tags={tags}
        onCreateTag={handleCreateTagFromModal}
        onUpdateTag={handleUpdateTagFromModal}
        onDeleteTag={handleDeleteTagFromModal}
        isTagSaving={isTagSaving}
      />
      {errors.general && (
        <div className={styles.errorMessage}>{errors.general}</div>
      )}
      {saveSuccess && (
        <div className={styles.successMessage}>Role created successfully</div>
      )}
    </>
  );
}

// =============================================================================
// Coming Soon View
// =============================================================================

function ComingSoonView({ title }: { title: string }) {
  return (
    <Card>
      <div className={styles.comingSoon}>
        <h2>{title}</h2>
        <p>This feature is coming soon.</p>
      </div>
    </Card>
  );
}
