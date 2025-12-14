// Specialist Login Screen
// Flow: Phone → OTP → Permissions → Home
// Only specialists registered by admin can log in

import { useState } from 'react'
import { Phone, ArrowRight, KeyRound, Bell, MapPin, Check, Briefcase } from 'lucide-react'
import {
  Screen, ScreenHeader, ScreenBody, ScreenFooter,
  TopBar, Card, CardContent, Button, Input,
  useToast, Doc
} from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { dispatchEvent } from '@/lib/events'
import { useRepo } from '@/hooks/useRepo'
import type { SpecialistUser, SpecialistEntity } from '@prototype/factories'

interface LoginScreenProps {
  onLogin?: () => void
}

type Step = 'phone' | 'otp' | 'permissions'

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const { show } = useToast()
  const { login } = useAuth<SpecialistUser>({ namespace: 'specialist' })
  const specialists = useRepo<SpecialistEntity>('specialists')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<Step>('phone')
  const [error, setError] = useState('')
  const [existingSpecialist, setExistingSpecialist] = useState<SpecialistEntity | null>(null)
  const [permissions, setPermissions] = useState({
    notifications: false,
    location: false
  })

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }

  const formatOtp = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 6)
  }

  const getDigits = (value: string) => value.replace(/\D/g, '')
  const isValidPhone = getDigits(phone).length === 10
  const isValidOtp = otp.length === 6

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value))
    setError('')
  }

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtp(formatOtp(e.target.value))
    setError('')
  }

  const handleContinue = () => {
    if (step === 'phone') {
      if (!isValidPhone) {
        setError('Enter 10 digits (e.g. 050-123-4567)')
        show({ message: 'Please enter a valid phone number', type: 'error' })
        return
      }
      // Check if specialist exists in the system (registered by admin)
      const specialist = specialists.data.find(s => s.phone === phone)
      if (!specialist) {
        setError('Phone not registered. Please contact admin.')
        show({ message: 'This phone number is not registered as a specialist', type: 'error' })
        return
      }
      if (!specialist.isActive) {
        setError('Your account is inactive. Please contact admin.')
        show({ message: 'Account is inactive', type: 'error' })
        return
      }
      setExistingSpecialist(specialist)
      dispatchEvent('auth.otp_sent', { phone: `***${phone.slice(-4)}`, app: 'specialist' })
      setError('')
      setStep('otp')
    } else if (step === 'otp') {
      if (!isValidOtp) {
        setError('Enter 6-digit code')
        show({ message: 'Please enter the verification code', type: 'error' })
        return
      }
      // Mock: any 6 digits work
      dispatchEvent('auth.verified', {
        phone,
        app: 'specialist',
        isNewUser: false
      })
      setError('')
      setStep('permissions')
    } else if (step === 'permissions') {
      // Complete login - only for registered specialists
      if (existingSpecialist) {
        login({
          id: existingSpecialist.id,
          phone: existingSpecialist.phone,
          name: existingSpecialist.name,
          email: existingSpecialist.email,
          avatar: existingSpecialist.avatar,
          role: 'specialist'
        })
        dispatchEvent('auth.login', { app: 'specialist', userId: existingSpecialist.id })
        onLogin?.()
      }
    }
  }

  const togglePermission = (key: 'notifications' | 'location') => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const renderStepIndicator = () => {
    const steps = ['phone', 'otp', 'permissions']
    const currentIndex = steps.indexOf(step)

    return (
      <div className="flex items-center justify-center gap-2 mb-6">
        {steps.map((s, i) => (
          <div
            key={s}
            className={`w-2 h-2 rounded-full transition-colors ${
              i <= currentIndex ? 'bg-amber-500' : 'bg-muted'
            }`}
          />
        ))}
      </div>
    )
  }

  const renderPhoneStep = () => (
    <>
      <h2 className="text-lg font-semibold mb-2">Sign in with phone</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Enter your registered phone number
      </p>
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="tel"
          placeholder="050-123-4567"
          value={phone}
          onChange={handlePhoneChange}
          className={`pl-10 ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
          autoFocus
        />
      </div>
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      <p className="text-xs text-muted-foreground mt-2">
        {getDigits(phone).length}/10 digits
      </p>
    </>
  )

  const renderOtpStep = () => (
    <>
      <h2 className="text-lg font-semibold mb-2">Enter verification code</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Code sent to {phone}
      </p>
      <div className="relative">
        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          inputMode="numeric"
          placeholder="000000"
          value={otp}
          onChange={handleOtpChange}
          className={`pl-10 text-center text-2xl tracking-[0.5em] font-mono ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
          autoFocus
        />
      </div>
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      <p className="text-xs text-muted-foreground mt-2">
        {otp.length}/6 digits
      </p>
      <Button
        variant="link"
        size="sm"
        className="mt-2 p-0 h-auto text-amber-600"
        onClick={() => {}}
      >
        Resend code
      </Button>
    </>
  )

  const renderPermissionsStep = () => (
    <>
      <h2 className="text-lg font-semibold mb-2">Enable permissions</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Required for accepting jobs
      </p>
      <div className="space-y-3">
        <button
          onClick={() => togglePermission('notifications')}
          className={`w-full p-4 rounded-lg border-2 flex items-center gap-3 transition-colors ${
            permissions.notifications
              ? 'border-amber-500 bg-amber-50'
              : 'border-border hover:border-amber-300'
          }`}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            permissions.notifications ? 'bg-amber-500 text-white' : 'bg-muted'
          }`}>
            <Bell className="h-5 w-5" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium">Notifications</p>
            <p className="text-xs text-muted-foreground">Get notified of new jobs</p>
          </div>
          {permissions.notifications && (
            <Check className="h-5 w-5 text-amber-500" />
          )}
        </button>

        <button
          onClick={() => togglePermission('location')}
          className={`w-full p-4 rounded-lg border-2 flex items-center gap-3 transition-colors ${
            permissions.location
              ? 'border-amber-500 bg-amber-50'
              : 'border-border hover:border-amber-300'
          }`}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            permissions.location ? 'bg-amber-500 text-white' : 'bg-muted'
          }`}>
            <MapPin className="h-5 w-5" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium">Location</p>
            <p className="text-xs text-muted-foreground">Share location during shifts</p>
          </div>
          {permissions.location && (
            <Check className="h-5 w-5 text-amber-500" />
          )}
        </button>
      </div>
    </>
  )

  const getButtonText = () => {
    switch (step) {
      case 'phone': return 'Send Code'
      case 'otp': return 'Verify'
      case 'permissions': return 'Get Started'
    }
  }

  const handleBack = () => {
    const steps: Step[] = ['phone', 'otp', 'permissions']
    const currentIndex = steps.indexOf(step)
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1])
      setError('')
    }
  }

  return (
    <Screen bg="muted">
      <Doc of="routes.specialist-login" floating position="bottom-left" />
      <ScreenHeader border={false} transparent>
        <TopBar
          title=""
          back={step !== 'phone' ? handleBack : undefined}
        />
      </ScreenHeader>

      <ScreenBody padding="lg" className="flex flex-col">
        {/* Logo / Brand */}
        <div className="text-center mb-6 pt-4">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-amber-100 flex items-center justify-center">
            <Briefcase className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold text-foreground">ElderCare</h1>
          <p className="text-sm text-muted-foreground">Specialist Portal</p>
        </div>

        {renderStepIndicator()}

        {/* Form */}
        <Card className="flex-1">
          <CardContent className="p-6">
            {step === 'phone' && renderPhoneStep()}
            {step === 'otp' && renderOtpStep()}
            {step === 'permissions' && renderPermissionsStep()}
          </CardContent>
        </Card>

        {/* Features - only on phone step */}
        {step === 'phone' && (
          <div className="mt-6 space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Manage your schedule
            </p>
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Accept and track orders
            </p>
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Build your reputation
            </p>
          </div>
        )}
      </ScreenBody>

      <ScreenFooter className="p-4">
        <Button
          className="w-full bg-amber-600 hover:bg-amber-700"
          size="lg"
          onClick={handleContinue}
        >
          {getButtonText()}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        {step === 'permissions' && (
          <Button
            variant="ghost"
            className="w-full mt-2"
            onClick={handleContinue}
          >
            Maybe later
          </Button>
        )}
      </ScreenFooter>
    </Screen>
  )
}
