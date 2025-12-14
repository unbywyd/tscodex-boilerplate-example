// Client Login Screen
// Full onboarding flow: Phone → OTP → Profile (name+address) → Permissions → Home

import { useState } from 'react'
import { Phone, ArrowRight, User, Bell, MapPin, Check, Home } from 'lucide-react'
import {
  Screen, ScreenHeader, ScreenBody, ScreenFooter,
  TopBar, Card, CardContent, Button, Input,
  Select, Doc, useToast, OTPInput
} from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { dispatchEvent } from '@/lib/events'
import { ISRAELI_CITIES, type ClientUser } from '@prototype/factories'

interface LoginScreenProps {
  onLogin?: () => void
  onSkip?: () => void
}

type Step = 'phone' | 'otp' | 'profile' | 'permissions'

export default function LoginScreen({ onLogin, onSkip }: LoginScreenProps) {
  const { show } = useToast()
  const { login } = useAuth<ClientUser>({ namespace: 'client' })
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [step, setStep] = useState<Step>('phone')
  const [error, setError] = useState('')
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

  const handleContinue = (otpValue?: string) => {
    if (step === 'phone') {
      if (!isValidPhone) {
        setError('Enter 10 digits (e.g. 050-123-4567)')
        show({ message: 'Please enter a valid phone number', type: 'error' })
        return
      }
      dispatchEvent('auth.otp_sent', {
        phone: `***${phone.slice(-4)}`,
        app: 'client'
      })
      setError('')
      setStep('otp')
    } else if (step === 'otp') {
      // Use passed value from onComplete or fall back to state
      const codeToValidate = otpValue ?? otp
      if (codeToValidate.length !== 6) {
        setError('Enter 6-digit code')
        show({ message: 'Please enter the verification code', type: 'error' })
        return
      }
      dispatchEvent('auth.verified', {
        phone,
        app: 'client',
        isNewUser: true
      })
      setError('')
      setStep('profile')
    } else if (step === 'profile') {
      if (!name.trim()) {
        setError('Name is required')
        show({ message: 'Please enter your name', type: 'error' })
        return
      }
      setError('')
      setStep('permissions')
    } else if (step === 'permissions') {
      // Complete login
      login({
        id: crypto.randomUUID(),
        phone,
        name: name.trim(),
        city: city || undefined,
        address: address || undefined,
        role: 'client'
      })
      dispatchEvent('auth.login', {
        app: 'client',
        userId: 'new'
      })
      onLogin?.()
    }
  }

  const handleSkip = () => {
    onSkip?.()
  }

  const togglePermission = (key: 'notifications' | 'location') => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const renderStepIndicator = () => {
    const steps = ['phone', 'otp', 'profile', 'permissions']
    const currentIndex = steps.indexOf(step)

    return (
      <div className="flex items-center justify-center gap-2 mb-6">
        {steps.map((s, i) => (
          <div
            key={s}
            className={`w-2 h-2 rounded-full transition-colors ${
              i <= currentIndex ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>
    )
  }

  const renderPhoneStep = () => (
    <>
      <h2 className="text-lg font-semibold mb-2">Enter your phone</h2>
      <p className="text-sm text-muted-foreground mb-4">
        We'll send you a verification code
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
      <OTPInput
        value={otp}
        onChange={(value) => { setOtp(value); setError('') }}
        onComplete={handleContinue}
        length={6}
        error={error}
        autoFocus
        className="gap-1.5 [&_input]:w-10 [&_input]:h-12 [&_input]:text-lg"
      />
      <div className="text-center mt-4">
        <Button
          variant="link"
          size="sm"
          className="p-0 h-auto"
          onClick={() => {
            show({ message: 'Code resent!', type: 'success' })
          }}
        >
          Resend code
        </Button>
      </div>
    </>
  )

  const renderProfileStep = () => (
    <>
      <h2 className="text-lg font-semibold mb-2">Tell us about yourself</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Name is required, address helps us serve you faster
      </p>
      <div className="space-y-3">
        {/* Name - required */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">Your Name *</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="How should we call you?"
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              className={`pl-10 ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>

        {/* City - optional */}
        <Select
          label="City"
          placeholder="Select your city"
          value={city}
          onValueChange={setCity}
          options={ISRAELI_CITIES}
        />

        {/* Address - optional */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">Street Address</label>
          <div className="relative">
            <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Street and house number"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        Address is optional - you can fill it later when placing an order
      </p>
    </>
  )

  const renderPermissionsStep = () => (
    <>
      <h2 className="text-lg font-semibold mb-2">Enable permissions</h2>
      <p className="text-sm text-muted-foreground mb-4">
        For the best experience
      </p>
      <div className="space-y-3">
        <button
          onClick={() => togglePermission('notifications')}
          className={`w-full p-4 rounded-lg border-2 flex items-center gap-3 transition-colors ${
            permissions.notifications
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            permissions.notifications ? 'bg-primary text-white' : 'bg-muted'
          }`}>
            <Bell className="h-5 w-5" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium">Notifications</p>
            <p className="text-xs text-muted-foreground">Get updates on your orders</p>
          </div>
          {permissions.notifications && (
            <Check className="h-5 w-5 text-primary" />
          )}
        </button>

        <button
          onClick={() => togglePermission('location')}
          className={`w-full p-4 rounded-lg border-2 flex items-center gap-3 transition-colors ${
            permissions.location
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            permissions.location ? 'bg-primary text-white' : 'bg-muted'
          }`}>
            <MapPin className="h-5 w-5" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium">Location</p>
            <p className="text-xs text-muted-foreground">Find services near you</p>
          </div>
          {permissions.location && (
            <Check className="h-5 w-5 text-primary" />
          )}
        </button>
      </div>
    </>
  )

  const getButtonText = () => {
    switch (step) {
      case 'phone': return 'Send Code'
      case 'otp': return 'Verify'
      case 'profile': return 'Continue'
      case 'permissions': return 'Get Started'
    }
  }

  return (
    <Screen bg="muted">
      <Doc of="routes.client-login" floating position="bottom-left" />
      <ScreenHeader border={false} transparent>
        <TopBar
          title=""
          back={step !== 'phone' ? () => {
            const steps: Step[] = ['phone', 'otp', 'profile', 'permissions']
            const currentIndex = steps.indexOf(step)
            if (currentIndex > 0) {
              setStep(steps[currentIndex - 1])
              setError('')
            }
          } : undefined}
          rightAction={
            step === 'phone' ? (
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                Skip
              </Button>
            ) : undefined
          }
        />
      </ScreenHeader>

      <ScreenBody padding="lg" className="flex flex-col">
        {/* Logo / Brand */}
        <div className="text-center mb-6 pt-4">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">ElderCare</h1>
        </div>

        {renderStepIndicator()}

        {/* Form */}
        <Card className="flex-1">
          <CardContent className="p-6">
            {step === 'phone' && renderPhoneStep()}
            {step === 'otp' && renderOtpStep()}
            {step === 'profile' && renderProfileStep()}
            {step === 'permissions' && renderPermissionsStep()}
          </CardContent>
        </Card>
      </ScreenBody>

      <ScreenFooter className="p-4">
        <Button className="w-full" size="lg" onClick={handleContinue}>
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
