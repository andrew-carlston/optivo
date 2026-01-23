import { Input, Avatar } from '@/components'
import { UseOnboardingReturn } from '../hooks/useOnboarding'
import styles from '../onboarding.module.sass'

interface PersonalStepProps {
  onboarding: UseOnboardingReturn
}

export default function PersonalStep({ onboarding }: PersonalStepProps) {
  const {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    preferredName,
    setPreferredName,
    phone,
    setPhone,
    setAvatarFile,
    errors,
  } = onboarding

  return (
    <>
      <h2 className={styles.stepTitle}>Personal Information</h2>

      <div className={styles.personalHeader}>
        <Avatar
          size="xxl"
          editable={true}
          onChange={setAvatarFile}
          placeholder="Add Photo"
          className={styles.avatar}
        />
        <div className={styles.personalDetails}>
          <div className={styles.twoColumn}>
            <Input
              id="firstName"
              label="First Name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              error={errors.firstName}
              placeholder="John"
              autoFocus
            />
            <Input
              id="lastName"
              label="Last Name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              error={errors.lastName}
              placeholder="Doe"
            />
          </div>
        </div>
      </div>

      <div className={styles.formGroup}>
        <Input
          id="preferredName"
          label="Preferred Name (Optional)"
          type="text"
          value={preferredName}
          onChange={(e) => setPreferredName(e.target.value)}
          placeholder="What should we call you?"
        />
      </div>

      <div className={styles.formGroup}>
        <Input
          id="phone"
          label="Phone Number (Optional)"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={errors.phone}
          placeholder="+1 (555) 123-4567"
        />
      </div>
    </>
  )
}
