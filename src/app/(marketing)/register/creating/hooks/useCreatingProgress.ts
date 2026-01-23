'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export interface ProgressStep {
  id: number
  label: string
  duration: number
  status: 'pending' | 'in_progress' | 'completed'
}

const INITIAL_STEPS: Omit<ProgressStep, 'status'>[] = [
  { id: 1, label: 'Creating your workspace...', duration: 1000 },
  { id: 2, label: 'Setting up database...', duration: 1500 },
  { id: 3, label: 'Configuring permissions...', duration: 1000 },
  { id: 4, label: 'Preparing your dashboard...', duration: 1000 },
  { id: 5, label: 'Almost there...', duration: 500 },
]

const REDIRECT_DELAY = 1500

export function useCreatingProgress() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tenantSlug = searchParams.get('slug') || ''

  const [currentStep, setCurrentStep] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Generate steps with status
  const steps: ProgressStep[] = INITIAL_STEPS.map((step, index) => ({
    ...step,
    status:
      index < currentStep
        ? 'completed'
        : index === currentStep && !isComplete
        ? 'in_progress'
        : 'pending',
  }))

  // Progress through steps
  const progressToNextStep = useCallback(() => {
    setCurrentStep((prev) => {
      const nextStep = prev + 1
      if (nextStep >= INITIAL_STEPS.length) {
        setIsComplete(true)
        return prev
      }
      return nextStep
    })
  }, [])

  // Effect to handle step progression
  useEffect(() => {
    if (isComplete || currentStep >= INITIAL_STEPS.length) {
      return
    }

    const currentStepData = INITIAL_STEPS[currentStep]
    if (!currentStepData) return

    const timer = setTimeout(() => {
      if (currentStep === INITIAL_STEPS.length - 1) {
        // Mark last step as complete, then set isComplete
        setCurrentStep(INITIAL_STEPS.length)
        setIsComplete(true)
      } else {
        progressToNextStep()
      }
    }, currentStepData.duration)

    return () => clearTimeout(timer)
  }, [currentStep, isComplete, progressToNextStep])

  // Effect to handle redirect after completion
  useEffect(() => {
    if (!isComplete || isRedirecting || !tenantSlug) {
      return
    }

    const timer = setTimeout(() => {
      setIsRedirecting(true)
      router.push(`/${tenantSlug}/sign-in`)
    }, REDIRECT_DELAY)

    return () => clearTimeout(timer)
  }, [isComplete, isRedirecting, tenantSlug, router])

  return {
    currentStep,
    steps,
    isComplete,
    isRedirecting,
    tenantSlug,
  }
}

export type UseCreatingProgressReturn = ReturnType<typeof useCreatingProgress>
