import { INDUSTRY_OPTIONS } from '../constants'
import { UseRegistrationReturn } from '../hooks/useRegistration'
import styles from '../page.module.sass'

interface ReviewStepProps {
  registration: UseRegistrationReturn
}

export default function ReviewStep({ registration }: ReviewStepProps) {
  const {
    companyName,
    slug,
    subtext,
    industry,
    billingPlan,
    hipaaCompliance,
    email,
    getFullAddress,
    getFullBillingAddress,
  } = registration

  return (
    <>
      <h2 className={styles.stepTitle}>Review & Confirm</h2>
      <div className={styles.review}>
        <div className={styles.reviewSection}>
          <h3>Company Information</h3>
          <div className={styles.reviewGrid}>
            <div className={styles.reviewItem}>
              <span className={styles.reviewLabel}>Name</span>
              <span className={styles.reviewValue}>{companyName}</span>
            </div>
            <div className={styles.reviewItem}>
              <span className={styles.reviewLabel}>Slug</span>
              <span className={styles.reviewValue}>{slug}</span>
            </div>
            <div className={styles.reviewItem}>
              <span className={styles.reviewLabel}>Tagline</span>
              <span className={styles.reviewValue}>{subtext || '—'}</span>
            </div>
            <div className={styles.reviewItem}>
              <span className={styles.reviewLabel}>Industry</span>
              <span className={styles.reviewValue}>{INDUSTRY_OPTIONS.find(o => o.value === industry)?.label || '—'}</span>
            </div>
            <div className={styles.reviewItem}>
              <span className={styles.reviewLabel}>Address</span>
              <span className={styles.reviewValue}>{getFullAddress() || '—'}</span>
            </div>
          </div>
        </div>

        <div className={styles.reviewSection}>
          <h3>Billing</h3>
          <div className={styles.reviewGrid}>
            <div className={styles.reviewItem}>
              <span className={styles.reviewLabel}>Plan</span>
              <span className={styles.reviewValue}>{billingPlan.charAt(0).toUpperCase() + billingPlan.slice(1)}</span>
            </div>
            <div className={styles.reviewItem}>
              <span className={styles.reviewLabel}>HIPAA Compliance</span>
              <span className={styles.reviewValue}>{hipaaCompliance ? 'Enabled (+$2/agent/mo)' : 'Not enabled'}</span>
            </div>
            <div className={styles.reviewItem}>
              <span className={styles.reviewLabel}>Address</span>
              <span className={styles.reviewValue}>
                {getFullBillingAddress() || '—'}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.reviewSection}>
          <h3>Account</h3>
          <div className={styles.reviewGrid}>
            <div className={styles.reviewItem}>
              <span className={styles.reviewLabel}>Email</span>
              <span className={styles.reviewValue}>{email}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
