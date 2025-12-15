// Specialist Orders Screen
// List of assigned orders

import { useState } from 'react'
import { Home, ClipboardList, Calendar, MapPin, Clock, Phone, FileText, Play } from 'lucide-react'
import {
  Screen, ScreenHeader, ScreenBody, ScreenFooter,
  TopBar, BottomNav, Card, CardContent, Button, Badge,
  Tabs, TabsList, TabsTrigger, TabsContent, EmptyState,
  Doc, type BottomNavItem
} from '@/components/ui'
import { useRepo } from '@/hooks/useRepo'
import { dispatchEvent } from '@/lib/events'
import { useAuth } from '@/hooks/useAuth'
import type { CareOrderEntity, SpecialistEntity } from '@prototype/factories'

interface SpecialistOrdersProps {
  onBack?: () => void
  onNavigate?: (screen: string, orderId?: string) => void
}

const navItems: BottomNavItem[] = [
  { value: 'home', icon: <Home className="h-5 w-5" />, label: 'Home' },
  { value: 'orders', icon: <ClipboardList className="h-5 w-5" />, label: 'Orders' },
  { value: 'availability', icon: <Calendar className="h-5 w-5" />, label: 'Availability' },
]

const statusColors: Record<string, string> = {
  assigned: 'bg-purple-100 text-purple-700',
  on_way: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-cyan-100 text-cyan-700',
  completed: 'bg-green-100 text-green-700',
  paid: 'bg-emerald-100 text-emerald-700',
}

export default function SpecialistOrders({ onBack, onNavigate }: SpecialistOrdersProps) {
  const { user } = useAuth<SpecialistEntity>({ namespace: 'specialist' })
  const orders = useRepo<CareOrderEntity>('orders')
  const [activeNav, setActiveNav] = useState('orders')
  const [activeTab, setActiveTab] = useState('pending')

  const myOrders = user
    ? orders.data.filter(o => o.specialistId === user.id || o.specialistName === user.name)
    : []

  const pendingOrders = myOrders.filter(o => ['assigned', 'on_way'].includes(o.status))
  const activeOrders = myOrders.filter(o => o.status === 'in_progress')
  const completedOrders = myOrders.filter(o => ['completed', 'paid'].includes(o.status))

  const handleNavChange = (id: string) => {
    setActiveNav(id)
    if (onNavigate) {
      if (id === 'home') onNavigate('home')
      if (id === 'availability') onNavigate('availability')
    }
  }

  const handleStartShift = (orderId: string) => {
    const startTime = new Date().toISOString()
    orders.update(orderId, {
      status: 'in_progress',
      actualStart: startTime
    })
    dispatchEvent('shift.started', {
      orderId,
      specialistId: user?.id,
      startTime
    })
    onNavigate?.('shift', orderId)
  }

  const renderOrderCard = (order: CareOrderEntity, showActions: boolean = false) => (
    <Doc of="components.order-card" entityId={order.id} key={order.id}>
      <Card className="mb-3">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-semibold capitalize">{order.serviceType}</h4>
              <p className="text-sm text-muted-foreground">{order.clientName || 'Client'}</p>
            </div>
            <Badge className={statusColors[order.status] || 'bg-gray-100'}>
              {order.status.replace('_', ' ')}
            </Badge>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{order.address}</span>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {order.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {order.startTime}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0" />
              <span>{order.phone}</span>
            </div>
            {order.notes && (
              <div className="flex items-start gap-2 text-muted-foreground">
                <FileText className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="text-xs">{order.notes}</span>
              </div>
            )}
          </div>

          {showActions && order.status === 'assigned' && (
            <div className="mt-4 flex gap-2">
              <Button
                className="flex-1"
                onClick={() => handleStartShift(order.id)}
              >
                <Play className="h-4 w-4 mr-2" />
                Start Shift
              </Button>
            </div>
          )}

          {order.status === 'in_progress' && (
            <Button
              className="w-full mt-4"
              variant="outline"
              onClick={() => onNavigate?.('shift', order.id)}
            >
              View Active Shift
            </Button>
          )}
        </CardContent>
      </Card>
    </Doc>
  )

  return (
    <Screen className="bg-slate-50">
      <Doc of="routes.specialist-orders" floating position="bottom-left" />
      <ScreenHeader>
        <TopBar
          title="My Orders"
          back={onBack}
        />
      </ScreenHeader>

      <ScreenBody padding="md">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="pending" className="flex-1">
              Pending ({pendingOrders.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="flex-1">
              Active ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-1">
              Done ({completedOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pendingOrders.length === 0 ? (
              <EmptyState
                preset="no-data"
                title="No Pending Orders"
                description="You don't have any pending orders at the moment."
              />
            ) : (
              pendingOrders.map(order => renderOrderCard(order, true))
            )}
          </TabsContent>

          <TabsContent value="active">
            {activeOrders.length === 0 ? (
              <EmptyState
                preset="no-data"
                title="No Active Shifts"
                description="You don't have any active shifts right now."
              />
            ) : (
              activeOrders.map(order => renderOrderCard(order))
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedOrders.length === 0 ? (
              <EmptyState
                preset="no-data"
                title="No Completed Orders"
                description="Your completed orders will appear here."
              />
            ) : (
              completedOrders.slice(0, 10).map(order => renderOrderCard(order))
            )}
          </TabsContent>
        </Tabs>
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
