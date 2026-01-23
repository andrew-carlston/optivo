'use client'

import { useState } from 'react'
import { Button, Input, Card, Form, ThemeSwitcher } from '@/components'
import styles from './page.module.sass'

const features = [
  {
    title: 'Lightning Fast',
    description: 'Optimized performance that keeps up with your workflow. No more waiting around.',
  },
  {
    title: 'Secure by Design',
    description: 'Enterprise-grade security built into every layer. Your data stays protected.',
  },
  {
    title: 'Team Collaboration',
    description: 'Work together seamlessly with real-time collaboration tools and shared workspaces.',
  },
  {
    title: 'Smart Analytics',
    description: 'Gain insights into your productivity with intelligent reporting and dashboards.',
  },
]

export default function MarketingPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [submitted, setSubmitted] = useState(false)

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {}

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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (validateForm()) {
      setSubmitted(true)
      setEmail('')
      setPassword('')
      setErrors({})
    }
  }

  return (
    <div className={styles.page}>
      {/* Theme Switcher - Fixed position */}
      <div className={styles.themeSwitcherWrapper}>
        <ThemeSwitcher />
      </div>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Elevate Your Workflow
          </h1>
          <p className={styles.heroSubtitle}>
            Transform your productivity with Optivo. A modern platform designed to streamline your work and boost your efficiency.
          </p>
          <div className={styles.heroCtas}>
            <a href="/register" style={{textDecoration: 'none'}}>
              <Button variant="default">Get Started</Button>
            </a>
            <Button variant="ghost">Learn More</Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>Why Choose Optivo?</h2>
        <div className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <Card key={index} hoverable>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Signup Section */}
      <section className={styles.signup}>
        <Card className={styles.signupCard}>
          <h2 className={styles.sectionTitle}>Start Your Journey</h2>
          <p className={styles.signupDescription}>
            Create your free account and experience the future of productivity.
          </p>

          {submitted ? (
            <div className={styles.successMessage}>
              <p>Welcome aboard! Check your email to get started.</p>
            </div>
          ) : (
            <Form onSubmit={handleSubmit} className={styles.signupForm}>
              <Input
                id="email"
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                autoComplete="email"
              />
              <Input
                id="password"
                label="Password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                autoComplete="new-password"
              />
              <Button type="submit" variant="default">
                Create Account
              </Button>
            </Form>
          )}
        </Card>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <span className={styles.footerLogo}>Optivo</span>
            <p className={styles.footerTagline}>Elevate your workflow</p>
          </div>
          <nav className={styles.footerLinks}>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </nav>
          <p className={styles.copyright}>
            &copy; {new Date().getFullYear()} Optivo. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
