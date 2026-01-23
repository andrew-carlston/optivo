import { STEPS } from '../constants'
import styles from '../onboarding.module.sass'

interface StepIndicatorProps {
  currentStep: number
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className={styles.stepIndicator}>
      {STEPS.map((s, index) => (
        <div key={s.number} className={styles.stepWrapper}>
          <div
            className={`${styles.step} ${s.number === currentStep ? styles.active : ''} ${s.number < currentStep ? styles.completed : ''}`}
          >
            {s.number < currentStep ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              s.number
            )}
          </div>
          <span
            className={`${styles.stepLabel} ${s.number === currentStep ? styles.active : ''} ${s.number < currentStep ? styles.completed : ''}`}
          >
            {s.label}
          </span>
          {index < STEPS.length - 1 && (
            <div
              className={`${styles.stepLine} ${s.number < currentStep ? styles.completed : ''}`}
            />
          )}
        </div>
      ))}
    </div>
  )
}
