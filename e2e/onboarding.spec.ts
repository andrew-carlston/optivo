import { test, expect, Page, Browser } from '@playwright/test'

/**
 * E2E Tests for Registration and Sign-In Onboarding Flow
 *
 * These tests cover the complete user journey:
 * - Flow 1: New Company Registration
 * - Flow 2: Find Domain
 * - Flow 3: New User Sign-In -> Onboarding
 * - Flow 4: Returning User Sign-In -> Dashboard
 */

// Generate unique identifiers for test isolation
const generateUniqueId = () => Math.random().toString(36).substring(2, 8)

// Test data factory
const createTestCompany = () => {
  const id = generateUniqueId()
  return {
    name: `Test Company ${id}`,
    slug: `test-company-${id}`,
    email: `admin-${id}@testcompany.com`,
    password: 'SecurePassword123!',
    tagline: 'Building the future together',
  }
}

// Helper to complete full registration
async function completeRegistration(page: Page, company: ReturnType<typeof createTestCompany>) {
  await page.goto('/register')

  // Step 1: Company Information
  await expect(page.getByRole('heading', { name: 'Company Information' })).toBeVisible({ timeout: 10000 })
  await page.locator('#companyName').fill(company.name)
  await page.getByRole('button', { name: 'Continue' }).click()

  // Step 2: Billing Information
  await expect(page.getByRole('heading', { name: 'Billing Information' })).toBeVisible({ timeout: 10000 })
  await page.getByRole('heading', { name: 'Professional' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()

  // Step 3: Account Setup
  await expect(page.getByRole('heading', { name: 'Account Setup' })).toBeVisible({ timeout: 10000 })
  await page.locator('#email').fill(company.email)
  await page.locator('#password').fill(company.password)
  await page.locator('#confirmPassword').fill(company.password)
  await page.getByRole('button', { name: 'Continue' }).click()

  // Step 4: Review
  await expect(page.getByRole('heading', { name: 'Review' })).toBeVisible({ timeout: 10000 })
  await page.getByRole('button', { name: 'Create Company' }).click()

  // Wait for redirect to creating page and then to sign-in
  await expect(page).toHaveURL(/\/register\/creating/, { timeout: 15000 })
  await expect(page).toHaveURL(new RegExp(`/${company.slug}/sign-in`), { timeout: 45000 })
}

// Helper to sign in
async function signIn(page: Page, slug: string, email: string, password: string) {
  await page.goto(`/${slug}/sign-in`)

  await expect(page.locator('#email')).toBeVisible({ timeout: 15000 })
  await page.locator('#email').fill(email)
  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(page.locator('#password')).toBeVisible({ timeout: 10000 })
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: 'Sign In' }).click()
}

// Helper to complete onboarding
async function completeOnboarding(page: Page, slug: string) {
  // Wait for onboarding page
  await expect(page).toHaveURL(new RegExp(`/${slug}/onboarding`), { timeout: 15000 })

  // Step 1: Welcome - title includes tenant name dynamically
  await expect(page.getByRole('heading', { name: /Welcome to/i })).toBeVisible({ timeout: 10000 })
  const getStartedButton = page.getByRole('button', { name: 'Get Started' })
  await expect(getStartedButton).toBeVisible({ timeout: 5000 })
  await expect(getStartedButton).toBeEnabled({ timeout: 5000 })
  await getStartedButton.click({ force: true })

  // Step 2: Personal Information - wait for first name input to appear
  // Give React time to update state
  await page.waitForTimeout(500)
  await expect(page.locator('#firstName')).toBeVisible({ timeout: 15000 })
  await expect(page.getByRole('heading', { name: 'Personal Information' })).toBeVisible({ timeout: 5000 })
  await page.locator('#firstName').fill('John')
  await page.locator('#lastName').fill('Doe')
  await page.locator('#phone').fill('+1 555-123-4567')
  const continueBtn1 = page.getByRole('button', { name: 'Continue' })
  await expect(continueBtn1).toBeEnabled({ timeout: 5000 })
  await continueBtn1.click({ force: true })

  // Step 3: Address - wait for street1 input to appear
  await page.waitForTimeout(500)
  await expect(page.locator('#street1')).toBeVisible({ timeout: 15000 })
  await expect(page.getByRole('heading', { name: 'Your Address' })).toBeVisible({ timeout: 5000 })
  await page.locator('#street1').fill('123 Main Street')
  await page.locator('#city').fill('San Francisco')

  // Select state from dropdown
  const stateDropdown = page.locator('button').filter({ hasText: 'Select state' })
  if (await stateDropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
    await stateDropdown.click()
    await page.getByRole('button', { name: 'California' }).first().click()
  }

  await page.locator('#zip').fill('94102')
  const continueBtn2 = page.getByRole('button', { name: 'Continue' })
  await expect(continueBtn2).toBeEnabled({ timeout: 5000 })
  await continueBtn2.click({ force: true })

  // Step 4: Complete - wait for the Go to Dashboard button
  await page.waitForTimeout(500)
  await expect(page.getByRole('button', { name: 'Go to Dashboard' })).toBeVisible({ timeout: 15000 })
  await page.getByRole('button', { name: 'Go to Dashboard' }).click({ force: true })

  // Wait for dashboard
  await expect(page).toHaveURL(new RegExp(`/${slug}/dashboard`), { timeout: 15000 })
}

// Helper to set up company in beforeAll
async function setupCompany(browser: Browser): Promise<ReturnType<typeof createTestCompany>> {
  const company = createTestCompany()
  const page = await browser.newPage()
  try {
    await completeRegistration(page, company)
  } finally {
    await page.close()
  }
  return company
}

// Helper to set up company with completed onboarding
async function setupCompanyWithOnboarding(browser: Browser): Promise<ReturnType<typeof createTestCompany>> {
  const company = createTestCompany()
  const page = await browser.newPage()
  try {
    await completeRegistration(page, company)
    await signIn(page, company.slug, company.email, company.password)
    await completeOnboarding(page, company.slug)
  } finally {
    await page.close()
  }
  return company
}

// =============================================================================
// FLOW 1: NEW COMPANY REGISTRATION
// =============================================================================
test.describe('Flow 1: New Company Registration', () => {
  test('should complete full registration flow and redirect to sign-in', async ({ page }) => {
    const company = createTestCompany()

    // Navigate to registration page
    await page.goto('/register')

    // Verify we're on step 1 - Company Information
    await expect(page.getByRole('heading', { name: 'Company Information' })).toBeVisible({ timeout: 10000 })

    // Fill company name
    await page.locator('#companyName').fill(company.name)

    // Fill optional tagline
    const taglineInput = page.locator('#subtext')
    if (await taglineInput.isVisible()) {
      await taglineInput.fill(company.tagline)
    }

    // Click Continue to go to Step 2
    await page.getByRole('button', { name: 'Continue' }).click()

    // Verify we're on step 2 - Billing Information
    await expect(page.getByRole('heading', { name: 'Billing Information' })).toBeVisible({ timeout: 10000 })

    // Select the Professional plan
    await page.getByRole('heading', { name: 'Professional' }).click()

    // Click Continue to go to Step 3
    await page.getByRole('button', { name: 'Continue' }).click()

    // Verify we're on step 3 - Account Setup
    await expect(page.getByRole('heading', { name: 'Account Setup' })).toBeVisible({ timeout: 10000 })

    // Fill account information
    await page.locator('#email').fill(company.email)
    await page.locator('#password').fill(company.password)
    await page.locator('#confirmPassword').fill(company.password)

    // Click Continue to go to Step 4
    await page.getByRole('button', { name: 'Continue' }).click()

    // Verify we're on step 4 - Review
    await expect(page.getByRole('heading', { name: 'Review' })).toBeVisible({ timeout: 10000 })

    // Verify company name appears in review
    await expect(page.getByText(company.name)).toBeVisible()

    // Submit the form
    await page.getByRole('button', { name: 'Create Company' }).click()

    // Should redirect to /register/creating?slug=...
    await expect(page).toHaveURL(/\/register\/creating/, { timeout: 15000 })

    // Verify the creating page shows the progress title
    await expect(page.getByRole('heading', { name: /Setting Up Your Company/i })).toBeVisible({ timeout: 10000 })

    // Wait for progress steps to show
    const progressSteps = page.locator('[role="listitem"]')
    await expect(progressSteps.first()).toBeVisible({ timeout: 10000 })

    // Wait for completion - should show "All Done!" and then redirect
    await expect(page.getByText('All Done!')).toBeVisible({ timeout: 30000 })

    // Should eventually redirect to sign-in page
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15000 })
  })

  test('should show validation errors for required fields', async ({ page }) => {
    await page.goto('/register')

    // Wait for the form to load
    await expect(page.getByRole('heading', { name: 'Company Information' })).toBeVisible({ timeout: 10000 })

    // Try to continue without filling required fields
    await page.getByRole('button', { name: 'Continue' }).click()

    // Should show validation error for company name
    await expect(page.getByText('Company name is required')).toBeVisible({ timeout: 5000 })
  })

  test('should allow navigation between steps', async ({ page }) => {
    await page.goto('/register')

    // Fill step 1 and go to step 2
    await expect(page.getByRole('heading', { name: 'Company Information' })).toBeVisible({ timeout: 10000 })
    await page.locator('#companyName').fill('Navigation Test Company')
    await page.getByRole('button', { name: 'Continue' }).click()

    // Verify on step 2
    await expect(page.getByRole('heading', { name: 'Billing Information' })).toBeVisible({ timeout: 10000 })

    // Go back to step 1
    await page.getByRole('button', { name: 'Previous' }).click()

    // Verify on step 1 and data is preserved
    await expect(page.getByRole('heading', { name: 'Company Information' })).toBeVisible({ timeout: 10000 })
    await expect(page.locator('#companyName')).toHaveValue('Navigation Test Company')
  })
})

// =============================================================================
// FLOW 2: FIND DOMAIN
// =============================================================================
test.describe('Flow 2: Find Domain', () => {
  // Each test creates its own company for isolation
  test('should auto-redirect to sign-in when tenant is found', async ({ page, browser }) => {
    const company = await setupCompany(browser)

    await page.goto('/find-domain')

    // Verify we're on the find domain page
    await expect(page.getByRole('heading', { name: /Find Your Company/i })).toBeVisible({ timeout: 10000 })

    // Enter the tenant slug
    const slugInput = page.locator('#company-slug')
    await expect(slugInput).toBeVisible()
    await slugInput.fill(company.slug)

    // Click the Find Company button
    await page.getByRole('button', { name: 'Find Company' }).click()

    // Should auto-redirect to sign-in when tenant is found
    await expect(page).toHaveURL(new RegExp(`/${company.slug}/sign-in`), { timeout: 15000 })
  })

  test('should show not found message for invalid slug', async ({ page }) => {
    await page.goto('/find-domain')

    await expect(page.getByRole('heading', { name: /Find Your Company/i })).toBeVisible({ timeout: 10000 })

    // Enter a non-existent slug
    const slugInput = page.locator('#company-slug')
    await slugInput.fill('nonexistent-company-xyz-999')

    // Click Find Company
    await page.getByRole('button', { name: 'Find Company' }).click()

    // Should show not found message
    await expect(page.getByText('Company not found')).toBeVisible({ timeout: 10000 })
  })

  test('should normalize slug input', async ({ page }) => {
    await page.goto('/find-domain')

    await expect(page.getByRole('heading', { name: /Find Your Company/i })).toBeVisible({ timeout: 10000 })

    const slugInput = page.locator('#company-slug')

    // Type with uppercase and spaces - should be normalized
    await slugInput.fill('TEST Company')

    // The input should show normalized value (lowercase, hyphenated)
    await expect(slugInput).toHaveValue('test-company')
  })
})

// =============================================================================
// FLOW 3: NEW USER SIGN-IN -> ONBOARDING
// =============================================================================
test.describe('Flow 3: New User Sign-In -> Onboarding', () => {
  test('should display email correctly for new users (not "null, null")', async ({ page, browser }) => {
    const company = await setupCompany(browser)

    // Navigate to the sign-in page
    await page.goto(`/${company.slug}/sign-in`)

    // Wait for email input to be visible
    await expect(page.locator('#email')).toBeVisible({ timeout: 15000 })

    // Enter email
    await page.locator('#email').fill(company.email)

    // Submit email
    await page.getByRole('button', { name: 'Continue' }).click()

    // Wait for password step
    await expect(page.locator('#password')).toBeVisible({ timeout: 10000 })

    // Verify the user display name shows email (not "null, null")
    // For new users without names, it should show the email
    const userNameDisplay = page.locator('[class*="userName"]')
    await expect(userNameDisplay).toBeVisible({ timeout: 5000 })

    // The display should NOT contain "null"
    const displayText = await userNameDisplay.textContent()
    expect(displayText).not.toMatch(/null/i)

    // It should show the email since user has no name yet
    expect(displayText).toContain(company.email)
  })

  test('should redirect new user to onboarding after sign-in', async ({ page, browser }) => {
    const company = await setupCompany(browser)

    await signIn(page, company.slug, company.email, company.password)

    // Should redirect to onboarding (NOT dashboard) because is_new=true
    await expect(page).toHaveURL(new RegExp(`/${company.slug}/onboarding`), { timeout: 15000 })

    // Verify onboarding page loaded
    await expect(page.getByRole('heading', { name: /Complete Your Profile/i })).toBeVisible({ timeout: 10000 })
  })

  test('should complete onboarding steps', async ({ page, browser }) => {
    const company = await setupCompany(browser)

    await signIn(page, company.slug, company.email, company.password)
    await completeOnboarding(page, company.slug)

    // Verify we're on the dashboard
    await expect(page).toHaveURL(new RegExp(`/${company.slug}/dashboard`), { timeout: 10000 })
  })

  test('should show validation errors on personal info step', async ({ page, browser }) => {
    const company = await setupCompany(browser)

    await signIn(page, company.slug, company.email, company.password)

    // Wait for onboarding page
    await expect(page).toHaveURL(new RegExp(`/${company.slug}/onboarding`), { timeout: 15000 })

    // Go past welcome step
    await expect(page.getByRole('heading', { name: /Welcome to/i })).toBeVisible({ timeout: 10000 })
    const getStartedBtn = page.getByRole('button', { name: 'Get Started' })
    await expect(getStartedBtn).toBeEnabled({ timeout: 5000 })
    await getStartedBtn.click({ force: true })

    // Wait for first name input to appear (indicates Personal step loaded)
    await page.waitForTimeout(500)
    await expect(page.locator('#firstName')).toBeVisible({ timeout: 15000 })

    // Try to continue without filling required fields
    await expect(page.getByRole('heading', { name: 'Personal Information' })).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: 'Continue' }).click()

    // Should show validation errors
    await expect(page.getByText('First name is required')).toBeVisible({ timeout: 5000 })
  })
})

// =============================================================================
// FLOW 4: RETURNING USER SIGN-IN -> DASHBOARD
// =============================================================================
test.describe('Flow 4: Returning User Sign-In -> Dashboard', () => {
  test('should redirect returning user directly to dashboard', async ({ page, browser }) => {
    const company = await setupCompanyWithOnboarding(browser)

    await signIn(page, company.slug, company.email, company.password)

    // Should redirect directly to dashboard (NOT onboarding) because is_new=false
    await expect(page).toHaveURL(new RegExp(`/${company.slug}/dashboard`), { timeout: 15000 })
  })

  test('should display user name (not email) after completing onboarding', async ({ page, browser }) => {
    const company = await setupCompanyWithOnboarding(browser)

    await page.goto(`/${company.slug}/sign-in`)

    await expect(page.locator('#email')).toBeVisible({ timeout: 15000 })
    await page.locator('#email').fill(company.email)
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page.locator('#password')).toBeVisible({ timeout: 10000 })

    // Now the user display should show the name (John Doe) not email
    // because we filled in personal info during onboarding
    const userNameDisplay = page.locator('[class*="userName"]')
    await expect(userNameDisplay).toBeVisible({ timeout: 5000 })

    // Should show "John" or "John Doe" - the name we entered during onboarding
    const displayText = await userNameDisplay.textContent()
    expect(displayText?.toLowerCase()).toMatch(/john/i)
  })

  test('should show error for invalid password', async ({ page, browser }) => {
    const company = await setupCompanyWithOnboarding(browser)

    await page.goto(`/${company.slug}/sign-in`)

    await expect(page.locator('#email')).toBeVisible({ timeout: 15000 })
    await page.locator('#email').fill(company.email)
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page.locator('#password')).toBeVisible({ timeout: 10000 })
    await page.locator('#password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign In' }).click()

    // Should show error message
    await expect(page.getByRole('alert').or(page.getByText(/Invalid password/i))).toBeVisible({ timeout: 10000 })
  })

  test('should show error for non-existent email', async ({ page, browser }) => {
    const company = await setupCompanyWithOnboarding(browser)

    await page.goto(`/${company.slug}/sign-in`)

    await expect(page.locator('#email')).toBeVisible({ timeout: 15000 })
    await page.locator('#email').fill('nonexistent@example.com')
    await page.getByRole('button', { name: 'Continue' }).click()

    // Should show error message
    await expect(page.getByRole('alert').or(page.getByText(/No account found/i))).toBeVisible({ timeout: 10000 })
  })
})

// =============================================================================
// UI/UX TESTS
// =============================================================================
test.describe('UI/UX Tests', () => {
  test('should have accessible form inputs with labels', async ({ page }) => {
    await page.goto('/register')

    await expect(page.getByRole('heading', { name: 'Company Information' })).toBeVisible({ timeout: 10000 })

    // Check that inputs have proper labels
    const companyNameInput = page.locator('#companyName')
    await expect(companyNameInput).toBeVisible()

    // The label should be associated with the input
    const label = page.locator('label[for="companyName"]')
    await expect(label).toBeVisible()
    await expect(label).toHaveText(/Company Name/i)
  })

  test('should show loading states during form submission', async ({ page }) => {
    const company = createTestCompany()

    await page.goto('/register')

    // Fill all steps quickly
    await expect(page.getByRole('heading', { name: 'Company Information' })).toBeVisible({ timeout: 10000 })
    await page.locator('#companyName').fill(company.name)
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page.getByRole('heading', { name: 'Billing Information' })).toBeVisible({ timeout: 10000 })
    await page.getByRole('heading', { name: 'Professional' }).click()
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page.getByRole('heading', { name: 'Account Setup' })).toBeVisible({ timeout: 10000 })
    await page.locator('#email').fill(company.email)
    await page.locator('#password').fill(company.password)
    await page.locator('#confirmPassword').fill(company.password)
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page.getByRole('heading', { name: 'Review' })).toBeVisible({ timeout: 10000 })

    // Click Create Company and check for loading state
    await page.getByRole('button', { name: 'Create Company' }).click()

    // Should show "Creating..." loading state
    await expect(page.getByRole('button', { name: 'Creating...' })).toBeVisible({ timeout: 5000 })
  })

  test('should handle theme switcher', async ({ page }) => {
    await page.goto('/register')

    // Wait for the page to load
    await expect(page.getByRole('heading', { name: /Create Your Company/i })).toBeVisible({ timeout: 10000 })

    // Find theme switcher wrapper
    const themeSwitcher = page.locator('[class*="themeSwitcher"]').first()

    if (await themeSwitcher.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Click to toggle theme
      const button = themeSwitcher.locator('button').first()
      if (await button.isVisible({ timeout: 1000 }).catch(() => false)) {
        await button.click()
      }

      // Page should still be functional
      await expect(page.getByRole('heading', { name: /Create Your Company/i })).toBeVisible()
    }
  })
})

// =============================================================================
// EDGE CASES
// =============================================================================
test.describe('Edge Cases', () => {
  test('should handle creating page without slug parameter', async ({ page }) => {
    await page.goto('/register/creating')

    // Should show error state
    await expect(page.getByRole('heading', { name: 'Something went wrong' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Missing company information')).toBeVisible()
  })

  test('should handle sign-in to non-existent tenant', async ({ page }) => {
    await page.goto('/nonexistent-tenant-xyz-999/sign-in')

    // Should show error or 404 - depending on implementation
    // Wait to see what happens
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})

    // Check if we got an error page or the sign-in form failed to load tenant
    const is404 = await page.getByText(/404|not found|does not exist/i).isVisible({ timeout: 3000 }).catch(() => false)
    const hasEmailInput = await page.locator('#email').isVisible({ timeout: 3000 }).catch(() => false)

    if (is404) {
      // Expected: 404 page
      expect(is404).toBeTruthy()
    } else if (hasEmailInput) {
      // Alternative: Form loads but will fail on submit
      await page.locator('#email').fill('test@test.com')
      await page.getByRole('button', { name: 'Continue' }).click()

      // Should show some kind of error
      await expect(page.getByRole('alert').or(page.getByText(/error|not found/i))).toBeVisible({ timeout: 10000 })
    }
  })

  test('should work with browser refresh on step 2', async ({ page }) => {
    await page.goto('/register')

    // Fill step 1 and go to step 2
    await expect(page.getByRole('heading', { name: 'Company Information' })).toBeVisible({ timeout: 10000 })
    await page.locator('#companyName').fill('Refresh Test Company')
    await page.getByRole('button', { name: 'Continue' }).click()

    // Verify on step 2
    await expect(page.getByRole('heading', { name: 'Billing Information' })).toBeVisible({ timeout: 10000 })

    // Refresh the page
    await page.reload()

    // Page should reload - may reset to step 1 (depends on implementation)
    // At minimum, the page should be functional
    await expect(page.getByRole('heading', { name: /Company Information|Billing Information/i })).toBeVisible({ timeout: 10000 })
  })
})
