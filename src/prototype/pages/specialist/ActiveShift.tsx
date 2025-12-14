// Active Shift Screen
// Manage current work shift

import { useState, useEffect } from 'react'
import { MapPin, Clock, Phone, FileText, Play, Square, CheckCircle2, AlertCircle } from 'lucide-react'
import {
  Screen, ScreenHeader, ScreenBody, ScreenFooter,
  TopBar, Card, CardContent, Button, Badge,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Doc, useToast
} from '@/components/ui'
import { useRepo } from '@/hooks/useRepo'
import { useAuth } from '@/hooks/useAuth'
import { dispatchEvent } from '@/lib/events'
import { notifyApp } from '@prototype/stores/notificationStore'
import type { CareOrderEntity, SpecialistEntity } from '@prototype/factories'

interface ActiveShiftProps {
  onBack?: () => void
  orderId?: string
}

export default function ActiveShift({ onBack, orderId }: ActiveShiftProps) {
  const { show } = useToast()
  const { user } = useAuth<SpecialistEntity>({ namespace: 'specialist' })
  const orders = useRepo<CareOrderEntity>('orders')
  const [showEndDialog, setShowEndDialog] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)

  const myOrders = user
    ? orders.data.filter(o => o.specialistId === user.id || o.specialistName === user.name)
    : []

  const activeOrder = orderId
    ? orders.getById(orderId)
    : myOrders.find(o => o.status === 'in_progress')

  // Timer for elapsed time
  useEffect(() => {
    if (!activeOrder?.actualStart) return

    const startTime = new Date(activeOrder.actualStart).getTime()
    const interval = setInterval(() => {
      const now = Date.now()
      setElapsedTime(Math.floor((now - startTime) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [activeOrder?.actualStart])

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStartShift = () => {
    if (activeOrder) {
      const startTime = new Date().toISOString()
      orders.update(activeOrder.id, {
        status: 'in_progress',
        actualStart: startTime,
        updatedAt: startTime
      })
      dispatchEvent('shift.started', {
        orderId: activeOrder.id,
        specialistId: user?.id,
        startTime
      })
      // Notify client that specialist started
      notifyApp(
        'client',
        'Service Started',
        `${user?.name || 'Your specialist'} has started the ${activeOrder.serviceType} service`,
        'info',
        { orderId: activeOrder.id }
      )
      show({ message: 'Shift started!', type: 'success' })
    }
  }

  const handleEndShift = () => {
    if (activeOrder) {
      const endTime = new Date().toISOString()
      orders.update(activeOrder.id, {
        status: 'completed',
        actualEnd: endTime,
        updatedAt: endTime
      })
      dispatchEvent('shift.ended', {
        orderId: activeOrder.id,
        duration: elapsedTime,
        endTime
      })
      // Notify client about completion
      notifyApp(
        'client',
        'Service Completed',
        `Your ${activeOrder.serviceType} service has been completed. Duration: ${formatTime(elapsedTime)}`,
        'success',
        { orderId: activeOrder.id }
      )
      // Notify admin about completion
      notifyApp(
        'admin',
        'Order Completed',
        `${activeOrder.serviceType} in ${activeOrder.city} completed by ${user?.name}`,
        'success',
        { orderId: activeOrder.id }
      )
      setShowEndDialog(false)
      show({ message: 'Shift completed!', type: 'success' })
      onBack?.()
    }
  }

  if (!activeOrder) {
    return (
      <Screen className="bg-slate-50">
        <ScreenHeader>
          <TopBar title="Active Shift" back={onBack} />
        </ScreenHeader>
        <ScreenBody padding="md" className="flex items-center justify-center">
          <Card className="w-full">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-2">No Active Shift</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You don't have an active shift right now.
              </p>
              <Button onClick={onBack}>Go Back</Button>
            </CardContent>
          </Card>
        </ScreenBody>
      </Screen>
    )
  }

  const isActive = activeOrder.status === 'in_progress'

  return (
    <Screen className="bg-slate-50">
      <Doc of="routes.specialist-active-shift" floating position="bottom-left" />
      <ScreenHeader>
        <TopBar title="Active Shift" back={onBack} />
      </ScreenHeader>

      <ScreenBody padding="md" className="space-y-4">
        {/* Timer Card */}
        <Card className={`border-2 ${isActive ? 'border-cyan-500 bg-cyan-50' : 'border-amber-500 bg-amber-50'}`}>
          <CardContent className="p-6 text-center">
            {isActive ? (
              <>
                <Badge className="bg-cyan-600 text-white mb-3">In Progress</Badge>
                <p className="text-4xl font-mono font-bold text-cyan-700">
                  {formatTime(elapsedTime)}
                </p>
                <p className="text-sm text-cyan-600 mt-2">Time elapsed</p>
              </>
            ) : (
              <>
                <Badge className="bg-amber-600 text-white mb-3">Ready to Start</Badge>
                <p className="text-lg text-amber-700 mt-2">
                  Tap "Start Shift" when you arrive
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold capitalize">{activeOrder.serviceType}</h3>
                <p className="text-sm text-muted-foreground">
                  {activeOrder.clientName || 'Client'}
                </p>
              </div>
              <Badge variant="outline" className="capitalize">
                {activeOrder.serviceType}
              </Badge>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-cyan-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-muted-foreground">{activeOrder.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-cyan-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Scheduled</p>
                  <p className="text-muted-foreground">
                    {activeOrder.date} at {activeOrder.startTime}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-cyan-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Contact</p>
                  <a href={`tel:${activeOrder.phone}`} className="text-cyan-600 underline">
                    {activeOrder.phone}
                  </a>
                </div>
              </div>

              {activeOrder.notes && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-cyan-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Notes</p>
                    <p className="text-muted-foreground">{activeOrder.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Time Record */}
        {activeOrder.actualStart && (
          <Card className="bg-slate-100 border-0">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Time Record</h4>
              <div className="space-y-1 text-sm">
                <p className="flex justify-between">
                  <span className="text-muted-foreground">Started:</span>
                  <span>{new Date(activeOrder.actualStart).toLocaleTimeString()}</span>
                </p>
                {activeOrder.actualEnd && (
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Ended:</span>
                    <span>{new Date(activeOrder.actualEnd).toLocaleTimeString()}</span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </ScreenBody>

      <ScreenFooter className="p-4 bg-white border-t">
        {!isActive ? (
          <Button
            className="w-full bg-cyan-600 hover:bg-cyan-700"
            size="lg"
            onClick={handleStartShift}
          >
            <Play className="h-5 w-5 mr-2" />
            Start Shift
          </Button>
        ) : (
          <Button
            className="w-full bg-red-600 hover:bg-red-700"
            size="lg"
            onClick={() => setShowEndDialog(true)}
          >
            <Square className="h-5 w-5 mr-2" />
            End Shift
          </Button>
        )}
      </ScreenFooter>

      {/* End Shift Confirmation */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent inline>
          <DialogHeader>
            <DialogTitle>End Shift?</DialogTitle>
            <DialogDescription>
              You've worked for {formatTime(elapsedTime)}. Are you sure you want to end this shift?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEndDialog(false)}>
              Continue Working
            </Button>
            <Button onClick={handleEndShift} className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Complete Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Screen>
  )
}
