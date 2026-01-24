'use client'

import { useState } from 'react'
import { Button, Input, Card } from '@/components'
import styles from './page.module.sass'

type SettingTab = 'countries' | 'states' | 'industries'

interface Country {
  value: string
  label: string
}

interface State {
  value: string
  label: string
  countryCode: string
}

interface Industry {
  value: string
  label: string
}

// Initial data - in production this would come from database
const INITIAL_COUNTRIES: Country[] = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'MX', label: 'Mexico' },
]

const INITIAL_INDUSTRIES: Industry[] = [
  { value: 'technology', label: 'Technology' },
  { value: 'telecom', label: 'Telecommunications' },
  { value: 'healthcare', label: 'Healthcare / Hospital' },
  { value: 'finance', label: 'Finance / Banking' },
  { value: 'retail', label: 'Retail / E-commerce' },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingTab>('countries')
  const [countries, setCountries] = useState<Country[]>(INITIAL_COUNTRIES)
  const [industries, setIndustries] = useState<Industry[]>(INITIAL_INDUSTRIES)
  const [selectedCountry, setSelectedCountry] = useState<string>('US')

  // Form states
  const [newCountryCode, setNewCountryCode] = useState('')
  const [newCountryName, setNewCountryName] = useState('')
  const [newStateCode, setNewStateCode] = useState('')
  const [newStateName, setNewStateName] = useState('')
  const [newIndustryCode, setNewIndustryCode] = useState('')
  const [newIndustryName, setNewIndustryName] = useState('')

  const handleAddCountry = () => {
    if (newCountryCode && newCountryName) {
      setCountries([...countries, { value: newCountryCode.toUpperCase(), label: newCountryName }])
      setNewCountryCode('')
      setNewCountryName('')
    }
  }

  const handleDeleteCountry = (value: string) => {
    setCountries(countries.filter(c => c.value !== value))
  }

  const handleAddIndustry = () => {
    if (newIndustryCode && newIndustryName) {
      setIndustries([...industries, { value: newIndustryCode.toLowerCase().replace(/\s+/g, '_'), label: newIndustryName }])
      setNewIndustryCode('')
      setNewIndustryName('')
    }
  }

  const handleDeleteIndustry = (value: string) => {
    setIndustries(industries.filter(i => i.value !== value))
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>System Settings</h1>
        <p className={styles.subtitle}>Manage dropdown options for registration and forms</p>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'countries' ? styles.active : ''}`}
            onClick={() => setActiveTab('countries')}
          >
            Countries
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'states' ? styles.active : ''}`}
            onClick={() => setActiveTab('states')}
          >
            States / Provinces
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'industries' ? styles.active : ''}`}
            onClick={() => setActiveTab('industries')}
          >
            Industries
          </button>
        </div>

        <Card className={styles.content}>
          {activeTab === 'countries' && (
            <>
              <h2 className={styles.sectionTitle}>Countries</h2>
              <div className={styles.addForm}>
                <Input
                  id="countryCode"
                  label="Country Code"
                  type="text"
                  value={newCountryCode}
                  onChange={(e) => setNewCountryCode(e.target.value)}
                  placeholder="US"
                />
                <Input
                  id="countryName"
                  label="Country Name"
                  type="text"
                  value={newCountryName}
                  onChange={(e) => setNewCountryName(e.target.value)}
                  placeholder="United States"
                />
                <Button onClick={handleAddCountry}>Add Country</Button>
              </div>
              <div className={styles.list}>
                {countries.map((country) => (
                  <div key={country.value} className={styles.listItem}>
                    <span className={styles.code}>{country.value}</span>
                    <span className={styles.name}>{country.label}</span>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDeleteCountry(country.value)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'states' && (
            <>
              <h2 className={styles.sectionTitle}>States / Provinces</h2>
              <div className={styles.countryFilter}>
                <label className={styles.label}>Select Country:</label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className={styles.select}
                >
                  {countries.map((country) => (
                    <option key={country.value} value={country.value}>
                      {country.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.addForm}>
                <Input
                  id="stateCode"
                  label="State Code"
                  type="text"
                  value={newStateCode}
                  onChange={(e) => setNewStateCode(e.target.value)}
                  placeholder="CA"
                />
                <Input
                  id="stateName"
                  label="State Name"
                  type="text"
                  value={newStateName}
                  onChange={(e) => setNewStateName(e.target.value)}
                  placeholder="California"
                />
                <Button onClick={() => {
                  if (newStateCode && newStateName) {
                    // TODO: Add state to database for selectedCountry
                    setNewStateCode('')
                    setNewStateName('')
                  }
                }}>Add State</Button>
              </div>
              <p className={styles.note}>
                States are stored per country. Select a country above to manage its states.
              </p>
            </>
          )}

          {activeTab === 'industries' && (
            <>
              <h2 className={styles.sectionTitle}>Industries</h2>
              <div className={styles.addForm}>
                <Input
                  id="industryCode"
                  label="Industry Code"
                  type="text"
                  value={newIndustryCode}
                  onChange={(e) => setNewIndustryCode(e.target.value)}
                  placeholder="tech"
                />
                <Input
                  id="industryName"
                  label="Industry Name"
                  type="text"
                  value={newIndustryName}
                  onChange={(e) => setNewIndustryName(e.target.value)}
                  placeholder="Technology"
                />
                <Button onClick={handleAddIndustry}>Add Industry</Button>
              </div>
              <div className={styles.list}>
                {industries.map((industry) => (
                  <div key={industry.value} className={styles.listItem}>
                    <span className={styles.code}>{industry.value}</span>
                    <span className={styles.name}>{industry.label}</span>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDeleteIndustry(industry.value)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        <div className={styles.saveSection}>
          <Button>Save Changes</Button>
        </div>
      </div>
    </div>
  )
}
