'use client'

import Link from 'next/link'
import { Avatar, Button, FormCard, Input, ThemeSwitcher } from '@/components'
import { useSignIn } from './hooks/useSignIn'
import styles from './page.module.sass'

export default function SignInPage() {
  const signIn = useSignIn()
  const {
    tenant,
    step,
    handleBack,
    email,
    password,
    handleEmailChange,
    handlePasswordChange,
    isCheckingEmail,
    isSigningIn,
    error,
    handleEmailSubmit,
    handlePasswordSubmit,
    userInfo,
    canSubmitEmail,
    canSubmitPassword,
    emailButtonText,
    passwordButtonText,
    userDisplayName,
  } = signIn

  const handleFormSubmit = step === 'email' ? handleEmailSubmit : handlePasswordSubmit

  return (
    <div className={styles.page}>
      <div className={styles.themeSwitcherWrapper}>
        <ThemeSwitcher />
      </div>

      <section className={styles.signIn}>
        <FormCard
          className={styles.signInCard}
          onSubmit={handleFormSubmit}
          header={
            <div className={styles.header}>
              <div className={styles.avatarWrapper}>
                <Avatar
                  src={tenant?.logo || undefined}
                  size="xl"
                  placeholder={tenant?.name?.charAt(0) || 'C'}
                />
              </div>
              <h1 className={styles.companyName}>
                {tenant?.name || 'Loading...'}
              </h1>
              {tenant?.subtext && (
                <p className={styles.tagline}>{tenant.subtext}</p>
              )}
            </div>
          }
          footer={
            <div className={styles.footer}>
              <Button
                type="submit"
                disabled={step === 'email' ? !canSubmitEmail : !canSubmitPassword}
              >
                {step === 'email' ? emailButtonText : passwordButtonText}
              </Button>
              <p className={styles.footerLink}>
                <Link href="/find-domain">Sign in to a different company</Link>
              </p>
            </div>
          }
        >
          <div className={styles.formContent}>
            {/* Email Step */}
            {step === 'email' && (
              <div className={styles.stepContainer}>
                <Input
                  id="email"
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  disabled={isCheckingEmail}
                  autoFocus
                />
              </div>
            )}

            {/* Password Step */}
            {step === 'password' && (
              <div className={styles.stepContainerEntering}>
                {/* User info display with back button */}
                <div className={styles.userInfoDisplay}>
                  <Avatar
                    src={userInfo?.avatar || undefined}
                    size="lg"
                    placeholder={userDisplayName.charAt(0).toUpperCase()}
                  />
                  <div className={styles.userDetails}>
                    <span className={styles.userName}>
                      {userDisplayName}
                    </span>
                    {userInfo?.title && (
                      <span className={styles.userTitle}>{userInfo.title}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className={styles.backButton}
                    onClick={handleBack}
                    aria-label="Change email address"
                  >
                    Change
                  </button>
                </div>

                <Input
                  id="password"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={isSigningIn}
                  autoFocus
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className={styles.errorMessage} role="alert">
                {error}
              </div>
            )}
          </div>
        </FormCard>
      </section>
    </div>
  )
}
