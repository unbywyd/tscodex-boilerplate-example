// Onboarding - Welcome screens for first-time users
// Shows app features and guides users through initial setup

import { useState } from 'react'
import {
  Heart, Shield, Briefcase, Calendar, ClipboardList,
  Users, Bell, MapPin, ArrowRight, Check
} from 'lucide-react'
import {
  Screen, ScreenBody, ScreenFooter,
  Button, Card, CardContent
} from '@/components/ui'

interface OnboardingStep {
  icon: React.ElementType
  title: string
  description: string
  color: string
}

interface OnboardingProps {
  app: 'client' | 'specialist' | 'admin'
  onComplete: () => void
  onSkip?: () => void
}

const clientSteps: OnboardingStep[] = [
  {
    icon: Heart,
    title: 'Welcome to ElderCare',
    description: 'Professional care services for your loved ones, available when you need them.',
    color: 'bg-cyan-100 text-cyan-600',
  },
  {
    icon: ClipboardList,
    title: 'Easy Ordering',
    description: 'Book nursing, companionship, or home help services in just a few taps.',
    color: 'bg-teal-100 text-teal-600',
  },
  {
    icon: MapPin,
    title: 'Track in Real-Time',
    description: 'Know exactly when your specialist arrives and track the service progress.',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    icon: Bell,
    title: 'Stay Updated',
    description: 'Get notifications about your orders and specialist assignments.',
    color: 'bg-purple-100 text-purple-600',
  },
]

const specialistSteps: OnboardingStep[] = [
  {
    icon: Briefcase,
    title: 'Welcome, Specialist',
    description: 'Join our network of care professionals and help families in need.',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    icon: Calendar,
    title: 'Manage Availability',
    description: 'Set your working hours and let clients book when you\'re available.',
    color: 'bg-teal-100 text-teal-600',
  },
  {
    icon: ClipboardList,
    title: 'Accept Orders',
    description: 'Receive job notifications and manage your assignments easily.',
    color: 'bg-cyan-100 text-cyan-600',
  },
  {
    icon: MapPin,
    title: 'Track Your Shifts',
    description: 'Log your time, track progress, and complete services professionally.',
    color: 'bg-green-100 text-green-600',
  },
]

const adminSteps: OnboardingStep[] = [
  {
    icon: Shield,
    title: 'Admin Dashboard',
    description: 'Manage the entire ElderCare platform from one central hub.',
    color: 'bg-violet-100 text-violet-600',
  },
  {
    icon: ClipboardList,
    title: 'Order Management',
    description: 'View all orders, assign specialists, and track service delivery.',
    color: 'bg-cyan-100 text-cyan-600',
  },
  {
    icon: Users,
    title: 'Specialist Network',
    description: 'Add, manage, and monitor your team of care specialists.',
    color: 'bg-teal-100 text-teal-600',
  },
  {
    icon: Bell,
    title: 'Real-Time Alerts',
    description: 'Get notified about new orders and important updates instantly.',
    color: 'bg-amber-100 text-amber-600',
  },
]

const appSteps = {
  client: clientSteps,
  specialist: specialistSteps,
  admin: adminSteps,
}

const appColors = {
  client: {
    primary: 'bg-cyan-600 hover:bg-cyan-700',
    secondary: 'text-cyan-600',
    dot: 'bg-cyan-500',
  },
  specialist: {
    primary: 'bg-amber-600 hover:bg-amber-700',
    secondary: 'text-amber-600',
    dot: 'bg-amber-500',
  },
  admin: {
    primary: 'bg-violet-600 hover:bg-violet-700',
    secondary: 'text-violet-600',
    dot: 'bg-violet-500',
  },
}

export function Onboarding({ app, onComplete, onSkip }: OnboardingProps) {
  const [step, setStep] = useState(0)
  const steps = appSteps[app]
  const colors = appColors[app]
  const currentStep = steps[step]
  const isLastStep = step === steps.length - 1

  const handleNext = () => {
    if (isLastStep) {
      onComplete()
    } else {
      setStep(step + 1)
    }
  }

  const Icon = currentStep.icon

  return (
    <Screen bg="muted">
      <ScreenBody padding="lg" className="flex flex-col items-center justify-center">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i <= step ? colors.dot : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className={`w-24 h-24 rounded-full ${currentStep.color} flex items-center justify-center mb-6`}>
          <Icon className="h-12 w-12" />
        </div>

        {/* Content */}
        <h1 className="text-2xl font-bold text-center mb-3">
          {currentStep.title}
        </h1>
        <p className="text-muted-foreground text-center max-w-xs">
          {currentStep.description}
        </p>

        {/* Features list on last step */}
        {isLastStep && (
          <Card className="mt-6 w-full max-w-xs">
            <CardContent className="p-4 space-y-3">
              {steps.slice(1).map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Check className={`h-4 w-4 ${colors.secondary}`} />
                  <span className="text-sm">{s.title}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </ScreenBody>

      <ScreenFooter className="p-4 space-y-2">
        <Button
          className={`w-full ${colors.primary}`}
          size="lg"
          onClick={handleNext}
        >
          {isLastStep ? 'Get Started' : 'Next'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        {onSkip && step === 0 && (
          <Button
            variant="ghost"
            className="w-full"
            onClick={onSkip}
          >
            Skip intro
          </Button>
        )}
      </ScreenFooter>
    </Screen>
  )
}

export default Onboarding
