'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Country, State, City } from 'country-state-city'
import { getAddressLabels } from '../constants'

// Helper to get full country name from ISO code
export const getCountryName = (isoCode: string): string => {
  if (!isoCode) return ''
  const country = Country.getCountryByCode(isoCode)
  return country?.name || isoCode
}

// Helper to get full state/province name from ISO code
export const getStateName = (countryCode: string, stateCode: string): string => {
  if (!countryCode || !stateCode) return ''
  const state = State.getStateByCodeAndCountry(stateCode, countryCode)
  return state?.name || stateCode
}

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function useRegistration() {
  const router = useRouter()

  // Country options
  const countryOptions = useMemo(() => {
    return Country.getAllCountries().map(c => ({
      value: c.isoCode,
      label: c.name
    }))
  }, [])

  // Step management
  const [step, setStep] = useState(1)

  // Company info
  const [companyName, setCompanyName] = useState('')
  const [slug, setSlug] = useState('')
  const [isEditingSlug, setIsEditingSlug] = useState(false)
  const [isSlugAvailable, setIsSlugAvailable] = useState<boolean | null>(null)
  const [isCheckingSlug, setIsCheckingSlug] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [subtext, setSubtext] = useState('')

  // Company address
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [country, setCountry] = useState('')
  const [industry, setIndustry] = useState('')

  // Billing
  const [billingPlan, setBillingPlan] = useState('free')
  const [billingAddress, setBillingAddress] = useState('')
  const [billingCity, setBillingCity] = useState('')
  const [billingState, setBillingState] = useState('')
  const [billingZip, setBillingZip] = useState('')
  const [billingCountry, setBillingCountry] = useState('')
  const [sameAsCompany, setSameAsCompany] = useState(true)
  const [hipaaCompliance, setHipaaCompliance] = useState(false)

  // Account
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Form state
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Debounced slug availability check
  const checkSlugAvailability = useCallback(async (slugToCheck: string) => {
    if (!slugToCheck) {
      setIsSlugAvailable(null)
      return
    }
    setIsCheckingSlug(true)
    try {
      const response = await fetch(`/api/check-slug?slug=${encodeURIComponent(slugToCheck)}`)
      const data = await response.json()
      setIsSlugAvailable(data.available)
    } catch {
      setIsSlugAvailable(null)
    } finally {
      setIsCheckingSlug(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      checkSlugAvailability(slug)
    }, 300)
    return () => clearTimeout(timer)
  }, [slug, checkSlugAvailability])

  // Computed state options
  const stateOptions = useMemo(() => {
    if (!country) return []
    return State.getStatesOfCountry(country).map(s => ({
      value: s.isoCode,
      label: s.name
    }))
  }, [country])

  const cityOptions = useMemo(() => {
    if (!country || !state) return []
    return City.getCitiesOfState(country, state).map(c => ({
      value: c.name,
      label: c.name
    }))
  }, [country, state])

  const billingStateOptions = useMemo(() => {
    if (!billingCountry) return []
    return State.getStatesOfCountry(billingCountry).map(s => ({
      value: s.isoCode,
      label: s.name
    }))
  }, [billingCountry])

  const billingCityOptions = useMemo(() => {
    if (!billingCountry || !billingState) return []
    return City.getCitiesOfState(billingCountry, billingState).map(c => ({
      value: c.name,
      label: c.name
    }))
  }, [billingCountry, billingState])

  // Address labels
  const addressLabels = getAddressLabels(country)
  const billingAddressLabels = getAddressLabels(billingCountry)

  // Handlers
  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCompanyName(value)
    if (!isEditingSlug) {
      setSlug(slugify(value))
    }
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(slugify(e.target.value))
  }

  const handleCountryChange = (val: string) => {
    setCountry(val)
    setState('')
    setCity('')
  }

  const handleStateChange = (val: string) => {
    setState(val)
    setCity('')
  }

  const handleBillingCountryChange = (val: string) => {
    setBillingCountry(val)
    setBillingState('')
    setBillingCity('')
  }

  const handleBillingStateChange = (val: string) => {
    setBillingState(val)
    setBillingCity('')
  }

  // Address formatting
  const getFullAddress = () => {
    const parts = [
      address,
      city,
      getStateName(country, state),
      zip,
      getCountryName(country)
    ].filter(Boolean)
    return parts.join(', ')
  }

  const getFullBillingAddress = () => {
    if (sameAsCompany) return getFullAddress()
    const parts = [
      billingAddress,
      billingCity,
      getStateName(billingCountry, billingState),
      billingZip,
      getCountryName(billingCountry)
    ].filter(Boolean)
    return parts.join(', ')
  }

  // Slug status
  const getSlugStatusColor = () => {
    if (isCheckingSlug) return 'var(--neo-text-secondary)'
    if (isSlugAvailable === true) return 'var(--neo-success)'
    if (isSlugAvailable === false) return 'var(--neo-error)'
    return 'var(--neo-text-secondary)'
  }

  const getSlugStatusText = () => {
    if (isCheckingSlug) return 'Checking...'
    if (isSlugAvailable === true) return 'Available'
    if (isSlugAvailable === false) return 'Not available'
    return ''
  }

  // Validation
  const validateStep = (currentStep: number) => {
    const newErrors: { [key: string]: string } = {}

    if (currentStep === 1) {
      if (!companyName) {
        newErrors.companyName = 'Company name is required'
      }
      if (!slug) {
        newErrors.slug = 'Slug is required'
      } else if (isSlugAvailable === false) {
        newErrors.slug = 'This slug is already taken'
      }
    } else if (currentStep === 3) {
      if (!email) {
        newErrors.email = 'Email is required'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = 'Please enter a valid email address'
      }

      if (!password) {
        newErrors.password = 'Password is required'
      } else if (password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters'
      }

      if (!confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password'
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Navigation
  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const handlePrevious = () => {
    setStep(step - 1)
  }

  // Submit
  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault()

    if (step !== 4 || isSubmitting) {
      return
    }

    if (validateStep(step)) {
      setIsSubmitting(true)
      try {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            companyName,
            slug,
            logo: '',
            subtext,
            industry,
            address,
            city,
            state: getStateName(country, state),
            zip,
            country: getCountryName(country),
            billingPlan,
            hipaaCompliance,
            sameAsCompany,
            billingAddress: sameAsCompany ? address : billingAddress,
            billingCity: sameAsCompany ? city : billingCity,
            billingState: sameAsCompany ? getStateName(country, state) : getStateName(billingCountry, billingState),
            billingZip: sameAsCompany ? zip : billingZip,
            billingCountry: sameAsCompany ? getCountryName(country) : getCountryName(billingCountry),
            email,
            password,
            confirmPassword
          })
        })

        const data = await response.json()

        if (response.ok) {
          setSubmitted(true)
          // Redirect to creating progress page
          router.push(`/register/creating?slug=${encodeURIComponent(slug)}`)
        } else {
          setErrors({ general: data.error })
          setIsSubmitting(false)
        }
      } catch (error) {
        console.error('Registration error:', error)
        setErrors({ general: 'An error occurred during registration' })
        setIsSubmitting(false)
      }
    }
  }

  return {
    // Step
    step,
    handleNext,
    handlePrevious,

    // Company
    companyName,
    handleCompanyNameChange,
    slug,
    handleSlugChange,
    isEditingSlug,
    setIsEditingSlug,
    isSlugAvailable,
    getSlugStatusColor,
    getSlugStatusText,
    logoFile,
    setLogoFile,
    subtext,
    setSubtext,

    // Company address
    address,
    setAddress,
    city,
    setCity,
    state,
    handleStateChange,
    zip,
    setZip,
    country,
    handleCountryChange,
    addressLabels,
    countryOptions,
    stateOptions,
    cityOptions,

    // Industry
    industry,
    setIndustry,

    // Billing
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
    billingState,
    handleBillingStateChange,
    billingZip,
    setBillingZip,
    billingCountry,
    handleBillingCountryChange,
    billingAddressLabels,
    billingStateOptions,
    billingCityOptions,

    // Account
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,

    // Form state
    errors,
    submitted,
    isSubmitting,
    handleSubmit,

    // Review helpers
    getFullAddress,
    getFullBillingAddress,
  }
}

export type UseRegistrationReturn = ReturnType<typeof useRegistration>
