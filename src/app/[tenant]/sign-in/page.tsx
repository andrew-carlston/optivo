'use client'

import { Avatar, Button, FormCard, Input, ThemeSwitcher } from '@/components'
import { useSignIn } from './hooks/useSignIn'
import styles from './page.module.sass'

export default function SignInPage() {
  const signIn = useSignIn()
  const {
    tenant,
    step,
    handleBack,
    handleBackToFindDomain,
    email,
    password,
    handleEmailChange,
    handlePasswordChange,
    showPassword,
    setShowPassword,
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
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={step === 'email' ? handleBackToFindDomain : handleBack}
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={step === 'email' ? !canSubmitEmail : !canSubmitPassword}
              >
                {step === 'email' ? emailButtonText : passwordButtonText}
              </Button>
            </>
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

                <div className={styles.inputWithToggle}>
                  <Input
                    id="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={isSigningIn}
                    autoFocus
                  />
                  <button
                    type="button"
                    className={styles.toggleButton}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
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
