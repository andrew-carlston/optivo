import { UseOnboardingReturn } from '../hooks/useOnboarding'
import { WELCOME_FEATURES } from '../constants'
import styles from '../onboarding.module.sass'

interface WelcomeStepProps {
  onboarding: UseOnboardingReturn
}

export default function WelcomeStep({ onboarding }: WelcomeStepProps) {
  const { tenant } = onboarding

  return (
    <div className={styles.welcomeStep}>
      <h2 className={styles.stepTitle}>Welcome to {tenant?.name || 'Your Organization'}</h2>
      <p className={styles.welcomeText}>
        Let&apos;s get your profile set up so your team can connect with you. This only takes a minute.
      </p>

      <div className={styles.featureList}>
        <h3 className={styles.featureTitle}>We&apos;ll collect:</h3>
        <ul className={styles.features}>
          {WELCOME_FEATURES.map((feature, index) => (
            <li key={index} className={styles.featureItem}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={styles.checkIcon}
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <p className={styles.privacyNote}>
        Your information is private and only visible to members of your organization.
      </p>
    </div>
  )
}
