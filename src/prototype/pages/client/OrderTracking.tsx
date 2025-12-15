// Order Tracking Screen
// Shows user's orders (auto-loaded for logged in users, search for guests)

import { useState, useEffect } from 'react'
import { Search, MapPin, Calendar, Clock, User, Check, Truck, Play, CheckCircle2, XCircle, Home, ClipboardList } from 'lucide-react'
import {
  Screen, ScreenHeader, ScreenBody, ScreenFooter,
  TopBar, BottomNav, Card, CardContent, Button, Input,
  Badge, Timeline, type TimelineStep, type BottomNavItem
} from '@/components/ui'
import { useRepo } from '@/hooks/useRepo'
import { useAuth } from '@/hooks/useAuth'
import type { CareOrderEntity, ClientUser } from '@prototype/factories'

interface OrderTrackingProps {
  onBack?: () => void
  onNavigate?: (screen: string) => void
  initialPhone?: string
}

const navItems: BottomNavItem[] = [
  { value: 'home', icon: <Home className="h-5 w-5" />, label: 'Home' },
  { value: 'orders', icon: <ClipboardList className="h-5 w-5" />, label: 'My Orders' },
  { value: 'history', icon: <Clock className="h-5 w-5" />, label: 'History' },
]

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  created: { label: 'Created', color: 'bg-gray-500', icon: Check },
  reviewing: { label: 'Under Review', color: 'bg-blue-500', icon: Search },
  assigned: { label: 'Specialist Assigned', color: 'bg-purple-500', icon: User },
  on_way: { label: 'On the Way', color: 'bg-amber-500', icon: Truck },
  in_progress: { label: 'In Progress', color: 'bg-cyan-500', icon: Play },
  completed: { label: 'Completed', color: 'bg-green-500', icon: CheckCircle2 },
  paid: { label: 'Completed', color: 'bg-green-500', icon: CheckCircle2 }, // Show as completed for client
  cancelled: { label: 'Cancelled', color: 'bg-red-500', icon: XCircle },
}

const statusOrder = ['created', 'reviewing', 'assigned', 'on_way', 'in_progress', 'completed']

export default function OrderTracking({ onBack, onNavigate, initialPhone = '' }: OrderTrackingProps) {
  const { user, isAuthenticated } = useAuth<ClientUser>({ namespace: 'client' })
  const orders = useRepo<CareOrderEntity>('orders')
  const [phone, setPhone] = useState(initialPhone)
  const [searchedPhone, setSearchedPhone] = useState('')
  const [activeNav, setActiveNav] = useState('orders')

  // Auto-load orders for logged in users
  useEffect(() => {
    if (isAuthenticated && user?.phone) {
      setSearchedPhone(user.phone)
      setPhone(user.phone)
    }
  }, [isAuthenticated, user?.phone])

  const clientOrders = orders.data.filter(o => o.phone === searchedPhone)
  const latestOrder = clientOrders[0]

  const handleSearch = () => {
    if (phone) {
      setSearchedPhone(phone)
    }
  }

  const handleNavChange = (id: string) => {
    setActiveNav(id)
    if (onNavigate) {
      if (id === 'home') onNavigate('home')
      if (id === 'history') onNavigate('history')
    }
  }

  const getTimelineSteps = (order: CareOrderEntity): TimelineStep[] => {
    const currentIndex = statusOrder.indexOf(order.status)

    return statusOrder.slice(0, -1).map((status, index) => {
      const config = statusConfig[status]
      let stepStatus: TimelineStep['status'] = 'pending'

      if (index < currentIndex) {
        stepStatus = 'completed'
      } else if (index === currentIndex) {
        stepStatus = 'current'
      }

      return {
        id: status,
        title: config.label,
        status: stepStatus,
      }
    })
  }

  return (
    <Screen className="bg-slate-50">
      <ScreenHeader>
        <TopBar
          title="Track Order"
          back={onBack}
        />
      </ScreenHeader>

      <ScreenBody padding="md" className="space-y-4">
        {/* Logged in user info */}
        {isAuthenticated && user && (
          <Card className="bg-cyan-50 border-cyan-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-cyan-600" />
                <span className="text-cyan-800">
                  Orders for <strong>{user.name}</strong> ({user.phone})
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Phone Search - only for guests */}
        {!isAuthenticated && (
          <Card>
            <CardContent className="p-4">
              <label className="text-sm font-medium mb-2 block">
                Enter your phone number
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="050-XXX-XXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={!phone}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Results */}
        {searchedPhone && !latestOrder && (
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4 text-center">
              <p className="text-amber-800">No orders found for this phone number.</p>
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => onNavigate?.('order')}
              >
                Create New Order
              </Button>
            </CardContent>
          </Card>
        )}

        {latestOrder && (
          <>
            {/* Current Status */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Current Status</h3>
                  <Badge className={`${statusConfig[latestOrder.status]?.color || 'bg-gray-500'} text-white`}>
                    {statusConfig[latestOrder.status]?.label || latestOrder.status}
                  </Badge>
                </div>

                <Timeline steps={getTimelineSteps(latestOrder)} />
              </CardContent>
            </Card>

            {/* Order Details */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold">Order Details</h3>

                <div className="space-y-2 text-sm">
                  <div className="flex gap-3">
                    <div className="w-5 h-5 rounded bg-cyan-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-medium text-cyan-600">
                        {latestOrder.serviceType.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="capitalize">{latestOrder.serviceType}</span>
                  </div>

                  <div className="flex gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span>{latestOrder.address}</span>
                  </div>

                  <div className="flex gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{latestOrder.date} at {latestOrder.startTime}</span>
                  </div>

                  {latestOrder.specialistName && (
                    <div className="flex gap-3">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>Specialist: {latestOrder.specialistName}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Time Tracking (if in progress or completed) */}
            {(latestOrder.actualStart || latestOrder.actualEnd) && (
              <Card className="bg-cyan-50 border-cyan-200">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-cyan-800 mb-2">Time Record</h3>
                  <div className="space-y-1 text-sm text-cyan-700">
                    {latestOrder.actualStart && (
                      <p>Started: {new Date(latestOrder.actualStart).toLocaleTimeString()}</p>
                    )}
                    {latestOrder.actualEnd && (
                      <p>Ended: {new Date(latestOrder.actualEnd).toLocaleTimeString()}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            {latestOrder.status === 'completed' && (
              <Button
                className="w-full"
                onClick={() => onNavigate?.('review')}
              >
                Leave a Review
              </Button>
            )}
          </>
        )}
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
