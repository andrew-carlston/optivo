import { UseOnboardingReturn } from '../hooks/useOnboarding'
import styles from '../onboarding.module.sass'

interface CompleteStepProps {
  onboarding: UseOnboardingReturn
}

export default function CompleteStep({ onboarding }: CompleteStepProps) {
  const { firstName, preferredName, tenant } = onboarding

  const displayName = preferredName || firstName || 'there'

  return (
    <div className={styles.completeStep}>
      <div className={styles.successIcon} aria-hidden="true">
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="16 8 10 14 8 12" />
        </svg>
      </div>

      <h2 className={styles.stepTitle}>You&apos;re All Set, {displayName}!</h2>

      <p className={styles.completeText}>
        Your profile is complete and ready to go. You can now start using {tenant?.name || 'the platform'} with your team.
      </p>

      <div className={styles.nextSteps}>
        <h3 className={styles.nextStepsTitle}>What&apos;s next?</h3>
        <ul className={styles.nextStepsList}>
          <li>Explore your dashboard</li>
          <li>Connect with your team members</li>
          <li>Customize your settings</li>
        </ul>
      </div>
    </div>
  )
}
