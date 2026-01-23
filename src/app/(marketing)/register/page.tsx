'use client'

import { Button, FormCard, ThemeSwitcher } from '@/components'
import { useRegistration } from './hooks/useRegistration'
import {
  StepIndicator,
  CompanyStep,
  BillingStep,
  AccountStep,
  ReviewStep,
} from './components'
import styles from './page.module.sass'

export default function RegisterPage() {
  const registration = useRegistration()
  const {
    step,
    handleNext,
    handlePrevious,
    handleSubmit,
    isSubmitting,
    errors,
    submitted,
  } = registration

  return (
    <div className={styles.page}>
      <div className={styles.themeSwitcherWrapper}>
        <ThemeSwitcher />
      </div>

      <section className={styles.register}>
        <FormCard
          className={styles.registerCard}
          header={
            <>
              <h1 className={styles.registerTitle}>
                Create Your <span className={styles.accent}>Company</span>
              </h1>
              <p className={styles.registerSubtitle}>
                Set up your organization and start collaborating with your team.
              </p>
              <StepIndicator currentStep={step} />
            </>
          }
          footer={
            <>
              {step > 1 && (
                <Button type="button" onClick={handlePrevious} variant="ghost">
                  Previous
                </Button>
              )}
              {step < 4 ? (
                <Button type="button" onClick={handleNext}>
                  Continue
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Company'}
                </Button>
              )}
            </>
          }
        >
          {step === 1 && <CompanyStep registration={registration} />}
          {step === 2 && <BillingStep registration={registration} />}
          {step === 3 && <AccountStep registration={registration} />}
          {step === 4 && <ReviewStep registration={registration} />}

          {errors.general && (
            <div className={styles.errorMessage}>
              {errors.general}
            </div>
          )}
          {submitted && (
            <div className={styles.successMessage}>
              Company created successfully! Redirecting to your dashboard...
            </div>
          )}
        </FormCard>
      </section>
    </div>
  )
}
