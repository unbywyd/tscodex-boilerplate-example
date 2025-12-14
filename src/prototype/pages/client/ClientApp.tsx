// Client App
// Main wrapper for the client mobile application

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { MobileToastProvider } from '@/components/ui'
import type { ClientUser } from '@prototype/factories'
import { Onboarding, NotificationToast } from '@prototype/components'
import LoginScreen from './LoginScreen'
import ClientHome from './ClientHome'
import OrderForm from './OrderForm'
import OrderTracking from './OrderTracking'
import OrderHistory from './OrderHistory'

type Screen = 'onboarding' | 'login' | 'home' | 'order' | 'track' | 'history' | 'review'

const ONBOARDING_KEY = 'eldercare_client_onboarding_complete'

export default function ClientApp() {
  const { isAuthenticated } = useAuth<ClientUser>({ namespace: 'client' })
  const [screen, setScreen] = useState<Screen>('onboarding')
  const [skippedLogin, setSkippedLogin] = useState(false)
  const [onboardingComplete, setOnboardingComplete] = useState(false)

  // Check if onboarding was completed before
  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY) === 'true'
    if (completed) {
      setOnboardingComplete(true)
      setScreen('login')
    }
  }, [])

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setOnboardingComplete(true)
    setScreen('login')
  }

  const navigate = (target: string) => {
    setScreen(target as Screen)
  }

  const renderContent = () => {
    // Show onboarding for first-time users
    if (screen === 'onboarding' && !onboardingComplete) {
      return (
        <Onboarding
          app="client"
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingComplete}
        />
      )
    }

    // Show login if not authenticated and not skipped, or if explicitly navigating to login
    if (screen === 'login' && !isAuthenticated && !skippedLogin) {
      return (
        <LoginScreen
          onLogin={() => setScreen('home')}
          onSkip={() => {
            setSkippedLogin(true)
            setScreen('home')
          }}
        />
      )
    }

    // Main app screens
    switch (screen) {
      case 'login':
        // User wants to login later
        return (
          <LoginScreen
            onLogin={() => setScreen('home')}
            onSkip={() => setScreen('home')}
          />
        )
      case 'order':
        return (
          <OrderForm
            onBack={() => setScreen('home')}
            onSuccess={() => setScreen('track')}
          />
        )
      case 'track':
        return (
          <OrderTracking
            onBack={() => setScreen('home')}
            onNavigate={navigate}
          />
        )
      case 'history':
        return (
          <OrderHistory
            onBack={() => setScreen('home')}
            onNavigate={navigate}
          />
        )
      case 'home':
      default:
        return <ClientHome onNavigate={navigate} />
    }
  }

  return (
    <MobileToastProvider position="bottom" offset={80}>
      <NotificationToast app="client" />
      {renderContent()}
    </MobileToastProvider>
  )
}
