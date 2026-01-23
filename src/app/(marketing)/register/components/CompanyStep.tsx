import { Input, Avatar, Dropdown } from '@/components'
import { UseRegistrationReturn } from '../hooks/useRegistration'
import styles from '../page.module.sass'

interface CompanyStepProps {
  registration: UseRegistrationReturn
}

export default function CompanyStep({ registration }: CompanyStepProps) {
  const {
    companyName,
    handleCompanyNameChange,
    slug,
    handleSlugChange,
    isEditingSlug,
    setIsEditingSlug,
    isSlugAvailable,
    getSlugStatusColor,
    getSlugStatusText,
    setLogoFile,
    subtext,
    setSubtext,
    address,
    setAddress,
    city,
    setCity,
    handleStateChange,
    zip,
    setZip,
    country,
    handleCountryChange,
    state,
    addressLabels,
    countryOptions,
    stateOptions,
    cityOptions,
    errors,
  } = registration

  return (
    <>
      <h2 className={styles.stepTitle}>Company Information</h2>

      {/* Logo + Company Name & Tagline */}
      <div className={styles.companyHeader}>
        <Avatar
          size="xxl"
          editable={true}
          onChange={setLogoFile}
          placeholder="Upload Logo"
          className={styles.companyLogo}
        />
        <div className={styles.companyDetails}>
          <div>
            <Input
              id="companyName"
              label="Company Name"
              type="text"
              value={companyName}
              onChange={handleCompanyNameChange}
              error={errors.companyName}
              placeholder="Enter your company name"
            />
            {companyName && (
              <div className={styles.slugUnderName}>
                {isEditingSlug ? (
                  <input
                    type="text"
                    value={slug}
                    onChange={handleSlugChange}
                    onBlur={() => setIsEditingSlug(false)}
                    autoFocus
                    className={`${styles.slugInput} ${isSlugAvailable === true ? styles.slugAvailable : isSlugAvailable === false ? styles.slugUnavailable : ''}`}
                  />
                ) : (
                  <span className={styles.slugValue}>{slug}</span>
                )}
                <span className={styles.slugStatus} style={{ color: getSlugStatusColor() }}>
                  {getSlugStatusText()}
                </span>
                {isSlugAvailable === false && !isEditingSlug && (
                  <button
                    type="button"
                    className={styles.editButton}
                    onClick={() => setIsEditingSlug(true)}
                    title="Edit slug"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                )}
              </div>
            )}
            {errors.slug && <div className={styles.slugError}>{errors.slug}</div>}
          </div>
          <Input
            id="subtext"
            label="Company Tagline"
            type="text"
            value={subtext}
            onChange={(e) => setSubtext(e.target.value)}
            placeholder="Together, stronger"
          />
        </div>
      </div>

      {/* Country & State */}
      <div className={styles.formGroup}>
        <div className={styles.twoColumn}>
          <div>
            <label className={styles.label}>Country</label>
            <Dropdown
              options={countryOptions}
              value={country}
              onChange={handleCountryChange}
              placeholder="Select country"
            />
          </div>
          <div>
            <label className={styles.label}>{addressLabels.state}</label>
            <Dropdown
              options={stateOptions.length > 0 ? stateOptions : [{ value: '', label: 'Select country first' }]}
              value={state}
              onChange={handleStateChange}
              placeholder={country ? `Select ${addressLabels.state.toLowerCase()}` : "Select country first"}
              disabled={!country || stateOptions.length === 0}
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className={styles.formGroup}>
        <Input
          id="address"
          label="Address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Street Address"
        />
      </div>

      {/* City & Zip */}
      <div className={styles.formGroup}>
        <div className={styles.twoColumn}>
          <div>
            <label className={styles.label}>{addressLabels.city}</label>
            <Dropdown
              options={cityOptions.length > 0 ? cityOptions : [{ value: '', label: `Select ${addressLabels.state.toLowerCase()} first` }]}
              value={city}
              onChange={setCity}
              placeholder={state ? `Select ${addressLabels.city.toLowerCase()}` : `Select ${addressLabels.state.toLowerCase()} first`}
              disabled={!state || cityOptions.length === 0}
            />
          </div>
          <Input
            id="zip"
            label={addressLabels.zip || 'Postal Code'}
            type="text"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            placeholder={addressLabels.zip || 'Postal Code'}
          />
        </div>
      </div>
    </>
  )
}
