// Admin Login Screen
// Email + password authentication (required)

import { useState } from 'react'
import { Mail, Lock, ArrowRight, Shield, Eye, EyeOff } from 'lucide-react'
import {
  Screen, ScreenBody, ScreenFooter,
  Card, CardContent, Button, Input,
  useToast, Doc
} from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { dispatchEvent } from '@/lib/events'
import type { AdminUser } from '@prototype/factories'

interface LoginScreenProps {
  onLogin?: () => void
}

// Demo credentials
const DEMO_CREDENTIALS = {
  email: 'admin@eldercare.com',
  password: 'admin123'
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const { show } = useToast()
  const { login } = useAuth<AdminUser>({ namespace: 'admin' })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleLogin = async () => {
    if (!isValidEmail(email)) {
      show({ message: 'Please enter a valid email address', type: 'error' })
      return
    }
    if (!password) {
      show({ message: 'Please enter your password', type: 'error' })
      return
    }

    setIsLoading(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))

    // Check credentials (demo mode)
    if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
      const adminId = crypto.randomUUID()
      login({
        id: adminId,
        email,
        name: 'Admin',
        role: 'admin'
      })
      dispatchEvent('auth.login', { app: 'admin', userId: adminId })
      onLogin?.()
    } else {
      show({ message: 'Invalid email or password', type: 'error' })
    }

    setIsLoading(false)
  }

  const handleDemoLogin = () => {
    setEmail(DEMO_CREDENTIALS.email)
    setPassword(DEMO_CREDENTIALS.password)
  }

  return (
    <Screen bg="muted">
      <Doc of="routes.admin-login" floating position="bottom-left" />

      <ScreenBody padding="lg" className="flex flex-col">
        {/* Logo / Brand */}
        <div className="text-center mb-8 pt-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-violet-100 flex items-center justify-center">
            <Shield className="h-10 w-10 text-violet-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">ElderCare</h1>
          <p className="text-muted-foreground mt-1">Admin Dashboard</p>
        </div>

        {/* Login Form */}
        <Card className="flex-1">
          <CardContent className="p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-2">Admin Login</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Enter your credentials to access the dashboard
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="admin@eldercare.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Demo hint */}
            <div className="pt-2">
              <button
                onClick={handleDemoLogin}
                className="text-xs text-violet-600 hover:underline"
              >
                Use demo credentials
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Admin capabilities */}
        <div className="mt-6 space-y-2 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
            Manage all orders
          </p>
          <p className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
            Assign specialists
          </p>
          <p className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
            View analytics
          </p>
        </div>
      </ScreenBody>

      <ScreenFooter className="p-4">
        <Button
          className="w-full bg-violet-600 hover:bg-violet-700"
          size="lg"
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
          {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </ScreenFooter>
    </Screen>
  )
}
