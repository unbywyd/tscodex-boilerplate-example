// Admin Dashboard Screen
// Main admin overview with metrics

import { useState, useEffect } from 'react'
import { LayoutDashboard, ClipboardList, Users, AlertCircle, UserPlus, LogOut } from 'lucide-react'
import {
  Screen, ScreenHeader, ScreenBody, ScreenFooter,
  TopBar, BottomNav, Card, CardContent, Button, Badge,
  Doc, type BottomNavItem
} from '@/components/ui'
import { useRepo } from '@/hooks/useRepo'
import { dispatchEvent } from '@/lib/events'
import { useAuth } from '@/hooks/useAuth'
import { NotificationBell } from '@prototype/components'
import type { CareOrderEntity, SpecialistEntity, AdminUser } from '@prototype/factories'

interface AdminDashboardProps {
  onNavigate?: (screen: string) => void
}

const navItems: BottomNavItem[] = [
  { value: 'dashboard', icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard' },
  { value: 'orders', icon: <ClipboardList className="h-5 w-5" />, label: 'Orders' },
  { value: 'specialists', icon: <Users className="h-5 w-5" />, label: 'Specialists' },
]

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { user, logout } = useAuth<AdminUser>({ namespace: 'admin' })
  const orders = useRepo<CareOrderEntity>('orders')
  const specialists = useRepo<SpecialistEntity>('specialists')
  const [activeNav, setActiveNav] = useState('dashboard')

  // Demo: populate data if empty
  useEffect(() => {
    if (orders.data.length === 0) {
      orders.populate(15)
    }
    if (specialists.data.length === 0) {
      specialists.populate(8)
    }
  }, [])

  const handleNavChange = (id: string) => {
    setActiveNav(id)
    if (onNavigate) {
      if (id === 'orders') onNavigate('orders')
      if (id === 'specialists') onNavigate('specialists')
    }
  }

  // Calculate stats
  const pendingOrders = orders.data.filter(o => ['created', 'reviewing'].includes(o.status))
  const assignedOrders = orders.data.filter(o => ['assigned', 'on_way'].includes(o.status))
  const inProgressOrders = orders.data.filter(o => o.status === 'in_progress')
  const completedOrders = orders.data.filter(o => o.status === 'completed')
  const activeSpecialists = specialists.data.filter(s => s.isActive)

  const todayOrders = orders.data.filter(o => {
    const orderDate = new Date(o.date).toDateString()
    const today = new Date().toDateString()
    return orderDate === today
  })

  return (
    <Screen className="bg-slate-50">
      <Doc of="routes.admin-dashboard" floating position="bottom-left" />
      <ScreenHeader>
        <TopBar
          title="Admin Dashboard"
          subtitle={`Hello, ${user?.name || 'Admin'}`}
          rightAction={
            <div className="flex items-center gap-1">
              <NotificationBell app="admin" />
              <Button variant="ghost" size="icon" onClick={() => {
                logout()
                dispatchEvent('auth.logout', { app: 'admin' })
              }}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          }
        />
      </ScreenHeader>

      <ScreenBody padding="md" className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <ClipboardList className="h-5 w-5 opacity-80" />
                <Badge className="bg-white/20 text-white">{todayOrders.length} today</Badge>
              </div>
              <p className="text-3xl font-bold">{orders.data.length}</p>
              <p className="text-cyan-100 text-sm">Total Orders</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-5 w-5 opacity-80" />
                <Badge className="bg-white/20 text-white">{activeSpecialists.length} active</Badge>
              </div>
              <p className="text-3xl font-bold">{specialists.data.length}</p>
              <p className="text-teal-100 text-sm">Specialists</p>
            </CardContent>
          </Card>
        </div>

        {/* Order Status Overview */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Order Status</h3>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-2 rounded-lg bg-amber-50">
                <p className="text-xl font-bold text-amber-600">{pendingOrders.length}</p>
                <p className="text-xs text-amber-700">Pending</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-purple-50">
                <p className="text-xl font-bold text-purple-600">{assignedOrders.length}</p>
                <p className="text-xs text-purple-700">Assigned</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-cyan-50">
                <p className="text-xl font-bold text-cyan-600">{inProgressOrders.length}</p>
                <p className="text-xs text-cyan-700">In Progress</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-green-50">
                <p className="text-xl font-bold text-green-600">{completedOrders.length}</p>
                <p className="text-xs text-green-700">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Actions */}
        {pendingOrders.length > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <h3 className="font-semibold text-amber-800">Needs Attention</h3>
              </div>
              <p className="text-sm text-amber-700 mb-3">
                {pendingOrders.length} order{pendingOrders.length !== 1 ? 's' : ''} waiting for assignment
              </p>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => onNavigate?.('orders')}
              >
                View Pending Orders
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recent Orders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Recent Orders</h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigate?.('orders')}>
              View All
            </Button>
          </div>

          <div className="space-y-2">
            {orders.data.slice(0, 5).map((order) => {
              const specialist = order.specialistId
                ? specialists.data.find(s => s.id === order.specialistId)
                : null
              return (
              <Card key={order.id} className="cursor-pointer hover:border-cyan-300" onClick={() => onNavigate?.('orders')}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{order.serviceType}</span>
                        <span className="text-muted-foreground text-sm">•</span>
                        <span className="text-muted-foreground text-sm truncate">{order.city}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {order.date} at {order.startTime}
                      </p>
                      {(order.specialistName || specialist) && (
                        <p className="text-xs text-purple-600 mt-0.5">
                          {order.specialistName || specialist?.name}
                          {(order.specialistPhone || specialist?.phone) && (
                            <span className="text-purple-400 ml-1">{order.specialistPhone || specialist?.phone}</span>
                          )}
                        </p>
                      )}
                    </div>
                    <Badge
                      className={`shrink-0 ml-2 ${
                        order.status === 'created' || order.status === 'reviewing'
                          ? 'bg-amber-100 text-amber-700'
                          : order.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-cyan-100 text-cyan-700'
                      }`}
                    >
                      {order.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )})}
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => onNavigate?.('orders')}>
                <ClipboardList className="h-4 w-4 mr-2" />
                Manage Orders
              </Button>
              <Button variant="outline" onClick={() => onNavigate?.('specialists')}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Specialist
              </Button>
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
