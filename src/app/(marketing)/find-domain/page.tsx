'use client'

import Link from 'next/link'
import { Button, FormCard, Input, ThemeSwitcher } from '@/components'
import { useFindDomain } from './hooks/useFindDomain'
import { TenantPreview } from './components'
import styles from './page.module.sass'

export default function FindDomainPage() {
  const findDomain = useFindDomain()
  const {
    slug,
    handleSlugChange,
    isSearching,
    canSearch,
    handleSearch,
    tenant,
    isFound,
    notFound,
    isRedirecting,
    error,
    buttonText,
  } = findDomain

  return (
    <div className={styles.page}>
      <div className={styles.themeSwitcherWrapper}>
        <ThemeSwitcher />
      </div>

      <section className={styles.findDomain}>
        <FormCard
          className={styles.findDomainCard}
          onSubmit={handleSearch}
          header={
            <>
              <h1 className={styles.findDomainTitle}>
                Find Your <span className={styles.accent}>Company</span>
              </h1>
              <p className={styles.findDomainSubtitle}>
                Enter your company slug to access your organization.
              </p>
            </>
          }
          footer={
            <Button
              type="submit"
              disabled={!canSearch || isRedirecting}
            >
              {buttonText}
            </Button>
          }
        >
          <div className={styles.formContent}>
            {/* Slug Input */}
            <Input
              id="company-slug"
              label="Company Slug"
              prefix="optivo.app/"
              type="text"
              value={slug}
              onChange={handleSlugChange}
              placeholder="acme-corp"
              hint="Enter your company identifier (e.g., acme-corp)"
              autoComplete="organization"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />

            {/* Tenant Preview - shown when found */}
            {isFound && tenant && (
              <TenantPreview
                name={tenant.name}
                slug={tenant.slug}
                logo={tenant.logo}
                tagline={tenant.tagline}
              />
            )}

            {/* Not Found Message */}
            {notFound && (
              <div className={styles.notFoundMessage}>
                <h3 className={styles.notFoundTitle}>Company not found</h3>
                <p className={styles.notFoundText}>
                  No company exists with the slug &quot;{slug}&quot;. Please check the spelling and try again.
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className={styles.errorMessage} role="alert">
                {error}
              </div>
            )}

            {/* Register Link */}
            <p className={styles.registerLink}>
              Don&apos;t have a company yet?{' '}
              <Link href="/register">Register your organization</Link>
            </p>
          </div>
        </FormCard>
      </section>
    </div>
  )
}
