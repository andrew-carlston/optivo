'use client'

import { useState, useCallback, useEffect } from 'react'
import { useParams } from 'next/navigation'
import type { TenantInfo } from '../../layout'

export type SignInStep = 'email' | 'password'

export interface UserInfo {
  firstName: string
  lastName: string
  title: string | null
  avatar: string | null
}

export interface UseSignInReturn {
  // Tenant info
  tenant: TenantInfo | null

  // Step navigation
  step: SignInStep
  handleBack: () => void

  // Form state
  email: string
  password: string
  handleEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handlePasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void

  // Submission state
  isCheckingEmail: boolean
  isSigningIn: boolean
  error: string | null

  // Form handlers
  handleEmailSubmit: (e?: React.FormEvent | React.MouseEvent) => Promise<void>
  handlePasswordSubmit: (e?: React.FormEvent | React.MouseEvent) => Promise<void>

  // User info (from email check)
  userInfo: UserInfo | null

  // UI helpers
  canSubmitEmail: boolean
  canSubmitPassword: boolean
  emailButtonText: string
  passwordButtonText: string
  userDisplayName: string
}

export function useSignIn(): UseSignInReturn {
  const params = useParams<{ tenant: string }>()
  const tenantSlug = params.tenant

  // ============================================
  // STATE
  // ============================================

  // Tenant data (loaded from layout's injected JSON)
  const [tenant, setTenant] = useState<TenantInfo | null>(null)

  // Step navigation
  const [step, setStep] = useState<SignInStep>('email')

  // Form data
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Loading states
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)

  // Error state
  const [error, setError] = useState<string | null>(null)

  // User info (returned from email check)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)

  // ============================================
  // EFFECTS
  // ============================================

  // Load tenant data from layout's injected script
  useEffect(() => {
    const tenantDataScript = document.getElementById('tenant-data')
    if (tenantDataScript) {
      try {
        const tenantData = JSON.parse(tenantDataScript.textContent || '{}')
        setTenant(tenantData)
      } catch (err) {
        console.error('Failed to parse tenant data:', err)
      }
    }
  }, [])

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const canSubmitEmail = isValidEmail && !isCheckingEmail
  const canSubmitPassword = password.length >= 1 && !isSigningIn

  const emailButtonText = isCheckingEmail ? 'Checking...' : 'Continue'
  const passwordButtonText = isSigningIn ? 'Signing in...' : 'Sign In'

  // Compute display name: prefer full name, fall back to email
  const userDisplayName = (() => {
    if (!userInfo) return email
    const fullName = [userInfo.firstName, userInfo.lastName]
      .filter(Boolean)
      .join(' ')
      .trim()
    return fullName || email
  })()

  // ============================================
  // HANDLERS
  // ============================================

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    setError(null)
  }, [])

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    setError(null)
  }, [])

  const handleBack = useCallback(() => {
    setStep('email')
    setPassword('')
    setError(null)
    setUserInfo(null)
  }, [])

  const handleEmailSubmit = useCallback(async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault()

    if (!canSubmitEmail) return

    setIsCheckingEmail(true)
    setError(null)

    try {
      const response = await fetch(`/api/${tenantSlug}/user-exists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok && data.exists) {
        // Store user info if returned from API
        if (data.user) {
          setUserInfo({
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            title: data.user.title || null,
            avatar: data.user.avatar || null,
          })
        }
        setStep('password')
      } else if (response.ok && !data.exists) {
        setError('No account found with this email address.')
      } else {
        setError(data.error || 'Unable to verify email. Please try again.')
      }
    } catch (err) {
      console.error('Email check error:', err)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsCheckingEmail(false)
    }
  }, [canSubmitEmail, email, tenantSlug])

  const handlePasswordSubmit = useCallback(async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault()

    if (!canSubmitPassword) return

    setIsSigningIn(true)
    setError(null)

    try {
      const response = await fetch(`/api/${tenantSlug}/sign-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Store user info for use in other pages (e.g., onboarding)
        if (data.user?.id) {
          localStorage.setItem('userId', data.user.id)
          localStorage.setItem('userEmail', data.user.email || email)
        }

        // Redirect new users to onboarding, existing users to dashboard
        if (data.isNew) {
          window.location.href = `/${tenantSlug}/onboarding`
        } else {
          window.location.href = `/${tenantSlug}/dashboard`
        }
      } else {
        setError(data.error || 'Invalid password. Please try again.')
      }
    } catch (err) {
      console.error('Sign-in error:', err)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsSigningIn(false)
    }
  }, [canSubmitPassword, email, password, tenantSlug])

  // ============================================
  // RETURN
  // ============================================

  return {
    // Tenant info
    tenant,

    // Step navigation
    step,
    handleBack,

    // Form state
    email,
    password,
    handleEmailChange,
    handlePasswordChange,

    // Submission state
    isCheckingEmail,
    isSigningIn,
    error,

    // Form handlers
    handleEmailSubmit,
    handlePasswordSubmit,

    // User info
    userInfo,

    // UI helpers
    canSubmitEmail,
    canSubmitPassword,
    emailButtonText,
    passwordButtonText,
    userDisplayName,
  }
}

export default useSignIn
