import { Avatar } from '@/components'
import styles from './TenantPreview.module.sass'

// Success checkmark icon
const CheckIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

interface TenantPreviewProps {
  name: string
  slug: string
  logo?: string
  tagline?: string
}

export default function TenantPreview({
  name,
  slug,
  logo,
  tagline,
}: TenantPreviewProps) {
  return (
    <div className={styles.preview} role="region" aria-label="Company found">
      <div className={styles.successBadge} aria-hidden="true">
        <CheckIcon />
      </div>

      <div className={styles.content}>
        <div className={styles.logoWrapper}>
          <Avatar
            src={logo}
            alt={`${name} logo`}
            size="lg"
            placeholder={name.charAt(0).toUpperCase()}
          />
        </div>

        <div className={styles.info}>
          <h3 className={styles.name}>{name}</h3>
          {tagline && <p className={styles.tagline}>{tagline}</p>}
          <code className={styles.slug}>{slug}</code>
        </div>
      </div>

      <p className={styles.foundMessage}>Found! Redirecting...</p>
    </div>
  )
}
