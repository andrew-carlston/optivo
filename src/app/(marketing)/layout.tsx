import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Optivo - Elevate Your Workflow',
  description: 'Transform your productivity with Optivo. A modern platform designed to streamline your work and boost your efficiency.',
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
