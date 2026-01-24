'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, Button, Container } from '@/components'
import styles from './page.module.sass'

interface TenantInfo {
  name: string
}

interface UserInfo {
  firstName?: string
  preferredName?: string
  email?: string
}

export default function DashboardPage() {
  const params = useParams()
  const tenantSlug = params.tenant as string

  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const userName = user?.preferredName || user?.firstName || user?.email?.split('@')[0] || 'User'

  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true)
      try {
        const userId = localStorage.getItem('userId')
        if (userId) {
          const response = await fetch(`/api/${tenantSlug}/user?userId=${userId}`)
          if (response.ok) {
            const userData = await response.json()
            setUser(userData)
          }
        }
      } catch (error) {
        console.error('Failed to load user data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (tenantSlug) {
      loadUserData()
    }
  }, [tenantSlug])

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Container>
          <header className={styles.pageHeader}>
            <h1 className={styles.title}>
              Welcome back, <span className={styles.accent}>{userName}</span>
            </h1>
            <p className={styles.subtitle}>
              Here&apos;s what&apos;s happening with your projects today.
            </p>
          </header>

          <section className={styles.statsGrid}>
            <Card className={styles.statCard}>
              <div className={styles.statValue}>12</div>
              <div className={styles.statLabel}>Active Projects</div>
            </Card>
            <Card className={styles.statCard}>
              <div className={styles.statValue}>48</div>
              <div className={styles.statLabel}>Tasks Completed</div>
            </Card>
            <Card className={styles.statCard}>
              <div className={styles.statValue}>8</div>
              <div className={styles.statLabel}>Team Members</div>
            </Card>
            <Card className={styles.statCard}>
              <div className={styles.statValue}>95%</div>
              <div className={styles.statLabel}>On Track</div>
            </Card>
          </section>

          <section className={styles.contentGrid}>
            <Card className={styles.contentCard}>
              <h2 className={styles.cardTitle}>Recent Activity</h2>
              <div className={styles.activityList}>
                <div className={styles.activityItem}>
                  <div className={styles.activityDot} />
                  <div className={styles.activityContent}>
                    <p className={styles.activityText}>New project created</p>
                    <span className={styles.activityTime}>2 hours ago</span>
                  </div>
                </div>
                <div className={styles.activityItem}>
                  <div className={styles.activityDot} />
                  <div className={styles.activityContent}>
                    <p className={styles.activityText}>Task completed: Design review</p>
                    <span className={styles.activityTime}>4 hours ago</span>
                  </div>
                </div>
                <div className={styles.activityItem}>
                  <div className={styles.activityDot} />
                  <div className={styles.activityContent}>
                    <p className={styles.activityText}>Team meeting scheduled</p>
                    <span className={styles.activityTime}>Yesterday</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className={styles.contentCard}>
              <h2 className={styles.cardTitle}>Quick Actions</h2>
              <div className={styles.quickActions}>
                <Button className={styles.quickActionButton}>
                  <PlusIcon />
                  <span>New Project</span>
                </Button>
                <Button className={styles.quickActionButton}>
                  <TaskIcon />
                  <span>Add Task</span>
                </Button>
                <Button className={styles.quickActionButton}>
                  <TeamIcon />
                  <span>Invite Member</span>
                </Button>
              </div>
            </Card>
          </section>
        </Container>
      </main>
    </div>
  )
}

// Icons
const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const TaskIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
)

const TeamIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)
