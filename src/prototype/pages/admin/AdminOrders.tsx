// Admin Orders Screen
// Manage all orders with assignment

import { useState, useEffect, useRef } from 'react'
import { LayoutDashboard, ClipboardList, Users, MapPin, Calendar, Clock, Phone, UserCheck, ChevronRight, Search, Pencil, Trash2, DollarSign, Timer } from 'lucide-react'
import {
  Screen, ScreenHeader, ScreenBody, ScreenFooter,
  TopBar, BottomNav, Card, CardContent, Button, Badge, Input,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Avatar, useToast, EmptyState, Doc, Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  type BottomNavItem
} from '@/components/ui'
import { useRepo } from '@/hooks/useRepo'
import { dispatchEvent } from '@/lib/events'
import { notifyApp } from '@prototype/stores/notificationStore'
import { SERVICES, ISRAELI_CITIES, type CareOrderEntity, type SpecialistEntity } from '@prototype/factories'

interface AdminOrdersProps {
  onBack?: () => void
  onNavigate?: (screen: string, data?: any) => void
}

const navItems: BottomNavItem[] = [
  { value: 'dashboard', icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard' },
  { value: 'orders', icon: <ClipboardList className="h-5 w-5" />, label: 'Orders' },
  { value: 'specialists', icon: <Users className="h-5 w-5" />, label: 'Specialists' },
]

const statusColors: Record<string, string> = {
  created: 'bg-gray-100 text-gray-700',
  reviewing: 'bg-blue-100 text-blue-700',
  assigned: 'bg-purple-100 text-purple-700',
  on_way: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-cyan-100 text-cyan-700',
  completed: 'bg-green-100 text-green-700',
  paid: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
}

const allStatuses = ['created', 'reviewing', 'assigned', 'on_way', 'in_progress', 'completed', 'paid', 'cancelled'] as const

function formatDuration(startIso: string | null, endIso: string | null): string {
  if (!startIso || !endIso) return '-'
  const start = new Date(startIso)
  const end = new Date(endIso)
  const diffMs = end.getTime() - start.getTime()
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h ${minutes}m`
}

function formatTime(isoString: string | null): string {
  if (!isoString) return '-'
  return new Date(isoString).toLocaleTimeString('en-IL', { hour: '2-digit', minute: '2-digit' })
}

export default function AdminOrders({ onBack, onNavigate }: AdminOrdersProps) {
  const { show } = useToast()
  const orders = useRepo<CareOrderEntity>('orders')
  const specialists = useRepo<SpecialistEntity>('specialists')
  const [activeNav, setActiveNav] = useState('orders')
  const [activeTab, setActiveTab] = useState('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<CareOrderEntity | null>(null)

  // Edit dialog state
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingOrder, setEditingOrder] = useState<CareOrderEntity | null>(null)
  const [editForm, setEditForm] = useState({
    clientName: '',
    phone: '',
    address: '',
    city: '',
    date: '',
    startTime: '',
    serviceType: '' as CareOrderEntity['serviceType'],
    notes: '',
    status: '' as CareOrderEntity['status'],
    specialistId: '' as string | null
  })

  // Payment dialog state
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [paymentOrder, setPaymentOrder] = useState<CareOrderEntity | null>(null)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    notes: ''
  })

  // Highlight state for status change animation
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(null)
  const highlightedCardRef = useRef<HTMLDivElement>(null)

  // Clear highlight after animation and scroll to highlighted card
  useEffect(() => {
    if (highlightedOrderId) {
      // Scroll to highlighted card after tab switch
      setTimeout(() => {
        highlightedCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
      const timer = setTimeout(() => setHighlightedOrderId(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [highlightedOrderId])

  // Map status to tab
  const getTabForStatus = (status: CareOrderEntity['status']): string => {
    if (['created', 'reviewing'].includes(status)) return 'pending'
    if (['assigned', 'on_way', 'in_progress'].includes(status)) return 'active'
    if (status === 'completed') return 'completed'
    if (status === 'paid') return 'paid'
    return 'pending'
  }

  const handleNavChange = (id: string) => {
    setActiveNav(id)
    if (onNavigate) {
      if (id === 'dashboard') onNavigate('dashboard')
      if (id === 'specialists') onNavigate('specialists')
    }
  }

  // Sort by updatedAt descending (newest first)
  const sortByUpdated = (a: CareOrderEntity, b: CareOrderEntity) => {
    const dateA = new Date(a.updatedAt || a.createdAt).getTime()
    const dateB = new Date(b.updatedAt || b.createdAt).getTime()
    return dateB - dateA
  }

  // Filter and sort orders
  const pendingOrders = orders.data
    .filter(o => ['created', 'reviewing'].includes(o.status))
    .sort(sortByUpdated)
  const activeOrders = orders.data
    .filter(o => ['assigned', 'on_way', 'in_progress'].includes(o.status))
    .sort(sortByUpdated)
  const completedOrders = orders.data
    .filter(o => o.status === 'completed')
    .sort(sortByUpdated)
  const paidOrders = orders.data
    .filter(o => o.status === 'paid')
    .sort(sortByUpdated)

  const getFilteredOrders = (orderList: CareOrderEntity[]) => {
    if (!searchQuery) return orderList
    const query = searchQuery.toLowerCase()
    return orderList.filter(o =>
      o.clientName?.toLowerCase().includes(query) ||
      o.phone.includes(query) ||
      o.city.toLowerCase().includes(query) ||
      o.serviceType.toLowerCase().includes(query)
    )
  }

  const availableSpecialists = specialists.data.filter(s => {
    if (!s.isActive) return false
    if (!selectedOrder) return true
    return s.serviceTypes.includes(selectedOrder.serviceType) &&
           s.cities.includes(selectedOrder.city)
  })

  const handleOpenAssign = (order: CareOrderEntity) => {
    setSelectedOrder(order)
    setShowAssignDialog(true)
  }

  const handleAssignSpecialist = (specialist: SpecialistEntity) => {
    if (!selectedOrder) return

    orders.update(selectedOrder.id, {
      status: 'assigned',
      specialistId: specialist.id,
      specialistName: specialist.name,
      specialistPhone: specialist.phone,
      updatedAt: new Date().toISOString()
    })

    dispatchEvent('order.assigned', {
      orderId: selectedOrder.id,
      specialistId: specialist.id,
      specialistName: specialist.name
    })

    // Notify specialist about new assignment
    notifyApp(
      'specialist',
      'New Assignment',
      `${selectedOrder.serviceType} order in ${selectedOrder.city} on ${selectedOrder.date}`,
      'order',
      { orderId: selectedOrder.id }
    )

    // Notify client about assignment
    notifyApp(
      'client',
      'Specialist Assigned',
      `${specialist.name} will handle your ${selectedOrder.serviceType} service`,
      'success',
      { orderId: selectedOrder.id }
    )

    // Switch to active tab and highlight
    setActiveTab('active')
    setHighlightedOrderId(selectedOrder.id)

    setShowAssignDialog(false)
    setSelectedOrder(null)
    show({ message: `Assigned to ${specialist.name}`, type: 'success' })
  }

  // Delete order
  const handleDeleteOrder = (order: CareOrderEntity) => {
    orders.delete(order.id)
    dispatchEvent('order.deleted', { orderId: order.id })
    show({ message: 'Order deleted', type: 'success' })
  }

  // Open edit dialog
  const handleOpenEdit = (order: CareOrderEntity) => {
    setEditingOrder(order)
    setEditForm({
      clientName: order.clientName || '',
      phone: order.phone,
      address: order.address,
      city: order.city,
      date: order.date,
      startTime: order.startTime,
      serviceType: order.serviceType,
      notes: order.notes,
      status: order.status,
      specialistId: order.specialistId
    })
    setShowEditDialog(true)
  }

  // Save edit
  const handleSaveEdit = () => {
    if (!editingOrder) return
    if (!editForm.phone || !editForm.address) {
      show({ message: 'Please fill in required fields', type: 'error' })
      return
    }

    // Validate: active statuses require a specialist
    const needsSpecialist = ['assigned', 'on_way', 'in_progress'].includes(editForm.status)
    if (needsSpecialist && !editForm.specialistId) {
      show({ message: 'Please assign a specialist for this status', type: 'error' })
      return
    }

    const specialist = editForm.specialistId
      ? specialists.data.find(s => s.id === editForm.specialistId)
      : null

    orders.update(editingOrder.id, {
      clientName: editForm.clientName,
      phone: editForm.phone,
      address: editForm.address,
      city: editForm.city,
      date: editForm.date,
      startTime: editForm.startTime,
      serviceType: editForm.serviceType,
      notes: editForm.notes,
      status: editForm.status,
      specialistId: editForm.specialistId,
      specialistName: specialist?.name,
      updatedAt: new Date().toISOString()
    })

    dispatchEvent('order.updated', {
      orderId: editingOrder.id,
      status: editForm.status
    })

    // Switch to the appropriate tab and highlight the order
    const newTab = getTabForStatus(editForm.status)
    setActiveTab(newTab)
    setHighlightedOrderId(editingOrder.id)

    setShowEditDialog(false)
    setEditingOrder(null)
    show({ message: 'Order updated!', type: 'success' })
  }

  // Open payment dialog
  const handleOpenPayment = (order: CareOrderEntity) => {
    setPaymentOrder(order)
    setPaymentForm({ amount: '', notes: '' })
    setShowPaymentDialog(true)
  }

  // Mark as paid
  const handleMarkPaid = () => {
    if (!paymentOrder) return
    const amount = parseFloat(paymentForm.amount)
    if (isNaN(amount) || amount <= 0) {
      show({ message: 'Please enter a valid amount', type: 'error' })
      return
    }

    orders.update(paymentOrder.id, {
      status: 'paid',
      paidAmount: amount,
      paidAt: new Date().toISOString(),
      paymentNotes: paymentForm.notes || null,
      updatedAt: new Date().toISOString()
    })

    dispatchEvent('order.paid', {
      orderId: paymentOrder.id,
      amount
    })

    notifyApp(
      'specialist',
      'Payment Confirmed',
      `Order #${paymentOrder.id.slice(-6)} has been marked as paid: ₪${amount}`,
      'success',
      { orderId: paymentOrder.id }
    )

    // Switch to paid tab and highlight
    setActiveTab('paid')
    setHighlightedOrderId(paymentOrder.id)

    setShowPaymentDialog(false)
    setPaymentOrder(null)
    show({ message: 'Order marked as paid!', type: 'success' })
  }

  const renderOrderCard = (order: CareOrderEntity) => {
    const isHighlighted = order.id === highlightedOrderId
    return (
    <div
      key={order.id}
      ref={isHighlighted ? highlightedCardRef : undefined}
    >
      <Card
        className={`mb-3 transition-all duration-500 ${
          isHighlighted
            ? 'ring-2 ring-cyan-500 ring-offset-2 bg-cyan-50 animate-pulse'
            : ''
        }`}
      >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-semibold capitalize">{order.serviceType}</h4>
            <p className="text-sm text-muted-foreground">{order.clientName || 'Unknown Client'}</p>
          </div>
          <Badge className={statusColors[order.status]}>
            {order.status.replace('_', ' ')}
          </Badge>
        </div>

        <div className="space-y-1.5 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{order.address}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {order.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {order.startTime}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 shrink-0" />
            <span>{order.phone}</span>
          </div>
        </div>

        {(order.specialistName || order.specialistId) && (() => {
          const specialist = order.specialistId
            ? specialists.data.find(s => s.id === order.specialistId)
            : null
          const phoneToShow = order.specialistPhone || specialist?.phone
          return (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-50 mb-3">
              <UserCheck className="h-4 w-4 text-purple-600" />
              <div className="text-sm text-purple-700">
                <span className="font-medium">{order.specialistName || specialist?.name || 'Assigned'}</span>
                {phoneToShow && (
                  <span className="text-purple-500 ml-2">{phoneToShow}</span>
                )}
              </div>
            </div>
          )
        })()}

        {/* Shift stats for completed/paid orders */}
        {(order.status === 'completed' || order.status === 'paid') && order.actualStart && (
          <div className="p-2 rounded-lg bg-slate-50 mb-3 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Timer className="h-3 w-3" /> Started
              </span>
              <span className="font-medium">{formatTime(order.actualStart)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Ended</span>
              <span className="font-medium">{formatTime(order.actualEnd)}</span>
            </div>
            <div className="flex items-center justify-between text-xs border-t pt-1">
              <span className="text-muted-foreground font-medium">Duration</span>
              <span className="font-bold text-cyan-600">{formatDuration(order.actualStart, order.actualEnd)}</span>
            </div>
          </div>
        )}

        {/* Payment info for paid orders */}
        {order.status === 'paid' && order.paidAmount && (
          <div className="p-2 rounded-lg bg-emerald-50 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-3 w-3" /> Paid
              </span>
              <span className="font-bold text-emerald-700">₪{order.paidAmount}</span>
            </div>
            {order.paymentNotes && (
              <p className="text-xs text-muted-foreground mt-1">{order.paymentNotes}</p>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap">
          {['created', 'reviewing'].includes(order.status) && (
            <Button
              className="flex-1"
              onClick={() => handleOpenAssign(order)}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Assign
            </Button>
          )}

          {order.status === 'completed' && (
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => handleOpenPayment(order)}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Mark Paid
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenEdit(order)}
          >
            <Pencil className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => handleDeleteOrder(order)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
      </Card>
    </div>
  )}

  return (
    <Screen className="bg-slate-50">
      <Doc of="routes.admin-orders" floating position="bottom-left" />
      <ScreenHeader>
        <TopBar title="Orders" back={onBack} />
      </ScreenHeader>

      <ScreenBody padding="md">
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-4 grid grid-cols-4">
            <TabsTrigger value="pending" className="text-xs px-1">
              Pending ({pendingOrders.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="text-xs px-1">
              Active ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs px-1">
              Done ({completedOrders.length})
            </TabsTrigger>
            <TabsTrigger value="paid" className="text-xs px-1">
              Paid ({paidOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {getFilteredOrders(pendingOrders).length === 0 ? (
              <EmptyState
                preset="no-data"
                title="No Pending Orders"
                description="All orders have been assigned."
              />
            ) : (
              getFilteredOrders(pendingOrders).map(renderOrderCard)
            )}
          </TabsContent>

          <TabsContent value="active">
            {getFilteredOrders(activeOrders).length === 0 ? (
              <EmptyState
                preset="no-data"
                title="No Active Orders"
                description="No orders are currently in progress."
              />
            ) : (
              getFilteredOrders(activeOrders).map(renderOrderCard)
            )}
          </TabsContent>

          <TabsContent value="completed">
            {getFilteredOrders(completedOrders).length === 0 ? (
              <EmptyState
                preset="no-data"
                title="No Completed Orders"
                description="Completed orders will appear here."
              />
            ) : (
              getFilteredOrders(completedOrders).slice(0, 20).map(renderOrderCard)
            )}
          </TabsContent>

          <TabsContent value="paid">
            {getFilteredOrders(paidOrders).length === 0 ? (
              <EmptyState
                preset="no-data"
                title="No Paid Orders"
                description="Paid orders will appear here."
              />
            ) : (
              getFilteredOrders(paidOrders).slice(0, 20).map(renderOrderCard)
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

      {/* Assign Specialist Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent inline className="max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Assign Specialist</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="mb-4 p-3 rounded-lg bg-slate-100">
              <p className="font-medium capitalize">{selectedOrder.serviceType}</p>
              <p className="text-sm text-muted-foreground">{selectedOrder.city}</p>
            </div>
          )}

          <div className="space-y-2">
            {availableSpecialists.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No available specialists for this service and location.
              </p>
            ) : (
              availableSpecialists.map((specialist) => (
                <Card
                  key={specialist.id}
                  className="cursor-pointer hover:border-cyan-300"
                  onClick={() => handleAssignSpecialist(specialist)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar src={specialist.avatar} alt={specialist.name} size="md" />
                      <div className="flex-1">
                        <p className="font-medium">{specialist.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {specialist.serviceTypes.join(', ')}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent inline className="max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Client Name</label>
                <Input
                  value={editForm.clientName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, clientName: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Phone *</label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Address *</label>
              <Input
                value={editForm.address}
                onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">City</label>
                <Select
                  value={editForm.city}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, city: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {ISRAELI_CITIES.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Service</label>
                <Select
                  value={editForm.serviceType}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, serviceType: value as CareOrderEntity['serviceType'] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICES.map(service => (
                      <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Date</label>
                <Input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Time</label>
                <Input
                  type="time"
                  value={editForm.startTime}
                  onChange={(e) => setEditForm(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Status</label>
              <Select
                value={editForm.status}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value as CareOrderEntity['status'] }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {allStatuses.map(status => (
                    <SelectItem key={status} value={status} className="capitalize">
                      {status.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Assigned Specialist</label>
              <Select
                value={editForm.specialistId || 'none'}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, specialistId: value === 'none' ? null : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select specialist" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not assigned</SelectItem>
                  {specialists.data.filter(s => s.isActive).map(specialist => (
                    <SelectItem key={specialist.id} value={specialist.id}>
                      {specialist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Notes</label>
              <Input
                value={editForm.notes}
                onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent inline>
          <DialogHeader>
            <DialogTitle>Mark as Paid</DialogTitle>
          </DialogHeader>

          {paymentOrder && (
            <div className="py-4 space-y-4">
              <div className="p-3 rounded-lg bg-slate-50">
                <p className="font-medium capitalize">{paymentOrder.serviceType}</p>
                <p className="text-sm text-muted-foreground">{paymentOrder.clientName} - {paymentOrder.date}</p>
                {paymentOrder.actualStart && (
                  <p className="text-sm text-cyan-600 mt-1">
                    Duration: {formatDuration(paymentOrder.actualStart, paymentOrder.actualEnd)}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Amount (₪) *</label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Notes</label>
                <Input
                  placeholder="e.g., Cash payment, Bank transfer..."
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleMarkPaid}>
              <DollarSign className="h-4 w-4 mr-2" />
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Screen>
  )
}
