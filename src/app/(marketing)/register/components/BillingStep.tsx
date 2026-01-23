import { Input, Dropdown, Toggle } from '@/components'
import { INDUSTRY_OPTIONS } from '../constants'
import { UseRegistrationReturn } from '../hooks/useRegistration'
import styles from '../page.module.sass'

interface BillingStepProps {
  registration: UseRegistrationReturn
}

export default function BillingStep({ registration }: BillingStepProps) {
  const {
    industry,
    setIndustry,
    billingPlan,
    setBillingPlan,
    hipaaCompliance,
    setHipaaCompliance,
    sameAsCompany,
    setSameAsCompany,
    billingAddress,
    setBillingAddress,
    billingCity,
    setBillingCity,
    handleBillingStateChange,
    billingZip,
    setBillingZip,
    billingCountry,
    handleBillingCountryChange,
    billingState,
    billingAddressLabels,
    countryOptions,
    billingStateOptions,
    billingCityOptions,
  } = registration

  return (
    <>
      <h2 className={styles.stepTitle}>Billing Information</h2>

      {/* Industry Selection */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Industry</label>
        <Dropdown
          options={INDUSTRY_OPTIONS}
          value={industry}
          onChange={setIndustry}
          placeholder="Select your industry"
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Billing Plan</label>
        <div className={styles.planCards}>
          <div
            className={`${styles.planCard} ${billingPlan === 'free' ? styles.selected : ''}`}
            onClick={() => setBillingPlan('free')}
          >
            <h3 className={styles.planName}>Starter</h3>
            <span className={styles.planPrice}>Free</span>
            <p className={styles.planSubprice}>{hipaaCompliance ? '+ $2/agent/mo' : '\u00A0'}</p>
            <ul className={styles.planFeatures}>
              <li>Up to 10 agents</li>
              <li>Basic scheduling</li>
              <li>Email support</li>
              <li>7-day forecast</li>
            </ul>
          </div>
          <div
            className={`${styles.planCard} ${billingPlan === 'pro' ? styles.selected : ''}`}
            onClick={() => setBillingPlan('pro')}
          >
            <h3 className={styles.planName}>Professional</h3>
            <span className={styles.planPrice}>$99<small>/mo</small></span>
            <p className={styles.planSubprice}>+ ${hipaaCompliance ? '14' : '12'}/agent/mo</p>
            <ul className={styles.planFeatures}>
              <li>Unlimited agents</li>
              <li>Advanced forecasting</li>
              <li>Real-time adherence</li>
              <li>Priority support</li>
            </ul>
          </div>
          <div
            className={`${styles.planCard} ${billingPlan === 'enterprise' ? styles.selected : ''}`}
            onClick={() => setBillingPlan('enterprise')}
          >
            <h3 className={styles.planName}>Enterprise</h3>
            <span className={styles.planPrice}>$299<small>/mo</small></span>
            <p className={styles.planSubprice}>+ ${hipaaCompliance ? '20' : '18'}/agent/mo</p>
            <ul className={styles.planFeatures}>
              <li>Multi-site management</li>
              <li>Custom integrations</li>
              <li>Dedicated CSM</li>
              <li>99.9% SLA guarantee</li>
            </ul>
          </div>
        </div>
      </div>

      {/* HIPAA Compliance */}
      <div className={styles.formGroup}>
        <div className={styles.toggleRow}>
          <div className={styles.toggleInfo}>
            <span className={styles.toggleLabel}>HIPAA Compliance</span>
            <span className={styles.togglePrice}>+$2/agent/mo</span>
          </div>
          <Toggle
            checked={hipaaCompliance}
            onChange={setHipaaCompliance}
          />
        </div>
        <p className={styles.hipaaNote}>
          Enable HIPAA compliance if your organization handles protected health information (PHI), personally identifiable information (PII), or requires enhanced data security. Includes Business Associate Agreement (BAA), encryption at rest, detailed audit logging, access controls, and compliance reporting. Recommended for healthcare, insurance, legal, and financial services.
        </p>
      </div>

      <div className={styles.formGroup}>
        <div className={styles.toggleRow}>
          <span className={styles.toggleLabel}>Billing address same as company</span>
          <Toggle
            checked={sameAsCompany}
            onChange={setSameAsCompany}
          />
        </div>
      </div>

      {!sameAsCompany && (
        <>
          {/* Country & State */}
          <div className={styles.formGroup}>
            <div className={styles.twoColumn}>
              <div>
                <label className={styles.label}>Country</label>
                <Dropdown
                  options={countryOptions}
                  value={billingCountry}
                  onChange={handleBillingCountryChange}
                  placeholder="Select country"
                />
              </div>
              <div>
                <label className={styles.label}>{billingAddressLabels.state}</label>
                <Dropdown
                  options={billingStateOptions.length > 0 ? billingStateOptions : [{ value: '', label: 'Select country first' }]}
                  value={billingState}
                  onChange={handleBillingStateChange}
                  placeholder={billingCountry ? `Select ${billingAddressLabels.state.toLowerCase()}` : "Select country first"}
                  disabled={!billingCountry || billingStateOptions.length === 0}
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className={styles.formGroup}>
            <Input
              id="billingAddress"
              label="Address"
              type="text"
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              placeholder="Street Address"
            />
          </div>

          {/* City & Zip */}
          <div className={styles.formGroup}>
            <div className={styles.twoColumn}>
              <div>
                <label className={styles.label}>{billingAddressLabels.city}</label>
                <Dropdown
                  options={billingCityOptions.length > 0 ? billingCityOptions : [{ value: '', label: `Select ${billingAddressLabels.state.toLowerCase()} first` }]}
                  value={billingCity}
                  onChange={setBillingCity}
                  placeholder={billingState ? `Select ${billingAddressLabels.city.toLowerCase()}` : `Select ${billingAddressLabels.state.toLowerCase()} first`}
                  disabled={!billingState || billingCityOptions.length === 0}
                />
              </div>
              <Input
                id="billingZip"
                label={billingAddressLabels.zip || 'Postal Code'}
                type="text"
                value={billingZip}
                onChange={(e) => setBillingZip(e.target.value)}
                placeholder={billingAddressLabels.zip || 'Postal Code'}
              />
            </div>
          </div>
        </>
      )}
    </>
  )
}
