// Order History Screen
// View past orders by phone number or auto-load for logged in users

import { useState, useEffect } from 'react'
import { Search, MapPin, Calendar, Clock, Star, Home, ClipboardList, ChevronRight, User } from 'lucide-react'
import {
  Screen, ScreenHeader, ScreenBody, ScreenFooter,
  TopBar, BottomNav, Card, CardContent, Button, Input,
  Badge, EmptyState, type BottomNavItem
} from '@/components/ui'
import { useRepo } from '@/hooks/useRepo'
import { useAuth } from '@/hooks/useAuth'
import type { CareOrderEntity, ClientUser } from '@prototype/factories'

interface OrderHistoryProps {
  onBack?: () => void
  onNavigate?: (screen: string) => void
}

const navItems: BottomNavItem[] = [
  { value: 'home', icon: <Home className="h-5 w-5" />, label: 'Home' },
  { value: 'orders', icon: <ClipboardList className="h-5 w-5" />, label: 'My Orders' },
  { value: 'history', icon: <Clock className="h-5 w-5" />, label: 'History' },
]

const statusColors: Record<string, string> = {
  created: 'bg-gray-100 text-gray-700',
  reviewing: 'bg-blue-100 text-blue-700',
  assigned: 'bg-purple-100 text-purple-700',
  on_way: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-cyan-100 text-cyan-700',
  completed: 'bg-green-100 text-green-700',
  paid: 'bg-green-100 text-green-700', // Show same as completed for client
  cancelled: 'bg-red-100 text-red-700',
}

// For client, show paid as completed
const getDisplayStatus = (status: string) => {
  if (status === 'paid') return 'completed'
  return status
}

export default function OrderHistory({ onBack, onNavigate }: OrderHistoryProps) {
  const { user, isAuthenticated } = useAuth<ClientUser>({ namespace: 'client' })
  const orders = useRepo<CareOrderEntity>('orders')
  const [phone, setPhone] = useState('')
  const [searchedPhone, setSearchedPhone] = useState('')
  const [activeNav, setActiveNav] = useState('history')

  // Auto-load orders for logged in users
  useEffect(() => {
    if (isAuthenticated && user?.phone) {
      setSearchedPhone(user.phone)
      setPhone(user.phone)
    }
  }, [isAuthenticated, user?.phone])

  const clientOrders = orders.data
    .filter(o => o.phone === searchedPhone)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const handleSearch = () => {
    if (phone) {
      setSearchedPhone(phone)
    }
  }

  const handleNavChange = (id: string) => {
    setActiveNav(id)
    if (onNavigate) {
      if (id === 'home') onNavigate('home')
      if (id === 'orders') onNavigate('track')
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <Screen className="bg-slate-50">
      <ScreenHeader>
        <TopBar
          title="Order History"
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
                  Showing orders for <strong>{user.name}</strong> ({user.phone})
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Phone Search - show different text if logged in */}
        <Card>
          <CardContent className="p-4">
            <label className="text-sm font-medium mb-2 block">
              {isAuthenticated ? 'Search another phone number' : 'Enter your phone number'}
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

        {/* Search Results */}
        {searchedPhone && clientOrders.length === 0 && (
          <EmptyState
            preset="search"
            title="No Orders Found"
            description="No orders found for this phone number."
            action={{
              label: "Create New Order",
              onClick: () => onNavigate?.('order')
            }}
          />
        )}

        {/* Orders List */}
        {clientOrders.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Found {clientOrders.length} order{clientOrders.length !== 1 ? 's' : ''}
            </p>

            {clientOrders.map((order) => (
              <Card
                key={order.id}
                className="cursor-pointer hover:border-cyan-300 transition-colors"
                onClick={() => onNavigate?.('track')}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium capitalize">{order.serviceType}</h4>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <Badge className={statusColors[order.status]}>
                      {getDisplayStatus(order.status).replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate">{order.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{order.date} at {order.startTime}</span>
                    </div>
                  </div>

                  {['completed', 'paid'].includes(order.status) && (
                    <div className="mt-3 pt-3 border-t flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm font-medium">Leave a review</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
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
