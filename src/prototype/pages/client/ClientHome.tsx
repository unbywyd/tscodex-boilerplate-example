// Client Home Screen
// Main landing page for the client app

import { useState } from 'react'
import { Heart, ClipboardList, Clock, Plus, Search, Phone, ChevronRight, Stethoscope, Home, ShoppingBag, Users, Ambulance, User, LogOut, MapPin, Calendar } from 'lucide-react'
import {
  Screen, ScreenHeader, ScreenBody, ScreenFooter,
  TopBar, BottomNav, Card, CardContent, Button, Input, Badge,
  Doc, type BottomNavItem
} from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useRepo } from '@/hooks/useRepo'
import { dispatchEvent } from '@/lib/events'
import { NotificationBell } from '@prototype/components'
import { SERVICES, type ClientUser, type CareOrderEntity } from '@prototype/factories'

interface ClientHomeProps {
  onNavigate?: (screen: string) => void
}

const navItems: BottomNavItem[] = [
  { value: 'home', icon: <Home className="h-5 w-5" />, label: 'Home' },
  { value: 'orders', icon: <ClipboardList className="h-5 w-5" />, label: 'My Orders' },
  { value: 'history', icon: <Clock className="h-5 w-5" />, label: 'History' },
]

const serviceIcons: Record<string, React.ElementType> = {
  Heart, Stethoscope, Home, ShoppingBag, Users, Ambulance
}

const statusConfig: Record<string, { label: string; color: string }> = {
  created: { label: 'Created', color: 'bg-gray-100 text-gray-700' },
  reviewing: { label: 'Under Review', color: 'bg-blue-100 text-blue-700' },
  assigned: { label: 'Assigned', color: 'bg-purple-100 text-purple-700' },
  on_way: { label: 'On the Way', color: 'bg-amber-100 text-amber-700' },
  in_progress: { label: 'In Progress', color: 'bg-cyan-100 text-cyan-700' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
}

export default function ClientHome({ onNavigate }: ClientHomeProps) {
  const { user, isAuthenticated, logout } = useAuth<ClientUser>({ namespace: 'client' })
  const orders = useRepo<CareOrderEntity>('orders')
  const [activeNav, setActiveNav] = useState('home')
  const [trackPhone, setTrackPhone] = useState('')

  // Get user's active orders (not completed/cancelled)
  const userOrders = isAuthenticated && user?.phone
    ? orders.data.filter(o => o.phone === user.phone && !['completed', 'paid', 'cancelled'].includes(o.status))
    : []

  const handleNavChange = (id: string) => {
    setActiveNav(id)
    if (onNavigate) {
      if (id === 'orders') onNavigate('track')
      if (id === 'history') onNavigate('history')
    }
  }

  const handleTrackOrder = () => {
    if (trackPhone && onNavigate) {
      onNavigate('track')
    }
  }

  const handleLogout = () => {
    logout()
    dispatchEvent('auth.logout', { app: 'client' })
  }

  return (
    <Screen className="bg-slate-50">
      <Doc of="routes.client-home" floating position="bottom-left" />
      <ScreenHeader>
        <TopBar
          title="ElderCare"
          subtitle={isAuthenticated ? `Hello, ${user?.name}` : "Care services for your loved ones"}
          rightAction={
            <div className="flex items-center gap-1">
              <NotificationBell app="client" />
              {isAuthenticated ? (
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => onNavigate?.('login')}>
                  <User className="h-4 w-4 mr-1" />
                  Login
                </Button>
              )}
            </div>
          }
        />
      </ScreenHeader>

      <ScreenBody padding="md" className="space-y-6">
        {/* New Order CTA */}
        <Card className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white border-0">
          <CardContent className="p-5">
            <h2 className="text-lg font-semibold mb-2">Need Care Services?</h2>
            <p className="text-cyan-100 text-sm mb-4">
              Order a caregiver, nurse, or assistant in just a few taps.
            </p>
            <Button
              size="lg"
              className="w-full bg-white text-cyan-700 hover:bg-cyan-50"
              onClick={() => onNavigate?.('order')}
            >
              <Plus className="h-5 w-5 mr-2" />
              New Order
            </Button>
          </CardContent>
        </Card>

        {/* User's Active Orders (for authenticated) or Track Order (for guests) */}
        {isAuthenticated ? (
          userOrders.length > 0 ? (
            <div>
              <h3 className="font-semibold text-lg mb-3">Your Active Orders</h3>
              <div className="space-y-2">
                {userOrders.map((order) => (
                  <Card
                    key={order.id}
                    className="cursor-pointer hover:border-cyan-300 transition-colors"
                    onClick={() => onNavigate?.('track')}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize">{order.serviceType}</span>
                            <Badge className={statusConfig[order.status]?.color || 'bg-gray-100'}>
                              {statusConfig[order.status]?.label || order.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {order.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {order.startTime}
                            </span>
                          </div>
                          {order.specialistName && (
                            <p className="text-xs text-purple-600 mt-1">
                              {order.specialistName}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : null
        ) : (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                Track Your Order
              </h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter your phone number"
                  value={trackPhone}
                  onChange={(e) => setTrackPhone(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleTrackOrder} disabled={!trackPhone}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Services Grid */}
        <div>
          <h3 className="font-semibold text-lg mb-3">Our Services</h3>
          <div className="grid grid-cols-2 gap-3">
            {SERVICES.map((service) => {
              const Icon = serviceIcons[service.icon] || Heart
              return (
                <Card
                  key={service.id}
                  className="cursor-pointer hover:border-cyan-300 transition-colors"
                  onClick={() => onNavigate?.('order')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-cyan-100 p-2">
                        <Icon className="h-5 w-5 text-cyan-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{service.name}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {service.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Contact Info */}
        <Card className="bg-slate-100 border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-cyan-600 p-2">
                <Phone className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">Need help?</p>
                <p className="text-sm text-cyan-600">Call us: 1-800-CARE</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </ScreenBody>

      <ScreenFooter>
        <BottomNav
          items={navItems}
          value={activeNav}
          onValueChange={handleNavChange}
        />
      </ScreenFooter>
    </Screen>
  )
}
