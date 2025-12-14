// Admin App
// Main wrapper for the admin mobile application

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { MobileToastProvider } from '@/components/ui'
import type { AdminUser } from '@prototype/factories'
import { Onboarding, NotificationToast } from '@prototype/components'
import LoginScreen from './LoginScreen'
import AdminDashboard from './AdminDashboard'
import AdminOrders from './AdminOrders'
import AdminSpecialists from './AdminSpecialists'

type Screen = 'onboarding' | 'dashboard' | 'orders' | 'specialists'

const ONBOARDING_KEY = 'eldercare_admin_onboarding_complete'

export default function AdminApp() {
  const { isAuthenticated } = useAuth<AdminUser>({ namespace: 'admin' })
  const [screen, setScreen] = useState<Screen>('onboarding')
  const [onboardingComplete, setOnboardingComplete] = useState(false)

  // Check if onboarding was completed before
  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY) === 'true'
    if (completed) {
      setOnboardingComplete(true)
      setScreen('dashboard')
    }
  }, [])

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setOnboardingComplete(true)
    setScreen('dashboard')
  }

  const navigate = (target: string) => {
    setScreen(target as Screen)
  }

  const renderContent = () => {
    // Show onboarding for first-time users
    if (screen === 'onboarding' && !onboardingComplete) {
      return (
        <Onboarding
          app="admin"
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingComplete}
        />
      )
    }

    // Require login - no skip option
    if (!isAuthenticated) {
      return <LoginScreen onLogin={() => setScreen('dashboard')} />
    }

    // Main app screens
    switch (screen) {
      case 'orders':
        return (
          <AdminOrders
            onBack={() => setScreen('dashboard')}
            onNavigate={navigate}
          />
        )
      case 'specialists':
        return (
          <AdminSpecialists
            onBack={() => setScreen('dashboard')}
            onNavigate={navigate}
          />
        )
      case 'dashboard':
      default:
        return <AdminDashboard onNavigate={navigate} />
    }
  }

  return (
    <MobileToastProvider position="bottom" offset={80}>
      <NotificationToast app="admin" />
      {renderContent()}
    </MobileToastProvider>
  )
}
