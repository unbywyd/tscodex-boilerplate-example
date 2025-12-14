// Specialist App
// Main wrapper for the specialist mobile application

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { MobileToastProvider } from '@/components/ui'
import type { SpecialistUser } from '@prototype/factories'
import { Onboarding, NotificationToast } from '@prototype/components'
import LoginScreen from './LoginScreen'
import SpecialistHome from './SpecialistHome'
import SpecialistOrders from './SpecialistOrders'
import ActiveShift from './ActiveShift'
import AvailabilitySetup from './AvailabilitySetup'

type Screen = 'onboarding' | 'home' | 'orders' | 'shift' | 'availability'

const ONBOARDING_KEY = 'eldercare_specialist_onboarding_complete'

export default function SpecialistApp() {
  const { isAuthenticated } = useAuth<SpecialistUser>({ namespace: 'specialist' })
  const [screen, setScreen] = useState<Screen>('onboarding')
  const [activeOrderId, setActiveOrderId] = useState<string | undefined>()
  const [onboardingComplete, setOnboardingComplete] = useState(false)

  // Check if onboarding was completed before
  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY) === 'true'
    if (completed) {
      setOnboardingComplete(true)
      setScreen('home')
    }
  }, [])

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setOnboardingComplete(true)
    setScreen('home')
  }

  const navigate = (target: string, orderId?: string) => {
    if (orderId) setActiveOrderId(orderId)
    setScreen(target as Screen)
  }

  const renderContent = () => {
    // Show onboarding for first-time users
    if (screen === 'onboarding' && !onboardingComplete) {
      return (
        <Onboarding
          app="specialist"
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingComplete}
        />
      )
    }

    // Require login - no skip option
    if (!isAuthenticated) {
      return <LoginScreen onLogin={() => setScreen('home')} />
    }

    // Main app screens
    switch (screen) {
      case 'orders':
        return (
          <SpecialistOrders
            onBack={() => setScreen('home')}
            onNavigate={navigate}
          />
        )
      case 'shift':
        return (
          <ActiveShift
            onBack={() => setScreen('orders')}
            orderId={activeOrderId}
          />
        )
      case 'availability':
        return (
          <AvailabilitySetup
            onBack={() => setScreen('home')}
            onNavigate={navigate}
          />
        )
      case 'home':
      default:
        return <SpecialistHome onNavigate={navigate} />
    }
  }

  return (
    <MobileToastProvider position="bottom" offset={80}>
      <NotificationToast app="specialist" />
      {renderContent()}
    </MobileToastProvider>
  )
}
