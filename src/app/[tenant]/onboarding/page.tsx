'use client'

import { Button, FormCard, ThemeSwitcher } from '@/components'
import { useOnboarding } from './hooks/useOnboarding'
import {
  StepIndicator,
  WelcomeStep,
  PersonalStep,
  AddressStep,
  CompleteStep,
} from './components'
import styles from './onboarding.module.sass'

export default function OnboardingPage() {
  const onboarding = useOnboarding()
  const {
    tenant,
    step,
    handleNext,
    handlePrevious,
    handleComplete,
    handleGoToDashboard,
    isSubmitting,
    errors,
    success,
  } = onboarding

  const getButtonText = () => {
    if (isSubmitting) {
      if (step === 2) return 'Saving...'
      if (step === 3) return 'Saving...'
      if (step === 4) return 'Completing...'
    }
    if (step === 1) return 'Get Started'
    if (step === 4) return 'Go to Dashboard'
    return 'Continue'
  }

  const handlePrimaryAction = () => {
    if (step === 4) {
      if (success) {
        handleGoToDashboard()
      } else {
        handleComplete()
      }
    } else {
      handleNext()
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.themeSwitcherWrapper}>
        <ThemeSwitcher />
      </div>

      <section className={styles.onboarding}>
        <FormCard
          className={styles.onboardingCard}
          header={
            <>
              <h1 className={styles.onboardingTitle}>
                Complete Your <span className={styles.accent}>Profile</span>
              </h1>
              <p className={styles.onboardingSubtitle}>
                {tenant?.name ? `Welcome to ${tenant.name}! ` : ''}
                Let&apos;s set up your profile to get started.
              </p>
              <StepIndicator currentStep={step} />
            </>
          }
          footer={
            <>
              {step > 1 && step < 4 && (
                <Button
                  type="button"
                  onClick={handlePrevious}
                  variant="ghost"
                  disabled={isSubmitting}
                >
                  Previous
                </Button>
              )}
              <Button
                type="button"
                onClick={handlePrimaryAction}
                disabled={isSubmitting}
              >
                {getButtonText()}
              </Button>
            </>
          }
        >
          {step === 1 && <WelcomeStep onboarding={onboarding} />}
          {step === 2 && <PersonalStep onboarding={onboarding} />}
          {step === 3 && <AddressStep onboarding={onboarding} />}
          {step === 4 && <CompleteStep onboarding={onboarding} />}

          {errors.general && (
            <div className={styles.errorMessage} role="alert">
              {errors.general}
            </div>
          )}
          {success && (
            <div className={styles.successMessage} role="status">
              {success}
            </div>
          )}
        </FormCard>
      </section>
    </div>
  )
}
