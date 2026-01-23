import { Input, Dropdown } from '@/components'
import { UseOnboardingReturn } from '../hooks/useOnboarding'
import { US_STATES, COUNTRY_OPTIONS } from '../constants'
import styles from '../onboarding.module.sass'

interface AddressStepProps {
  onboarding: UseOnboardingReturn
}

export default function AddressStep({ onboarding }: AddressStepProps) {
  const {
    street1,
    setStreet1,
    street2,
    setStreet2,
    city,
    setCity,
    state,
    setState,
    zip,
    setZip,
    country,
    setCountry,
    errors,
  } = onboarding

  return (
    <>
      <h2 className={styles.stepTitle}>Your Address</h2>

      {/* Country & State - First row */}
      <div className={styles.formGroup}>
        <div className={styles.twoColumn}>
          <div>
            <label className={styles.label} htmlFor="country-dropdown">
              Country
            </label>
            <Dropdown
              options={COUNTRY_OPTIONS}
              value={country}
              onChange={setCountry}
              placeholder="Select country"
            />
            {errors.country && <span className={styles.fieldError}>{errors.country}</span>}
          </div>
          <div>
            <label className={styles.label} htmlFor="state-dropdown">
              State
            </label>
            <Dropdown
              options={US_STATES}
              value={state}
              onChange={setState}
              placeholder="Select state"
            />
            {errors.state && <span className={styles.fieldError}>{errors.state}</span>}
          </div>
        </div>
      </div>

      {/* Street Address */}
      <div className={styles.formGroup}>
        <Input
          id="street1"
          label="Street Address"
          type="text"
          value={street1}
          onChange={(e) => setStreet1(e.target.value)}
          error={errors.street1}
          placeholder="123 Main Street"
        />
      </div>

      {/* Apt/Suite (Optional) */}
      <div className={styles.formGroup}>
        <Input
          id="street2"
          label="Apt, Suite, Unit (Optional)"
          type="text"
          value={street2}
          onChange={(e) => setStreet2(e.target.value)}
          placeholder="Apt 4B"
        />
      </div>

      {/* City & ZIP - Last row */}
      <div className={styles.formGroup}>
        <div className={styles.twoColumn}>
          <Input
            id="city"
            label="City"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            error={errors.city}
            placeholder="New York"
          />
          <Input
            id="zip"
            label="ZIP Code"
            type="text"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            error={errors.zip}
            placeholder="10001"
          />
        </div>
      </div>
    </>
  )
}
