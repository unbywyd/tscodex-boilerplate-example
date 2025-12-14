// Specialist Home Screen
// Main dashboard for the specialist app

import { useState, useEffect } from 'react'
import { Home, ClipboardList, Calendar, Play, Clock, MapPin, CheckCircle2, LogOut } from 'lucide-react'
import {
  Screen, ScreenHeader, ScreenBody, ScreenFooter,
  TopBar, BottomNav, Card, CardContent, Button, Badge,
  Doc, type BottomNavItem
} from '@/components/ui'
import { useRepo } from '@/hooks/useRepo'
import { dispatchEvent } from '@/lib/events'
import { useAuth } from '@/hooks/useAuth'
import { NotificationBell } from '@prototype/components'
import type { CareOrderEntity, SpecialistEntity, SpecialistUser } from '@prototype/factories'

interface SpecialistHomeProps {
  onNavigate?: (screen: string) => void
}

const navItems: BottomNavItem[] = [
  { value: 'home', icon: <Home className="h-5 w-5" />, label: 'Home' },
  { value: 'orders', icon: <ClipboardList className="h-5 w-5" />, label: 'Orders' },
  { value: 'availability', icon: <Calendar className="h-5 w-5" />, label: 'Availability' },
]

export default function SpecialistHome({ onNavigate }: SpecialistHomeProps) {
  const { user, logout } = useAuth<SpecialistUser>({ namespace: 'specialist' })
  const orders = useRepo<CareOrderEntity>('orders')
  const specialists = useRepo<SpecialistEntity>('specialists')
  const [activeNav, setActiveNav] = useState('home')

  // Demo: populate data if empty
  useEffect(() => {
    if (specialists.data.length === 0) {
      specialists.populate(5)
    }
    if (orders.data.length === 0) {
      orders.populate(10)
    }
  }, [])

  const handleNavChange = (id: string) => {
    setActiveNav(id)
    if (onNavigate) {
      if (id === 'orders') onNavigate('orders')
      if (id === 'availability') onNavigate('availability')
    }
  }

  const myOrders = user
    ? orders.data.filter(o => o.specialistId === user.id || o.specialistName === user.name)
    : []

  const todayOrders = myOrders.filter(o => {
    const orderDate = new Date(o.date).toDateString()
    const today = new Date().toDateString()
    return orderDate === today
  })

  const activeOrder = myOrders.find(o => o.status === 'in_progress')
  const assignedOrders = myOrders.filter(o => ['assigned', 'on_way'].includes(o.status))

  return (
    <Screen className="bg-slate-50">
      <Doc of="routes.specialist-home" floating position="bottom-left" />
      <ScreenHeader>
        <TopBar
          title="My Work"
          subtitle={user?.name || 'Specialist'}
          rightAction={
            <div className="flex items-center gap-1">
              <NotificationBell app="specialist" />
              <Button variant="ghost" size="icon" onClick={() => {
                logout()
                dispatchEvent('auth.logout', { app: 'specialist' })
              }}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          }
        />
      </ScreenHeader>

      <ScreenBody padding="md" className="space-y-4">
        {/* Active Shift Card */}
        {activeOrder ? (
          <Card className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Badge className="bg-white/20 text-white">Active Shift</Badge>
                <Play className="h-5 w-5" />
              </div>
              <h3 className="font-semibold mb-1 capitalize">{activeOrder.serviceType}</h3>
              <p className="text-cyan-100 text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {activeOrder.city}
              </p>
              <Button
                className="w-full mt-4 bg-white text-cyan-700 hover:bg-cyan-50"
                onClick={() => onNavigate?.('shift')}
              >
                View Active Shift
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-slate-100 border-0">
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No active shift</p>
              {assignedOrders.length > 0 && (
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={() => onNavigate?.('orders')}
                >
                  Start Next Order
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-cyan-600">{todayOrders.length}</p>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-amber-600">{assignedOrders.length}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-green-600">
                {myOrders.filter(o => o.status === 'completed').length}
              </p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Orders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Upcoming Orders</h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigate?.('orders')}>
              View All
            </Button>
          </div>

          {assignedOrders.length === 0 ? (
            <Card className="bg-slate-50">
              <CardContent className="p-4 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No pending orders</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {assignedOrders.slice(0, 3).map((order) => (
                <Card key={order.id} className="cursor-pointer hover:border-cyan-300" onClick={() => onNavigate?.('orders')}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-cyan-100 p-2">
                        <ClipboardList className="h-5 w-5 text-cyan-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium capitalize">{order.serviceType}</h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {order.address}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {order.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {order.startTime}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
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
