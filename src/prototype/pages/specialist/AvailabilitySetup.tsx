// Availability Setup Screen
// Manage weekly availability

import { useState } from 'react'
import { Home, ClipboardList, Calendar, Plus, Trash2, Clock, Check } from 'lucide-react'
import {
  Screen, ScreenHeader, ScreenBody, ScreenFooter,
  TopBar, BottomNav, Card, CardContent, Button, Badge,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  TimePicker, useToast, Doc, type BottomNavItem
} from '@/components/ui'
import { useRepo } from '@/hooks/useRepo'
import { dispatchEvent } from '@/lib/events'
import { useAuth } from '@/hooks/useAuth'
import type { AvailabilityEntity, SpecialistEntity } from '@prototype/factories'

interface AvailabilitySetupProps {
  onBack?: () => void
  onNavigate?: (screen: string) => void
}

const navItems: BottomNavItem[] = [
  { value: 'home', icon: <Home className="h-5 w-5" />, label: 'Home' },
  { value: 'orders', icon: <ClipboardList className="h-5 w-5" />, label: 'Orders' },
  { value: 'availability', icon: <Calendar className="h-5 w-5" />, label: 'Availability' },
]

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function AvailabilitySetup({ onBack, onNavigate }: AvailabilitySetupProps) {
  const { show } = useToast()
  const { user } = useAuth<SpecialistEntity>({ namespace: 'specialist' })
  const availabilities = useRepo<AvailabilityEntity>('availabilities')
  const [activeNav, setActiveNav] = useState('availability')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [newSlot, setNewSlot] = useState({ startTime: '09:00', endTime: '17:00' })

  // Get next 7 days (starting from tomorrow, not today)
  const getWeekDates = () => {
    const dates: Date[] = []
    const today = new Date()
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const weekDates = getWeekDates()

  const myAvailabilities = user
    ? availabilities.data.filter(a => a.specialistId === user.id)
    : []

  const getAvailabilityForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return myAvailabilities.filter(a => a.date === dateStr)
  }

  const handleNavChange = (id: string) => {
    setActiveNav(id)
    if (onNavigate) {
      if (id === 'home') onNavigate('home')
      if (id === 'orders') onNavigate('orders')
    }
  }

  const handleAddSlot = () => {
    if (!selectedDay || !user) return

    const dateStr = selectedDay.toISOString().split('T')[0]
    availabilities.create({
      specialistId: user.id,
      date: dateStr,
      startTime: newSlot.startTime,
      endTime: newSlot.endTime,
      isBooked: false
    })

    dispatchEvent('availability.added', {
      specialistId: user.id,
      date: dateStr,
      startTime: newSlot.startTime,
      endTime: newSlot.endTime
    })

    setShowAddDialog(false)
    setNewSlot({ startTime: '09:00', endTime: '17:00' })
    show({ message: 'Availability added!', type: 'success' })
  }

  const handleDeleteSlot = (id: string) => {
    availabilities.delete(id)
    show({ message: 'Slot removed', type: 'success' })
  }

  const openAddDialog = (date: Date) => {
    setSelectedDay(date)
    setShowAddDialog(true)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IL', {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Screen className="bg-slate-50">
      <Doc of="routes.specialist-availability" floating position="bottom-left" />
      <ScreenHeader>
        <TopBar
          title="My Availability"
          back={onBack}
        />
      </ScreenHeader>

      <ScreenBody padding="md" className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Set your available hours for the next 7 days
        </p>

        {/* Week View */}
        {weekDates.map((date, index) => {
          const slots = getAvailabilityForDate(date)
          const isTomorrow = index === 0

          return (
            <Card key={index} className={isTomorrow ? 'border-cyan-300' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {weekDays[date.getDay()]}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(date)}
                    </span>
                    {isTomorrow && (
                      <Badge className="bg-cyan-100 text-cyan-700 text-xs">Tomorrow</Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openAddDialog(date)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {slots.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Not available
                  </p>
                ) : (
                  <div className="space-y-2">
                    {slots.map((slot) => (
                      <div
                        key={slot.id}
                        className={`flex items-center justify-between p-2 rounded-lg ${
                          slot.isBooked ? 'bg-amber-50' : 'bg-green-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Clock className={`h-4 w-4 ${slot.isBooked ? 'text-amber-600' : 'text-green-600'}`} />
                          <span className="text-sm font-medium">
                            {slot.startTime} - {slot.endTime}
                          </span>
                          {slot.isBooked && (
                            <Badge className="bg-amber-200 text-amber-800 text-xs">
                              Booked
                            </Badge>
                          )}
                        </div>
                        {!slot.isBooked && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteSlot(slot.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </ScreenBody>

      <ScreenFooter>
        <BottomNav
          items={navItems}
          value={activeNav}
          onValueChange={handleNavChange}
        />
      </ScreenFooter>

      {/* Add Slot Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent inline>
          <DialogHeader>
            <DialogTitle>Add Availability</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedDay && (
              <p className="text-sm font-medium">
                {weekDays[selectedDay.getDay()]}, {formatDate(selectedDay)}
              </p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <TimePicker
                label="Start Time"
                placeholder="Start"
                value={newSlot.startTime}
                onChange={(time) => setNewSlot(prev => ({ ...prev, startTime: time || '09:00' }))}
                minuteStep={30}
              />
              <TimePicker
                label="End Time"
                placeholder="End"
                value={newSlot.endTime}
                onChange={(time) => setNewSlot(prev => ({ ...prev, endTime: time || '17:00' }))}
                minuteStep={30}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSlot}>
              <Check className="h-4 w-4 mr-2" />
              Add Slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Screen>
  )
}
