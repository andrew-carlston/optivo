'use client'

import { Suspense } from 'react'
import { FormCard, ThemeSwitcher } from '@/components'
import { useCreatingProgress } from './hooks/useCreatingProgress'
import type { ProgressStep } from './hooks/useCreatingProgress'
import styles from './creating.module.sass'

function ProgressStepItem({ step }: { step: ProgressStep }) {
  const statusClass =
    step.status === 'completed'
      ? styles.completed
      : step.status === 'in_progress'
      ? styles.inProgress
      : styles.pending

  return (
    <div className={`${styles.step} ${statusClass}`} role="listitem">
      <div className={styles.stepIcon} aria-hidden="true">
        {step.status === 'in_progress' && <div className={styles.spinner} />}
        {step.status === 'completed' && <div className={styles.checkmark} />}
        {step.status === 'pending' && <div className={styles.pendingDot} />}
      </div>
      <span className={styles.stepLabel}>{step.label}</span>
    </div>
  )
}

function SuccessAnimation() {
  return (
    <div className={styles.successContainer}>
      <div className={styles.successBurst} aria-hidden="true">
        {/* Confetti particles */}
        <div className={`${styles.confetti} ${styles.confetti1}`} />
        <div className={`${styles.confetti} ${styles.confetti2}`} />
        <div className={`${styles.confetti} ${styles.confetti3}`} />
        <div className={`${styles.confetti} ${styles.confetti4}`} />
        <div className={`${styles.confetti} ${styles.confetti5}`} />
        <div className={`${styles.confetti} ${styles.confetti6}`} />
        <div className={`${styles.confetti} ${styles.confetti7}`} />
        <div className={`${styles.confetti} ${styles.confetti8}`} />
        <div className={`${styles.confetti} ${styles.confetti9}`} />
        <div className={`${styles.confetti} ${styles.confetti10}`} />
        <div className={`${styles.confetti} ${styles.confetti11}`} />
        <div className={`${styles.confetti} ${styles.confetti12}`} />
        {/* Central checkmark circle */}
        <div className={styles.burstCircle}>
          <div className={styles.burstCheckmark} />
        </div>
      </div>
      <h2 className={styles.successTitle}>All Done!</h2>
      <p className={styles.successSubtitle}>
        Your company has been created successfully.
      </p>
      <div className={styles.redirecting}>
        <div className={styles.redirectingSpinner} />
        <span>Redirecting to sign in...</span>
      </div>
    </div>
  )
}

function CreatingProgressContent() {
  const { steps, isComplete, tenantSlug } = useCreatingProgress()

  // Calculate progress percentage
  const completedSteps = steps.filter((s) => s.status === 'completed').length
  const progressPercent = isComplete
    ? 100
    : (completedSteps / steps.length) * 100

  // If no slug provided, show error state
  if (!tenantSlug) {
    return (
      <div className={styles.page}>
        <div className={styles.themeSwitcherWrapper}>
          <ThemeSwitcher />
        </div>
        <section className={styles.creating}>
          <FormCard className={styles.creatingCard}>
            <div className={styles.header}>
              <h1 className={styles.title}>Something went wrong</h1>
              <p className={styles.subtitle}>
                Missing company information. Please try registering again.
              </p>
            </div>
          </FormCard>
        </section>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.themeSwitcherWrapper}>
        <ThemeSwitcher />
      </div>

      <section className={styles.creating}>
        <div className={styles.cardWrapper}>
          <FormCard className={styles.creatingCard}>
            {/* Progress bar */}
            <div className={styles.progressBar} role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
              <div
                className={`${styles.progressFill} ${isComplete ? styles.complete : ''}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {!isComplete ? (
              <>
                <div className={styles.header}>
                  <h1 className={styles.title}>
                    Setting Up <span className={styles.accent}>Your Company</span>
                  </h1>
                  <p className={styles.subtitle}>
                    Please wait while we prepare everything for you...
                  </p>
                </div>

                <div
                  className={styles.stepsContainer}
                  role="list"
                  aria-label="Setup progress steps"
                >
                  {steps.map((step) => (
                    <ProgressStepItem key={step.id} step={step} />
                  ))}
                </div>
              </>
            ) : (
              <SuccessAnimation />
            )}
          </FormCard>
        </div>
      </section>
    </div>
  )
}

export default function CreatingPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.page}>
          <section className={styles.creating}>
            <FormCard className={styles.creatingCard}>
              <div className={styles.header}>
                <h1 className={styles.title}>Loading...</h1>
              </div>
            </FormCard>
          </section>
        </div>
      }
    >
      <CreatingProgressContent />
    </Suspense>
  )
}
