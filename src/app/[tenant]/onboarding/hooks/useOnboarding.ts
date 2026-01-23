'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TenantInfo } from '../../layout'

export function useOnboarding() {
  const params = useParams()
  const router = useRouter()
  const tenantSlug = params.tenant as string

  // ==================== STATE ====================

  // Tenant info
  const [tenant, setTenant] = useState<TenantInfo | null>(null)

  // User info (loaded from localStorage after sign-in)
  const [userId, setUserId] = useState<string | null>(null)

  // Step management
  const [step, setStep] = useState(1)

  // Personal info
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [preferredName, setPreferredName] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  // Address info
  const [street1, setStreet1] = useState('')
  const [street2, setStreet2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [country, setCountry] = useState('US')

  // Form state
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState('')

  // ==================== EFFECTS ====================

  // Load tenant data from script tag
  useEffect(() => {
    const tenantDataScript = document.getElementById('tenant-data')
    if (tenantDataScript) {
      try {
        const data = JSON.parse(tenantDataScript.textContent || '{}')
        setTenant(data)
      } catch (e) {
        console.error('Failed to parse tenant data:', e)
      }
    }
  }, [])

  // Load user ID from localStorage (set during sign-in)
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId')
    if (storedUserId) {
      setUserId(storedUserId)
    }
  }, [])

  // ==================== VALIDATION ====================

  const validateStep = useCallback((currentStep: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (currentStep === 2) {
      // Personal info validation
      if (!firstName.trim()) {
        newErrors.firstName = 'First name is required'
      }
      if (!lastName.trim()) {
        newErrors.lastName = 'Last name is required'
      }
      if (phone && !/^[\d\s\-+()]+$/.test(phone)) {
        newErrors.phone = 'Please enter a valid phone number'
      }
    }

    if (currentStep === 3) {
      // Address validation
      if (!street1.trim()) {
        newErrors.street1 = 'Street address is required'
      }
      if (!city.trim()) {
        newErrors.city = 'City is required'
      }
      if (!state.trim()) {
        newErrors.state = 'State is required'
      }
      if (!zip.trim()) {
        newErrors.zip = 'ZIP code is required'
      }
      if (!country) {
        newErrors.country = 'Country is required'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [firstName, lastName, phone, street1, city, state, zip, country])

  // ==================== API CALLS ====================

  const savePersonalInfo = useCallback(async (): Promise<boolean> => {
    if (!userId) {
      setErrors({ general: 'User session not found. Please sign in again.' })
      return false
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      let avatarUrl: string | null = null

      // Upload avatar if one is selected
      if (avatarFile) {
        const formData = new FormData()
        formData.append('file', avatarFile)
        formData.append('type', 'avatar')
        formData.append('userId', userId)

        const uploadResponse = await fetch(`/api/${tenantSlug}/upload`, {
          method: 'POST',
          body: formData,
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          avatarUrl = uploadData.url
        } else {
          console.error('Avatar upload failed, continuing without avatar')
        }
      }

      const response = await fetch(`/api/${tenantSlug}/onboarding/personal`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          firstName,
          lastName,
          preferredName: preferredName || null,
          phone: phone || null,
          avatar: avatarUrl,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors({ general: data.error || 'Failed to save personal information' })
        return false
      }

      return true
    } catch (error) {
      console.error('Error saving personal info:', error)
      setErrors({ general: 'Network error. Please try again.' })
      return false
    } finally {
      setIsSubmitting(false)
    }
  }, [tenantSlug, userId, firstName, lastName, preferredName, phone, avatarFile])

  const saveAddress = useCallback(async (): Promise<boolean> => {
    if (!userId) {
      setErrors({ general: 'User session not found. Please sign in again.' })
      return false
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      // Build request body, only include non-empty optional fields
      const addressData: Record<string, string | boolean> = {
        userId,
        addressType: 'home',
        isPrimary: true,
      }
      if (street1) addressData.street1 = street1
      if (street2) addressData.street2 = street2
      if (city) addressData.city = city
      if (state) addressData.state = state
      if (zip) addressData.zip = zip
      if (country) addressData.country = country

      const response = await fetch(`/api/${tenantSlug}/onboarding/address`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressData),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors({ general: data.error || 'Failed to save address' })
        return false
      }

      return true
    } catch (error) {
      console.error('Error saving address:', error)
      setErrors({ general: 'Network error. Please try again.' })
      return false
    } finally {
      setIsSubmitting(false)
    }
  }, [tenantSlug, userId, street1, street2, city, state, zip, country])

  const completeOnboarding = useCallback(async (): Promise<boolean> => {
    if (!userId) {
      setErrors({ general: 'User session not found. Please sign in again.' })
      return false
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      const response = await fetch(`/api/${tenantSlug}/onboarding/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors({ general: data.error || 'Failed to complete onboarding' })
        return false
      }

      setSuccess('Profile setup complete!')
      return true
    } catch (error) {
      console.error('Error completing onboarding:', error)
      setErrors({ general: 'Network error. Please try again.' })
      return false
    } finally {
      setIsSubmitting(false)
    }
  }, [tenantSlug, userId])

  // ==================== HANDLERS ====================

  const handleNext = useCallback(async () => {
    // Welcome step - just proceed
    if (step === 1) {
      setStep(2)
      return
    }

    // Personal info step - validate and save
    if (step === 2) {
      if (!validateStep(2)) return
      const saved = await savePersonalInfo()
      if (saved) {
        setStep(3)
      }
      return
    }

    // Address step - validate and save
    if (step === 3) {
      if (!validateStep(3)) return
      const saved = await saveAddress()
      if (saved) {
        setStep(4)
      }
      return
    }
  }, [step, validateStep, savePersonalInfo, saveAddress])

  const handlePrevious = useCallback(() => {
    if (step > 1) {
      setErrors({})
      setStep(step - 1)
    }
  }, [step])

  const handleComplete = useCallback(async () => {
    const completed = await completeOnboarding()
    if (completed) {
      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push(`/${tenantSlug}/dashboard`)
      }, 1500)
    }
  }, [completeOnboarding, router, tenantSlug])

  const handleGoToDashboard = useCallback(() => {
    router.push(`/${tenantSlug}/dashboard`)
  }, [router, tenantSlug])

  // ==================== RETURN ====================

  return {
    // Tenant
    tenant,
    tenantSlug,

    // Step
    step,
    handleNext,
    handlePrevious,

    // Personal info
    firstName,
    setFirstName,
    lastName,
    setLastName,
    preferredName,
    setPreferredName,
    phone,
    setPhone,
    avatarFile,
    setAvatarFile,

    // Address
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

    // Form state
    errors,
    isSubmitting,
    success,

    // Actions
    handleComplete,
    handleGoToDashboard,
  }
}

export type UseOnboardingReturn = ReturnType<typeof useOnboarding>
